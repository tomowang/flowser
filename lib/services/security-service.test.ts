import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('#imports', () => ({
  storage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

vi.mock('../db', () => ({
  dbPromise: Promise.resolve({}),
}));

import { SecurityService } from './security-service';

describe('SecurityService', () => {
  it('should derive a key from password', async () => {
    const key = await SecurityService.deriveKey('password123');
    expect(key.type).toBe('secret');
    expect(key.extractable).toBe(true);
  });

  it('should encrypt and decrypt correctly', async () => {
    const password = 'test-password';
    const plaintext = 'secret message';
    const key = await SecurityService.deriveKey(password);
    SecurityService.setMasterKey(key);

    const { iv, data } = await SecurityService.encrypt(plaintext);
    expect(iv).toBeDefined();
    expect(data).toBeDefined();

    const decrypted = await SecurityService.decrypt(data, iv);
    expect(decrypted).toBe(plaintext);
  });

  it('should throw error if master key not set during encrypt', async () => {
    SecurityService.setMasterKey(null as any);
    await expect(SecurityService.encrypt('test')).rejects.toThrow('Master key not set');
  });
});