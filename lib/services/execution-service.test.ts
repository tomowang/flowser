import { describe, it, expect, vi, beforeEach } from "vitest";
import { ExecutionService } from "./execution-service";
import { IWorkflowExecutionResult } from "../types";

const mockGetAll = vi.fn();
vi.mock("../db", () => ({
  dbPromise: Promise.resolve({
    getAll: (store: string) => mockGetAll(store),
  }),
}));

function makeExecution(id: string, endTime: number): IWorkflowExecutionResult {
  return {
    id,
    workflowId: "wf-1",
    startTime: endTime - 100,
    endTime,
    status: "success",
    nodeExecutionResults: [],
  };
}

describe("ExecutionService.purgeExecutions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("never deletes when retention is 'forever'", async () => {
    const deleteSpy = vi
      .spyOn(ExecutionService, "deleteExecutions")
      .mockResolvedValue(undefined);

    const purged = await ExecutionService.purgeExecutions("forever");

    expect(purged).toBe(0);
    expect(mockGetAll).not.toHaveBeenCalled();
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it("is a no-op when there are fewer executions than the retention count", async () => {
    mockGetAll.mockResolvedValue([
      makeExecution("a", 1),
      makeExecution("b", 2),
    ]);
    const deleteSpy = vi
      .spyOn(ExecutionService, "deleteExecutions")
      .mockResolvedValue(undefined);

    const purged = await ExecutionService.purgeExecutions(100);

    expect(purged).toBe(0);
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it("is a no-op when the execution count exactly equals the retention count", async () => {
    mockGetAll.mockResolvedValue(
      Array.from({ length: 100 }, (_, i) => makeExecution(`e${i}`, i)),
    );
    const deleteSpy = vi
      .spyOn(ExecutionService, "deleteExecutions")
      .mockResolvedValue(undefined);

    const purged = await ExecutionService.purgeExecutions(100);

    expect(purged).toBe(0);
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it("deletes the oldest executions beyond the retention count, keeping the newest N", async () => {
    const executions = [
      makeExecution("oldest", 1),
      ...Array.from({ length: 100 }, (_, i) =>
        makeExecution(`kept${i}`, 100 + i),
      ),
    ];
    mockGetAll.mockResolvedValue(executions);
    const deleteSpy = vi
      .spyOn(ExecutionService, "deleteExecutions")
      .mockResolvedValue(undefined);

    const purged = await ExecutionService.purgeExecutions(100);

    expect(purged).toBe(1);
    expect(deleteSpy).toHaveBeenCalledWith(["oldest"]);
  });
});
