import { describe, it, expect, vi, beforeEach } from "vitest";
import { storage } from "#imports";
import { getExecutionRetention, setExecutionRetention } from "./index";

vi.mock("#imports", () => ({
  storage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

describe("execution-retention", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getExecutionRetention", () => {
    it("returns 'forever' when storage is empty", async () => {
      vi.spyOn(storage, "getItem").mockResolvedValue(null);
      expect(await getExecutionRetention()).toBe("forever");
    });

    it("returns a stored valid numeric value", async () => {
      vi.spyOn(storage, "getItem").mockResolvedValue(1000);
      expect(await getExecutionRetention()).toBe(1000);
    });

    it("falls back to default if storage contains an invalid value", async () => {
      vi.spyOn(storage, "getItem").mockResolvedValue(42 as unknown as null);
      expect(await getExecutionRetention()).toBe("forever");
    });
  });

  describe("setExecutionRetention", () => {
    it("calls storage.setItem with the correct key/value", async () => {
      vi.spyOn(storage, "setItem").mockResolvedValue(undefined);
      await setExecutionRetention(500);
      expect(storage.setItem).toHaveBeenCalledWith(
        "local:flowser_execution_retention",
        500,
      );
    });
  });
});
