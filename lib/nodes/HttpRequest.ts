import { browser } from "#imports";
import { INodeType, IExecuteFunctions, INodeExecutionData } from "../types";
import { MessageType } from "../messages";
import { Globe } from "lucide-vue-next";

export const HttpRequest: INodeType = {
  description: {
    displayName: "HTTP Request",
    name: "httpRequest",
    icon: Globe,
    group: ["core"],
    version: 1,
    description: "Makes an HTTP request",
    defaults: {
      name: "HTTP Request",
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
          { name: "PATCH", value: "PATCH" },
          { name: "HEAD", value: "HEAD" },
        ],
        default: "GET",
      },
      {
        displayName: "Query Parameters",
        name: "parameters",
        type: "json",
        default: "{}",
        description: "Query parameters to append to the URL",
      },
      {
        displayName: "Headers",
        name: "headers",
        type: "json",
        default: "{}",
        description: "Request headers",
      },
      {
        displayName: "Body Type",
        name: "specifyBody",
        type: "options",
        options: [
          { name: "None", value: "none" },
          { name: "JSON", value: "json" },
          { name: "Form-Urlencoded", value: "form" },
        ],
        default: "none",
      },
      {
        displayName: "JSON Body",
        name: "body",
        type: "json",
        default: "{}",
        description: "JSON body to send",
        displayOptions: {
          show: {
            specifyBody: ["json"],
          },
        },
      },
      {
        displayName: "Form Body",
        name: "bodyForm",
        type: "json",
        default: "{}",
        description: "Form data to send",
        displayOptions: {
          show: {
            specifyBody: ["form"],
          },
        },
      },
    ],
  },
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
        const urlStr = this.getNodeParameter("url", i) as string;
        const method = this.getNodeParameter("method", i) as string;
        const parametersStr = this.getNodeParameter("parameters", i) as string;
        const headersStr = this.getNodeParameter("headers", i) as string;
        const specifyBody = this.getNodeParameter("specifyBody", i) as string;

        // Construct URL with query parameters
        let url = urlStr;
        if (parametersStr) {
            try {
                const urlObj = new URL(urlStr);
                const params = JSON.parse(parametersStr);
                Object.keys(params).forEach((key) => {
                    urlObj.searchParams.append(key, String(params[key]));
                });
                url = urlObj.toString();
            } catch (e) {
                console.warn("Invalid parameters JSON", parametersStr);
            }
        }

        // Prepare Headers
        let headers: Record<string, string> = {};
        if (headersStr) {
            try {
                const parsed = JSON.parse(headersStr);
                Object.keys(parsed).forEach(key => {
                    headers[key] = String(parsed[key]);
                });
            } catch (e) {
                console.warn("Invalid headers JSON", headersStr);
            }
        }

        // Prepare Body
        let body: any = undefined;
        if (method !== "GET" && method !== "HEAD" && specifyBody !== "none") {
            if (specifyBody === "json") {
                const bodyStr = this.getNodeParameter("body", i) as string;
                try {
                    body = bodyStr ? JSON.parse(bodyStr) : undefined;
                    if (!headers["Content-Type"]) {
                        headers["Content-Type"] = "application/json";
                    }
                } catch (e) {
                    console.warn("Invalid JSON body", bodyStr);
                }
            } else if (specifyBody === "form") {
                const bodyStr = this.getNodeParameter("bodyForm", i) as string;
                try {
                   const parsed = bodyStr ? JSON.parse(bodyStr) : {};
                   // Convert to x-www-form-urlencoded string
                   const formData = new URLSearchParams();
                   Object.keys(parsed).forEach(key => formData.append(key, String(parsed[key])));
                   body = formData.toString();
                   
                   if (!headers["Content-Type"]) {
                        headers["Content-Type"] = "application/x-www-form-urlencoded";
                   }
                } catch (e) {
                    console.warn("Invalid Form body", bodyStr);
                }
            }
        }

        try {
            const response = await browser.runtime.sendMessage({
                type: MessageType.HTTP_EXECUTE_REQUEST,
                payload: {
                    url,
                    method,
                    headers,
                    body,
                },
            });

            if (!response.success) {
                throw new Error(response.error);
            }

            returnData.push({
                json: response.data,
            });
        } catch (error: any) {
            returnData.push({
                json: {
                    error: error.message,
                },
            });
        }
    }
    return [returnData];
  },
};
