import { dbPromise } from "../db";
import { IDataTable, IDataTableRow, IDataTableColumn } from "../types";

export class DataTableService {
  static async listTables(): Promise<IDataTable[]> {
    const db = await dbPromise;
    return db.getAll("datatable_metadata");
  }

  static async getTable(id: string): Promise<IDataTable | undefined> {
    const db = await dbPromise;
    return db.get("datatable_metadata", id);
  }

  static async createTable(
    name: string,
    columns: IDataTableColumn[] = [],
  ): Promise<string> {
    const db = await dbPromise;
    const id = crypto.randomUUID();
    const table: IDataTable = {
      id,
      name,
      columns,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.put("datatable_metadata", table);
    return id;
  }

  static async updateTable(
    id: string,
    updates: Partial<IDataTable>,
  ): Promise<void> {
    const db = await dbPromise;
    const table = await db.get("datatable_metadata", id);
    if (!table) return;

    Object.assign(table, updates, { updatedAt: Date.now() });
    await db.put("datatable_metadata", table);
  }

  static async deleteTable(id: string): Promise<void> {
    const db = await dbPromise;

    // Delete the table metadata
    await db.delete("datatable_metadata", id);

    // Delete all rows associated with this table
    // Construct a key range that covers all rows for this tableId
    // Keys are [tableId, rowId]
    const range = IDBKeyRange.bound([id, ""], [id, "\uffff"]);
    await db.delete("datatable_data", range);
  }

  // Row operations

  static async getRows(tableId: string): Promise<IDataTableRow[]> {
    const db = await dbPromise;
    // Retrieve all rows for a table using the composite key range
    const range = IDBKeyRange.bound([tableId, ""], [tableId, "\uffff"]);
    return db.getAll("datatable_data", range);
  }

  static async addRow(
    tableId: string,
    data: Record<string, any>,
  ): Promise<string> {
    const db = await dbPromise;
    const rowId = crypto.randomUUID();
    const row: IDataTableRow = {
      tableId,
      rowId,
      data,
    };
    await db.put("datatable_data", row);
    return rowId;
  }

  static async updateRow(
    tableId: string,
    rowId: string,
    data: Record<string, any>,
  ): Promise<void> {
    const db = await dbPromise;
    const key: [string, string] = [tableId, rowId];
    const row = await db.get("datatable_data", key);
    if (!row) return;

    row.data = data;
    await db.put("datatable_data", row);
  }

  static async deleteRow(tableId: string, rowId: string): Promise<void> {
    const db = await dbPromise;
    await db.delete("datatable_data", [tableId, rowId]);
  }
}
