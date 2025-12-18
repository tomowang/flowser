import { dbPromise } from "../db";
import { IWorkflow } from "../types";

export class WorkflowService {
  static async saveWorkflow(workflow: IWorkflow): Promise<string> {
    const db = await dbPromise;
    await db.put("workflows", workflow);
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
}
