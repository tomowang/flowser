import Openai from "@thesvg/vue/openai-chatgpt";
import type { ICredentialType } from "../types";

export const OpenAIApiCredential: ICredentialType = {
  name: "openai_api",
  displayName: "OpenAI API",
  icon: Openai,
  properties: [
    {
      displayName: "API Key",
      name: "apiKey",
      type: "password",
      required: true,
      description: "OpenAI API key",
    },
    {
      displayName: "Base URL",
      name: "baseUrl",
      type: "string",
      required: false,
      default: "",
      description: "Optional custom Base URL (e.g. for proxies or Azure)",
    },
  ],
  documentationUrl: "https://platform.openai.com/api-keys",
};
