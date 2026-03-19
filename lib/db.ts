import { openDB, DBSchema } from "idb";
import {
  IWorkflow,
  ICredential,
  IWorkflowExecutionResult,
  IDataTable,
  IDataTableRow,
} from "./types";

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
  datatable_metadata: {
    key: string;
    value: IDataTable;
  };
  datatable_data: {
    key: [string, number]; // [tableId, rowId]
    value: IDataTableRow;
  };
}

export const dbPromise = openDB<FlowserDB>("flowser-db", 4, {
  upgrade(db) {
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
    if (!db.objectStoreNames.contains("datatable_metadata")) {
      db.createObjectStore("datatable_metadata", { keyPath: "id" });
    }
    if (!db.objectStoreNames.contains("datatable_data")) {
      db.createObjectStore("datatable_data", { keyPath: ["tableId", "rowId"] });
    }
  },
});
