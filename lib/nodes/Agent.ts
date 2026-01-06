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
      color: "#673ab7", // Deep Purple
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
    // Simulate Agent logic
    const prompt = this.getNodeParameter("prompt") as string;
    const message = this.getNodeParameter("message") as string;

    // Check for connected Model
    let modelInfo = "No model connected";
    let credentialInfo = "No credential";

    if (this.getConnectedNodes) {
      const modelNodes = this.getConnectedNodes("model");
      if (modelNodes.length > 0) {
        const modelNode = modelNodes[0];
        const modelName = modelNode.data.modelName;
        const credentialId = modelNode.data.credentialId;
        modelInfo = `Connected Model: ${modelName}`;

        if (credentialId) {
          // In real execution, we would use the credential to call the API
          // Here we just verify we can access it (if we were in a secure context)
          // Note: SecurityService and CredentialService usages would be here.
          // Since this runs in browser, we can import them directly if we want to test fully.
          const { CredentialService } = await import(
            "../services/credential-service"
          );
          try {
            const apiKey =
              await CredentialService.getDecryptedValue(credentialId);
            credentialInfo = apiKey
              ? `Credential loaded (starts with ${apiKey.substring(0, 4)}...)`
              : "Failed to decrypt";
          } catch (e: any) {
            credentialInfo = `Credential Error: ${e.message}`;
          }
        }
      }
    }

    return [
      [
        {
          json: {
            output: `Agent received: "${message}". Processed with prompt: "${prompt}".\n${modelInfo}\n${credentialInfo}`,
          },
        },
      ],
    ];
  },
};
