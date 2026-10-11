import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockDocs = [
  {
    id: 'user-1',
    data: () => ({
      uid: 'user-1',
      studentId: '20305',
      name: '김민준',
      role: 'student',
      isTeacher: false
    })
  },
  {
    id: 'user-admin',
    data: () => ({
      uid: 'user-admin',
      studentId: 'sshsgym',
      name: '총괄관리자',
      role: 'admin',
      isTeacher: false
    })
  }
];

const mockUpdateFn = vi.fn();
const mockBatchCommit = vi.fn().mockResolvedValue(undefined);

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn((db, name) => ({ name })),
  doc: vi.fn((db, name, id) => ({ name, id })),
  getDocs: vi.fn(async (col) => {
    if (col.name === 'users') {
      return { docs: mockDocs };
    }
    return { docs: [{ id: 'doc-1', data: () => ({ title: 'Test' }) }] };
  }),
  writeBatch: vi.fn(() => ({
    update: mockUpdateFn,
    commit: mockBatchCommit
  })),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn()
}));

vi.mock('../lib/firebase', () => ({
  db: {}
}));

import { exportFirestoreDataJSON, scrubPersonalData } from './backupService';

describe('backupService Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports all major firestore collections into JSON backup format', async () => {
    const backup = await exportFirestoreDataJSON();

    expect(backup).toHaveProperty('exportedAt');
    expect(backup).toHaveProperty('version', '1.0.0');
    expect(backup.collections).toHaveProperty('matches');
    expect(backup.collections).toHaveProperty('users');
    expect(backup.collections).toHaveProperty('notices');
    expect(backup.collections.users).toHaveLength(2);
    expect(backup.collections.matches).toHaveLength(1);
  });

  it('scrubs student PII while preserving admin account (sshsgym)', async () => {
    const result = await scrubPersonalData();

    expect(result.scrubbedCount).toBe(1); // Only user-1 scrubbed, sshsgym skipped
    expect(mockUpdateFn).toHaveBeenCalledTimes(1);
    expect(mockUpdateFn).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-1' }),
      expect.objectContaining({
        name: '익명학생',
        studentId: expect.stringMatching(/^ANON_/)
      })
    );
    expect(mockBatchCommit).toHaveBeenCalled();
  });
});
