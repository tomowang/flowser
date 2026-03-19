const icons = import.meta.glob("./icons/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

/**
 * Gets the SVG content for a credential icon.
 * @param iconPath The icon path from credential description (e.g., 'file:openai.svg')
 * @returns The SVG string or undefined if not found
 */
export function getCredentialIconContent(iconPath?: string | object): string | undefined {
  if (typeof iconPath !== "string" || !iconPath.startsWith("file:")) return undefined;

  const fileName = iconPath.replace("file:", "");
  
  // Try to find the icon in the credentials/icons directory
  const entry = Object.entries(icons).find(([path]) => {
    return path.endsWith(`/${fileName}`);
  });

  return entry?.[1];
}
