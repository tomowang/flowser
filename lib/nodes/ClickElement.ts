import { browser } from "#imports";
import { INodeType, IExecuteFunctions, INodeExecutionData } from "../types";
import { MousePointerClick } from "lucide-vue-next";

export const ClickElement: INodeType = {
  description: {
    displayName: "Click Element",
    name: "clickElement",
    icon: MousePointerClick,
    group: ["browser", "action"],
    version: 1,
    description: "Click an element on the page",
    defaults: {
      name: "Click Element",
    },
    inputs: [{ name: "main", type: "main", label: "Main" }],
    outputs: [{ name: "main", type: "main", label: "Main" }],
    properties: [
      {
        displayName: "Tab ID",
        name: "tabId",
        type: "string",
        default: "",
        description: "The ID of the tab to click the element in.",
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
        placeholder: "e.g. .button or //button",
        description: "The selector of the element to click",
        required: true,
      },
      {
        displayName: "Multiple",
        name: "multiple",
        type: "boolean",
        default: false,
        description: "Click all matched elements",
      },
    ],
  },
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const selectorType = this.getNodeParameter("selectorType", "css") as string;
    const selector = this.getNodeParameter("selector", "") as string;
    const multiple = this.getNodeParameter("multiple", false) as boolean;
    const items = this.getInputData();

    if (!selector) {
      throw new Error("Selector is required");
    }

    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const tabIdInput = this.getNodeParameter("tabId", i, undefined) as string;
      const tabId = Number(tabIdInput);
      if (tabId && !isNaN(tabId)) {
        await browser.scripting.executeScript({
          target: { tabId: tabId },
          func: (selectorType: string, selector: string, multiple: boolean) => {
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

            let elements: any[] = [];
            if (selectorType === "css") {
              elements = Array.from(document.querySelectorAll(selector));
            } else {
              elements = getElementsByXPath(selector);
            }

            if (elements.length > 0) {
              if (multiple) {
                elements.forEach((el: any) => el.click());
              } else {
                elements[0].click();
              }
            }
          },
          args: [selectorType, selector, multiple],
        });
        returnData.push(item);
      }
    }

    return [returnData];
  },
};
