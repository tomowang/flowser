import { IWorkflowNode } from "../types";
import { Registry } from "../nodes/registry";
import { isPropertyVisible } from "./displayOptions";

export interface IValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateNode(node: IWorkflowNode): IValidationResult {
  const nodeType = Registry.get(node.type);
  if (!nodeType) {
    return {
      isValid: false,
      errors: [`Node type ${node.type} not found`],
    };
  }

  const errors: string[] = [];
  const properties = nodeType.description.properties || [];

  const data = (node.data || {}) as Record<string, unknown>;
  for (const prop of properties) {
    if (prop.required && isPropertyVisible(prop, data, properties)) {
      const value = data[prop.name];
      if (value === undefined || value === null || value === "") {
        errors.push(`Property '${prop.displayName}' is required`);
      }
    }
  }

  const credentials = nodeType.description.credentials || [];
  for (const cred of credentials) {
    if (cred.required) {
      const value = node.data?.credentials?.[cred.name];
      if (!value) {
        errors.push(
          `Credential '${cred.displayName || cred.name}' is required`,
        );
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
