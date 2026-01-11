import { describe, it, expect, vi, beforeEach } from "vitest";
import { ClickElement } from "../lib/nodes/ClickElement";
import { IExecuteFunctions, INodeExecutionData } from "../lib/types";
import { browser } from "#imports";

// Mock browser.scripting
const mockExecuteScript = vi.fn();
vi.mock("#imports", () => ({
  browser: {
    scripting: {
      executeScript: (...args: any[]) => mockExecuteScript(...args),
    },
  },
}));

describe("ClickElement Node", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const executeNode = async (
    inputs: INodeExecutionData[],
    params: Record<string, any>,
  ) => {
    const context = {
      getInputData: () => inputs,
      getNodeParameter: (name: string, arg2: any, arg3?: any) => {
        if (params[name] !== undefined) return params[name];
        // Special handling for tabId which is called with (name, index, fallback)
        if (name === "tabId") return arg3;
        return arg2;
      },
    } as unknown as IExecuteFunctions;

    return ClickElement.execute!.call(context);
  };

  it("should fail if no selector is provided", async () => {
    await expect(
      executeNode([{ json: { id: 1 } }], { selector: "" }),
    ).rejects.toThrow("Selector is required");
  });

  it("should execute script for each input item with ID", async () => {
    const inputs = [{ json: { id: 1 } }, { json: { id: 2 } }];
    await executeNode(inputs, { selector: ".btn", selectorType: "css" });

    expect(mockExecuteScript).toHaveBeenCalledTimes(2);
    expect(mockExecuteScript).toHaveBeenCalledWith(
      expect.objectContaining({
        target: { tabId: 1 },
        args: ["css", ".btn", false],
      }),
    );
    expect(mockExecuteScript).toHaveBeenCalledWith(
      expect.objectContaining({
        target: { tabId: 2 },
        args: ["css", ".btn", false],
      }),
    );
  });

  it("should handle xpath selector type", async () => {
    const inputs = [{ json: { id: 1 } }];
    await executeNode(inputs, { selector: "//button", selectorType: "xpath" });

    expect(mockExecuteScript).toHaveBeenCalledWith(
      expect.objectContaining({
        target: { tabId: 1 },
        args: ["xpath", "//button", false],
      }),
    );
  });

  it("should pass multiple flag", async () => {
    const inputs = [{ json: { id: 1 } }];
    await executeNode(inputs, { selector: ".btn", multiple: true });

    expect(mockExecuteScript).toHaveBeenCalledWith(
      expect.objectContaining({
        target: { tabId: 1 },
        args: ["css", ".btn", true],
      }),
    );
  });

  it("should use text-specified tabId if provided", async () => {
    const inputs = [{ json: { id: 1 } }];
    await executeNode(inputs, { selector: ".btn", tabId: 999 });

    expect(mockExecuteScript).toHaveBeenCalledWith(
      expect.objectContaining({
        target: { tabId: 999 },
        args: ["css", ".btn", false],
      }),
    );
  });
});
