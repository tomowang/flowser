import { describe, it, expect, vi } from "vitest";
import { WorkflowRunner } from "../lib/engine/WorkflowRunner";
import { IWorkflow, INodeType } from "../lib/types";
import { Registry } from "../lib/nodes/registry";
import { AgentNode } from "../lib/nodes/Agent/Agent";

import { GeminiModel } from "../lib/nodes/ai/GeminiModel/GeminiModel";

// Register nodes
Registry.register(AgentNode);
Registry.register(GeminiModel);
// We need a trigger node
const ManualTriggerNode: INodeType = {
  description: {
    displayName: "Manual Trigger",
    name: "manualTrigger",
    icon: "",
    group: ["trigger"],
    version: 1,
    description: "Manual Trigger",
    defaults: { name: "Manual Trigger" },
    inputs: [],
    outputs: [{ name: "main", type: "main" }],
    properties: [],
  },
  async execute() {
    return [[{ json: { manual: true } }]];
  },
};
Registry.register(ManualTriggerNode);

// Mock dynamic imports
vi.mock("@ai-sdk/google", () => ({
  createGoogleGenerativeAI: () => {
    return (modelName: string) => ({
      modelId: modelName,
      provider: "google-mock",
    });
  },
  google: (modelName: string) => ({
    modelId: modelName,
    provider: "google-mock",
  }),
}));

vi.mock("ai", () => ({
  generateText: async (params: { prompt: string }) => {
    return {
      text: `Mock response for prompt: ${params.prompt}`,
      usage: { totalTokens: 10 },
    };
  },
}));

vi.mock("../lib/services/credential-service", () => ({
  CredentialService: {
    getDecryptedValue: async (id: string) => {
      if (id === "cred-123") return "fake-api-key";
      return null;
    },
    getDecryptedCredential: async (id: string) => {
      if (id === "cred-123") return { apiKey: "fake-api-key" };
      return null;
    },
  },
}));

// Mock QuickJS
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
    dispose: () => {}, // handle handle dispose
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

vi.mock("../lib/services/quickjs", () => ({
  getQuickJS: async () => ({
    newRuntime: () => mockRuntime,
  }),
}));

describe("Agent Node Execution", () => {
  it("should execute agent with connected gemini model", async () => {
    const workflow: IWorkflow = {
      id: "wf-1",
      name: "Agent Test",
      nodes: [
        {
          id: "trigger-1",
          type: "manualTrigger",
          position: { x: 0, y: 0 },
          data: { label: "Start" },
        },
        {
          id: "model-1",
          type: "geminiModel",
          position: { x: 0, y: 100 },
          data: {
            label: "Gemini",
            credentials: {
              gemini_api: "cred-123",
            },
            modelName: "gemini-pro",
          },
        },
        {
          id: "agent-1",
          type: "agent",
          position: { x: 200, y: 100 },
          data: {
            label: "Agent",
            prompt: "You are a bot",
            message: "Hello world",
          },
        },
      ],
      edges: [
        {
          id: "e1",
          source: "trigger-1",
          target: "agent-1",
          sourceHandle: "main",
          targetHandle: "main",
        },
        {
          id: "e2",
          source: "model-1",
          target: "agent-1", // Connected to Agent
          sourceHandle: "model",
          targetHandle: "model", // Agent input handle for model
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

    const agentResult = result.nodeExecutionResults.find(
      (n) => n.nodeId === "agent-1",
    );
    expect(agentResult).toBeDefined();
    expect(agentResult?.status).toBe("success");

    const output = agentResult?.outputData[0]?.json?.output;
    expect(output).toBe("Mock response for prompt: Hello world");

    const tokenUsage = agentResult?.outputData[0]?.json?.tokenUsage;
    expect(tokenUsage).toEqual({ totalTokens: 10 });
  });
});
