import {
  INodeType,
  IExecuteFunctions,
  INodeExecutionData,
  SupplyData,
} from "../../types";
import { Zap } from "lucide-vue-next";

export const DeepSeekModel: INodeType = {
  description: {
    displayName: "DeepSeek Chat Model",
    name: "deepSeekModel",
    icon: Zap,
    group: ["ai"],
    version: 1,
    description: "DeepSeek LLM Model",
    defaults: {
      name: "DeepSeek Model",
    },
    inputs: [],
    outputs: [{ name: "model", type: "model", label: "Model" }],
    credentials: [
      { name: "deepseek_api", required: true, displayName: "DeepSeek API" },
    ],
    properties: [
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
    ],
  },
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    return [[]];
  },
  async supplyData(
    this: IExecuteFunctions,
    itemIndex: number,
  ): Promise<SupplyData> {
    const modelName = this.getNodeParameter(
      "modelName",
      itemIndex,
      "deepseek-chat",
    ) as string;

    // Get credential using new getCredential method
    const credential = await this.getCredential?.("deepseek_api");
    if (!credential?.apiKey) {
      throw new Error("No credential selected for DeepSeek Model");
    }

    const apiKey = credential.apiKey as string;
    const baseUrl =
      (credential.baseUrl as string) || "https://api.deepseek.com/v1";

    const { createDeepSeek } = await import("@ai-sdk/deepseek");

    const deepseek = createDeepSeek({
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
