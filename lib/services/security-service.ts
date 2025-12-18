export class SecurityService {
  private static masterKey: CryptoKey | null = null;

  /**
   * Derives a master key from the password using PBKDF2.
   * Uses SHA-256(password) as the deterministic salt.
   */
  static async deriveKey(password: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const rawKey = encoder.encode(password);

    // 1. Generate deterministic salt: SHA-256(password)
    const saltBuffer = await crypto.subtle.digest("SHA-256", rawKey);

    // 2. Import password as key material
    const baseKey = await crypto.subtle.importKey(
      "raw",
      rawKey,
      { name: "PBKDF2" },
      false,
      ["deriveKey"],
    );

    // 3. Derive AES-GCM key
    return await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: saltBuffer,
        iterations: 100000,
        hash: "SHA-256",
      },
      baseKey,
      { name: "AES-GCM", length: 256 },
      true, // extractable (required for session storage)
      ["encrypt", "decrypt"],
    );
  }

  static setMasterKey(key: CryptoKey) {
    this.masterKey = key;
  }

  static getMasterKey(): CryptoKey | null {
    return this.masterKey;
  }

  static hasMasterKey(): boolean {
    return !!this.masterKey;
  }

  /**
   * Encrypts plaintext using the set master key.
   * Returns: { iv (base64), data (base64) }
   */
  static async encrypt(
    plaintext: string,
  ): Promise<{ iv: string; data: string }> {
    if (!this.masterKey) throw new Error("Master key not set");

    const encoder = new TextEncoder();
    const encoded = encoder.encode(plaintext);

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encryptedContent = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv as any,
      },
      this.masterKey,
      encoded,
    );

    return {
      iv: this.bufferToBase64(iv),
      data: this.bufferToBase64(new Uint8Array(encryptedContent)),
    };
  }

  /**
   * Decrypts data using the set master key.
   */
  static async decrypt(encryptedData: string, ivStr: string): Promise<string> {
    if (!this.masterKey) throw new Error("Master key not set");

    const iv = this.base64ToBuffer(ivStr);
    const data = this.base64ToBuffer(encryptedData);

    const decryptedContent = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv as any,
      },
      this.masterKey,
      data as any,
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedContent);
  }

  // --- Helpers ---

  private static bufferToBase64(buffer: Uint8Array): string {
    let binary = "";
    const len = buffer.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return window.btoa(binary);
  }

  private static base64ToBuffer(base64: string): Uint8Array {
    const binaryStr = window.atob(base64);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes;
  }
  /* --- Session Persistence --- */

  static async saveToSession(key: CryptoKey) {
    const exported = await crypto.subtle.exportKey("jwk", key);
    sessionStorage.setItem("flowser_mk", JSON.stringify(exported));
    this.masterKey = key;
  }

  static async restoreFromSession(): Promise<boolean> {
    const saved = sessionStorage.getItem("flowser_mk");
    if (!saved) return false;

    try {
      const jwk = JSON.parse(saved);
      const key = await crypto.subtle.importKey(
        "jwk",
        jwk,
        { name: "AES-GCM", length: 256 },
        true, // extractable
        ["encrypt", "decrypt"],
      );
      this.masterKey = key;
      return true;
    } catch (e) {
      console.warn("Failed to restore master key from session", e);
      return false;
    }
  }
}
