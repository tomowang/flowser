import { INodeType, IExecuteFunctions, INodeExecutionData } from "../types";

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
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

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
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      // Return 1 item handling the response
      // In real n8n, this iterates over items. For simplicity, we assume 1-to-1 or just single execution for now if items isn't array mapped.
      // But the signature inputs Map<string, any>.

      returnData.push({
        json: data,
      });
    } catch (error: any) {
      returnData.push({
        json: {
          error: error.message,
        },
      });
    }

    return [returnData];
  },
};
