import {
  INodeType,
  IExecuteFunctions,
  INodeExecutionData,
  SupplyData,
} from "../../types";
import { CredentialService } from "../../services/credential-service";
import { Sparkles } from "lucide-vue-next";

export const GeminiModel: INodeType = {
  description: {
    displayName: "Gemini Chat Model",
    name: "geminiModel",
    icon: Sparkles,
    group: ["ai"],
    version: 1,
    description: "Google Gemini LLM Model",
    defaults: {
      name: "Gemini Model",
    },
    inputs: [],
    outputs: [{ name: "model", type: "model", label: "Model" }],
    credentials: [
      { name: "gemini_api", required: true, displayName: "Gemini API" },
    ],
    properties: [
      {
        displayName: "Model Name",
        name: "modelName",
        type: "options",
        typeOptions: {
          loadOptionsMethod: "listModels",
          loadOptionsDependsOn: ["credentials.gemini_api"],
        },
        options: [],
        default: "gemini-2.5-flash-lite",
      },
    ],
  },
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    // Models typically don't execute on their own in this architecture (like Tools).
    // They are called by the Agent.
    return [[]];
  },
  async supplyData(
    this: IExecuteFunctions,
    itemIndex: number,
  ): Promise<SupplyData> {
    const modelName = this.getNodeParameter(
      "modelName",
      itemIndex,
      "gemini-2.5-flash-lite",
    ) as string;

    // Get credential using new getCredential method
    const credential = await this.getCredential?.("gemini_api");
    if (!credential?.apiKey) {
      throw new Error("No credential selected for Gemini Model");
    }

    const apiKey = credential.apiKey as string;

    const { createGoogleGenerativeAI } = await import("@ai-sdk/google");

    const google = createGoogleGenerativeAI({
      apiKey: apiKey,
    });

    // Create and return the model instance
    return {
      response: {
        model: google(modelName),
        provider: "google",
        modelName: modelName,
      },
    };
  },
  methods: {
    async listModels(this: IExecuteFunctions): Promise<any> {
      const credential = await this.getCredential?.("gemini_api");
      if (!credential?.apiKey) {
        return {
          results: [],
        };
      }
      const apiKey = credential.apiKey as string;
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        );
        const data = await response.json();
        if (data.models) {
          return {
            results: data.models
              .filter(
                (m: any) =>
                  m.name.includes("gemini") &&
                  m.supportedGenerationMethods?.includes("generateContent"),
              )
              .map((m: any) => ({
                name: m.displayName,
                value: m.name.replace("models/", ""),
              })),
          };
        }
      } catch (e) {
        console.error("Failed to list models", e);
      }
      return { results: [] };
    },
  },
};
