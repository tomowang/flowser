import { browser } from "#imports";
import { INodeType, IExecuteFunctions, INodeExecutionData } from "../types";
import { AppWindow } from "lucide-vue-next";

export const TabQuery: INodeType = {
  description: {
    displayName: "Tab Query",
    name: "tabQuery",
    icon: AppWindow,
    group: ["browser"],
    version: 1,
    description: "Query browser tabs",
    defaults: {
      name: "Tab Query",
      color: "#ff6f00",
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
        placeholder: "e.g. *Google*",
        description: "Match page titles against a pattern",
      },
      {
        displayName: "URL Pattern",
        name: "url",
        type: "string",
        default: "",
        required: false,
        placeholder: "e.g. *google.com*",
        description: "Match tabs against a URL pattern",
      },
      {
        displayName: "Active",
        name: "active",
        type: "options",
        options: [
          { name: "Any", value: "any" },
          { name: "Yes", value: "yes" },
          { name: "No", value: "no" },
        ],
        default: "any",
        description: "Whether the tabs are active in their windows",
      },
      {
        displayName: "Status",
        name: "tabStatus",
        type: "options",
        options: [
          { name: "Any", value: "any" },
          { name: "Unloaded", value: "unloaded" },
          { name: "Loading", value: "loading" },
          { name: "Complete", value: "complete" },
        ],
        default: "any",
        description: "Whether the tabs have completed loading",
      },
    ],
  },
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const title = this.getNodeParameter("title", "") as string;
    const url = this.getNodeParameter("url", "") as string;
    const active = this.getNodeParameter("active", "any") as string;
    const tabStatus = this.getNodeParameter("tabStatus", "any") as string;

    const queryInfo: any = {};

    if (title) {
      queryInfo.title = title;
    }

    if (url) {
      queryInfo.url = url;
    }

    if (active === "yes") {
      queryInfo.active = true;
    } else if (active === "no") {
      queryInfo.active = false;
    }

    if (tabStatus !== "any") {
      queryInfo.status = tabStatus;
    }

    const tabs = await browser.tabs.query(queryInfo);

    return [tabs.map((tab) => ({ json: tab }))];
  },
};
