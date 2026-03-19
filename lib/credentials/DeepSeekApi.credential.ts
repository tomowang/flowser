import type { ICredentialType } from "../types";

export const DeepSeekApiCredential: ICredentialType = {
  name: "deepseek_api",
  displayName: "DeepSeek API",
  icon: "file:deepseek.svg",
  properties: [
    {
      displayName: "API Key",
      name: "apiKey",
      type: "password",
      required: true,
      description: "DeepSeek API key",
    },
    {
      displayName: "Base URL",
      name: "baseUrl",
      type: "string",
      required: false,
      default: "https://api.deepseek.com/v1",
      description: "DeepSeek API Base URL",
    },
  ],
  documentationUrl: "https://platform.deepseek.com/api_keys",
};
