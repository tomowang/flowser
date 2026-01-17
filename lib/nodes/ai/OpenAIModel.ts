import {
  INodeType,
  IExecuteFunctions,
  INodeExecutionData,
  SupplyData,
} from "../../types";
import { Bot } from "lucide-vue-next";

export const OpenAIModel: INodeType = {
  description: {
    displayName: "OpenAI Chat Model",
    name: "openAIModel",
    icon: Bot,
    group: ["ai"],
    version: 1,
    description: "OpenAI LLM Model",
    defaults: {
      name: "OpenAI Model",
    },
    inputs: [],
    outputs: [{ name: "model", type: "model", label: "Model" }],
    credentials: [
      { name: "openai_api", required: true, displayName: "OpenAI API" },
    ],
    properties: [
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
      "gpt-4o-mini",
    ) as string;

    // Get credential using new getCredential method
    const credential = await this.getCredential?.("openai_api");
    if (!credential?.apiKey) {
      throw new Error("No credential selected for OpenAI Model");
    }

    const apiKey = credential.apiKey as string;
    const baseUrl = credential.baseUrl as string | undefined;

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
