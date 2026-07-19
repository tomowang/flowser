import { browser } from "#imports";
import { Browser } from "wxt/browser";
import { INodeType, IExecuteFunctions, INodeExecutionData } from "../../types";
import { Hourglass } from "@lucide/vue";

const POLL_INTERVAL_MS = 250;

function checkElementInDom(selectorType: string, selector: string): boolean {
  function getElementsByXPath(xpath: string, parent: Node = document) {
    const results: (Node | null)[] = [];
    const query = document.evaluate(
      xpath,
      parent,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null,
    );
    for (let i = 0, length = query.snapshotLength; i < length; ++i) {
      results.push(query.snapshotItem(i));
    }
    return results;
  }

  if (selectorType === "css") {
    return document.querySelectorAll(selector).length > 0;
  }
  return getElementsByXPath(selector).length > 0;
}

function checkElementInViewport(
  selectorType: string,
  selector: string,
): boolean {
  function getElementsByXPath(xpath: string, parent: Node = document) {
    const results: (Node | null)[] = [];
    const query = document.evaluate(
      xpath,
      parent,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null,
    );
    for (let i = 0, length = query.snapshotLength; i < length; ++i) {
      results.push(query.snapshotItem(i));
    }
    return results;
  }

  function queryElements(): Element[] {
    if (selectorType === "css") {
      return Array.from(document.querySelectorAll(selector));
    }
    return getElementsByXPath(selector).filter(
      (el): el is Element => el instanceof Element,
    );
  }

  const viewportWidth =
    window.innerWidth || document.documentElement.clientWidth;
  const viewportHeight =
    window.innerHeight || document.documentElement.clientHeight;

  return queryElements().some((el) => {
    const rect = el.getBoundingClientRect();
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < viewportHeight &&
      rect.left < viewportWidth
    );
  });
}

interface PollResult {
  found: boolean;
  everSucceeded: boolean;
  lastError: string | null;
}

// Polls the tab with short, self-contained script injections rather than a
// single long-lived injected script. A tab that's still navigating (e.g.
// right after a "New Tab" node) tears down any in-page script's execution
// context on navigation, silently killing observers set up before the
// navigation landed — polling survives that because each attempt is a fresh
// injection, and transient failures while the tab is mid-navigation are
// simply retried.
async function pollTab(
  tabId: number,
  timeoutMs: number,
  func: (selectorType: string, selector: string) => boolean,
  args: [string, string],
): Promise<PollResult> {
  const deadline = Date.now() + timeoutMs;
  let lastError: string | null = null;
  let everSucceeded = false;

  for (;;) {
    try {
      const result = await browser.scripting.executeScript({
        target: { tabId },
        func,
        args,
      });
      everSucceeded = true;
      if (result?.[0]?.result === true) {
        return { found: true, everSucceeded, lastError: null };
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      return { found: false, everSucceeded, lastError };
    }
    await new Promise((resolve) =>
      setTimeout(resolve, Math.min(POLL_INTERVAL_MS, remaining)),
    );
  }
}

function waitForHttpRequest(
  tabId: number,
  urlContains: string,
  method: string,
  timeoutMs: number,
): Promise<Browser.webRequest.OnCompletedDetails | null> {
  return new Promise((resolve) => {
    let settled = false;
    const state: { timer?: ReturnType<typeof setTimeout> } = {};

    const listener = (details: Browser.webRequest.OnCompletedDetails) => {
      if (settled) return;
      if (!details.url.includes(urlContains)) return;
      if (method !== "any" && details.method !== method) return;

      settled = true;
      clearTimeout(state.timer);
      browser.webRequest.onCompleted.removeListener(listener);
      resolve(details);
    };

    browser.webRequest.onCompleted.addListener(listener, {
      urls: ["<all_urls>"],
      tabId,
    });

    state.timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      browser.webRequest.onCompleted.removeListener(listener);
      resolve(null);
    }, timeoutMs);
  });
}

