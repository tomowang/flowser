export enum MessageType {
  HTTP_EXECUTE_REQUEST = "HTTP:EXECUTE_REQUEST",
  WORKFLOW_UPDATED = "WORKFLOW:UPDATED",
  SECURITY_SAVE_MK = "SECURITY:SAVE_MK",
  SECURITY_GET_MK = "SECURITY:GET_MK",
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
