import { dbPromise } from "../db";
import { ICredential } from "../types";
import { SecurityService } from "./security-service";

export class CredentialService {
  static async saveCredential(
    name: string,
    type: string,
    data: Record<string, unknown>,
  ): Promise<string> {
    // Serialize the credential data to JSON string before encrypting
    const jsonData = JSON.stringify(data);
    const { iv, data: encryptedData } = await SecurityService.encrypt(jsonData);

    const credential: ICredential = {
      id: crypto.randomUUID(),
      name,
      type,
      encryptedData,
      iv,
      createdAt: Date.now(),
    };

    const db = await dbPromise;
    await db.put("credentials", credential);
    return credential.id;
  }

  static async updateCredential(
    id: string,
    name: string,
    type: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    const db = await dbPromise;
    const existing = (await db.get("credentials", id)) as ICredential;
    if (!existing) {
      throw new Error("Credential not found");
    }

    const jsonData = JSON.stringify(data);
    const { iv, data: encryptedData } = await SecurityService.encrypt(jsonData);

    const credential: ICredential = {
      ...existing,
      name,
      type,
      encryptedData,
      iv,
    };

    await db.put("credentials", credential);
  }

  static async getCredential(id: string): Promise<ICredential | undefined> {
    const db = await dbPromise;
    return db.get("credentials", id);
  }

  static async getCredentials(): Promise<
    Omit<ICredential, "encryptedData" | "iv">[]
  > {
    const db = await dbPromise;
    const all = await db.getAll("credentials");
    // Return metadata only, stripping sensitive parts for safety (though they are encrypted)
    return all.map(({ id, name, type, createdAt }) => ({
      id,
      name,
      type,
      createdAt,
    }));
  }

  static async getDecryptedCredential(
    id: string,
  ): Promise<Record<string, unknown> | null> {
    const db = await dbPromise;
    const cred = (await db.get("credentials", id)) as ICredential;
    if (!cred) return null;

    const decrypted = await SecurityService.decrypt(
      cred.encryptedData,
      cred.iv,
    );
    try {
      return JSON.parse(decrypted);
    } catch {
      // Legacy support: if it's not JSON, return as { apiKey: value }
      return { apiKey: decrypted };
    }
  }

  // Legacy helper for backward compatibility
  static async getDecryptedValue(id: string): Promise<string | null> {
    const data = await this.getDecryptedCredential(id);
    if (!data) return null;
    // Return apiKey for legacy callers
    return (data.apiKey as string) || null;
  }

  static async deleteCredential(id: string) {
    const db = await dbPromise;
    await db.delete("credentials", id);
  }
}
