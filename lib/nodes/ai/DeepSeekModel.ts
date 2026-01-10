import { INodeType, IExecuteFunctions, INodeExecutionData, SupplyData } from "../../types";
import { Zap } from "lucide-vue-next";

export const DeepSeekModel: INodeType = {
  description: {
    displayName: "DeepSeek Chat Model",
    name: "deepSeekModel",
    icon: Zap,
    group: ["model"],
    version: 1,
    description: "DeepSeek LLM Model",
    defaults: {
      name: "DeepSeek Model",
    },
    inputs: [],
    outputs: [{ name: "model", type: "model", label: "Model" }],
    properties: [
      {
        displayName: "Credential",
        name: "credentialId",
        type: "credential",
        credentialType: "deepseek_api",
        default: "",
        description: "Select the credential to use",
      },
      {
        displayName: "Model Name",
        name: "modelName",
        type: "options",
        options: [
          { name: "DeepSeek-V3 (Chat)", value: "deepseek-chat" },
          { name: "DeepSeek-R1 (Reasoner)", value: "deepseek-reasoner" },
        ],
        default: "deepseek-chat",
      },
      {
        displayName: "Base URL",
        name: "baseUrl",
        type: "string",
        default: "https://api.deepseek.com/v1", // Default DeepSeek API URL if using OpenAI SDK
        description: "DeepSeek API Base URL (defaults to https://api.deepseek.com/v1)",
      },
    ],
  },
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    return [[]];
  },
  async supplyData(this: IExecuteFunctions, itemIndex: number): Promise<SupplyData> {
    const credentialId = this.getNodeParameter("credentialId", itemIndex) as string;
    const modelName = this.getNodeParameter("modelName", itemIndex, "deepseek-chat") as string;
    const baseUrl = this.getNodeParameter("baseUrl", itemIndex, "https://api.deepseek.com/v1") as string;

    if (!credentialId) {
      throw new Error("No credential selected for DeepSeek Model");
    }

    const { CredentialService } = await import("../../services/credential-service");
    
    const apiKey = await CredentialService.getDecryptedValue(credentialId);
    if (!apiKey) {
      throw new Error("Failed to decrypt DeepSeek API key");
    }

    // DeepSeek is OpenAI compatible
    const { createOpenAI } = await import("@ai-sdk/openai");
    
    const deepseek = createOpenAI({
      apiKey: apiKey,
      baseURL: baseUrl,
    });

    return {
      response: {
        model: deepseek(modelName),
        provider: "deepseek",
        modelName: modelName,
      },
    };
  },
};
