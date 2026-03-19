import { Database } from "lucide-vue-next";
import { INodeType, IExecuteFunctions, INodeExecutionData } from "../../types";
import { DataTableService } from "../../services/data-table-service";

export const DataTable: INodeType = {
  description: {
    displayName: "Data Table",
    name: "dataTable",
    icon: Database,
    group: ["core"],
    version: 1,
    description: "Read data from a Data Table",
    defaults: {
      name: "Data Table",
    },
    inputs: [{ name: "main", type: "main", label: "Main" }],
    outputs: [{ name: "main", type: "main", label: "Main" }],
    properties: [
      {
        displayName: "Table Name or ID",
        name: "table",
        type: "string",
        default: "",
        required: true,
        description: "The name or ID of the Data Table to read from",
      },
      {
        displayName: "Filter",
        name: "filter",
        type: "json",
        default: "{}",
        description:
          'JSON object where keys are column names and values are filter values. (e.g. { "name": "John" })',
      },
      {
        displayName: "Limit",
        name: "limit",
        type: "number",
        default: 0,
        description: "Max number of rows to return (0 for no limit)",
      },
    ],
  },
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const tableIdentifier = this.getNodeParameter("table", "") as string;
    let filter = this.getNodeParameter("filter", {}) as Record<string, unknown>;
    const limit = this.getNodeParameter("limit", 0) as number;

    if (typeof filter === "string") {
      try {
        filter = JSON.parse(filter) as Record<string, unknown>;
      } catch {
        filter = {};
      }
    }

    if (!tableIdentifier) {
      throw new Error("Table Name or ID is required");
    }

    let tableId = tableIdentifier;
    // Check if input is a valid UUID, otherwise treat as name
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tableIdentifier)) {
      const id = await DataTableService.getTableIdByName(tableIdentifier);
      if (!id) {
        throw new Error(`Table with name "${tableIdentifier}" not found`);
      }
      tableId = id;
    }

    const rows = await DataTableService.getRows(tableId, filter);

    let resultRows = rows;
    if (limit > 0) {
      resultRows = rows.slice(0, limit);
    }

    return [resultRows.map((row) => ({ json: row.data }))];
  },
};
