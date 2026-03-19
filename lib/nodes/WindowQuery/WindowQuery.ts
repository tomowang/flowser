import { browser } from "#imports";
import { INodeType, IExecuteFunctions, INodeExecutionData } from "../../types";
import { AppWindow } from "lucide-vue-next";

export const WindowQuery: INodeType = {
  description: {
    displayName: "Window Query",
    name: "windowQuery",
    icon: AppWindow,
    group: ["browser"],
    version: 1,
    description: "Query browser windows",
    defaults: {
      name: "Window Query",
    },
    inputs: [{ name: "main", type: "main", label: "Main" }],
    outputs: [{ name: "main", type: "main", label: "Main" }],
    properties: [
      {
        displayName: "Populate Tabs",
        name: "populate",
        type: "boolean",
        default: false,
        description:
          "Whether the window objects should have a 'tabs' property containing a list of tabs.Tab objects.",
      },
      {
        displayName: "Window Types",
        name: "windowTypes",
        type: "options",
        options: [
          { name: "Any", value: "any" },
          { name: "Normal", value: "normal" },
          { name: "Popup", value: "popup" },
          { name: "Panel", value: "panel" },
          { name: "App", value: "app" },
          { name: "DevTools", value: "devtools" },
        ],
        default: "any",
        description: "The type of window to query",
      },
    ],
  },
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const populate = this.getNodeParameter("populate", false) as boolean;
    const windowType = this.getNodeParameter("windowTypes", "any") as string;

    const queryOptions: Record<string, unknown> = {
      populate,
    };

    if (windowType && windowType !== "any") {
      queryOptions.windowTypes = [windowType];
    }

    const windows = await browser.windows.getAll(queryOptions as unknown as Parameters<typeof browser.windows.getAll>[0]);

    return [windows.map((window) => ({ json: window as unknown as Record<string, unknown> }))];
  },
};
