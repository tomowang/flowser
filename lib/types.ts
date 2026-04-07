export type IDataValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | IDataObject
  | IDataValue[];

export interface IDataObject {
  [key: string]: IDataValue;
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
  id: string;
  nodeId: string;
  nodeName: string;
  startTime: number;
  endTime: number;
  status: "success" | "error" | "running";
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
  status: "success" | "error" | "running";
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
  icon?: string | object | ((...args: unknown[]) => unknown);
  properties: INodeProperties[]; // Fields to collect (e.g., apiKey)
  documentationUrl?: string;
}

export type NodeParameterValue = string | number | boolean;

export interface DisplayCondition {
  [key: string]: NodeParameterValue | NodeParameterValue[];
}

export interface IDisplayOptions {
  hide?: {
    [key: string]: Array<NodeParameterValue | DisplayCondition> | undefined;
  };
  show?: {
    [key: string]: Array<NodeParameterValue | DisplayCondition> | undefined;
  };
}

export interface INodeProperties {
  displayName: string;
  name: string;
  type:
    | "string"
    | "number"
    | "boolean"
    | "options"
    | "json"
    | "code"
    | "cron"
    | "password"
    | "fixedCollection";
  default?: unknown;
  options?: {
    name: string;
    value?: string;
    displayName?: string;
    values?: INodeProperties[];
  }[];
  placeholder?: string;
  description?: string;
  required?: boolean;
  noDataExpression?: boolean;
  displayOptions?: IDisplayOptions;
  colSpan?: number; // Optional: for grid layout (e.g., 1 or 2)
  typeOptions?: {
    loadOptionsMethod?: string;
    loadOptionsDependsOn?: string[];
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
  icon: string | object | ((...args: unknown[]) => unknown); // Icon name e.g. 'f7:bolt' or svg string or Component
  group: string[];
  version: number;
  description: string;
  defaults: {
    name: string;
    [key: string]: unknown;
  };
  inputs: INodePort[];
  outputs: INodePort[];
  properties: INodeProperties[];
  credentials?: INodeCredentialDescription[];
}

export interface IExecuteFunctions {
  // Methods available to nodes during execution
  getInputData(): INodeExecutionData[];
  getNodeParameter(paramName: string, fallback?: unknown): unknown;
  getNodeParameter(
    paramName: string,
    itemIndex: number,
    fallback?: unknown,
  ): unknown;
  getConnectedNodes?(inputName: string): unknown[];
  getCredential?(
    credentialType: string,
  ): Promise<Record<string, unknown> | null>;
  evaluateExpression?(expression: string, itemIndex: number): unknown;
}

export type ISupplyDataFunctions = IExecuteFunctions;

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
  methods?: {
    [key: string]: (this: IExecuteFunctions) => Promise<unknown>;
  };
}

// Workflow persistence model
export interface IWorkflowNode {
  id: string;
  type: string; // Corresponds to INodeType.description.name
  position: { x: number; y: number };
  data: {
    label?: string; // User defined name
  } & Record<string, unknown>; // Parameter values
  parameters?: Record<string, unknown>; // Store actual param values here to separate from UI state?
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

export interface IDataTableColumn {
  name: string;
  type: "string" | "number" | "boolean" | "json";
}

export interface IDataTable {
  id: string;
  name: string;
  columns: IDataTableColumn[];
  nextRowId?: number;
  createdAt: number;
  updatedAt: number;
}

export interface IDataTableRow {
  tableId: string;
  rowId: number;
  data: Record<string, unknown>;
}

