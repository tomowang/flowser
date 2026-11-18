import { describe, expect, it, vi } from "vitest";
import { WorkflowRunner } from "../lib/engine/WorkflowRunner";
import { Registry } from "../lib/nodes/registry";
import { TabGroupQuery } from "../lib/nodes/TabGroupQuery/TabGroupQuery";
import type { INodeExecutionData, INodeType, IWorkflow } from "../lib/types";

const { queryGroups } = vi.hoisted(() => ({
  queryGroups: vi.fn<() => Promise<unknown[]>>(),
}));

vi.mock("wxt/browser", () => ({
  browser: { tabGroups: { query: queryGroups } },
}));

vi.mock("../lib/services/quickjs", () => ({
  getQuickJS: async () => ({
    newRuntime: () => ({
      newContext: () => ({
        newFunction: () => ({ dispose() {} }),
        setProp() {},
        dispose() {},
        global: {},
      }),
      dispose() {},
    }),
  }),
}));

function workflow(alwaysOutputData?: boolean): IWorkflow {
  return {
    id: "empty-output",
    name: "Empty output",
    active: false,
    createdAt: 0,
    updatedAt: 0,
    nodes: [
      {
        id: "query",
        type: "tabGroupQuery",
        position: { x: 0, y: 0 },
        data: { title: "Work", alwaysOutputData },
      },
      {
        id: "next",
        type: "emptyOutputConsumer",
        position: { x: 200, y: 0 },
        data: {},
      },
    ],
    edges: [{ id: "edge", source: "query", target: "next" }],
  };
}

const consumer: INodeType = {
  ...TabGroupQuery,
  description: {
    ...TabGroupQuery.description,
    name: "emptyOutputConsumer",
    properties: [],
  },
  async execute() {
    // Node lookup must see the same synthesized data as the downstream input.
    expect(this.getNodeOutputData!("query")).toEqual(this.getInputData());
    return [this.getInputData()];
  },
};

Registry.register(TabGroupQuery);
Registry.register(consumer);

describe("Always Output Data", () => {
  it.each([undefined, false])(
    "stops on no tab groups by default (%s)",
    async (setting) => {
      queryGroups.mockResolvedValue([]);
      const result = await new WorkflowRunner(workflow(setting)).run("query");

      expect(result.status).toBe("success");
      expect(result.nodeExecutionResults.map((node) => node.nodeId)).toEqual([
        "query",
      ]);
      expect(result.nodeExecutionResults[0].outputData).toEqual([]);
    },
  );

  it("continues from a query with no matches and records the empty item", async () => {
    queryGroups.mockResolvedValue([]);
    const onCompleted = vi.fn();
    const onStarted = vi.fn();
    const result = await new WorkflowRunner(
      workflow(true),
      undefined,
      onCompleted,
      onStarted,
    ).run("query");

    expect(queryGroups).toHaveBeenCalledWith({ title: "Work" });
    expect(result.status).toBe("success");
    expect(result.nodeExecutionResults.map((node) => node.nodeId)).toEqual([
      "query",
      "next",
    ]);
    expect(result.nodeExecutionResults[0].outputData).toEqual([{ json: {} }]);
    expect(result.nodeExecutionResults[1].inputData).toEqual([{ json: {} }]);
    expect(onCompleted.mock.calls[0][0].outputData).toEqual([{ json: {} }]);
    expect(onStarted.mock.calls[1][1]).toEqual([{ json: {} }]);
  });

  it("preserves matching tab groups", async () => {
    const groups = [
      {
        id: 7,
        title: "Work",
        color: "blue" as const,
        collapsed: false,
        windowId: 1,
      },
    ];
    queryGroups.mockResolvedValue(groups);
    const result = await new WorkflowRunner(workflow(true)).run("query");

    expect(result.status).toBe("success");
    expect(result.nodeExecutionResults[0].outputData).toEqual(
      groups.map((json) => ({ json })),
    );
    expect(result.nodeExecutionResults[1].inputData).toEqual(
      groups.map((json) => ({ json })),
    );
  });

  it("uses the empty item in a single-node run", async () => {
    queryGroups.mockResolvedValue([]);
    const result = await new WorkflowRunner(workflow(true)).runNode("next");

    expect(result.status).toBe("success");
    expect(result.nodeExecutionResults[0].outputData).toEqual([{ json: {} }]);
    expect(result.nodeExecutionResults[1].inputData).toEqual([{ json: {} }]);
  });

  it("does not turn query failures into empty results", async () => {
    queryGroups.mockRejectedValue(new Error("Query failed"));
    const result = await new WorkflowRunner(workflow(true)).run("query");

    expect(result.status).toBe("error");
    expect(result.nodeExecutionResults).toHaveLength(1);
    expect(result.nodeExecutionResults[0].errorMessage).toBe("Query failed");
    expect(result.nodeExecutionResults[0].outputData).toEqual([]);
  });

  it.each<INodeExecutionData[][]>([
    [[], [{ json: { id: 7 } }]],
    [[{ json: { id: 7 } }], []],
    [[], []],
    [],
  ])(
    "only fills the first output when all branches are empty: %j",
    async (...outputs) => {
      const branch: INodeType = {
        ...TabGroupQuery,
        description: {
          ...TabGroupQuery.description,
          name: "emptyOutputBranch",
          properties: [],
          outputs: [
            { name: "true", type: "main" },
            { name: "false", type: "main" },
          ],
        },
        async execute() {
          return outputs;
        },
      };
      Registry.register(branch);
      const wf = workflow(true);
      wf.nodes[0].type = "emptyOutputBranch";
      wf.nodes.push({ ...wf.nodes[1], id: "other" });
      wf.edges[0].sourceHandle = "true";
      wf.edges.push({
        id: "other-edge",
        source: "query",
        target: "other",
        sourceHandle: "false",
      });
      // Use pass-through consumers here because node lookup stores the first output only.
      const passThrough: INodeType = {
        ...consumer,
        description: {
          ...consumer.description,
          name: "emptyOutputPassThrough",
        },
        async execute() {
          return [this.getInputData()];
        },
      };
      Registry.register(passThrough);
      wf.nodes[1].type = wf.nodes[2].type = "emptyOutputPassThrough";
      const hasTrue = outputs[0]?.length > 0;
      const hasFalse = outputs[1]?.length > 0;
      const result = await new WorkflowRunner(wf).run("query");

      expect(result.status).toBe("success");
      expect(result.nodeExecutionResults.map((node) => node.nodeId)).toEqual([
        "query",
        hasFalse ? "other" : "next",
      ]);
      expect(result.nodeExecutionResults[1].inputData).toEqual(
        hasFalse ? outputs[1] : hasTrue ? outputs[0] : [{ json: {} }],
      );
    },
  );
});
