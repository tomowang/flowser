import { describe, it, expect, vi } from "vitest";
import { useEntityI18n } from "./useEntityI18n";

const messages: Record<string, string> = {
  "nodes.if.displayName": "条件判断 (If)",
  "nodes.if.properties.operator.displayName": "操作符",
  "nodes.if.properties.operator.options.string:equal": "等于",
  "credentialTypes.gemini_api.displayName": "Gemini API 密钥",
};

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string) => messages[key],
    te: (key: string) => key in messages,
  }),
}));

describe("useEntityI18n", () => {
  it("returns the translation when the key exists", () => {
    const nodeI18n = useEntityI18n("nodes");
    expect(nodeI18n.label("if", "If")).toBe("条件判断 (If)");
    expect(nodeI18n.propertyLabel("if", "operator", "Operator")).toBe(
      "操作符",
    );
    expect(
      nodeI18n.optionLabel("if", "operator", "string:equal", "is equal to"),
    ).toBe("等于");
  });

  it("falls back to the provided default when the key is missing", () => {
    const nodeI18n = useEntityI18n("nodes");
    expect(nodeI18n.label("httpRequest", "HTTP Request")).toBe(
      "HTTP Request",
    );
    expect(
      nodeI18n.description("httpRequest", "Makes an HTTP request"),
    ).toBe("Makes an HTTP request");
    expect(
      nodeI18n.optionLabel("httpRequest", "method", "GET", "GET"),
    ).toBe("GET");
  });

  it("scopes keys by entity kind", () => {
    const credI18n = useEntityI18n("credentialTypes");
    expect(credI18n.label("gemini_api", "Gemini API")).toBe(
      "Gemini API 密钥",
    );
    expect(credI18n.label("openai_api", "OpenAI API")).toBe("OpenAI API");
  });
});
