import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DataTable } from './DataTable';
import { IExecuteFunctions, INodeExecutionData } from '../../types';

vi.mock('../../services/data-table-service', () => ({
  DataTableService: {
    getTableIdByName: vi.fn(),
    getRows: vi.fn(),
  },
}));

import { DataTableService } from '../../services/data-table-service';

describe('DataTable Node', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const executeNode = async (inputs: INodeExecutionData[], params: Record<string, unknown>) => {
    const context = {
      getInputData: () => inputs,
      getNodeParameter: (name: string, indexOrFallback: unknown, arg3?: unknown) => {
        let fallback: unknown;
        if (typeof indexOrFallback === 'number') {
          fallback = arg3;
        } else {
          fallback = indexOrFallback;
        }
        return params[name] !== undefined ? params[name] : fallback;
      }
    } as unknown as IExecuteFunctions;
    return DataTable.execute!.call(context);
  };

  it('should fetch rows from table by ID', async () => {
    const tableId = '12345678-1234-1234-1234-123456789012';
    vi.mocked(DataTableService.getRows).mockResolvedValue([{ tableId, rowId: 1, data: { name: 'test' } }]);

    const result = await executeNode([], { table: tableId });

    expect(DataTableService.getRows).toHaveBeenCalledWith(tableId, {});
    expect(result[0][0].json).toEqual({ name: 'test' });
  });

  it('should resolve table name to ID', async () => {
    const tableName = 'MyTable';
    const tableId = '12345678-1234-1234-1234-123456789012';
    vi.mocked(DataTableService.getTableIdByName).mockResolvedValue(tableId);
    vi.mocked(DataTableService.getRows).mockResolvedValue([{ tableId, rowId: 1, data: { foo: 'bar' } }]);

    const result = await executeNode([], { table: tableName });

    expect(DataTableService.getTableIdByName).toHaveBeenCalledWith(tableName);
    expect(DataTableService.getRows).toHaveBeenCalledWith(tableId, {});
    expect(result[0][0].json.foo).toBe('bar');
  });

  it('should respect limit parameter', async () => {
    const tableId = '12345678-1234-1234-1234-123456789012';
    vi.mocked(DataTableService.getRows).mockResolvedValue([
      { tableId, rowId: 1, data: { id: 1 } },
      { tableId, rowId: 2, data: { id: 2 } }
    ]);

    const result = await executeNode([], { table: tableId, limit: 1 });
    expect(result[0]).toHaveLength(1);
    expect(result[0][0].json.id).toBe(1);
  });
});