
import { describe, it, expect, vi } from "vitest";
import { WorkflowRunner } from "../engine/WorkflowRunner";
import { IWorkflow, INodeType } from "../types";
import { Registry } from "../nodes/registry";
import { validateNode } from "./validation";

// Define a test node type with required properties
const TestNode: INodeType = {
  description: {
    displayName: "Test Node",
    name: "testNode",
    icon: "",
    group: ["test"],
    version: 1,
    description: "Test Node",
    defaults: { name: "Test Node" },
    inputs: [{ name: "main", type: "main" }],
    outputs: [{ name: "main", type: "main" }],
    properties: [
      {
        displayName: "Required Field",
        name: "requiredField",
        type: "string",
        required: true,
      },
    ],
  },
  async execute() {
    return [[{ json: { success: true } }]];
  },
};

const TriggerNode: INodeType = {
  description: {
    displayName: "Trigger",
    name: "manualTrigger",
    icon: "",
    group: ["trigger"],
    version: 1,
    description: "Manual Trigger",
    defaults: { name: "Trigger" },
    inputs: [],
    outputs: [{ name: "main", type: "main" }],
    properties: [],
  },
  async execute() {
    return [[{ json: { trigger: true } }]];
  },
};



// Mock Helper for QuickJS
const mockContext = {
  newFunction: () => ({ dispose: () => {} }),
  getString: () => "mock",
  newObject: () => ({ dispose: () => {} }),
  getProp: () => ({ dispose: () => {} }),
  setProp: () => {},
  callFunction: () => ({
    dispose: () => {},
    value: { dispose: () => {} },
    error: undefined,
  }),
  newString: () => ({ dispose: () => {} }),
  getNumber: () => 0,
  newNumber: () => ({ dispose: () => {} }),
  evalCode: () => ({
    value: { dispose: () => {} },
    error: undefined,
    dispose: () => {},
  }),
  dump: (val: unknown) => val,
  dispose: () => {},
  global: {},
  undefined: undefined,
};

const mockRuntime = {
  newContext: () => mockContext,
  dispose: () => {},
};

vi.mock("../services/quickjs", () => ({
  getQuickJS: async () => ({
    newRuntime: () => mockRuntime,
  }),
}));

vi.mock("vue-sonner", () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

describe("Node Validation", () => {
  Registry.register(TestNode);
  Registry.register(TriggerNode);

  it("should return invalid for missing required property", () => {
    const validResult = validateNode({
      id: "1",
      type: "testNode",
      data: { requiredField: "value" },
      position: { x: 0, y: 0 },
    });
    expect(validResult.isValid).toBe(true);

    const invalidResult = validateNode({
      id: "1",
      type: "testNode",
      data: {},
      position: { x: 0, y: 0 },
    });
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errors).toContain("Property 'Required Field' is required");
  });

  it("should block execution for invalid node", async () => {
    const workflow: IWorkflow = {
      id: "wf-1",
      name: "Validation Test",
      nodes: [
        {
          id: "trigger",
          type: "manualTrigger",
          position: { x: 0, y: 0 },
          data: {},
        },
        {
          id: "node-1",
          type: "testNode",
          position: { x: 100, y: 0 },
          data: {}, // Missing requiredField
        },
      ],
      edges: [
        {
          id: "e1",
          source: "trigger",
          target: "node-1",
          sourceHandle: "main",
          targetHandle: "main",
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      active: false,
    };

    const runner = new WorkflowRunner(workflow);
    const result = await runner.run("trigger");

    expect(result.status).toBe("error");
    const node1Result = result.nodeExecutionResults.find((n) => n.nodeId === "node-1");
    // Trigger should succeed
    const triggerResult = result.nodeExecutionResults.find((n) => n.nodeId === "trigger");
    expect(triggerResult?.status).toBe("success");

    // Node 1 should fail or not start if validation happens before execution log
    // Implementation check: we log "Executing node..." then validate.
    // If validation fails, it throws.
    // It is caught in executeNode, so status becomes error.
    expect(node1Result).toBeDefined();
    expect(node1Result?.status).toBe("error");
    expect(node1Result?.errorMessage).toContain("Node validation failed");
  });
  it("should return invalid for missing required credential", () => {
    // Register a node with required credential
    const CredentialNode: INodeType = {
      description: {
        displayName: "Credential Node",
        name: "credentialNode",
        icon: "",
        group: ["test"],
        version: 1,
        description: "Credential Node",
        defaults: { name: "Credential Node" },
        inputs: [],
        outputs: [],
        properties: [],
        credentials: [
          { name: "test_cred", required: true, displayName: "Test Credential" },
        ],
      },
    };
    Registry.register(CredentialNode);

    const validResult = validateNode({
      id: "1",
      type: "credentialNode",
      data: {
        credentials: {
          test_cred: "some-id",
        },
      },
      position: { x: 0, y: 0 },
    });
    expect(validResult.isValid).toBe(true);

    const invalidResult = validateNode({
      id: "1",
      type: "credentialNode",
      data: {
        credentials: {},
      },
      position: { x: 0, y: 0 },
    });
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errors).toContain(
      "Credential 'Test Credential' is required",
    );
  });
});
