import {
  INodeType,
  IExecuteFunctions,
  INodeExecutionData,
  SupplyData,
} from "../../../types";
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
        typeOptions: {
          loadOptionsMethod: "listModels",
          loadOptionsDependsOn: ["credentials.openai_api"],
        },
        options: [],
        default: "gpt-4o",
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
      "gpt-4o",
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
  methods: {
    async listModels(this: IExecuteFunctions): Promise<any> {
      const credential = await this.getCredential?.("openai_api");
      if (!credential?.apiKey) {
        return { results: [] };
      }
      const apiKey = credential.apiKey as string;
      const baseUrl = (credential.baseUrl as string) || "https://api.openai.com/v1";

      const url = `${baseUrl}/models`; // Helper to handle slash? simplified here

      try {
        const response = await fetch(url, {
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        if (data.data) {
          // Filter out non-chat models loosely
          const chatModels = data.data.filter((m: any) =>
            m.id.includes("gpt") || m.id.includes("o1") || m.id.includes("o3") // o1/o3 reasoning models
          );

          return {
            results: chatModels.map((m: any) => ({
              name: m.id,
              value: m.id,
            })),
          };
        }
      } catch (e) {
        console.error("Failed to list OpenAI models", e);
      }
      return { results: [] };
    },
  },
};
