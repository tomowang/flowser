import { dbPromise } from "../db";
import { IWorkflow } from "../types";
import { browser } from "wxt/browser";

export class WorkflowService {
  static async saveWorkflow(workflow: IWorkflow): Promise<string> {
    const db = await dbPromise;
    await db.put("workflows", workflow);
    try {
      await browser.runtime.sendMessage({
        type: "WORKFLOW:UPDATED",
        payload: workflow,
      });
    } catch (e) {
      // Ignore errors if background is not listening yet
    }
    return workflow.id;
  }

  static async getWorkflow(id: string): Promise<IWorkflow | undefined> {
    const db = await dbPromise;
    return db.get("workflows", id);
  }

  static async getAllWorkflows(): Promise<IWorkflow[]> {
    const db = await dbPromise;
    return db.getAll("workflows");
  }

  static async deleteWorkflow(id: string): Promise<void> {
    const db = await dbPromise;
    await db.delete("workflows", id);
  }

  static async updateWorkflowStatus(
    id: string,
    active: boolean,
  ): Promise<void> {
    const db = await dbPromise;
    const workflow = await db.get("workflows", id);
    if (workflow) {
      workflow.active = active;
      workflow.updatedAt = Date.now();
      await db.put("workflows", workflow);

      try {
        await browser.runtime.sendMessage({
          type: "WORKFLOW:UPDATED",
          payload: workflow,
        });
      } catch (e) {
        // Ignore errors if background is not listening yet
      }
    }
  }
}
