export interface IDataObject {
  [key: string]: any;
}

export interface IBinaryData {
  data: string; // Base64
  mimeType: string;
  fileName?: string;
}

export interface INodeExecutionData {
  json: IDataObject;
  binary?: {
    [key: string]: IBinaryData;
  };
}

export interface IExecutionNodeResult {
  nodeId: string;
  nodeName: string;
  startTime: number;
  endTime: number;
  status: "success" | "error";
  errorMessage?: string;
  inputData: INodeExecutionData[];
  outputData: INodeExecutionData[];
}

export interface IWorkflowExecutionResult {
  id: string;
  workflowId: string;
  workflowName?: string;
  startTime: number;
  endTime: number;
  status: "success" | "error";
  nodeExecutionResults: IExecutionNodeResult[];
}

export interface ICredential {
  id: string;
  name: string;
  type: string;
  encryptedData: string;
  iv: string;
  createdAt: number;
}

// Credential reference in node type description (similar to n8n's INodeCredentialDescription)
export interface INodeCredentialDescription {
  name: string; // References ICredentialType.name
  required?: boolean;
  displayName?: string;
}

// Credential type definition (similar to n8n's ICredentialType)
export interface ICredentialType {
  name: string; // e.g., 'gemini_api'
  displayName: string; // e.g., 'Gemini API'
  icon?: any;
  properties: INodeProperties[]; // Fields to collect (e.g., apiKey)
  documentationUrl?: string;
}

export interface INodeProperties {
  displayName: string;
  name: string;
  type: "string" | "number" | "boolean" | "options" | "json" | "code" | "cron" | "password";
  default?: any;
  options?: { name: string; value: string }[];
  placeholder?: string;
  description?: string;
  required?: boolean;
  displayOptions?: {
    show?: {
      [key: string]: any[];
    };
  };
}

export interface INodePort {
  name: string;
  type: string; // 'main' | 'tool' | ...
  label?: string;
  required?: boolean;
}

export interface INodeTypeDescription {
  displayName: string;
  name: string;
  icon: any; // Icon name e.g. 'f7:bolt' or svg string or Component
  group: string[];
  version: number;
  description: string;
  defaults: {
    name: string;
    [key: string]: any;
  };
  inputs: INodePort[];
  outputs: INodePort[];
  properties: INodeProperties[];
  credentials?: INodeCredentialDescription[];
}

export interface IExecuteFunctions {
  // Methods available to nodes during execution
  getInputData(): INodeExecutionData[];
  getNodeParameter(paramName: string, fallback?: any): any;
  getNodeParameter(paramName: string, itemIndex: number, fallback?: any): any;
  getConnectedNodes?(inputName: string): any[];
  getCredential?(
    credentialType: string,
  ): Promise<Record<string, unknown> | null>;
}

export interface ISupplyDataFunctions extends IExecuteFunctions {
  // Methods available to nodes during supplyData execution
}

// Output interface for supplyData
export type CloseFunction = () => Promise<void>;

export interface NodeExecutionHint {
  message: string;
}

export interface SupplyData {
  metadata?: IDataObject;
  response: unknown;
  closeFunction?: CloseFunction;
  hints?: NodeExecutionHint[];
}

export interface INodeType {
  description: INodeTypeDescription;
  execute?(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
  supplyData?(
    this: ISupplyDataFunctions,
    itemIndex: number,
  ): Promise<SupplyData>;
}

// Workflow persistence model
export interface IWorkflowNode {
  id: string;
  type: string; // Corresponds to INodeType.description.name
  position: { x: number; y: number };
  data: {
    label?: string; // User defined name
  } & Record<string, any>; // Parameter values
  parameters?: Record<string, any>; // Store actual param values here to separate from UI state?
  // For simplicity, let's keep everything in 'data' or a specific 'parameters' field.
  // n8n puts parameters in 'parameters' key usually.
}

export interface IWorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface IWorkflow {
  id: string;
  name: string;
  nodes: IWorkflowNode[];
  edges: IWorkflowEdge[];
  createdAt: number;
  updatedAt: number;
  active: boolean; // Is it auto-triggered?
  previewSvg?: string; // Serialized SVG of the mini-map
}
