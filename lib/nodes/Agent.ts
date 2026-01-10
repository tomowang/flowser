import { INodeType, IExecuteFunctions, INodeExecutionData } from "../types";
import { Bot } from "lucide-vue-next";

export const AgentNode: INodeType = {
  description: {
    displayName: "AI Agent",
    name: "agent",
    icon: Bot,
    group: ["agent"],
    version: 1,
    description: "An AI Agent that can use tools",
    defaults: {
      name: "AI Agent",
    },
    inputs: [
      { name: "main", type: "main", label: "Input" },
      { name: "tools", type: "tool", label: "Tools" },
      { name: "model", type: "model", label: "Model" },
    ],
    outputs: [{ name: "main", type: "main", label: "Output" }],
    properties: [
      {
        displayName: "Prompt",
        name: "prompt",
        type: "string", // text area
        default: "You are a helpful assistant.",
        description: "System prompt for the agent",
      },
      {
        displayName: "User Message",
        name: "message",
        type: "string",
        default: "",
        description: "Input message",
      },
    ],
  },
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    // @ts-ignore
    const input = this.getInputData();
    const prompt = this.getNodeParameter("prompt") as string;
    const message = this.getNodeParameter("message") as string;

    // Check for connected Model
    if (!this.getConnectedNodes) {
      throw new Error("getConnectedNodes not available");
    }

    const modelNodes = this.getConnectedNodes("model");
    if (modelNodes.length === 0) {
      throw new Error("No model connected to Agent node");
    }

    const modelNode = modelNodes[0];
    // In our runner, we attached the full nodeType to the returned object
    const modelNodeType = modelNode.nodeType as INodeType; 

    if (!modelNodeType || !modelNodeType.supplyData) {
      throw new Error("Connected model node does not support supplyData");
    }

    // Call supplyData on the model node
    // We pass itemIndex 0 for now, or loop if we want to support batching
    const itemIndex = 0;
    
    // We need to create a context for supplyData. 
    // Ideally the runner should handle this invocation if it was a distinct "supplyData" phase,
    // but here the Agent node orchestrates it ("pull" model).
    // We bind 'this' to the supplyData call, but 'this' is IExecuteFunctions.
    // supplyData expects ISupplyDataFunctions which extends IExecuteFunctions.
    // However, the context (getNodeParameter) needs to work for the *model* node, not the agent node.
    // The current 'this' context is for the Agent node.
    // We cannot easily re-bind 'this' to the model node's context without help from the Runner.
    
    // WAIT. n8n's `supplyData` helper or runner usually handles context creation.
    // In my `WorkflowRunner`, `getNodeParameter` uses `node.data`.
    // If I simply call `modelNodeType.supplyData.call(this, itemIndex)`, `this.getNodeParameter` will look at AGENT node's data.
    // This is WRONG. The model parameters (credentialId, modelName) are on the MODEL node.
    
    // I need a way to create a context for the model node.
    // Since I cannot access `WorkflowRunner` internals easily here, I might need to hack it 
    // OR change `WorkflowRunner` to provide a helper to "execute as node".
    // 
    // ALTERNATIVE: `supplyData` could accept the node data directly? No, it uses `this.getNodeParameter`.
    //
    // Let's look at `WorkflowRunner.ts` again. `executeNode` creates `executionFunctions`.
    // I need similar functions for the model node.
    //
    // QUICK FIX: verify if I can construct a proxy context.
    // `this.getNodeParameter` uses `node.data`. referencing the current executing node.
    //
    // I will implement a workaround in `Agent.ts` for now, assuming I can't easily change Runner architecture deeply in one step.
    // Actually, `getConnectedNodes` returns `data`.
    // I can bind a custom object to `supplyData`.
    
    const modelNodeData = modelNode.data;
    const runnerContext = this; // potentially dangerous if we rely on internal state, but `this` has methods.

    const modelSupplyDataContext = {
      ...this,
      getNodeParameter: (paramName: string, ...args: any[]) => {
          // Re-implement or proxy logic using modelNodeData
          const fallback = args.length > 1 ? args[1] : args[0];
          // We don't have expression evaluation context for the authorized node easily here without Runner help.
          // For now, assume simple values or simple retrieval.
          return modelNodeData[paramName] ?? fallback;
      },
    };

    const modelInstance = (await modelNodeType.supplyData!.call(modelSupplyDataContext, itemIndex)).response as any;
    
    const { generateText } = await import("ai");

    const result = await generateText({
      model: modelInstance.model,
      system: prompt,
      prompt: message,
    });

    return [
      [
        {
          json: {
            output: result.text,
            tokenUsage: result.usage,
          },
        },
      ],
    ];
  },
};
