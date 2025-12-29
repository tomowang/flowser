import { dbPromise } from "../db";
import { IWorkflowExecutionResult } from "../types";

export class ExecutionService {
  static async saveExecution(
    execution: IWorkflowExecutionResult,
  ): Promise<void> {
    const db = await dbPromise;
    await db.put("executions", execution);
  }

  static async getExecutions(): Promise<IWorkflowExecutionResult[]> {
    const db = await dbPromise;
    const executions = await db.getAll("executions");
    // Sort by endTime descending (newest first)
    return executions.sort((a, b) => b.endTime - a.endTime);
  }

  static async getExecutionsByWorkflow(
    workflowId: string,
  ): Promise<IWorkflowExecutionResult[]> {
    const db = await dbPromise;
    const executions = await db.getAllFromIndex(
      "executions",
      "by-workflow",
      workflowId,
    );
    return executions.sort((a, b) => b.endTime - a.endTime);
  }

  static async deleteExecution(id: string): Promise<void> {
    const db = await dbPromise;
    await db.delete("executions", id);
  }
}
