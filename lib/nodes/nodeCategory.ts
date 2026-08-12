import { Registry } from "./registry";

export type NodeCategory = "trigger" | "core" | "browser" | "action" | "ai";

const GROUP_TO_CATEGORY: Record<string, NodeCategory> = {
  trigger: "trigger",
  core: "core",
  browser: "browser",
  page_action: "action",
  ai: "ai",
};

export function getNodeCategory(nodeTypeName: string | undefined): NodeCategory {
  const group = nodeTypeName && Registry.get(nodeTypeName)?.description.group?.[0];
  return (group && GROUP_TO_CATEGORY[group]) || "core";
}
