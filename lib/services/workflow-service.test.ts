import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkflowService } from './workflow-service';
import { dbPromise } from '../db';
import { IWorkflow } from '../types';

vi.mock('../db', () => ({
  dbPromise: Promise.resolve({
    put: vi.fn(),
    get: vi.fn(),
    getAll: vi.fn(),
    delete: vi.fn(),
  }),
}));

const mockSendMessage = vi.fn();
vi.mock('wxt/browser', () => ({
  browser: {
    runtime: {
      sendMessage: (...args: unknown[]) => mockSendMessage(...args),
    },
  },
}));

describe('WorkflowService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should save workflow and send message', async () => {
    const workflow = { id: 'wf1', name: 'Test' } as unknown as IWorkflow;
    await WorkflowService.saveWorkflow(workflow);
    
    const db = await dbPromise;
    expect(db.put).toHaveBeenCalledWith('workflows', workflow);
    expect(mockSendMessage).toHaveBeenCalledWith({
      type: 'WORKFLOW:UPDATED',
      payload: workflow
    });
  });

  it('should update workflow status', async () => {
    const db = await dbPromise;
    const workflow = { id: 'wf1', active: false } as unknown as IWorkflow;
    vi.mocked(db.get).mockResolvedValue(workflow);
    
    await WorkflowService.updateWorkflowStatus('wf1', true);
    
    expect(db.put).toHaveBeenCalledWith('workflows', expect.objectContaining({
      active: true
    }));
  });
});