import { describe, it, expect, vi, beforeEach } from "vitest";
import { WaitForResource } from "./WaitForResource";
import { IExecuteFunctions, INodeExecutionData } from "../../types";
import { browser } from "wxt/browser";

vi.mock("wxt/browser", () => ({
  browser: {
    scripting: {
      executeScript: vi.fn(),
    },
    webRequest: {
      onCompleted: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
  },
}));

describe("WaitForResource Node", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const executeNode = async (
    inputs: INodeExecutionData[],
    params: Record<string, unknown>,
  ) => {
    const context = {
      getInputData: () => inputs,
      getNodeParameter: (name: string, _index: number, fallback?: unknown) => {
        return params[name] !== undefined ? params[name] : fallback;
      },
    } as unknown as IExecuteFunctions;
    return WaitForResource.execute!.call(context);
  };

  describe("element mode", () => {
    it("passes input through when the element is found on the first poll", async () => {
      vi.mocked(browser.scripting.executeScript).mockResolvedValue([
        { result: true },
      ] as unknown as { result: unknown }[]);
      const inputs = [{ json: { val: 1 } }];
      const result = await executeNode(inputs, {
        waitFor: "element",
        tabId: 123,
        selector: ".banner",
      });
      expect(result[0][0].json.val).toBe(1);
      expect(browser.scripting.executeScript).toHaveBeenCalledWith(
        expect.objectContaining({ target: { tabId: 123 } }),
      );
    });

    it("throws a descriptive error on timeout", async () => {
      vi.useFakeTimers();
      try {
        vi.mocked(browser.scripting.executeScript).mockResolvedValue([
          { result: false },
        ] as unknown as { result: unknown }[]);

        const promise = executeNode([{ json: {} }], {
          waitFor: "element",
          tabId: 123,
          selector: ".banner",
          timeoutSeconds: 5,
        });

        const assertion = expect(promise).rejects.toThrow(
          'Timed out after 5s waiting for element matching css selector ".banner" to appear in tab 123',
        );
        await vi.advanceTimersByTimeAsync(5000);
        await assertion;
      } finally {
        vi.useRealTimers();
      }
    });

    it("throws for an invalid Tab ID without calling executeScript", async () => {
      await expect(
        executeNode([{ json: {} }], {
          waitFor: "element",
          tabId: NaN,
          selector: ".banner",
        }),
      ).rejects.toThrow("Invalid Tab ID");
      expect(browser.scripting.executeScript).not.toHaveBeenCalled();
    });

    it("throws when the selector is missing", async () => {
      await expect(
        executeNode([{ json: {} }], {
          waitFor: "element",
          tabId: 123,
          selector: "",
        }),
      ).rejects.toThrow("Selector is required");
    });

    it("recovers from transient executeScript failures (e.g. the tab still navigating) and finds the element on a later poll", async () => {
      vi.useFakeTimers();
      try {
        vi.mocked(browser.scripting.executeScript)
          .mockRejectedValueOnce(
            new Error("Cannot access contents of the page"),
          )
          .mockRejectedValueOnce(
            new Error("Cannot access contents of the page"),
          )
          .mockResolvedValueOnce([{ result: true }] as unknown as {
            result: unknown;
          }[]);

        const promise = executeNode([{ json: { val: 5 } }], {
          waitFor: "element",
          tabId: 123,
          selector: ".banner",
          timeoutSeconds: 30,
        });

        await vi.advanceTimersByTimeAsync(1000);
        const result = await promise;

        expect(result[0][0].json.val).toBe(5);
        expect(browser.scripting.executeScript).toHaveBeenCalledTimes(3);
      } finally {
        vi.useRealTimers();
      }
    });

    it("reports the underlying error when every poll attempt fails (e.g. an invalid tab)", async () => {
      vi.useFakeTimers();
      try {
        vi.mocked(browser.scripting.executeScript).mockRejectedValue(
          new Error("No tab with id: 123"),
        );

        const promise = executeNode([{ json: {} }], {
          waitFor: "element",
          tabId: 123,
          selector: ".banner",
          timeoutSeconds: 5,
        });

        const assertion = expect(promise).rejects.toThrow(
          'Failed to check tab 123 for element matching css selector ".banner": No tab with id: 123',
        );
        await vi.advanceTimersByTimeAsync(5000);
        await assertion;
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe("viewport mode", () => {
    it("passes input through when the element is visible", async () => {
      vi.mocked(browser.scripting.executeScript).mockResolvedValue([
        { result: true },
      ] as unknown as { result: unknown }[]);
      const result = await executeNode([{ json: { val: 2 } }], {
        waitFor: "viewport",
        tabId: 123,
        selector: "#hero",
      });
      expect(result[0][0].json.val).toBe(2);
    });

    it("throws a descriptive error on timeout", async () => {
      vi.useFakeTimers();
      try {
        vi.mocked(browser.scripting.executeScript).mockResolvedValue([
          { result: false },
        ] as unknown as { result: unknown }[]);

        const promise = executeNode([{ json: {} }], {
          waitFor: "viewport",
          tabId: 123,
          selector: "#hero",
          timeoutSeconds: 5,
        });

        const assertion = expect(promise).rejects.toThrow(
          'Timed out after 5s waiting for element matching css selector "#hero" to become visible in the viewport of tab 123',
        );
        await vi.advanceTimersByTimeAsync(5000);
        await assertion;
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe("httpRequest mode", () => {
    it("passes input through when a matching request completes", async () => {
      vi.mocked(browser.webRequest.onCompleted.addListener).mockImplementation(
        (listener) => {
          (listener as (details: unknown) => void)({
            url: "https://example.com/api/checkout",
            method: "POST",
          });
        },
      );

      const result = await executeNode([{ json: { val: 3 } }], {
        waitFor: "httpRequest",
        tabId: 123,
        urlContains: "/api/checkout",
        method: "POST",
      });

      expect(result[0][0].json.val).toBe(3);
      expect(browser.webRequest.onCompleted.removeListener).toHaveBeenCalled();
    });

    it("matches any method when Method is 'any'", async () => {
      vi.mocked(browser.webRequest.onCompleted.addListener).mockImplementation(
        (listener) => {
          (listener as (details: unknown) => void)({
            url: "https://example.com/api/checkout",
            method: "PATCH",
          });
        },
      );

      const result = await executeNode([{ json: {} }], {
        waitFor: "httpRequest",
        tabId: 123,
        urlContains: "/api/checkout",
        method: "any",
      });

      expect(result[0]).toHaveLength(1);
    });

    it("ignores non-matching requests before resolving on a matching one", async () => {
      let capturedListener: ((details: unknown) => void) | undefined;
      vi.mocked(browser.webRequest.onCompleted.addListener).mockImplementation(
        (listener) => {
          capturedListener = listener as (details: unknown) => void;
        },
      );

      const promise = executeNode([{ json: { val: 4 } }], {
        waitFor: "httpRequest",
        tabId: 123,
        urlContains: "/api/checkout",
        method: "POST",
      });

      capturedListener?.({
        url: "https://example.com/api/other",
        method: "POST",
      });
      capturedListener?.({
        url: "https://example.com/api/checkout",
        method: "GET",
      });
      capturedListener?.({
        url: "https://example.com/api/checkout",
        method: "POST",
      });

      const result = await promise;
      expect(result[0][0].json.val).toBe(4);
    });

    it("throws a descriptive error and removes the listener on timeout", async () => {
      vi.useFakeTimers();
      try {
        vi.mocked(
          browser.webRequest.onCompleted.addListener,
        ).mockImplementation(() => {});

        const promise = executeNode([{ json: {} }], {
          waitFor: "httpRequest",
          tabId: 123,
          urlContains: "/api/checkout",
          timeoutSeconds: 5,
        });

        const assertion = expect(promise).rejects.toThrow(
          'Timed out after 5s waiting for a any method request whose URL contains "/api/checkout" on tab 123',
        );
        await vi.advanceTimersByTimeAsync(5000);
        await assertion;

        expect(
          browser.webRequest.onCompleted.removeListener,
        ).toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    });

    it("throws when URL Contains is missing", async () => {
      await expect(
        executeNode([{ json: {} }], {
          waitFor: "httpRequest",
          tabId: 123,
          urlContains: "",
        }),
      ).rejects.toThrow("URL Contains is required");
    });
  });

  describe("shared validation", () => {
    it("throws for an invalid timeout", async () => {
      await expect(
        executeNode([{ json: {} }], {
          waitFor: "element",
          tabId: 123,
          selector: ".x",
          timeoutSeconds: 0,
        }),
      ).rejects.toThrow("Invalid timeout value: 0");
    });

    it("throws for an unknown wait mode", async () => {
      await expect(
        executeNode([{ json: {} }], {
          waitFor: "bogus",
          tabId: 123,
        }),
      ).rejects.toThrow("Unknown Wait For mode: bogus");
    });
  });
});
