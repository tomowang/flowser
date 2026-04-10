import { INodeExecutionData } from "../types";

export function evaluateParameters(
  this: {
    evaluateStringWithExpressions(
      text: string,
      index: number,
      inputData: INodeExecutionData[],
    ): unknown;
  },
  value: unknown,
  index: number,
  inputData: INodeExecutionData[],
): unknown {
  if (typeof value === "string") {
    if (value.startsWith("=") && !value.startsWith("==")) {
      return this.evaluateStringWithExpressions(
        value.slice(1),
        index,
        inputData,
      );
    }
  } else if (Array.isArray(value)) {
    return value.map((item) =>
      evaluateParameters.call(this, item, index, inputData),
    );
  } else if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const key in value as Record<string, unknown>) {
      result[key] = evaluateParameters.call(
        this,
        (value as Record<string, unknown>)[key],
        index,
        inputData,
      );
    }
    return result;
  }
  return value;
}
