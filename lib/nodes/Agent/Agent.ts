import {
  INodeType,
  IExecuteFunctions,
  INodeExecutionData,
  ISupplyDataFunctions,
} from "../../types";
import { Bot } from "lucide-vue-next";

interface IConnectedNode {
  id: string;
  type: string;
  nodeType: INodeType;
  data: Record<string, unknown>;
}

export const AgentNode: INodeType = {
  description: {
    displayName: "AI Agent",
    name: "agent",
    icon: Bot,
    group: ["ai"],
    version: 1,
    description: "An AI Agent that can use tools",
    defaults: {
      name: "AI Agent",
    },
    inputs: [
      { name: "main", type: "main", label: "Input" },
      { name: "tools", type: "tool", label: "Tools" },
      { name: "model", type: "model", label: "Model", required: true },
    ],
    outputs: [{ name: "main", type: "main", label: "Output" }],
    properties: [
      {
        displayName: "Prompt",
        name: "prompt",
        type: "textarea",
        typeOptions: {
          rows: 10,
        },
        default: "You are a helpful assistant.",
        description: "System prompt for the agent",
      },
      {
        displayName: "User Message",
        name: "message",
        type: "textarea",
        typeOptions: {
          rows: 5,
        },
        default: "",
        description: "Input message",
      },
    ],
  },
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const prompt = this.getNodeParameter("prompt") as string;
    const message = this.getNodeParameter("message") as string;

    // Check for connected Model
    if (!this.getConnectedNodes) {
      throw new Error("getConnectedNodes not available");
    }

    const modelNodes = this.getConnectedNodes("model") as IConnectedNode[];
    if (modelNodes.length === 0) {
      throw new Error("No model connected to Agent node");
    }

    const modelNode = modelNodes[0];
    // In our runner, we attached the full nodeType to the returned object
    const modelNodeType = modelNode.nodeType;

    if (!modelNodeType || !modelNodeType.supplyData) {
      throw new Error("Connected model node does not support supplyData");
    }

    // Call supplyData on the model node
    // We pass itemIndex 0 for now, or loop if we want to support batching
    const itemIndex = 0;

    const modelNodeData = modelNode.data;

    const modelSupplyDataContext = {
      ...this,
      getNodeParameter: (paramName: string, ...args: unknown[]) => {
        // Re-implement or proxy logic using modelNodeData
        const fallback = args.length > 1 ? args[1] : args[0];
        // We don't have expression evaluation context for the authorized node easily here without Runner help.
        // For now, assume simple values or simple retrieval.
        return modelNodeData[paramName] ?? fallback;
      },
      getCredential: async (credentialType: string) => {
        // Credentials are stored in modelNodeData.credentials[credentialType] as credential ID
        const credentialId = (
          modelNodeData?.credentials as Record<string, string> | undefined
        )?.[credentialType];
        if (!credentialId) return null;

        const { CredentialService } = await import(
          "../../services/credential-service"
        );
        return await CredentialService.getDecryptedCredential(credentialId);
      },
    } as ISupplyDataFunctions;

    const supplyDataResult = await modelNodeType.supplyData.call(
      modelSupplyDataContext,
      itemIndex,
    );

    const modelInstance = supplyDataResult.response as {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      model: any; // ai-sdk model instance
      provider: string;
      modelName: string;
    };

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