export const WaitForResource: INodeType = {
  description: {
    displayName: "Wait For Resource",
    name: "waitForResource",
    icon: Hourglass,
    group: ["page_action"],
    version: 1,
    description:
      "Waits for an element to appear, an HTTP request to complete, or an element to become visible in the viewport before continuing the workflow",
    defaults: {
      name: "Wait For Resource",
    },
    inputs: [{ name: "main", type: "main", label: "Main" }],
    outputs: [{ name: "main", type: "main", label: "Main" }],
    properties: [
      {
        displayName: "Wait For",
        name: "waitFor",
        type: "options",
        options: [
          { name: "Element", value: "element" },
          { name: "HTTP Request", value: "httpRequest" },
          { name: "Viewport", value: "viewport" },
        ],
        default: "element",
        description: "What to wait for before continuing the workflow",
        noDataExpression: true,
      },
      {
        displayName: "Tab ID",
        name: "tabId",
        type: "number",
        default: undefined,
        placeholder: "e.g. 12345 or {{ $json.tabId }}",
        description: "The ID of the tab to wait on",
        required: true,
      },
      {
        displayName: "Selector Type",
        name: "selectorType",
        type: "options",
        options: [
          { name: "CSS Selector", value: "css" },
          { name: "XPath", value: "xpath" },
        ],
        default: "css",
        description: "The type of selector to use",
        displayOptions: {
          show: {
            waitFor: ["element", "viewport"],
          },
        },
      },
      {
        displayName: "Selector",
        name: "selector",
        type: "string",
        default: "",
        placeholder: "e.g. .banner or //div[@id='banner']",
        description: "The selector of the element to wait for",
        required: true,
        displayOptions: {
          show: {
            waitFor: ["element", "viewport"],
          },
        },
      },
      {
        displayName: "URL Contains",
        name: "urlContains",
        type: "string",
        default: "",
        placeholder: "e.g. /api/checkout",
        description: "Wait for a request whose URL contains this substring",
        required: true,
        displayOptions: {
          show: {
            waitFor: ["httpRequest"],
          },
        },
      },
      {
        displayName: "Method",
        name: "method",
        type: "options",
        options: [
          { name: "Any", value: "any" },
          { name: "GET", value: "GET" },
          { name: "POST", value: "POST" },
          { name: "PUT", value: "PUT" },
          { name: "DELETE", value: "DELETE" },
          { name: "PATCH", value: "PATCH" },
          { name: "HEAD", value: "HEAD" },
        ],
        default: "any",
        description: "Only match requests using this HTTP method",
        displayOptions: {
          show: {
            waitFor: ["httpRequest"],
          },
        },
      },
      {
        displayName: "Timeout (Seconds)",
        name: "timeoutSeconds",
        type: "number",
        default: 30,
        description: "How long to wait before failing the node",
      },
    ],
  },
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const waitFor = this.getNodeParameter("waitFor", i, "element") as string;
      const tabIdInput = this.getNodeParameter("tabId", i, undefined);
      const tabId = Number(tabIdInput);
      const timeoutSeconds = this.getNodeParameter(
        "timeoutSeconds",
        i,
        30,
      ) as number;

      if (!tabId || isNaN(tabId)) {
        throw new Error(`Invalid Tab ID: ${tabIdInput}`);
      }
      if (isNaN(timeoutSeconds) || timeoutSeconds <= 0) {
        throw new Error(`Invalid timeout value: ${timeoutSeconds}`);
      }

      const timeoutMs = timeoutSeconds * 1000;

      if (waitFor === "element" || waitFor === "viewport") {
        const selectorType = this.getNodeParameter(
          "selectorType",
          i,
          "css",
        ) as string;
        const selector = this.getNodeParameter("selector", i, "") as string;

        if (!selector) {
          throw new Error("Selector is required");
        }

        const checkFunc =
          waitFor === "element" ? checkElementInDom : checkElementInViewport;
        const { found, everSucceeded, lastError } = await pollTab(
          tabId,
          timeoutMs,
          checkFunc,
          [selectorType, selector],
        );

        if (!found) {
          if (!everSucceeded && lastError) {
            throw new Error(
              `Failed to check tab ${tabId} for element matching ${selectorType} selector "${selector}": ${lastError}`,
            );
          }
          const location =
            waitFor === "viewport"
              ? "become visible in the viewport of"
              : "appear in";
          throw new Error(
            `Timed out after ${timeoutSeconds}s waiting for element matching ${selectorType} selector "${selector}" to ${location} tab ${tabId}`,
          );
        }
      } else if (waitFor === "httpRequest") {
        const urlContains = this.getNodeParameter(
          "urlContains",
          i,
          "",
        ) as string;
        const method = this.getNodeParameter("method", i, "any") as string;

        if (!urlContains) {
          throw new Error("URL Contains is required");
        }

        const details = await waitForHttpRequest(
          tabId,
          urlContains,
          method,
          timeoutMs,
        );
        if (!details) {
          const methodLabel = method === "any" ? "any method" : method;
          throw new Error(
            `Timed out after ${timeoutSeconds}s waiting for a ${methodLabel} request whose URL contains "${urlContains}" on tab ${tabId}`,
          );
        }
      } else {
        throw new Error(`Unknown Wait For mode: ${waitFor}`);
      }

      returnData.push(items[i]);
    }

    return [returnData];
  },
};
