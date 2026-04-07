import { browser, defineBackground } from "#imports";
import {
  MessageType,
  type RuntimeMessage,
  type ExecuteHttpRequestPayload,
} from "../lib/messages";
import "../lib/nodes/register";
import { dbPromise } from "../lib/db";
import { WorkflowRunner } from "../lib/engine/WorkflowRunner";
import { ExecutionService } from "../lib/services/execution-service";
import { SecurityService } from "../lib/services/security-service";
import parser from "cron-parser";
import { IWorkflow, IDataObject } from "../lib/types";

// Transient session encryption key (memory-only)
// This key encrypts the Master Key when it's saved in session storage
// If the background script is completely killed, we lose this key and 
// the user will need to re-enter their password (secure-by-default)
let transientSessionKey: CryptoKey | null = null;

async function getTransientKey() {
  if (transientSessionKey) return transientSessionKey;
  transientSessionKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
  return transientSessionKey;
}

/**
 * Wraps (encrypts) the Master Key JWK with the transient session key.
 */
async function wrapMasterKey(jwk: JsonWebKey): Promise<string> {
  const key = await getTransientKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(jwk));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );

  // Return formatted blob: iv:encryptedData (base64)
  const ivBase64 = btoa(String.fromCharCode(...iv));
  const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  return `${ivBase64}:${encryptedBase64}`;
}

/**
 * Unwraps (decrypts) the Master Key JWK using the transient session key.
 */
async function unwrapMasterKey(blob: string): Promise<JsonWebKey | null> {
  try {
    const key = await getTransientKey();
    const [ivBase64, encryptedBase64] = blob.split(":");
    
    const iv = new Uint8Array(atob(ivBase64).split("").map(c => c.charCodeAt(0)));
    const encrypted = new Uint8Array(atob(encryptedBase64).split("").map(c => c.charCodeAt(0)));
    
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encrypted
    );
    
    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch (e) {
    console.error("Failed to unwrap master key", e);
    return null;
  }
}

async function scheduleWorkflow(workflow: IWorkflow) {
  // Clear existing alarm for this workflow
  await browser.alarms.clear(workflow.id);

  if (!workflow.active) {
    return;
  }

  // Check if it has a schedule trigger
  const scheduleNode = workflow.nodes.find((n) => n.type === "scheduleTrigger");
  if (!scheduleNode) {
    return;
  }

  console.log("Schedule node", scheduleNode);

  const cronExpression =
    scheduleNode.data.cron || scheduleNode.data.defaults?.cron || "0 * * * *";

  try {
    const interval = parser.parse(cronExpression);
    const nextDate = interval.next().toDate();
    console.log(
      `Scheduling workflow ${workflow.name} for ${nextDate.toISOString()}`,
    );

    // Create alarm
    await browser.alarms.create(workflow.id, {
      when: nextDate.getTime(),
    });
  } catch (err) {
    console.error(
      `Failed to parse cron expression for workflow ${workflow.name}:`,
      err,
    );
  }
}

