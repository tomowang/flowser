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

    // Delete all rows associated with this table
    // Keys are [tableId, rowId]
    // The previous implementation assumed rowId was string which could be problematic if we switch to number.
    // However, if we delete all rows, we should query by tableId index if possible,
    // or iterate. Since we use [tableId, rowId] as key, we can use a range.
    // For numbers we can use lower/upper bounds.
    // If we mixed types (string and number), we might need two deletes or a wide range.
    // Let's assume we might have both during migration or just numbers now.
    // IDBKeyRange.bound([id, -Infinity], [id, Infinity]) might work for numbers.
    // For strings it was [id, ""] to [id, "\uffff"].

    // Let's try to delete both ranges to be safe or just use a very wide range if possible.
    // IDB compares numbers < strings.
    // So [id, -Infinity] to [id, "\uffff"] covers both?
    // Actually, [id, <min>] to [id, <max>].
    // Let's delete number range and string range separately to be safe.

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
    filters?: Record<string, any>,
  ): Promise<IDataTableRow[]> {
    const db = await dbPromise;
    // Retrieve all rows for a table using the composite key range
    // We need to fetch both number encoded rows and string encoded rows if we want to be safe,
    // or just fetch everything for the table.
    // Since we are moving to numbers, we should prioritize that.
    // But getting all might require two queries if we strictly use ranges.
    // Or we can just use a wide range.

    const numberRange = IDBKeyRange.bound([tableId, -Infinity], [tableId, Infinity]);
    const numRows = await db.getAll("datatable_data", numberRange);

    const stringRange = IDBKeyRange.bound([tableId, ""], [tableId, "\uffff"]);
    const strRows = await db.getAll("datatable_data", stringRange);

    const rows = [...numRows, ...strRows];

    if (filters && Object.keys(filters).length > 0) {
      return rows.filter((row) => {
        return Object.entries(filters).every(([key, value]) => {
          // Loose equality check to handle string/number mismatches from inputs
          // eslint-disable-next-line eqeqeq
          return row.data[key] == value;
        });
      });
    }

    return rows;
  }

  static async addRow(
    tableId: string,
    data: Record<string, any>,
  ): Promise<number> {
    const db = await dbPromise;

    // Get table metadata to determine next ID
    const table = await db.get("datatable_metadata", tableId);
    if (!table) {
      throw new Error(`Table ${tableId} not found`);
    }

    let nextId = table.nextRowId;
    if (typeof nextId !== "number") {
      // Initialize if missing (migration)
      // Find max existing ID if we wanted to be safe, but "discard compatibility" was requested.
      // So we start at 1.
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
    data: Record<string, any>,
  ): Promise<void> {
    const db = await dbPromise;
    const key: [string, number] = [tableId, rowId];
    const row = await db.get("datatable_data", key);
    if (!row) return;

    row.data = data;
    await db.put("datatable_data", row);
  }

  static async deleteRow(tableId: string, rowId: number): Promise<void> {
    const db = await dbPromise;
    await db.delete("datatable_data", [tableId, rowId]);
  }
}
