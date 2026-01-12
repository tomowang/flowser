import type { ICredentialType } from "../types";

import { GeminiApiCredential } from "./GeminiApi";
import { OpenAIApiCredential } from "./OpenAIApi";
import { AnthropicApiCredential } from "./AnthropicApi";
import { DeepSeekApiCredential } from "./DeepSeekApi";

export {
  GeminiApiCredential,
  OpenAIApiCredential,
  AnthropicApiCredential,
  DeepSeekApiCredential,
};

// Registry of all credential types
const credentialTypes: ICredentialType[] = [
  GeminiApiCredential,
  OpenAIApiCredential,
  AnthropicApiCredential,
  DeepSeekApiCredential,
];

// Get all registered credential types
export function getAllCredentialTypes(): ICredentialType[] {
  return credentialTypes;
}

// Get a credential type by name
export function getCredentialType(name: string): ICredentialType | undefined {
  return credentialTypes.find((ct) => ct.name === name);
}