export default defineBackground(() => {
  console.log("Hello background!", { id: browser.runtime.id });

  // 1. Set storage session access level to TRUSTED_CONTEXTS (prevents content script access)
  // This is a browser-native security hardening.
  const storage = browser.storage as typeof browser.storage & {
    session?: { setAccessLevel?: (arg: { accessLevel: string }) => Promise<void> };
  };
  if (typeof storage.session?.setAccessLevel === "function") {
    storage.session.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
  }

  // Reschedule all active workflows on startup
  dbPromise.then(async (db) => {
    const workflows = await db.getAll("workflows");
    for (const workflow of workflows) {
      scheduleWorkflow(workflow);
    }
  });

  browser.runtime.onMessage.addListener(
    (message: RuntimeMessage, sender, sendResponse) => {
      // 1. Security check: Only allow requests from our extension's pages
      const extensionUrl = browser.runtime.getURL("");
      const isInternal = sender.url?.startsWith(extensionUrl) || sender.id === browser.runtime.id;

      if (!isInternal) {
        console.warn("Blocked message from untrusted sender:", sender.url);
        return;
      }

      if (message.type === MessageType.HTTP_EXECUTE_REQUEST) {
        const payload = message.payload as ExecuteHttpRequestPayload;
        fetch(payload.url, {
          method: payload.method,
          headers: payload.headers,
          body: payload.body ? JSON.stringify(payload.body) : undefined,
        })
          .then((response) => response.json())
          .then((data) => {
            sendResponse({ success: true, data });
          })
          .catch((error) => {
            sendResponse({ success: false, error: error.message });
          });

        return true; // Keep the message channel open for async response
      } else if (message.type === MessageType.SECURITY_SAVE_MK) {
        // Double-wrapping: Encrypt Master Key JWK with transient session key
        wrapMasterKey(message.payload as JsonWebKey)
          .then(async (wrapped) => {
            await storage.setItem("session:flowser_wrapped_mk", wrapped);
            // Also sync the masterKey in the background service's memory
            const key = await crypto.subtle.importKey(
              "jwk",
              message.payload as JsonWebKey,
              { name: "AES-GCM", length: 256 },
              true,
              ["encrypt", "decrypt"]
            );
            SecurityService.setMasterKey(key);
            sendResponse({ success: true });
          })
          .catch((err) => sendResponse({ success: false, error: err.message }));
        return true;
      } else if (message.type === MessageType.SECURITY_GET_MK) {
        storage.getItem<string>("session:flowser_wrapped_mk")
          .then(async (wrapped) => {
            if (!wrapped) return sendResponse({ success: true, data: null });
            const jwk = await unwrapMasterKey(wrapped);
            sendResponse({ success: true, data: jwk });
          })
          .catch((err) => sendResponse({ success: false, error: err.message }));
        return true;
      } else if (message.type === MessageType.WORKFLOW_UPDATED) {
        const workflow = message.payload as IWorkflow;
        scheduleWorkflow(workflow);
        // Reschedule might not need to send response, but good practice
        sendResponse({ success: true });
      }
    },
  );

  browser.alarms.onAlarm.addListener(async (alarm) => {
    const db = await dbPromise;
    const workflow = await db.get("workflows", alarm.name);

    if (workflow && workflow.active) {
      const scheduleNode = workflow.nodes.find(
        (n) => n.type === "scheduleTrigger",
      );
      if (scheduleNode) {
        console.log("Executing scheduled workflow", workflow.name);
        const runner = new WorkflowRunner(workflow);
        // Pass cron trigger data
        const triggerData = [
          {
            json: {
              timestamp: Date.now(),
              scheduledTime: alarm.scheduledTime,
            },
          },
        ];

        try {
          const result = await runner.run(scheduleNode.id, triggerData);
          await ExecutionService.saveExecution(result);
        } catch (e) {
          console.error("Error running scheduled workflow", e);
        }

        // Reschedule for next occurrence
        scheduleWorkflow(workflow);
      }
    }
  });

  browser.tabs.onCreated.addListener(async (tab) => {
    console.log("Tab created", tab);

    const db = await dbPromise;
    const workflows = await db.getAll("workflows");

    for (const workflow of workflows) {
      const triggerNode = workflow.nodes.find((n) => n.type === "tabCreated");
      if (triggerNode && workflow.active) {
        console.log("Executing workflow", workflow.name);
        const runner = new WorkflowRunner(workflow);
        const triggerData = [{ json: tab as unknown as IDataObject }];
        const result = await runner.run(triggerNode.id, triggerData);
        await ExecutionService.saveExecution(result);
      }
    }
  });

  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    console.log("Tab updated", tabId, changeInfo, tab);

    const db = await dbPromise;
    const workflows = await db.getAll("workflows");

    for (const workflow of workflows) {
      const triggerNode = workflow.nodes.find((n) => n.type === "tabUpdated");
      if (triggerNode && workflow.active) {
        console.log("Executing workflow", workflow.name);
        const runner = new WorkflowRunner(workflow);
        const triggerData = [
          {
            json: {
              tabId,
              changeInfo,
              tab: tab as unknown as IDataObject,
            },
          },
        ];
        const result = await runner.run(triggerNode.id, triggerData);
        await ExecutionService.saveExecution(result);
      }
    }
  });
});
