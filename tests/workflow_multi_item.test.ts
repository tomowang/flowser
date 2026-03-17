import { describe, it, expect, vi } from "vitest";
import { WorkflowRunner } from "../lib/engine/WorkflowRunner";
import { IWorkflow, INodeType } from "../lib/types";
import { Registry } from "../lib/nodes/registry";

// ── Minimal node stubs ────────────────────────────────────────────────────────

const MultiOutputTrigger: INodeType = {
  description: {
    displayName: "Multi Output Trigger",
    name: "multiOutputTrigger2",
    icon: "",
    group: ["trigger"],
    version: 1,
    description: "Trigger that outputs multiple items",
    defaults: { name: "Multi Output Trigger" },
    inputs: [],
    outputs: [{ name: "main", type: "main" }],
    properties: [],
  },
  async execute() {
    return [
      [
        { json: { value: 10 } },
        { json: { value: 5 } },
        { json: { value: 20 } },
      ],
    ];
  },
};

/**
 * A node that, for each input item, reads a parameter (which may be an
 * expression like `={{ $json.value }}`) and copies it into the output.
 * This exercises the getNodeParameter → expression evaluation path directly.
 */
const PerItemParamNode: INodeType = {
  description: {
    displayName: "Per-Item Param",
    name: "perItemParam",
    icon: "",
    group: ["core"],
    version: 1,
    description: "Reads a param per-item and outputs it",
    defaults: { name: "Per-Item Param" },
    inputs: [{ name: "main", type: "main" }],
    outputs: [{ name: "main", type: "main" }],
    properties: [
      {
        displayName: "Captured",
        name: "captured",
        type: "string",
        default: "",
      },
    ],
  },
  async execute() {
    const items = this.getInputData();
    return [
      items.map((_, i) => ({
        json: {
          // getNodeParameter with index i — this is the code path that was buggy
          captured: this.getNodeParameter("captured", i),
        },
      })),
    ];
  },
};

Registry.register(MultiOutputTrigger);
Registry.register(PerItemParamNode);

// ── QuickJS mock ──────────────────────────────────────────────────────────────
//
// WorkflowRunner uses QuickJS to evaluate expression strings.
// Every returned value must satisfy the QuickJS handle interface: { dispose() }.

let _currentItemIndex = 0;
let _currentInputData: Array<{ json: Record<string, unknown> }> = [];

function makeHandle(value: unknown) {
  return { __value: value, dispose: vi.fn() };
}

const mockContext = {
  newFunction: vi.fn(() => makeHandle(null)),
  getString: vi.fn(() => "mock"),
  newObject: vi.fn(() => makeHandle(null)),
  getProp: vi.fn((_owner: unknown, key: string) => {
    if (key === "$itemIndex") return makeHandle(_currentItemIndex);
    if (key === "JSON") return makeHandle(null);
    if (key === "parse") return makeHandle(null);
    return makeHandle(null);
  }),
  setProp: vi.fn((_owner: unknown, key: string, val: unknown) => {
    if (key === "$itemIndex" && typeof (val as any).__value === "number") {
      _currentItemIndex = (val as any).__value;
    }
  }),
  callFunction: vi.fn(
    (_fn: unknown, _thisArg: unknown, jsonStringHandle: unknown) => {
      try {
        const str = (jsonStringHandle as any).__value as string;
        return { value: makeHandle(JSON.parse(str)), error: undefined };
      } catch {
        return { value: makeHandle(null), error: undefined };
      }
    },
  ),
  newString: vi.fn((s: string) => makeHandle(s)),
  getNumber: vi.fn((handle: unknown) => {
    const v = (handle as any).__value;
    return typeof v === "number" ? v : _currentItemIndex;
  }),
  newNumber: vi.fn((n: number) => {
    _currentItemIndex = n;
    return makeHandle(n);
  }),
  /**
   * Evaluates simple `$json.<field>` and `$input.item.json.<field>` expressions
   * against the current item. WorkflowRunner sets $itemIndex via newNumber
   * before each evalCode call, so _currentItemIndex is always in sync.
   */
  evalCode: vi.fn((expr: string) => {
    const item = _currentInputData[_currentItemIndex] ?? _currentInputData[0];
    const jsonData = item?.json ?? {};
    let result: unknown = expr;
    try {
      const safeExpr = expr.replace(/\$json\./g, "__json.");
      // eslint-disable-next-line no-new-func
      result = new Function("__json", `"use strict"; return (${safeExpr})`)(
        jsonData,
      );
    } catch {
      // fallback — return raw expression string
    }
    return { value: makeHandle(result), error: undefined };
  }),
  dump: vi.fn((handle: unknown) => (handle as any).__value ?? handle),
  dispose: vi.fn(),
  global: makeHandle(null),
  undefined: makeHandle(undefined),
};

const mockRuntime = {
  newContext: () => mockContext,
  dispose: vi.fn(),
};

vi.mock("../lib/services/quickjs", () => ({
  getQuickJS: async () => ({
    newRuntime: () => mockRuntime,
  }),
}));

vi.mock("../lib/services/credential-service", () => ({
  CredentialService: {
    getDecryptedCredential: async () => null,
  },
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Multi-item expression evaluation", () => {
  /**
   * Regression test for the bug where `getNodeParameter` always used
   * `itemIndex = 0` when evaluating expressions, causing all items to
   * receive the first item's data.
   *
   * Workflow:
   *   MultiOutputTrigger (3 items) ──► PerItemParamNode
   *
   * The `PerItemParamNode` has a parameter `captured = ={{ $json.value }}`
   * (an expression). It calls `this.getNodeParameter("captured", i)` for
   * each item index i.
   *
   * Expected: captured = [10, 5, 20]  (one per input item)
   * Before fix: captured = [10, 10, 10]  (always item[0])
   */
  it("getNodeParameter evaluates expressions with the correct per-item index", async () => {
    _currentInputData = [
      { json: { value: 10 } },
      { json: { value: 5 } },
      { json: { value: 20 } },
    ];
    _currentItemIndex = 0;

    const workflow: IWorkflow = {
      id: "wf-multi2",
      name: "Multi Item Param Test",
      nodes: [
        {
          id: "trigger-1",
          type: "multiOutputTrigger2",
          position: { x: 0, y: 0 },
          data: { label: "Trigger" },
        },
        {
          id: "param-1",
          type: "perItemParam",
          position: { x: 200, y: 0 },
          data: {
            label: "Per-Item Param",
            // Expression: reads current item's value via getNodeParameter.
            // The "=" prefix tells getNodeParameter to evaluate as expression.
            // The {{ }} delimiters are required by evaluateStringWithExpressions.
            captured: "={{ $json.value }}",
          },
        },
      ],
      edges: [
        {
          id: "e1",
          source: "trigger-1",
          target: "param-1",
          sourceHandle: "main",
          targetHandle: "main",
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      active: true,
      previewSvg: "",
    };

    const runner = new WorkflowRunner(workflow);
    const result = await runner.run("trigger-1");
    expect(result.status).toBe("success");

    const paramResult = result.nodeExecutionResults.find(
      (n) => n.nodeId === "param-1",
    );
    expect(paramResult).toBeDefined();
    expect(paramResult!.outputData).toHaveLength(3);

    // Each item should have captured its OWN value, not always item[0]'s value
    expect(paramResult!.outputData[0].json.captured).toBe(10);
    expect(paramResult!.outputData[1].json.captured).toBe(5);
    expect(paramResult!.outputData[2].json.captured).toBe(20);
  });
});
