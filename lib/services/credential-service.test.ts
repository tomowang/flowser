import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('#imports', () => ({ storage: { getItem: vi.fn(), setItem: vi.fn() } }));
vi.mock('../db', () => ({ dbPromise: Promise.resolve({ put: vi.fn(), get: vi.fn(), getAll: vi.fn(), delete: vi.fn() }) }));
vi.mock('./security-service', () => ({ SecurityService: { encrypt: vi.fn(), decrypt: vi.fn() } }));
import { CredentialService } from './credential-service';
import { SecurityService } from './security-service';
import { dbPromise } from '../db';
if (typeof crypto !== 'undefined' && (crypto as unknown as Crypto).randomUUID) { vi.spyOn(crypto, 'randomUUID').mockReturnValue('test-uuid' as `${string}-${string}-${string}-${string}-${string}`); } else { (global as unknown as { crypto: unknown }).crypto = { randomUUID: () => 'test-uuid' }; }
describe('CredentialService', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it('should save a credential', async () => {
    vi.mocked(SecurityService.encrypt).mockResolvedValue({ iv: 'mock-iv', data: 'encrypted-data' });
    const id = await CredentialService.saveCredential('Test', 'type', { key: 'val' });
    const db = await dbPromise;
    expect(id).toBe('test-uuid');
    expect(db.put).toHaveBeenCalled();
  });
  it('should get decrypted credential', async () => {
    const db = await dbPromise;
    vi.mocked(db.get).mockResolvedValue({ id: '1', encryptedData: '...', iv: '...' });
    vi.mocked(SecurityService.decrypt).mockResolvedValue(JSON.stringify({ apiKey: 'secret' }));
    const result = await CredentialService.getDecryptedCredential('1');
    expect(result).toEqual({ apiKey: 'secret' });
  });
});
