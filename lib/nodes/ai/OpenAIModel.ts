import { INodeType, IExecuteFunctions, INodeExecutionData, SupplyData } from "../../types";
import { Bot } from "lucide-vue-next";

export const OpenAIModel: INodeType = {
  description: {
    displayName: "OpenAI Chat Model",
    name: "openAIModel",
    icon: Bot,
    group: ["model"],
    version: 1,
    description: "OpenAI LLM Model",
    defaults: {
      name: "OpenAI Model",
    },
    inputs: [],
    outputs: [{ name: "model", type: "model", label: "Model" }],
    properties: [
      {
        displayName: "Credential",
        name: "credentialId",
        type: "credential",
        credentialType: "openai_api",
        default: "",
        description: "Select the credential to use",
      },
      {
        displayName: "Model Name",
        name: "modelName",
        type: "options",
        options: [
          { name: "GPT-5", value: "gpt-5" },
          { name: "GPT-4.5 (Orion)", value: "gpt-4.5-preview" },
          { name: "GPT-4o", value: "gpt-4o" },
          { name: "GPT-4o Mini", value: "gpt-4o-mini" },
          { name: "o3 (Reasoning)", value: "o3" },
          { name: "o3 Mini", value: "o3-mini" },
          { name: "GPT-4 Turbo", value: "gpt-4-turbo" },
        ],
        default: "gpt-5",
      },
      {
        displayName: "Base URL",
        name: "baseUrl",
        type: "string",
        default: "",
        description: "Optional custom Base URL (e.g. for proxies)",
      },
    ],
  },
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    return [[]];
  },
  async supplyData(this: IExecuteFunctions, itemIndex: number): Promise<SupplyData> {
    const credentialId = this.getNodeParameter("credentialId", itemIndex) as string;
    const modelName = this.getNodeParameter("modelName", itemIndex, "gpt-4o-mini") as string;
    const baseUrl = this.getNodeParameter("baseUrl", itemIndex) as string;

    if (!credentialId) {
      throw new Error("No credential selected for OpenAI Model");
    }

    const { CredentialService } = await import("../../services/credential-service");
    
    const apiKey = await CredentialService.getDecryptedValue(credentialId);
    if (!apiKey) {
      throw new Error("Failed to decrypt OpenAI API key");
    }

    const { createOpenAI } = await import("@ai-sdk/openai");
    
    const openai = createOpenAI({
      apiKey: apiKey,
      baseURL: baseUrl || undefined,
    });

    return {
      response: {
        model: openai(modelName),
        provider: "openai",
        modelName: modelName,
      },
    };
  },
};
