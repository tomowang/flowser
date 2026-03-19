import {
  INodeType,
  IExecuteFunctions,
  INodeExecutionData,
  SupplyData,
} from "../../../types";

interface IDeepSeekModel {
  id: string;
}

export const DeepSeekModel: INodeType = {
  description: {
    displayName: "DeepSeek Chat Model",
    name: "deepSeekModel",
    icon: "file:deepseek.svg",
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
        typeOptions: {
          loadOptionsMethod: "listModels",
          loadOptionsDependsOn: ["credentials.deepseek_api"],
        },
        options: [],
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
  methods: {
    async listModels(this: IExecuteFunctions): Promise<unknown> {
      const credential = await this.getCredential?.("deepseek_api");
      if (!credential?.apiKey) {
        return { results: [] };
      }
      const apiKey = credential.apiKey as string;
      // DeepSeek uses standard OpenAI-like models endpoint
      // Base URL might be v1 or not, usually https://api.deepseek.com/models or https://api.deepseek.com/v1/models
      // The credential might have baseUrl.
      let baseUrl = (credential.baseUrl as string) || "https://api.deepseek.com";
      // Normalize baseUrl to remove /v1 suffix if present because we might append /models or /v1/models?
      // Actually usually it's BASE_URL/models.
      // If user typed https://api.deepseek.com/v1, we want https://api.deepseek.com/v1/models.
      // If user typed https://api.deepseek.com, we want https://api.deepseek.com/models ??
      // DeepSeek docs: https://api.deepseek.com/models
      // Let's rely on standard fetch.
      if (baseUrl.endsWith("/")) baseUrl = baseUrl.slice(0, -1);

      const url = `${baseUrl}/models`;

      try {
        const response = await fetch(url, {
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        });
        const data = (await response.json()) as { data: IDeepSeekModel[] };
        if (data.data) {
          return {
            results: data.data.map((m) => ({
              name: m.id, // DeepSeek displayName might be missing or same
              value: m.id,
            })),
          };
        }
      } catch (e) {
        console.error("Failed to list DeepSeek models", e);
      }
      return { results: [] };
    },
  },
};
