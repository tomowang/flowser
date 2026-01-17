import {
  INodeType,
  IExecuteFunctions,
  INodeExecutionData,
  SupplyData,
} from "../../types";
import { MessageCircle } from "lucide-vue-next";

export const ClaudeModel: INodeType = {
  description: {
    displayName: "Claude Chat Model",
    name: "claudeModel",
    icon: MessageCircle,
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
        options: [
          { name: "Claude 4.5 Opus", value: "claude-4-5-opus" },
          { name: "Claude 4.5 Sonnet", value: "claude-4-5-sonnet" },
          { name: "Claude 4.5 Haiku", value: "claude-haiku-4-5-20251001" },
          { name: "Claude 3.7 Sonnet", value: "claude-3-7-sonnet-20250224" },
          { name: "Claude 3.5 Sonnet", value: "claude-3-5-sonnet-20240620" },
          { name: "Claude 3.5 Haiku", value: "claude-3-5-haiku-20241022" },
        ],
        default: "claude-4-5-sonnet",
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
};
