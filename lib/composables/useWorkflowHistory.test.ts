import { describe, it, expect, vi } from 'vitest';
import { useWorkflowHistory } from './useWorkflowHistory';

// Mock vue and vueuse
vi.mock('vue', () => ({
  ref: (v: any) => ({ value: v })
}));

vi.mock('@vueuse/core', () => ({
  useManualRefHistory: (state: any) => ({
    history: [],
    commit: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    canUndo: { value: true },
    canRedo: { value: true },
    clear: vi.fn()
  }),
  useDebounceFn: (fn: any) => fn
}));

describe('useWorkflowHistory', () => {
  it('should initialize state', () => {
    const { initState, state } = useWorkflowHistory();
    initState([{ id: '1' }] as any, []);
    expect(state.value.nodes).toHaveLength(1);
  });
});