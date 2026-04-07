import { describe, it, expect } from 'vitest';
import { If } from './If';
import { IExecuteFunctions, INodeExecutionData } from '../../types';

describe('If Node', () => {
  const executeNode = async (inputs: INodeExecutionData[], params: Record<string, unknown>) => {
    const context = {
      getInputData: () => inputs,
      getNodeParameter: (name: string, _index: number, fallback?: unknown) => {
        return params[name] !== undefined ? params[name] : fallback;
      },
      evaluateExpression: (expr: string, index: number) => {
        if (expr.startsWith('$json.')) {
          const key = expr.replace('$json.', '');
          return inputs[index].json[key];
        }
        return expr;
      }
    } as unknown as IExecuteFunctions;
    return If.execute!.call(context);
  };

  it('should route items to true branch when conditions match (all)', async () => {
    const inputs = [{ json: { value: 10 } }, { json: { value: 5 } }];
    const conditions = [{ key: '$json.value', operator: '>', value: '7' }];
    const result = await executeNode(inputs, { combinator: 'all', conditions: JSON.stringify(conditions) });

    expect(result[0]).toHaveLength(1);
    expect(result[1]).toHaveLength(1);
    expect(result[0][0].json.value).toBe(10);
  });

  it('should handle multiple conditions with OR (any)', async () => {
    const inputs = [{ json: { v: 1 } }, { json: { v: 10 } }];
    const conditions = [
      { key: '$json.v', operator: '==', value: '1' },
      { key: '$json.v', operator: '==', value: '2' }
    ];
    const result = await executeNode(inputs, { combinator: 'any', conditions });

    expect(result[0]).toHaveLength(1);
    expect(result[0][0].json.v).toBe(1);
  });

  it('should handle string operations (contains)', async () => {
    const inputs = [{ json: { s: 'hello world' } }, { json: { s: 'foo' } }];
    const conditions = [{ key: '$json.s', operator: 'contains', value: 'hello' }];
    const result = await executeNode(inputs, { combinator: 'all', conditions });

    expect(result[0]).toHaveLength(1);
    expect(result[0][0].json.s).toBe('hello world');
  });
});