import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Wait } from './Wait';
import { IExecuteFunctions } from '../../types';

describe('Wait Node', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const executeNode = async (inputs: unknown[], params: Record<string, unknown>) => {
    const context = {
      getInputData: () => inputs,
      getNodeParameter: (name: string, _index: number, fallback?: unknown) => {
        return params[name] !== undefined ? params[name] : fallback;
      }
    } as unknown as IExecuteFunctions;
    return Wait.execute!.call(context);
  };

  it('should wait for specified time and return input data', async () => {
    const inputs = [{ json: { val: 1 } }];
    const waitPromise = executeNode(inputs, { seconds: 1 });

    // Fast-forward time
    await vi.advanceTimersByTimeAsync(1000);
    
    const result = await waitPromise;
    expect(result[0]).toHaveLength(1);
    expect(result[0][0].json.val).toBe(1);
  });

  it('should throw error for negative wait time', async () => {
    const inputs = [{ json: { val: 1 } }];
    await expect(executeNode(inputs, { seconds: -1 })).rejects.toThrow('Invalid seconds value: -1');
  });
});