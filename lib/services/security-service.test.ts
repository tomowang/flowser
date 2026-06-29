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

  describe("validateKey", () => {
    it("should return true if master key is not configured", async () => {
      vi.spyOn(storage, "getItem").mockResolvedValue(null);
      mockGetAll.mockResolvedValue([]);
      const key = await SecurityService.deriveKey("password");
      const result = await SecurityService.validateKey(key);
      expect(result).toBe(true);
    });

    it("should validate correctly using verification block when it exists", async () => {
      vi.spyOn(storage, "getItem").mockResolvedValue("true");
      let storedVerification: string | null = null;
      vi.spyOn(storage, "setItem").mockImplementation(async (key, value) => {
        if (key === "local:flowser_verification") {
          storedVerification = value as string;
        }
      });

      const correctKey = await SecurityService.deriveKey("correct-password");
      const incorrectKey = await SecurityService.deriveKey("wrong-password");

      await SecurityService.saveToSession(correctKey);
      expect(storedVerification).not.toBeNull();

      vi.spyOn(storage, "getItem").mockImplementation(async (key) => {
        if (key === "local:flowser_master_key_set") return "true";
        if (key === "local:flowser_verification") return storedVerification;
        return null;
      });

      expect(await SecurityService.validateKey(correctKey)).toBe(true);
      expect(await SecurityService.validateKey(incorrectKey)).toBe(false);
    });

    it("should migrate and return true using credentials when verification block is missing", async () => {
      vi.spyOn(storage, "getItem").mockImplementation(async (key) => {
        if (key === "local:flowser_master_key_set") return "true";
        return null;
      });

      const key = await SecurityService.deriveKey("password");
      SecurityService.setMasterKey(key);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        new TextEncoder().encode("some-credential-data"),
      );

      const b64 = (buf: Uint8Array) => {
        let binary = "";
        for (let i = 0; i < buf.byteLength; i++) {
          binary += String.fromCharCode(buf[i]);
        }
        return btoa(binary);
      };

      mockGetAll.mockResolvedValue([
        {
          id: "1",
          name: "cred",
          encryptedData: b64(new Uint8Array(encrypted)),
          iv: b64(iv),
        },
      ]);

      let savedVerification = false;
      vi.spyOn(storage, "setItem").mockImplementation(async (key) => {
        if (key === "local:flowser_verification") {
          savedVerification = true;
        }
      });

      const result = await SecurityService.validateKey(key);
      expect(result).toBe(true);
      expect(savedVerification).toBe(true);
    });

    it("should return false using credentials when verification block is missing and key is wrong", async () => {
      vi.spyOn(storage, "getItem").mockImplementation(async (key) => {
        if (key === "local:flowser_master_key_set") return "true";
        return null;
      });

      const key = await SecurityService.deriveKey("password");
      const wrongKey = await SecurityService.deriveKey("wrong-password");

      SecurityService.setMasterKey(key);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        new TextEncoder().encode("some-credential-data"),
      );

      const b64 = (buf: Uint8Array) => {
        let binary = "";
        for (let i = 0; i < buf.byteLength; i++) {
          binary += String.fromCharCode(buf[i]);
        }
        return btoa(binary);
      };

      mockGetAll.mockResolvedValue([
        {
          id: "1",
          name: "cred",
          encryptedData: b64(new Uint8Array(encrypted)),
          iv: b64(iv),
        },
      ]);

      const result = await SecurityService.validateKey(wrongKey);
      expect(result).toBe(false);
    });

    it("should return true and save verification block in legacy case where configured is true but no credentials exist", async () => {
      vi.spyOn(storage, "getItem").mockImplementation(async (key) => {
        if (key === "local:flowser_master_key_set") return "true";
        return null;
      });

      mockGetAll.mockResolvedValue([]);

      const key = await SecurityService.deriveKey("password");
      let savedVerification = false;
      vi.spyOn(storage, "setItem").mockImplementation(async (key) => {
        if (key === "local:flowser_verification") {
          savedVerification = true;
        }
      });

      const result = await SecurityService.validateKey(key);
      expect(result).toBe(true);
      expect(savedVerification).toBe(true);
    });
  });
});
