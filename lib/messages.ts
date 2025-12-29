export enum MessageType {
  HTTP_EXECUTE_REQUEST = "HTTP:EXECUTE_REQUEST",
}

export interface ExecuteHttpRequestPayload {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
}

export interface RuntimeMessage<T = any> {
  type: MessageType;
  payload: T;
}

export interface RuntimeResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
