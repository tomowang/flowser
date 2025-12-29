import { openDB, DBSchema } from "idb";
import { IWorkflow, ICredential } from "./types";

import { IWorkflowExecutionResult } from "./types";

interface FlowserDB extends DBSchema {
  workflows: {
    key: string;
    value: IWorkflow;
  };
  credentials: {
    key: string;
    value: ICredential;
  };
  executions: {
    key: string;
    value: IWorkflowExecutionResult;
    indexes: { "by-workflow": string };
  };
}

export const dbPromise = openDB<FlowserDB>("flowser-db", 3, {
  upgrade(db, oldVersion, newVersion, transaction) {
    if (!db.objectStoreNames.contains("workflows")) {
      db.createObjectStore("workflows", { keyPath: "id" });
    }
    if (!db.objectStoreNames.contains("credentials")) {
      db.createObjectStore("credentials", { keyPath: "id" });
    }
    if (!db.objectStoreNames.contains("executions")) {
      const store = db.createObjectStore("executions", { keyPath: "id" });
      store.createIndex("by-workflow", "workflowId");
    }
  },
});
