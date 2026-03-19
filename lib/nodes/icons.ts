const icons = import.meta.glob("./**/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

/**
 * Gets the SVG content for a node icon.
 * @param nodeName The name of the node (e.g., 'openAIModel')
 * @param iconPath The icon path from node description (e.g., 'file:openai.svg')
 * @returns The SVG string or undefined if not found
 */
export function getNodeIconContent(nodeName: string, iconPath: string): string | undefined {
  if (!iconPath.startsWith("file:")) return undefined;

  const fileName = iconPath.replace("file:", "");
  
  // Try to find the icon in the node's directory or subdirectories
  // The glob keys look like './ai/OpenAIModel/openai.svg'
  const entry = Object.entries(icons).find(([path]) => {
    return path.endsWith(`/${fileName}`);
  });

  return entry?.[1];
}
