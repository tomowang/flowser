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
      nextRowId: 1,
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

    // Delete number range
    const numberRange = IDBKeyRange.bound([id, -Infinity], [id, Infinity]);
    await db.delete("datatable_data", numberRange);

    // Delete string range (legacy)
    const stringRange = IDBKeyRange.bound([id, ""], [id, "\uffff"]);
    await db.delete("datatable_data", stringRange);
  }

  static async getTableIdByName(name: string): Promise<string | undefined> {
    const db = await dbPromise;
    const tables = await db.getAll("datatable_metadata");
    const table = tables.find((t) => t.name === name);
    return table?.id;
  }

  // Row operations

  static async getRows(
    tableId: string,
    filters?: Record<string, unknown>,
  ): Promise<IDataTableRow[]> {
    const db = await dbPromise;

    const numberRange = IDBKeyRange.bound(
      [tableId, -Infinity],
      [tableId, Infinity],
    );
    const numRows = (await db.getAll(
      "datatable_data",
      numberRange,
    )) as IDataTableRow[];

    const stringRange = IDBKeyRange.bound([tableId, ""], [tableId, "\uffff"]);
    const strRows = (await db.getAll(
      "datatable_data",
      stringRange,
    )) as IDataTableRow[];

    const rows = [...numRows, ...strRows];

    if (filters && Object.keys(filters).length > 0) {
      return rows.filter((row) => {
        return Object.entries(filters).every(([key, value]) => {
          // Loose equality check to handle string/number mismatches from inputs
          return row.data[key] == value;
        });
      });
    }

    return rows;
  }

  static async addRow(
    tableId: string,
    data: Record<string, unknown>,
  ): Promise<number> {
    const db = await dbPromise;

    // Get table metadata to determine next ID
    const table = await db.get("datatable_metadata", tableId);
    if (!table) {
      throw new Error(`Table ${tableId} not found`);
    }

    let nextId = table.nextRowId;
    if (typeof nextId !== "number") {
      nextId = 1;
    }

    const rowId = nextId;
    const row: IDataTableRow = {
      tableId,
      rowId,
      data,
    };

    // Update table metadata first or last?
    // Update nextRowId
    table.nextRowId = nextId + 1;
    await db.put("datatable_metadata", table);

    await db.put("datatable_data", row);
    return rowId;
  }

  static async updateRow(
    tableId: string,
    rowId: number,
    data: Record<string, unknown>,
  ): Promise<void> {
    const db = await dbPromise;
    const key: [string, number] = [tableId, rowId];
    const row = (await db.get("datatable_data", key)) as
      | IDataTableRow
      | undefined;
    if (!row) return;

    row.data = data;
    await db.put("datatable_data", row);
  }

  static async deleteRow(tableId: string, rowId: number): Promise<void> {
    const db = await dbPromise;
    await db.delete("datatable_data", [tableId, rowId]);
  }
}
