import { describe, it, expect } from 'vitest';
import { Placeholder } from './Placeholder';
import { IExecuteFunctions, INodeExecutionData } from '../../types';

describe('Placeholder Node', () => {
  const executeNode = async (inputs: INodeExecutionData[]) => {
    const context = {
      getInputData: () => inputs,
    } as unknown as IExecuteFunctions;
    return Placeholder.execute!.call(context);
  };

  it('passes input items through unchanged', async () => {
    const inputs: INodeExecutionData[] = [
      { json: { a: 1, nested: { b: 'c' } } },
      { json: { d: [1, 2, 3] }, binary: { file: { data: 'base64', mimeType: 'text/plain' } } },
    ];

    const result = await executeNode(inputs);

    expect(result).toEqual([inputs]);
  });

  it('returns an empty array when there is no input data', async () => {
    const result = await executeNode([]);
    expect(result).toEqual([[]]);
  });
});
