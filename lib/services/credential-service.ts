import { dbPromise } from "../db";
import { ICredential } from "../types";
import { SecurityService } from "./security-service";

export class CredentialService {
  static async saveCredential(
    name: string,
    type: string,
    value: string,
  ): Promise<string> {
    const { iv, data } = await SecurityService.encrypt(value);

    const credential: ICredential = {
      id: crypto.randomUUID(),
      name,
      type,
      encryptedData: data,
      iv,
      createdAt: Date.now(),
    };

    const db = await dbPromise;
    await db.put("credentials", credential);
    return credential.id;
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

  static async getDecryptedValue(id: string): Promise<string | null> {
    const db = await dbPromise;
    const cred = (await db.get("credentials", id)) as ICredential;
    if (!cred) return null;

    return await SecurityService.decrypt(cred.encryptedData, cred.iv);
  }

  static async deleteCredential(id: string) {
    const db = await dbPromise;
    await db.delete("credentials", id);
  }
}
