import { openDB, DBSchema } from "idb";
import { IWorkflow } from "./types";

interface FlowserDB extends DBSchema {
  workflows: {
    key: string;
    value: IWorkflow;
  };
}

export const dbPromise = openDB<FlowserDB>("flowser-db", 1, {
  upgrade(db) {
    db.createObjectStore("workflows", { keyPath: "id" });
  },
});
