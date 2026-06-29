import { describe, it, expect, vi, beforeEach } from "vitest";
import { storage } from "#imports";
import { SecurityService } from "./security-service";

vi.mock("#imports", () => ({
  storage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

const mockGetAll = vi.fn().mockResolvedValue([]);
vi.mock("../db", () => ({
  dbPromise: Promise.resolve({
    getAll: (store: string) => mockGetAll(store),
  }),
}));

describe("SecurityService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should derive a key from password", async () => {
    vi.spyOn(storage, "getItem").mockResolvedValue(null);
    vi.spyOn(storage, "setItem").mockResolvedValue(undefined);
    const key = await SecurityService.deriveKey("password123");
    expect(key.type).toBe("secret");
    expect(key.extractable).toBe(true);
    expect(storage.getItem).toHaveBeenCalledWith("local:flowser_salt");
  });

  it("should create and store a new salt if none exists", async () => {
    vi.spyOn(storage, "getItem").mockResolvedValue(null);
    vi.spyOn(storage, "setItem").mockResolvedValue(undefined);
    await SecurityService.deriveKey("password");
    expect(storage.setItem).toHaveBeenCalledWith(
      "local:flowser_salt",
      expect.any(String),
    );
  });

  it("should use the same key for same password and salt", async () => {
    const salt = btoa(String.fromCharCode(...new Uint8Array(16).fill(1)));
    vi.spyOn(storage, "getItem").mockResolvedValue(salt);

    const key1 = await SecurityService.deriveKey("password");
    const key2 = await SecurityService.deriveKey("password");

    const jwk1 = await crypto.subtle.exportKey("jwk", key1);
    const jwk2 = await crypto.subtle.exportKey("jwk", key2);
    expect(jwk1.k).toBe(jwk2.k);
  });

  it("should use different keys for same password but different salts", async () => {
    const salt1 = btoa(String.fromCharCode(...new Uint8Array(16).fill(1)));
    const salt2 = btoa(String.fromCharCode(...new Uint8Array(16).fill(2)));

    vi.spyOn(storage, "getItem").mockResolvedValue(salt1);
    const key1 = await SecurityService.deriveKey("password");

    vi.spyOn(storage, "getItem").mockResolvedValue(salt2);
    const key2 = await SecurityService.deriveKey("password");

    const jwk1 = await crypto.subtle.exportKey("jwk", key1);
    const jwk2 = await crypto.subtle.exportKey("jwk", key2);
    expect(jwk1.k).not.toBe(jwk2.k);
  });

  it("should encrypt and decrypt correctly", async () => {
    vi.spyOn(storage, "getItem").mockResolvedValue(null);
    vi.spyOn(storage, "setItem").mockResolvedValue(undefined);
    const password = "test-password";
    const plaintext = "secret message";
    const key = await SecurityService.deriveKey(password);
    SecurityService.setMasterKey(key);

    const { iv, data } = await SecurityService.encrypt(plaintext);
    expect(iv).toBeDefined();
    expect(data).toBeDefined();

    const decrypted = await SecurityService.decrypt(data, iv);
    expect(decrypted).toBe(plaintext);
  });

  it("should throw error if master key not set during encrypt", async () => {
    SecurityService.setMasterKey(null as unknown as CryptoKey);
    await expect(SecurityService.encrypt("test")).rejects.toThrow(
      "Master key not set",
    );
  });

  describe("isMasterKeyConfigured", () => {
    it("should return true if master key set flag is true in storage", async () => {
      vi.spyOn(storage, "getItem").mockResolvedValue("true");
      const result = await SecurityService.isMasterKeyConfigured();
      expect(result).toBe(true);
      expect(storage.getItem).toHaveBeenCalledWith(
        "local:flowser_master_key_set",
      );
    });

    it("should fallback to credentials database if flag is not set", async () => {
      vi.spyOn(storage, "getItem").mockResolvedValue(null);
      mockGetAll.mockResolvedValue([{ id: "1", name: "test-cred" }]);
      const result = await SecurityService.isMasterKeyConfigured();
      expect(result).toBe(true);
      expect(storage.setItem).toHaveBeenCalledWith(
        "local:flowser_master_key_set",
        "true",
      );
    });

    it("should return false if neither flag is set nor credentials exist", async () => {
      vi.spyOn(storage, "getItem").mockResolvedValue(null);
      mockGetAll.mockResolvedValue([]);
      const result = await SecurityService.isMasterKeyConfigured();
      expect(result).toBe(false);
    });
  });
});
