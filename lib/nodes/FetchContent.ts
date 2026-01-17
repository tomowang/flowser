import { browser } from "#imports";
import { INodeType, IExecuteFunctions, INodeExecutionData } from "../types";
import { FileText } from "lucide-vue-next";

export const FetchContent: INodeType = {
  description: {
    displayName: "Fetch Content",
    name: "fetchContent",
    icon: FileText,
    group: ["page_action"],
    version: 1,
    description: "Fetch content from a web page",
    defaults: {
      name: "Fetch Content",
    },
    inputs: [{ name: "main", type: "main", label: "Main" }],
    outputs: [{ name: "main", type: "main", label: "Main" }],
    properties: [
      {
        displayName: "Tab ID",
        name: "tabId",
        type: "string",
        default: "",
        description: "The ID of the tab to fetch content from.",
        required: true,
      },
      {
        displayName: "Selector Type",
        name: "selectorType",
        type: "options",
        options: [
          { name: "CSS Selector", value: "css" },
          { name: "XPath", value: "xpath" },
        ],
        default: "css",
        description: "The type of selector to use",
      },
      {
        displayName: "Selector",
        name: "selector",
        type: "string",
        default: "",
        placeholder: "e.g. .content or //div[@id='content']",
        description: "The selector of the element to fetch",
        required: true,
      },
      {
        displayName: "Content Type",
        name: "contentType",
        type: "options",
        options: [
          { name: "Text", value: "text" },
          { name: "HTML", value: "html" },
        ],
        default: "text",
        description: "The type of content to fetch",
      },
      {
        displayName: "Multiple",
        name: "multiple",
        type: "boolean",
        default: true,
        description: "Fetch all matched elements",
      },
    ],
  },
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const selectorType = this.getNodeParameter("selectorType", "css") as string;
    const selector = this.getNodeParameter("selector", "") as string;
    const contentType = this.getNodeParameter("contentType", "text") as string;
    const multiple = this.getNodeParameter("multiple", false) as boolean;
    const items = this.getInputData();

    if (!selector) {
      throw new Error("Selector is required");
    }

    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const tabIdInput = this.getNodeParameter("tabId", i, undefined) as string;
      const tabId = Number(tabIdInput);

      if (tabId && !isNaN(tabId)) {
        const result = await browser.scripting.executeScript({
          target: { tabId: tabId },
          func: (
            selectorType: string,
            selector: string,
            contentType: string,
            multiple: boolean,
          ) => {
            function getElementsByXPath(xpath: string, parent = document) {
              const results = [];
              const query = document.evaluate(
                xpath,
                parent,
                null,
                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                null,
              );
              for (let i = 0, length = query.snapshotLength; i < length; ++i) {
                results.push(query.snapshotItem(i));
              }
              return results;
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let elements: any[] = [];
            if (selectorType === "css") {
              elements = Array.from(document.querySelectorAll(selector));
            } else {
              elements = getElementsByXPath(selector);
            }

            if (elements.length > 0) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const extractContent = (el: any) => {
                return contentType === "text" ? el.textContent : el.outerHTML;
              };

              if (multiple) {
                return elements.map(extractContent);
              } else {
                return extractContent(elements[0]);
              }
            }
            return null;
          },
          args: [selectorType, selector, contentType, multiple],
        });

        if (result && result[0] && result[0].result !== undefined) {
          returnData.push({
            json: {
              content: result[0].result,
            },
          });
        } else {
          returnData.push({
            json: {
              content: null,
            },
          });
        }
      } else {
        returnData.push({
          json: {
            error: "Invalid Tab ID",
          },
        });
      }
    }

    return [returnData];
  },
};
