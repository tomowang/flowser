import { dbPromise } from "../db";
import { IWorkflowExecutionResult } from "../types";
import { ExecutionRetention } from "../execution-retention";

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

  static async deleteExecutions(ids: string[]): Promise<void> {
    const db = await dbPromise;
    const tx = db.transaction("executions", "readwrite");
    await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done]);
  }

  static async purgeExecutions(retention: ExecutionRetention): Promise<number> {
    if (retention === "forever") return 0;

    const db = await dbPromise;
    const all = await db.getAll("executions");
    if (all.length <= retention) return 0;

    const sorted = all.sort((a, b) => b.endTime - a.endTime);
    const idsToDelete = sorted.slice(retention).map((e) => e.id);

    await this.deleteExecutions(idsToDelete);
    return idsToDelete.length;
  }
}
