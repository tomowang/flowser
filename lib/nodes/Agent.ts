import { INodeType, IExecuteFunctions, INodeExecutionData } from "../types";

export const AgentNode: INodeType = {
  description: {
    displayName: "AI Agent",
    name: "agent",
    icon: "fa:user-secret",
    group: ["agent"],
    version: 1,
    description: "An AI Agent that can use tools",
    defaults: {
      name: "AI Agent",
      color: "#673ab7", // Deep Purple
    },
    inputs: [
      { name: "main", type: "main", label: "Input" },
      { name: "tools", type: "tool", label: "Tools" },
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
    const input = this.getInputData();
    // Simulate Agent logic
    const prompt = this.getNodeParameter("prompt") as string;
    const message = this.getNodeParameter("message") as string;

    // In a real implementation, we would:
    // 1. Get connected nodes on 'tools' input.
    // 2. Introspect them to get their tool definitions.
    // 3. Call an LLM with functions.

    // For this simulation:
    // We check if a Calculator tool is connected, and if the message requests math, we "use" it.

    // We need a way to see connected nodes.
    // Since we don't have that in `IExecuteFunctions` yet, we'll mock it or simply return a static response for now,
    // and then improve the engine to pass connections.

    return [
      [
        {
          json: {
            output: `Agent received: "${message}". Processed with prompt: "${prompt}". (Tool usage mocked)`,
          },
        },
      ],
    ];
  },
};
