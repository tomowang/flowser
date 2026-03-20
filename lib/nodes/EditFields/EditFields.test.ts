import { describe, it, expect, vi } from 'vitest';
import { EditFields } from './EditFields';
import { IExecuteFunctions } from '../../types';

describe('EditFields Node', () => {
  const executeNode = async (inputs: any[], params: Record<string, any>) => {
    const context = {
      getInputData: () => inputs,
      getNodeParameter: (name: string, index: number, fallback?: any) => {
        return params[name] !== undefined ? params[name] : fallback;
      }
    } as unknown as IExecuteFunctions;
    return EditFields.execute!.call(context);
  };

  it('should merge fields with existing data (mapping mode)', async () => {
    const inputs = [{ json: { old: 'val' } }];
    const fields = {
      values: [
        { name: 'newStr', type: 'string', stringValue: 'hello' },
        { name: 'newNum', type: 'number', numberValue: 123 },
        { name: 'newBool', type: 'boolean', booleanValue: 'true' },
        { name: 'newJson', type: 'json', jsonValue: '{"a":1}' }
      ]
    };
    const result = await executeNode(inputs, { mode: 'mapping', fields });

    expect(result[0][0].json).toEqual({
      old: 'val',
      newStr: 'hello',
      newNum: 123,
      newBool: true,
      newJson: { a: 1 }
    });
  });

  it('should only keep set fields (keepOnlySet mode)', async () => {
    const inputs = [{ json: { old: 'val' } }];
    const fields = {
      values: [{ name: 'only', type: 'string', stringValue: 'me' }]
    };
    const result = await executeNode(inputs, { mode: 'keepOnlySet', fields });

    expect(result[0][0].json).toEqual({
      only: 'me'
    });
    expect(result[0][0].json.old).toBeUndefined();
  });
});