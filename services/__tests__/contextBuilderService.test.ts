import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();
const mockCollection = vi.fn();
const mockGetDocs = vi.fn();
const mockServerTimestamp = vi.fn(() => null);

vi.mock('firebase/firestore', () => ({
  doc: (...args: any[]) => (mockDoc as (...args: any[]) => any)(...args),
  getDoc: (...args: any[]) => (mockGetDoc as (...args: any[]) => any)(...args),
  setDoc: (...args: any[]) => (mockSetDoc as (...args: any[]) => any)(...args),
  updateDoc: (...args: any[]) => (mockUpdateDoc as (...args: any[]) => any)(...args),
  deleteDoc: (...args: any[]) => (mockDeleteDoc as (...args: any[]) => any)(...args),
  collection: (...args: any[]) => (mockCollection as (...args: any[]) => any)(...args),
  getDocs: (...args: any[]) => (mockGetDocs as (...args: any[]) => any)(...args),
  serverTimestamp: (...args: any[]) => (mockServerTimestamp as (...args: any[]) => any)(...args),
}));

vi.mock('../firebase', () => ({
  db: {},
  auth: { currentUser: null },
}));

import { contextBuilderService } from '../contextBuilderService';

const UID = 'test-uid';

function mockSnap(exists: boolean, data: any = null) {
  return { exists: () => exists, data: () => data };
}

function mockQuerySnap(docs: any[] = []) {
  return { forEach(cb: (d: any) => void) { docs.forEach(d => cb(mockSnap(true, d))); } };
}

beforeEach(() => {
  vi.clearAllMocks();
  contextBuilderService.clearCache();
});

describe('contextBuilderService', () => {
  describe('buildUserContext', () => {
    it('returns empty string for empty uid', async () => {
      const result = await contextBuilderService.buildUserContext('');
      expect(result).toBe('');
    });

    it('builds context with profile when data exists', async () => {
      mockGetDoc
        .mockResolvedValueOnce(mockSnap(true, {
          name: 'Test User', age: 28, gender: 'Male', height: 180, weight: 80,
          goal: 'Strength', experience: 'Intermediate', splitPreference: 'Push/Pull/Legs',
          equipment: 'Full Gym', injuries: 'None',
        }))
        .mockResolvedValueOnce(mockSnap(true, {
          splitName: 'PPL Split', description: 'A solid split',
          schedule: [
            { dayName: 'Day 1 - Push', focus: 'Chest' },
            { dayName: 'Day 2 - Pull', focus: 'Back' },
          ],
        }))
        .mockResolvedValueOnce(mockSnap(true, { content: 'Push harder on leg days' }));
      mockGetDocs.mockResolvedValue(mockQuerySnap([]));

      const result = await contextBuilderService.buildUserContext(UID);
      expect(result).toContain('Test User');
      expect(result).toContain('PPL Split');
      expect(result).toContain('Push harder');
    });

    it('handles partial data gracefully', async () => {
      mockGetDoc
        .mockResolvedValueOnce(mockSnap(true, { name: 'Test User', goal: 'Strength' }))
        .mockResolvedValueOnce(mockSnap(false))
        .mockResolvedValueOnce(mockSnap(false));
      mockGetDocs.mockResolvedValue(mockQuerySnap([]));

      const result = await contextBuilderService.buildUserContext(UID);
      expect(result).toContain('Test User');
    });

    it('returns cached context within cache window', async () => {
      mockGetDoc.mockResolvedValue(mockSnap(false));
      mockGetDocs.mockResolvedValue(mockQuerySnap([]));

      await contextBuilderService.buildUserContext(UID);
      const firstCallCount = mockGetDoc.mock.calls.length;

      await contextBuilderService.buildUserContext(UID);
      expect(mockGetDoc.mock.calls.length).toBe(firstCallCount);
    });

    it('refreshes cache when forceRefresh is true', async () => {
      mockGetDoc.mockResolvedValue(mockSnap(false));
      mockGetDocs.mockResolvedValue(mockQuerySnap([]));

      await contextBuilderService.buildUserContext(UID);
      const firstCallCount = mockGetDoc.mock.calls.length;

      mockGetDoc.mockResolvedValue(mockSnap(false));
      await contextBuilderService.buildUserContext(UID, true);
      expect(mockGetDoc.mock.calls.length).toBeGreaterThan(firstCallCount);
    });

    it('handles individual fetch failures gracefully', async () => {
      mockGetDoc.mockRejectedValue(new Error('Network error'));
      mockGetDocs.mockRejectedValue(new Error('Network error'));

      const result = await contextBuilderService.buildUserContext(UID);
      expect(result).toBe('');
    });
  });

  describe('clearCache', () => {
    it('clears cache for specific uid', async () => {
      mockGetDoc.mockResolvedValue(mockSnap(false));
      mockGetDocs.mockResolvedValue(mockQuerySnap([]));
      await contextBuilderService.buildUserContext(UID);

      const firstCallCount = mockGetDoc.mock.calls.length;
      contextBuilderService.clearCache(UID);

      mockGetDoc.mockResolvedValue(mockSnap(false));
      await contextBuilderService.buildUserContext(UID);
      expect(mockGetDoc.mock.calls.length).toBeGreaterThan(firstCallCount);
    });

    it('clears entire cache when no uid specified', async () => {
      mockGetDoc.mockResolvedValue(mockSnap(false));
      mockGetDocs.mockResolvedValue(mockQuerySnap([]));
      await contextBuilderService.buildUserContext(UID);
      await contextBuilderService.buildUserContext('other-uid');

      const firstCallCount = mockGetDoc.mock.calls.length;
      contextBuilderService.clearCache();

      mockGetDoc.mockResolvedValue(mockSnap(false));
      await contextBuilderService.buildUserContext(UID);
      expect(mockGetDoc.mock.calls.length).toBeGreaterThan(firstCallCount);
    });
  });
});
