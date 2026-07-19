import { INodeProperties } from "../types";

export function isPropertyVisible(
  prop: INodeProperties,
  data: Record<string, unknown>,
  allProperties: INodeProperties[],
): boolean {
  if (!prop.displayOptions) return true;

  const { show, hide } = prop.displayOptions;

  const checkConditions = (conditions: Record<string, unknown>) => {
    return Object.entries(conditions).every(([key, validValues]) => {
      const propertyDef = allProperties.find((p) => p.name === key);
      const currentValue = data[key] ?? propertyDef?.default;

      if (Array.isArray(validValues)) {
        return (validValues as unknown[]).some((val) => {
          if (typeof val === "object" && val !== null) {
            return false;
          }
          return val === currentValue;
        });
      }
      return validValues === currentValue;
    });
  };

  let isVisible = true;
  if (show)
    isVisible = isVisible && checkConditions(show as Record<string, unknown>);
  if (hide)
    isVisible = isVisible && !checkConditions(hide as Record<string, unknown>);
  return isVisible;
}
