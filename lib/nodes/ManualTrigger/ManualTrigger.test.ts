import { describe, it, expect } from 'vitest';
import { ManualTrigger } from './ManualTrigger';

describe('ManualTrigger Node', () => {
  it('should return empty item to start workflow', async () => {
    const result = await ManualTrigger.execute!.call({} as any);
    expect(result[0]).toHaveLength(1);
    expect(result[0][0].json).toEqual({});
  });
});