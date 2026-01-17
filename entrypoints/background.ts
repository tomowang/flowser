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
import parser from "cron-parser";
import { IWorkflow } from "../lib/types";

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

  // Reschedule all active workflows on startup
  dbPromise.then(async (db) => {
    const workflows = await db.getAll("workflows");
    for (const workflow of workflows) {
      scheduleWorkflow(workflow);
    }
  });

  browser.runtime.onMessage.addListener(
    (message: RuntimeMessage, sender, sendResponse) => {
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const triggerData = [{ json: tab as unknown as Record<string, any> }];
        const result = await runner.run(triggerNode.id, triggerData);
        await ExecutionService.saveExecution(result);
      }
    }
  });
});
