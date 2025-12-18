import { openDB, DBSchema } from "idb";
import { IWorkflow, ICredential } from "./types";

interface FlowserDB extends DBSchema {
  workflows: {
    key: string;
    value: IWorkflow;
  };
  credentials: {
    key: string;
    value: ICredential;
  };
}

export const dbPromise = openDB<FlowserDB>("flowser-db", 2, {
  upgrade(db, oldVersion, newVersion, transaction) {
    if (!db.objectStoreNames.contains("workflows")) {
      db.createObjectStore("workflows", { keyPath: "id" });
    }
    if (!db.objectStoreNames.contains("credentials")) {
      db.createObjectStore("credentials", { keyPath: "id" });
    }
  },
});
