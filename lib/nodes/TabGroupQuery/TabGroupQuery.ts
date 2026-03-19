import { browser } from "#imports";
import { INodeType, IExecuteFunctions, INodeExecutionData } from "../../types";
import { AppWindow } from "lucide-vue-next";

export const TabGroupQuery: INodeType = {
  description: {
    displayName: "Tab Group Query",
    name: "tabGroupQuery",
    icon: AppWindow,
    group: ["browser"],
    version: 1,
    description: "Query browser tab groups",
    defaults: {
      name: "Tab Group Query",
    },
    inputs: [{ name: "main", type: "main", label: "Main" }],
    outputs: [{ name: "main", type: "main", label: "Main" }],
    properties: [
      {
        displayName: "Title Pattern",
        name: "title",
        type: "string",
        default: "",
        required: false,
        placeholder: "e.g. *Work*",
        description: "Match group titles against a pattern",
      },
    ],
  },
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const title = this.getNodeParameter("title", "") as string;

    const queryInfo: Record<string, unknown> = {};

    if (title) {
      queryInfo.title = title;
    }

    const groups = await browser.tabGroups.query(queryInfo as unknown as Parameters<typeof browser.tabGroups.query>[0]);

    return [groups.map((group) => ({ json: group as unknown as Record<string, unknown> }))];
  },
};
