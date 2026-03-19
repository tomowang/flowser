import {
  INodeType,
  IExecuteFunctions,
  INodeExecutionData,
  SupplyData,
} from "../../../types";

interface IAnthropicModel {
  id: string;
  display_name?: string;
}

export const ClaudeModel: INodeType = {
  description: {
    displayName: "Claude Chat Model",
    name: "claudeModel",
    icon: "file:anthropic.svg",
    group: ["ai"],
    version: 1,
    description: "Anthropic Claude LLM Model",
    defaults: {
      name: "Claude Model",
    },
    inputs: [],
    outputs: [{ name: "model", type: "model", label: "Model" }],
    credentials: [
      { name: "anthropic_api", required: true, displayName: "Anthropic API" },
    ],
    properties: [
      {
        displayName: "Model Name",
        name: "modelName",
        type: "options",
        typeOptions: {
          loadOptionsMethod: "listModels",
          loadOptionsDependsOn: ["credentials.anthropic_api"],
        },
        options: [],
        default: "claude-3-5-sonnet-20240620",
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
      "claude-3-5-sonnet-20240620",
    ) as string;

    // Get credential using new getCredential method
    const credential = await this.getCredential?.("anthropic_api");
    if (!credential?.apiKey) {
      throw new Error("No credential selected for Claude Model");
    }

    const apiKey = credential.apiKey as string;

    const { createAnthropic } = await import("@ai-sdk/anthropic");

    const anthropic = createAnthropic({
      apiKey: apiKey,
    });

    return {
      response: {
        model: anthropic(modelName),
        provider: "anthropic",
        modelName: modelName,
      },
    };
  },
  methods: {
    async listModels(this: IExecuteFunctions): Promise<unknown> {
      const credential = await this.getCredential?.("anthropic_api");
      if (!credential?.apiKey) {
        return { results: [] };
      }
      const apiKey = credential.apiKey as string;

      try {
        const response = await fetch("https://api.anthropic.com/v1/models", {
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
        });
        const data = (await response.json()) as { data: IAnthropicModel[] };
        if (data.data) {
          return {
            results: data.data.map((m) => ({
              name: m.display_name || m.id,
              value: m.id,
            })),
          };
        }
      } catch (e) {
        console.error("Failed to list Claude models", e);
      }
      return { results: [] };
    },
  },
};
