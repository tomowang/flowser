import type { ICredentialType } from "../types";

export const OpenAIApiCredential: ICredentialType = {
  name: "openai_api",
  displayName: "OpenAI API",
  properties: [
    {
      displayName: "API Key",
      name: "apiKey",
      type: "string",
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
