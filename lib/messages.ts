export enum MessageType {
  HTTP_EXECUTE_REQUEST = "HTTP:EXECUTE_REQUEST",
  WORKFLOW_UPDATED = "WORKFLOW:UPDATED",
}

export interface ExecuteHttpRequestPayload {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: unknown;
}

export interface RuntimeMessage<T = unknown> {
  type: MessageType;
  payload: T;
}

export interface RuntimeResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
