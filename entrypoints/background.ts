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

export default defineBackground(() => {
  console.log("Hello background!", { id: browser.runtime.id });

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
      }
    },
  );

  browser.tabs.onCreated.addListener(async (tab) => {
    console.log("Tab created", tab);

    const db = await dbPromise;
    const workflows = await db.getAll("workflows");

    for (const workflow of workflows) {
      // @ts-ignore
      const triggerNode = workflow.nodes.find((n) => n.type === "tabCreated");
      if (triggerNode) {
        console.log("Executing workflow", workflow.name);
        const runner = new WorkflowRunner(workflow);
        const triggerData = [{ json: tab as any }];
        const result = await runner.run(triggerNode.id, triggerData);
        await ExecutionService.saveExecution(result);
      }
    }
  });
});
