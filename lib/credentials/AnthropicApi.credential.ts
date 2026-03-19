import type { ICredentialType } from "../types";

export const AnthropicApiCredential: ICredentialType = {
  name: "anthropic_api",
  displayName: "Anthropic API",
  icon: "file:anthropic.svg",
  properties: [
    {
      displayName: "API Key",
      name: "apiKey",
      type: "password",
      required: true,
      description: "Anthropic API key",
    },
  ],
  documentationUrl: "https://console.anthropic.com/settings/keys",
};
