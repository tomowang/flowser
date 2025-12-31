import { browser } from "#imports";
import { INodeType, IExecuteFunctions, INodeExecutionData } from "../types";
import { MessageType } from "../messages";

export const HttpRequest: INodeType = {
  description: {
    displayName: "HTTP Request",
    name: "httpRequest",
    icon: "fa:globe",
    group: ["development"],
    version: 1,
    description: "Makes an HTTP request",
    defaults: {
      name: "HTTP Request",
      color: "#22bbda",
    },
    inputs: [{ name: "main", type: "main", label: "Main" }],
    outputs: [{ name: "main", type: "main", label: "Main" }],
    properties: [
      {
        displayName: "URL",
        name: "url",
        type: "string",
        default: "",
        required: true,
        placeholder: "https://api.example.com",
        description: "The URL to make the request to",
      },
      {
        displayName: "Method",
        name: "method",
        type: "options",
        options: [
          { name: "GET", value: "GET" },
          { name: "POST", value: "POST" },
          { name: "PUT", value: "PUT" },
          { name: "DELETE", value: "DELETE" },
        ],
        default: "GET",
      },
      {
        displayName: "JSON Body",
        name: "body",
        type: "json",
        default: "{}",
        description: "JSON body to send",
      },
    ],
  },
  async run(this: IExecuteFunctions): Promise<INodeExecutionData> {
    const url = this.getNodeParameter("url") as string;
    const method = this.getNodeParameter("method") as string;
    const bodyStr = this.getNodeParameter("body") as string;

    let body: any = undefined;
    if (method !== "GET" && method !== "HEAD") {
      try {
        body = bodyStr ? JSON.parse(bodyStr) : undefined;
      } catch (e) {
        console.warn("Invalid JSON body", bodyStr);
      }
    }

    try {
      const response = await browser.runtime.sendMessage({
        type: MessageType.HTTP_EXECUTE_REQUEST,
        payload: {
          url,
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body,
        },
      });

      if (!response.success) {
        throw new Error(response.error);
      }

      return {
        json: response.data,
      };
    } catch (error: any) {
      return {
        json: {
          error: error.message,
        },
      };
    }
  },
};
