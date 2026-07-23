import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  Goal, 
  UserProfile, 
  WorkoutPlan, 
  WorkoutSession, 
  DailyLog, 
  NutritionEntry, 
  Note, 
  ProgressEntry, 
  AchievementBadge 
} from '../../types';

const mockDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();
const mockCollection = vi.fn();
const mockGetDocs = vi.fn();
const mockServerTimestamp = vi.fn(() => 'MOCK_SERVER_TIMESTAMP');

vi.mock('firebase/firestore', () => ({
  doc: (...args: any[]) => {
    for (let i = 1; i < args.length; i++) {
      if (args[i] === undefined || args[i] === null || args[i] === '') {
        throw new Error(`Function doc() cannot be called with an empty/undefined path segment at index ${i}`);
      }
    }
    return (mockDoc as (...args: any[]) => any)(...args);
  },
  getDoc: (...args: any[]) => (mockGetDoc as (...args: any[]) => any)(...args),
  setDoc: (...args: any[]) => (mockSetDoc as (...args: any[]) => any)(...args),
  updateDoc: (...args: any[]) => (mockUpdateDoc as (...args: any[]) => any)(...args),
  deleteDoc: (...args: any[]) => (mockDeleteDoc as (...args: any[]) => any)(...args),
  collection: (...args: any[]) => {
    for (let i = 1; i < args.length; i++) {
      if (args[i] === undefined || args[i] === null || args[i] === '') {
        throw new Error(`Function collection() cannot be called with an empty/undefined path segment at index ${i}`);
      }
    }
    return (mockCollection as (...args: any[]) => any)(...args);
  },
  getDocs: (...args: any[]) => (mockGetDocs as (...args: any[]) => any)(...args),
  serverTimestamp: (...args: any[]) => (mockServerTimestamp as (...args: any[]) => any)(...args),
}));


vi.mock('../firebase', () => ({
  db: { type: 'mock-db' },
  auth: { currentUser: null },
}));

import { firestoreService } from '../firestoreService';

const UID = 'test-uid-123';
const EMAIL = 'test@example.com';
const NAME = 'Test User';

function createDocSnap(exists: boolean, data: any = null) {
  return { exists: () => exists, data: () => data };
}

function createQuerySnap(docs: any[] = []) {
  return {
    forEach(cb: (d: any) => void) { docs.forEach(cb); },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('firestoreService', () => {
  
  // ==========================================
  // getUserProfile
  // ==========================================
  describe('getUserProfile', () => {
    it('returns profile when doc exists', async () => {
      const profile = { name: 'Test', email: 'test@test.com' };
      mockGetDoc.mockResolvedValue(createDocSnap(true, profile));
      const result = await firestoreService.getUserProfile(UID);
      expect(result).toEqual(profile);
      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users', UID);
    });

    it('returns null when doc does not exist', async () => {
      mockGetDoc.mockResolvedValue(createDocSnap(false));
      const result = await firestoreService.getUserProfile(UID);
      expect(result).toBeNull();
    });

    it('throws when uid is empty string', async () => {
      await expect(firestoreService.getUserProfile('')).rejects.toThrow('UID is required to fetch profile');
    });

    it('throws when uid is null', async () => {
      await expect(firestoreService.getUserProfile(null as unknown as string)).rejects.toThrow('UID is required to fetch profile');
    });

    it('throws when uid is undefined', async () => {
      await expect(firestoreService.getUserProfile(undefined as unknown as string)).rejects.toThrow('UID is required to fetch profile');
    });

    it('propagates Firestore errors', async () => {
      const error = new Error('Permission denied');
      mockGetDoc.mockRejectedValue(error);
      await expect(firestoreService.getUserProfile(UID)).rejects.toThrow('Permission denied');
    });
  });

  // ==========================================
  // createUserProfile
  // ==========================================
  describe('createUserProfile', () => {
    it('creates a basic profile successfully with correct mapping and options', async () => {
      mockSetDoc.mockResolvedValue(undefined);
      await firestoreService.createUserProfile(UID, EMAIL, NAME);
      expect(mockSetDoc).toHaveBeenCalledTimes(1);
      const [ref, data, options] = mockSetDoc.mock.calls[0];
      expect(data.uid).toBe(UID);
      expect(data.email).toBe(EMAIL);
      expect(data.name).toBe(NAME);
      expect(data.fullName).toBe(NAME);
      expect(data.onboardingCompleted).toBe(false);
      expect(data.completedOnboarding).toBe(false);
      expect(data.createdAt).toBe('MOCK_SERVER_TIMESTAMP');
      expect(data.updatedAt).toBe('MOCK_SERVER_TIMESTAMP');
      expect(options).toEqual({ merge: true });
    });

    it('throws when uid is empty', async () => {
      await expect(firestoreService.createUserProfile('', EMAIL, NAME)).rejects.toThrow('UID is required to create profile');
    });

    it('throws when uid is null', async () => {
      await expect(firestoreService.createUserProfile(null as unknown as string, EMAIL, NAME)).rejects.toThrow('UID is required to create profile');
    });

    it('throws when uid is undefined', async () => {
      await expect(firestoreService.createUserProfile(undefined as unknown as string, EMAIL, NAME)).rejects.toThrow('UID is required to create profile');
    });

    it('generates correct profile image URL with encoded name', async () => {
      mockSetDoc.mockResolvedValue(undefined);
      await firestoreService.createUserProfile(UID, EMAIL, 'John Doe & Co.');
      const data = mockSetDoc.mock.calls[0][1];
      expect(data.profileImage).toBe('https://ui-avatars.com/api/?name=John%20Doe%20%26%20Co.&background=ff5e00&color=fff');
    });

    it('propagates Firestore errors', async () => {
      const error = new Error('Database write failed');
      mockSetDoc.mockRejectedValue(error);
      await expect(firestoreService.createUserProfile(UID, EMAIL, NAME)).rejects.toThrow('Database write failed');
    });
  });

  // ==========================================
  // updateUserProfile
  // ==========================================
  describe('updateUserProfile', () => {
    it('updates profile with field mappings', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);
      await firestoreService.updateUserProfile(UID, { name: 'New Name', goal: Goal.STRENGTH });
      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      const updates = mockUpdateDoc.mock.calls[0][1];
      expect(updates.name).toBe('New Name');
      expect(updates.fullName).toBe('New Name');
      expect(updates.goal).toBe(Goal.STRENGTH);
      expect(updates.fitnessGoal).toBe(Goal.STRENGTH);
      expect(updates.updatedAt).toBe('MOCK_SERVER_TIMESTAMP');
    });

    it('maps onboarding fields bidirectionally', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);
      await firestoreService.updateUserProfile(UID, { completedOnboarding: true });
      const updates = mockUpdateDoc.mock.calls[0][1];
      expect(updates.completedOnboarding).toBe(true);
      expect(updates.onboardingCompleted).toBe(true);
    });

    it('maps fullName to name (reverse mapping)', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);
      await firestoreService.updateUserProfile(UID, { fullName: 'Reverse Name' });
      const updates = mockUpdateDoc.mock.calls[0][1];
      expect(updates.fullName).toBe('Reverse Name');
      expect(updates.name).toBe('Reverse Name');
    });

    it('maps fitnessGoal to goal (reverse mapping)', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);
      await firestoreService.updateUserProfile(UID, { fitnessGoal: Goal.STRENGTH });
      const updates = mockUpdateDoc.mock.calls[0][1];
      expect(updates.fitnessGoal).toBe(Goal.STRENGTH);
      expect(updates.goal).toBe(Goal.STRENGTH);
    });

    it('maps onboardingCompleted to completedOnboarding (reverse mapping)', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);
      await firestoreService.updateUserProfile(UID, { onboardingCompleted: false });
      const updates = mockUpdateDoc.mock.calls[0][1];
      expect(updates.onboardingCompleted).toBe(false);
      expect(updates.completedOnboarding).toBe(false);
    });

    it('removes undefined values to prevent Firestore validation failures', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);
      await firestoreService.updateUserProfile(UID, { name: undefined, goal: Goal.CUTTING });
      const updates = mockUpdateDoc.mock.calls[0][1];
      expect(updates.name).toBeUndefined();
      expect(Object.prototype.hasOwnProperty.call(updates, 'name')).toBe(false);
      expect(updates.goal).toBe(Goal.CUTTING);
    });

    it('handles updates for empty profileData object', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);
      await firestoreService.updateUserProfile(UID, {});
      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      const updates = mockUpdateDoc.mock.calls[0][1];
      expect(updates).toEqual({ updatedAt: 'MOCK_SERVER_TIMESTAMP' });
    });

    it('throws when uid is empty string', async () => {
      await expect(firestoreService.updateUserProfile('', {})).rejects.toThrow('UID is required to update profile');
    });

    it('throws when uid is null', async () => {
      await expect(firestoreService.updateUserProfile(null as unknown as string, {})).rejects.toThrow('UID is required to update profile');
    });

    it('throws when uid is undefined', async () => {
      await expect(firestoreService.updateUserProfile(undefined as unknown as string, {})).rejects.toThrow('UID is required to update profile');
    });

    it('propagates Firestore errors', async () => {
      const error = new Error('Update failed');
      mockUpdateDoc.mockRejectedValue(error);
      await expect(firestoreService.updateUserProfile(UID, { name: 'Name' })).rejects.toThrow('Update failed');
    });
  });

  // ==========================================
  // getWorkoutPlan
  // ==========================================
  describe('getWorkoutPlan', () => {
    it('returns plan when exists', async () => {
      const plan = { splitName: 'PPL', schedule: [], generatedAt: 12345 };
      mockGetDoc.mockResolvedValue(createDocSnap(true, plan));
      const result = await firestoreService.getWorkoutPlan(UID);
      expect(result).toEqual(plan);
      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users', UID, 'workoutPlans', 'currentPlan');
    });

    it('returns null when no plan exists', async () => {
      mockGetDoc.mockResolvedValue(createDocSnap(false));
      const result = await firestoreService.getWorkoutPlan(UID);
      expect(result).toBeNull();
    });

    it('throws when uid is empty string', async () => {
      await expect(firestoreService.getWorkoutPlan('')).rejects.toThrow('UID is required to fetch workout plan');
    });

    it('throws when uid is null', async () => {
      await expect(firestoreService.getWorkoutPlan(null as unknown as string)).rejects.toThrow('UID is required to fetch workout plan');
    });

    it('throws when uid is undefined', async () => {
      await expect(firestoreService.getWorkoutPlan(undefined as unknown as string)).rejects.toThrow('UID is required to fetch workout plan');
    });

    it('propagates Firestore errors', async () => {
      const error = new Error('Fetch failed');
      mockGetDoc.mockRejectedValue(error);
      await expect(firestoreService.getWorkoutPlan(UID)).rejects.toThrow('Fetch failed');
    });
  });

  // ==========================================
  // saveWorkoutPlan
  // ==========================================
  describe('saveWorkoutPlan', () => {
    it('saves plan, cleans undefined values, and adds updatedAt', async () => {
      mockSetDoc.mockResolvedValue(undefined);
      const plan: any = { splitName: 'PPL', schedule: [], description: 'Test', undefinedField: undefined };
      await firestoreService.saveWorkoutPlan(UID, plan);
      expect(mockSetDoc).toHaveBeenCalledTimes(1);
      const saved = mockSetDoc.mock.calls[0][1];
      expect(saved.splitName).toBe('PPL');
      expect(saved.undefinedField).toBeUndefined();
      expect(Object.prototype.hasOwnProperty.call(saved, 'undefinedField')).toBe(false);
      expect(saved.updatedAt).toBeDefined();
    });

    it('throws when uid is empty string', async () => {
      await expect(firestoreService.saveWorkoutPlan('', {} as any)).rejects.toThrow('UID is required to save workout plan');
    });

    it('throws when uid is null', async () => {
      await expect(firestoreService.saveWorkoutPlan(null as unknown as string, {} as any)).rejects.toThrow('UID is required to save workout plan');
    });

    it('throws when uid is undefined', async () => {
      await expect(firestoreService.saveWorkoutPlan(undefined as unknown as string, {} as any)).rejects.toThrow('UID is required to save workout plan');
    });

    it('throws error when plan is null or undefined', async () => {
      await expect(firestoreService.saveWorkoutPlan(UID, null as unknown as any)).rejects.toThrow();
      await expect(firestoreService.saveWorkoutPlan(UID, undefined as unknown as any)).rejects.toThrow();
    });

    it('propagates Firestore errors', async () => {
      const error = new Error('Save failed');
      mockSetDoc.mockRejectedValue(error);
      const plan = { splitName: 'PPL', schedule: [], description: 'Test', generatedAt: 12345 };
      await expect(firestoreService.saveWorkoutPlan(UID, plan)).rejects.toThrow('Save failed');
    });
  });

  // ==========================================
  // deleteWorkoutPlan
  // ==========================================
  describe('deleteWorkoutPlan', () => {
    it('deletes plan successfully', async () => {
      mockDeleteDoc.mockResolvedValue(undefined);
      await firestoreService.deleteWorkoutPlan(UID);
      expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users', UID, 'workoutPlans', 'currentPlan');
    });

    it('throws when uid is empty string', async () => {
      await expect(firestoreService.deleteWorkoutPlan('')).rejects.toThrow('UID is required to delete workout plan');
    });

    it('throws when uid is null', async () => {
      await expect(firestoreService.deleteWorkoutPlan(null as unknown as string)).rejects.toThrow('UID is required to delete workout plan');
    });

    it('throws when uid is undefined', async () => {
      await expect(firestoreService.deleteWorkoutPlan(undefined as unknown as string)).rejects.toThrow('UID is required to delete workout plan');
    });

    it('propagates Firestore errors', async () => {
      const error = new Error('Delete failed');
      mockDeleteDoc.mockRejectedValue(error);
      await expect(firestoreService.deleteWorkoutPlan(UID)).rejects.toThrow('Delete failed');
    });
  });

  // ==========================================
  // getWorkoutSessions
  // ==========================================
  describe('getWorkoutSessions', () => {
    it('returns sessions sorted by date descending', async () => {
      const sessions = [
        { id: '1', date: '2026-01-15T00:00:00Z', dayName: 'Push' },
        { id: '2', date: '2026-01-10T00:00:00Z', dayName: 'Pull' },
        { id: '3', date: '2026-01-20T00:00:00Z', dayName: 'Legs' },
      ];
      mockGetDocs.mockResolvedValue(createQuerySnap(
        sessions.map(s => createDocSnap(true, s))
      ));
      const result = await firestoreService.getWorkoutSessions(UID);
      expect(result).toHaveLength(3);
      expect(result[0].date).toBe('2026-01-20T00:00:00Z');
      expect(result[1].date).toBe('2026-01-15T00:00:00Z');
      expect(result[2].date).toBe('2026-01-10T00:00:00Z');
      expect(mockCollection).toHaveBeenCalledWith(expect.anything(), 'users', UID, 'workoutSessions');
    });

    it('returns empty array when no sessions', async () => {
      mockGetDocs.mockResolvedValue(createQuerySnap([]));
      const result = await firestoreService.getWorkoutSessions(UID);
      expect(result).toEqual([]);
    });

    it('handles sorting when some dates are invalid or missing', async () => {
      const sessions = [
        { id: '1', date: 'invalid-date', dayName: 'Push' },
        { id: '2', date: '2026-01-10', dayName: 'Pull' },
        { id: '3', date: '', dayName: 'Legs' },
      ];
      mockGetDocs.mockResolvedValue(createQuerySnap(
        sessions.map(s => createDocSnap(true, s))
      ));
      // Should not crash during sorting
      const result = await firestoreService.getWorkoutSessions(UID);
      expect(result).toHaveLength(3);
    });

    it('throws when uid is empty string', async () => {
      await expect(firestoreService.getWorkoutSessions('')).rejects.toThrow('UID is required to fetch workout sessions');
    });

    it('throws when uid is null', async () => {
      await expect(firestoreService.getWorkoutSessions(null as unknown as string)).rejects.toThrow('UID is required to fetch workout sessions');
    });

    it('throws when uid is undefined', async () => {
      await expect(firestoreService.getWorkoutSessions(undefined as unknown as string)).rejects.toThrow('UID is required to fetch workout sessions');
    });

    it('propagates Firestore errors', async () => {
      const error = new Error('Read failed');
      mockGetDocs.mockRejectedValue(error);
      await expect(firestoreService.getWorkoutSessions(UID)).rejects.toThrow('Read failed');
    });
  });

  // ==========================================
  // saveWorkoutSession
  // ==========================================
  describe('saveWorkoutSession', () => {
    it('saves session with cleaned data and adds updatedAt', async () => {
      mockSetDoc.mockResolvedValue(undefined);
      const session = { id: 's1', date: '2026-01-15', dayName: 'Push', exercises: [], undefinedField: undefined };
      await firestoreService.saveWorkoutSession(UID, session as any);
      expect(mockSetDoc).toHaveBeenCalledTimes(1);
      const saved = mockSetDoc.mock.calls[0][1];
      expect(saved.id).toBe('s1');
      expect(saved.undefinedField).toBeUndefined();
      expect(Object.prototype.hasOwnProperty.call(saved, 'undefinedField')).toBe(false);
      expect(saved.updatedAt).toBeDefined();
      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users', UID, 'workoutSessions', 's1');
    });

    it('throws when uid is empty string', async () => {
      await expect(firestoreService.saveWorkoutSession('', { id: 's1' } as any)).rejects.toThrow('UID is required to save workout session');
    });

    it('throws when uid is null', async () => {
      await expect(firestoreService.saveWorkoutSession(null as unknown as string, { id: 's1' } as any)).rejects.toThrow('UID is required to save workout session');
    });

    it('throws when uid is undefined', async () => {
      await expect(firestoreService.saveWorkoutSession(undefined as unknown as string, { id: 's1' } as any)).rejects.toThrow('UID is required to save workout session');
    });

    it('throws when session is null/undefined or missing id', async () => {
      await expect(firestoreService.saveWorkoutSession(UID, null as unknown as any)).rejects.toThrow();
      await expect(firestoreService.saveWorkoutSession(UID, undefined as unknown as any)).rejects.toThrow();
      await expect(firestoreService.saveWorkoutSession(UID, { date: '2026-01-15' } as any)).rejects.toThrow();
    });

    it('propagates Firestore errors', async () => {
      const error = new Error('Save session failed');
      mockSetDoc.mockRejectedValue(error);
      const session = { id: 's1', date: '2026-01-15', dayName: 'Push', exercises: [] };
      await expect(firestoreService.saveWorkoutSession(UID, session as any)).rejects.toThrow('Save session failed');
    });
  });

  // ==========================================
  // deleteWorkoutSession
  // ==========================================
  describe('deleteWorkoutSession', () => {
    it('deletes session successfully', async () => {
      mockDeleteDoc.mockResolvedValue(undefined);
      await firestoreService.deleteWorkoutSession(UID, 'session-1');
      expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users', UID, 'workoutSessions', 'session-1');
    });

    it('throws when uid is empty string', async () => {
      await expect(firestoreService.deleteWorkoutSession('', 's-1')).rejects.toThrow('UID is required to delete workout session');
    });

    it('throws when uid is null', async () => {
      await expect(firestoreService.deleteWorkoutSession(null as unknown as string, 's-1')).rejects.toThrow('UID is required to delete workout session');
    });

    it('throws when uid is undefined', async () => {
      await expect(firestoreService.deleteWorkoutSession(undefined as unknown as string, 's-1')).rejects.toThrow('UID is required to delete workout session');
    });

    it('throws when sessionId is empty string', async () => {
      await expect(firestoreService.deleteWorkoutSession(UID, '')).rejects.toThrow();
    });

    it('throws when sessionId is null/undefined', async () => {
      await expect(firestoreService.deleteWorkoutSession(UID, null as unknown as string)).rejects.toThrow();
      await expect(firestoreService.deleteWorkoutSession(UID, undefined as unknown as string)).rejects.toThrow();
    });

    it('propagates Firestore errors', async () => {
      const error = new Error('Delete failed');
      mockDeleteDoc.mockRejectedValue(error);
      await expect(firestoreService.deleteWorkoutSession(UID, 'session-1')).rejects.toThrow('Delete failed');
    });
  });

  // ==========================================
  // getDailyLogs
  // ==========================================
  describe('getDailyLogs', () => {
    it('returns logs sorted by date descending', async () => {
      const logs = [
        { date: '2026-01-15', workoutCompleted: true },
        { date: '2026-01-10', workoutCompleted: false },
        { date: '2026-01-20', workoutCompleted: true },
      ];
      mockGetDocs.mockResolvedValue(createQuerySnap(
        logs.map(l => createDocSnap(true, l))
      ));
      const result = await firestoreService.getDailyLogs(UID);
      expect(result).toHaveLength(3);
      expect(result[0].date).toBe('2026-01-20');
      expect(result[1].date).toBe('2026-01-15');
      expect(result[2].date).toBe('2026-01-10');
      expect(mockCollection).toHaveBeenCalledWith(expect.anything(), 'users', UID, 'dailyLogs');
    });

    it('returns empty array when no logs', async () => {
      mockGetDocs.mockResolvedValue(createQuerySnap([]));
      const result = await firestoreService.getDailyLogs(UID);
      expect(result).toEqual([]);
    });

    it('handles sorting when some log dates are invalid or missing', async () => {
      const logs = [
        { date: 'invalid', workoutCompleted: true },
        { date: '2026-01-10', workoutCompleted: false },
        { date: '', workoutCompleted: true },
      ];
      mockGetDocs.mockResolvedValue(createQuerySnap(
        logs.map(l => createDocSnap(true, l))
      ));
      const result = await firestoreService.getDailyLogs(UID);
      expect(result).toHaveLength(3);
    });

    it('throws when uid is empty string', async () => {
      await expect(firestoreService.getDailyLogs('')).rejects.toThrow('UID is required to fetch daily logs');
    });

    it('throws when uid is null', async () => {
      await expect(firestoreService.getDailyLogs(null as unknown as string)).rejects.toThrow('UID is required to fetch daily logs');
    });

    it('throws when uid is undefined', async () => {
      await expect(firestoreService.getDailyLogs(undefined as unknown as string)).rejects.toThrow('UID is required to fetch daily logs');
    });

    it('propagates Firestore errors', async () => {
      const error = new Error('Daily log fetch error');
      mockGetDocs.mockRejectedValue(error);
      await expect(firestoreService.getDailyLogs(UID)).rejects.toThrow('Daily log fetch error');
    });
  });

  // ==========================================
  // saveDailyLog
  // ==========================================
  describe('saveDailyLog', () => {
    it('sanitizes date for document key and saves cleaned log with updatedAt', async () => {
      mockSetDoc.mockResolvedValue(undefined);
      const log = { date: 'Mon Jan 15 2026 / 10:00 AM', workoutCompleted: true, waterIntake: 250, sleepHours: 8, mood: 'Good' as const };
      await firestoreService.saveDailyLog(UID, log);
      expect(mockDoc).toHaveBeenCalledWith(
        expect.anything(), 'users', UID, 'dailyLogs', 'Mon_Jan_15_2026___10_00_AM'
      );
      expect(mockSetDoc).toHaveBeenCalledTimes(1);
      const saved = mockSetDoc.mock.calls[0][1];
      expect(saved.date).toBe(log.date);
      expect(saved.updatedAt).toBeDefined();
    });

    it('throws when uid is empty string', async () => {
      await expect(firestoreService.saveDailyLog('', { date: '2026-01-15' } as any)).rejects.toThrow('UID is required to save daily log');
    });

    it('throws when uid is null', async () => {
      await expect(firestoreService.saveDailyLog(null as unknown as string, { date: '2026-01-15' } as any)).rejects.toThrow('UID is required to save daily log');
    });

    it('throws when uid is undefined', async () => {
      await expect(firestoreService.saveDailyLog(undefined as unknown as string, { date: '2026-01-15' } as any)).rejects.toThrow('UID is required to save daily log');
    });

    it('throws when log is null/undefined or missing date', async () => {
      await expect(firestoreService.saveDailyLog(UID, null as unknown as any)).rejects.toThrow();
      await expect(firestoreService.saveDailyLog(UID, undefined as unknown as any)).rejects.toThrow();
      await expect(firestoreService.saveDailyLog(UID, { mood: 'Good' } as any)).rejects.toThrow();
    });

    it('propagates Firestore errors', async () => {
      const error = new Error('Daily log save failed');
      mockSetDoc.mockRejectedValue(error);
      const log = { date: '2026-01-15', workoutCompleted: true, waterIntake: 250, sleepHours: 8, mood: 'Good' as const };
      await expect(firestoreService.saveDailyLog(UID, log)).rejects.toThrow('Daily log save failed');
    });
  });

  // ==========================================
  // getNutritionEntries
  // ==========================================
  describe('getNutritionEntries', () => {
    it('returns entries sorted by timestamp/date descending', async () => {
      const entries = [
        { id: '1', date: '2026-01-15', timestamp: 1000 },
        { id: '2', date: '2026-01-10', timestamp: 500 },
        { id: '3', date: '2026-01-20', timestamp: 2000 },
      ];
      mockGetDocs.mockResolvedValue(createQuerySnap(
        entries.map(e => createDocSnap(true, e))
      ));
      const result = await firestoreService.getNutritionEntries(UID);
      expect(result).toHaveLength(3);
      expect(result[0].timestamp).toBe(2000);
      expect(result[1].timestamp).toBe(1000);
      expect(result[2].timestamp).toBe(500);
      expect(mockCollection).toHaveBeenCalledWith(expect.anything(), 'users', UID, 'nutritionLogs');
    });

    it('sorts based on parsed date when timestamp is missing', async () => {
      const entries = [
        { id: '1', date: '2026-01-15' },
        { id: '2', date: '2026-01-10' },
        { id: '3', date: '2026-01-20' },
      ];
      mockGetDocs.mockResolvedValue(createQuerySnap(
        entries.map(e => createDocSnap(true, e))
      ));
      const result = await firestoreService.getNutritionEntries(UID);
      expect(result[0].date).toBe('2026-01-20');
      expect(result[1].date).toBe('2026-01-15');
      expect(result[2].date).toBe('2026-01-10');
    });

    it('falls back to 0 for sorting when both date and timestamp are invalid/missing', async () => {
      const entries = [
        { id: '1', date: 'invalid', timestamp: undefined },
        { id: '2', date: '2026-01-15', timestamp: undefined },
      ];
      mockGetDocs.mockResolvedValue(createQuerySnap(
        entries.map(e => createDocSnap(true, e))
      ));
      const result = await firestoreService.getNutritionEntries(UID);
      expect(result).toHaveLength(2);
    });

    it('returns empty array when no entries', async () => {
      mockGetDocs.mockResolvedValue(createQuerySnap([]));
      const result = await firestoreService.getNutritionEntries(UID);
      expect(result).toEqual([]);
    });

    it('throws when uid is empty string', async () => {
      await expect(firestoreService.getNutritionEntries('')).rejects.toThrow('UID is required to fetch nutrition entries');
    });

    it('throws when uid is null', async () => {
      await expect(firestoreService.getNutritionEntries(null as unknown as string)).rejects.toThrow('UID is required to fetch nutrition entries');
    });

    it('throws when uid is undefined', async () => {
      await expect(firestoreService.getNutritionEntries(undefined as unknown as string)).rejects.toThrow('UID is required to fetch nutrition entries');
    });

    it('propagates Firestore errors', async () => {
      const error = new Error('Nutrition read error');
      mockGetDocs.mockRejectedValue(error);
      await expect(firestoreService.getNutritionEntries(UID)).rejects.toThrow('Nutrition read error');
    });
  });

  // ==========================================
  // saveNutritionEntry
  // ==========================================
  describe('saveNutritionEntry', () => {
    it('normalizes missing meal, food, name, and date from timestamp', async () => {
      mockSetDoc.mockResolvedValue(undefined);
      const entry = { id: 'n1', name: 'Eggs', calories: 150, protein: 12, carbs: 1, fats: 10, timestamp: 1770000000000 };
      await firestoreService.saveNutritionEntry(UID, entry);
      expect(mockSetDoc).toHaveBeenCalledTimes(1);
      const saved = mockSetDoc.mock.calls[0][1];
      expect(saved.meal).toBe('Eggs');
      expect(saved.food).toBe('Eggs');
      expect(saved.date).toBe(new Date(1770000000000).toISOString().split('T')[0]);
      expect(saved.updatedAt).toBeDefined();
    });

    it('derives meal from name and food when meal missing', async () => {
      mockSetDoc.mockResolvedValue(undefined);
      const entry = { id: 'n2', name: 'Salad', food: 'Veggie Salad', calories: 100 };
      await firestoreService.saveNutritionEntry(UID, entry);
      const saved = mockSetDoc.mock.calls[0][1];
      expect(saved.meal).toBe('Salad');
    });

    it('derives name from meal when name missing', async () => {
      mockSetDoc.mockResolvedValue(undefined);
      const entry = { id: 'n3', meal: 'Oatmeal', calories: 250 };
      await firestoreService.saveNutritionEntry(UID, entry);
      const saved = mockSetDoc.mock.calls[0][1];
      expect(saved.name).toBe('Oatmeal');
    });

    it('throws when uid is empty string', async () => {
      await expect(firestoreService.saveNutritionEntry('', { id: 'n1' })).rejects.toThrow('UID is required to save nutrition entry');
    });

    it('throws when uid is null', async () => {
      await expect(firestoreService.saveNutritionEntry(null as unknown as string, { id: 'n1' })).rejects.toThrow('UID is required to save nutrition entry');
    });

    it('throws when uid is undefined', async () => {
      await expect(firestoreService.saveNutritionEntry(undefined as unknown as string, { id: 'n1' })).rejects.toThrow('UID is required to save nutrition entry');
    });

    it('throws when entry is null/undefined or missing id', async () => {
      await expect(firestoreService.saveNutritionEntry(UID, null as unknown as any)).rejects.toThrow();
      await expect(firestoreService.saveNutritionEntry(UID, undefined as unknown as any)).rejects.toThrow();
      await expect(firestoreService.saveNutritionEntry(UID, { meal: 'Eggs' })).rejects.toThrow();
    });

    it('propagates Firestore errors', async () => {
      const error = new Error('Nutrition save error');
      mockSetDoc.mockRejectedValue(error);
      const entry = { id: 'n1', meal: 'Eggs', food: 'Eggs', calories: 100 };
      await expect(firestoreService.saveNutritionEntry(UID, entry)).rejects.toThrow('Nutrition save error');
    });
  });

  // ==========================================
  // deleteNutritionEntry
  // ==========================================
  describe('deleteNutritionEntry', () => {
    it('deletes nutrition entry successfully', async () => {
      mockDeleteDoc.mockResolvedValue(undefined);
      await firestoreService.deleteNutritionEntry(UID, 'n1');
      expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users', UID, 'nutritionLogs', 'n1');
    });

    it('throws when uid is empty string', async () => {
      await expect(firestoreService.deleteNutritionEntry('', 'n1')).rejects.toThrow('UID is required to delete nutrition entry');
    });

    it('throws when uid is null', async () => {
      await expect(firestoreService.deleteNutritionEntry(null as unknown as string, 'n1')).rejects.toThrow('UID is required to delete nutrition entry');
    });

    it('throws when uid is undefined', async () => {
      await expect(firestoreService.deleteNutritionEntry(undefined as unknown as string, 'n1')).rejects.toThrow('UID is required to delete nutrition entry');
    });

    it('throws when entryId is empty string', async () => {
      await expect(firestoreService.deleteNutritionEntry(UID, '')).rejects.toThrow();
    });

    it('throws when entryId is null/undefined', async () => {
      await expect(firestoreService.deleteNutritionEntry(UID, null as unknown as string)).rejects.toThrow();
      await expect(firestoreService.deleteNutritionEntry(UID, undefined as unknown as string)).rejects.toThrow();
    });

    it('propagates Firestore errors', async () => {
      const error = new Error('Nutrition delete error');
      mockDeleteDoc.mockRejectedValue(error);
      await expect(firestoreService.deleteNutritionEntry(UID, 'n1')).rejects.toThrow('Nutrition delete error');
    });
  });

  // ==========================================
  // getNotes
  // ==========================================
  describe('getNotes', () => {
    it('excludes coach_notepad doc and returns notes sorted by timestamp descending', async () => {
      const notes = [
        { id: 'note1', title: 'My Note', content: 'Test', type: 'workout', date: '2026-01-15', timestamp: 100 },
        { id: 'coach_notepad', title: 'Coach Notepad', content: 'Secret', type: 'workout', date: '2026-01-15', timestamp: 200 },
        { id: 'note2', title: 'Another Note', content: 'Test2', type: 'diet', date: '2026-01-14', timestamp: 300 },
      ];
      mockGetDocs.mockResolvedValue(createQuerySnap(
        notes.map(n => ({ ...createDocSnap(true, n), id: n.id }))
      ));
      const result = await firestoreService.getNotes(UID);
      expect(result).toHaveLength(2);
      expect(result.find(n => n.id === 'coach_notepad')).toBeUndefined();
      expect(result[0].id).toBe('note2'); // timestamp 300
      expect(result[1].id).toBe('note1'); // timestamp 100
      expect(mockCollection).toHaveBeenCalledWith(expect.anything(), 'users', UID, 'notes');
    });

    it('returns empty array when no notes exist', async () => {
      mockGetDocs.mockResolvedValue(createQuerySnap([]));
      const result = await firestoreService.getNotes(UID);
      expect(result).toEqual([]);
    });

    it('handles sorting when some notes have identical or missing timestamps', async () => {
      const notes = [
        { id: 'note1', title: 'Note 1', timestamp: 100 },
        { id: 'note2', title: 'Note 2', timestamp: 100 },
      ];
      mockGetDocs.mockResolvedValue(createQuerySnap(
        notes.map(n => ({ ...createDocSnap(true, n), id: n.id }))
      ));
      const result = await firestoreService.getNotes(UID);
      expect(result).toHaveLength(2);
    });

    it('throws when uid is empty string', async () => {
      await expect(firestoreService.getNotes('')).rejects.toThrow('UID is required to fetch notes');
    });

    it('throws when uid is null', async () => {
      await expect(firestoreService.getNotes(null as unknown as string)).rejects.toThrow('UID is required to fetch notes');
    });

    it('throws when uid is undefined', async () => {
      await expect(firestoreService.getNotes(undefined as unknown as string)).rejects.toThrow('UID is required to fetch notes');
    });

    it('propagates Firestore errors', async () => {
      const error = new Error('Notes read error');
      mockGetDocs.mockRejectedValue(error);
      await expect(firestoreService.getNotes(UID)).rejects.toThrow('Notes read error');
    });
  });

  // ==========================================
  // saveNote
  // ==========================================
  describe('saveNote', () => {
    it('saves note with cleaned data and adds updatedAt', async () => {
      mockSetDoc.mockResolvedValue(undefined);
      const note = { id: 'note1', title: 'Test Note', content: 'Hello', type: 'workout' as const, date: '2026-01-15', timestamp: 100, undefinedField: undefined };
      await firestoreService.saveNote(UID, note);
      expect(mockSetDoc).toHaveBeenCalledTimes(1);
      const saved = mockSetDoc.mock.calls[0][1];
      expect(saved.title).toBe('Test Note');
      expect(saved.undefinedField).toBeUndefined();
      expect(Object.prototype.hasOwnProperty.call(saved, 'undefinedField')).toBe(false);
      expect(saved.updatedAt).toBeDefined();
      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users', UID, 'notes', 'note1');
    });

    it('throws when uid is empty string', async () => {
      await expect(firestoreService.saveNote('', { id: 'note1' } as any)).rejects.toThrow('UID is required to save note');
    });

    it('throws when uid is null', async () => {
      await expect(firestoreService.saveNote(null as unknown as string, { id: 'note1' } as any)).rejects.toThrow('UID is required to save note');
    });

    it('throws when uid is undefined', async () => {
      await expect(firestoreService.saveNote(undefined as unknown as string, { id: 'note1' } as any)).rejects.toThrow('UID is required to save note');
    });

    it('throws when note is null/undefined or missing id', async () => {
      await expect(firestoreService.saveNote(UID, null as unknown as any)).rejects.toThrow();
      await expect(firestoreService.saveNote(UID, undefined as unknown as any)).rejects.toThrow();
      await expect(firestoreService.saveNote(UID, { title: 'Note' } as any)).rejects.toThrow();
    });

    it('propagates Firestore errors', async () => {
      const error = new Error('Note save error');
      mockSetDoc.mockRejectedValue(error);
      const note = { id: 'note1', title: 'Note', content: 'Content', type: 'workout' as const, date: '2026', timestamp: 100 };
      await expect(firestoreService.saveNote(UID, note)).rejects.toThrow('Note save error');
    });
  });

  // ==========================================
  // deleteNote
  // ==========================================
  describe('deleteNote', () => {
    it('deletes note successfully', async () => {
      mockDeleteDoc.mockResolvedValue(undefined);
      await firestoreService.deleteNote(UID, 'note1');
      expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users', UID, 'notes', 'note1');
    });

    it('throws when uid is empty string', async () => {
      await expect(firestoreService.deleteNote('', 'n1')).rejects.toThrow('UID is required to delete note');
    });

    it('throws when uid is null', async () => {
      await expect(firestoreService.deleteNote(null as unknown as string, 'n1')).rejects.toThrow('UID is required to delete note');
    });

    it('throws when uid is undefined', async () => {
      await expect(firestoreService.deleteNote(undefined as unknown as string, 'n1')).rejects.toThrow('UID is required to delete note');
    });

    it('throws when noteId is empty string', async () => {
      await expect(firestoreService.deleteNote(UID, '')).rejects.toThrow();
    });

    it('throws when noteId is null/undefined', async () => {
      await expect(firestoreService.deleteNote(UID, null as unknown as string)).rejects.toThrow();
      await expect(firestoreService.deleteNote(UID, undefined as unknown as string)).rejects.toThrow();
    });

    it('propagates Firestore errors', async () => {
      const error = new Error('Note delete error');
      mockDeleteDoc.mockRejectedValue(error);
      await expect(firestoreService.deleteNote(UID, 'note1')).rejects.toThrow('Note delete error');
    });
  });

  // ==========================================
  // getCoachNotepad
  // ==========================================
  describe('getCoachNotepad', () => {
    it('returns content when doc exists', async () => {
      mockGetDoc.mockResolvedValue(createDocSnap(true, { content: 'Coach notes here' }));
      const result = await firestoreService.getCoachNotepad(UID);
      expect(result).toBe('Coach notes here');
      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users', UID, 'notes', 'coach_notepad');
    });

    it('returns empty string when doc does not exist', async () => {
      mockGetDoc.mockResolvedValue(createDocSnap(false));
      const result = await firestoreService.getCoachNotepad(UID);
      expect(result).toBe('');
    });

    it('returns empty string when content field is missing or undefined', async () => {
      mockGetDoc.mockResolvedValue(createDocSnap(true, {}));
      const result = await firestoreService.getCoachNotepad(UID);
      expect(result).toBe('');
    });

    it('throws when uid is empty string', async () => {
      await expect(firestoreService.getCoachNotepad('')).rejects.toThrow('UID is required to fetch coach notepad');
    });

    it('throws when uid is null', async () => {
      await expect(firestoreService.getCoachNotepad(null as unknown as string)).rejects.toThrow('UID is required to fetch coach notepad');
    });

    it('throws when uid is undefined', async () => {
      await expect(firestoreService.getCoachNotepad(undefined as unknown as string)).rejects.toThrow('UID is required to fetch coach notepad');
    });

    it('propagates Firestore errors', async () => {
      const error = new Error('Notepad fetch error');
      mockGetDoc.mockRejectedValue(error);
      await expect(firestoreService.getCoachNotepad(UID)).rejects.toThrow('Notepad fetch error');
    });
  });

  // ==========================================
  // saveCoachNotepad
  // ==========================================
  describe('saveCoachNotepad', () => {
    it('saves notepad with correct structure', async () => {
      mockSetDoc.mockResolvedValue(undefined);
      await firestoreService.saveCoachNotepad(UID, 'New coach notes');
      expect(mockSetDoc).toHaveBeenCalledTimes(1);
      const saved = mockSetDoc.mock.calls[0][1];
      expect(saved.id).toBe('coach_notepad');
      expect(saved.content).toBe('New coach notes');
      expect(saved.type).toBe('workout');
      expect(saved.source).toBe('coach_notepad');
      expect(saved.timestamp).toBeDefined();
      expect(saved.updatedAt).toBeDefined();
      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users', UID, 'notes', 'coach_notepad');
    });

    it('handles empty notepad content saving', async () => {
      mockSetDoc.mockResolvedValue(undefined);
      await firestoreService.saveCoachNotepad(UID, '');
      const saved = mockSetDoc.mock.calls[0][1];
      expect(saved.content).toBe('');
    });

    it('throws when uid is empty string', async () => {
      await expect(firestoreService.saveCoachNotepad('', 'Content')).rejects.toThrow('UID is required to save coach notepad');
    });

    it('throws when uid is null', async () => {
      await expect(firestoreService.saveCoachNotepad(null as unknown as string, 'Content')).rejects.toThrow('UID is required to save coach notepad');
    });

    it('throws when uid is undefined', async () => {
      await expect(firestoreService.saveCoachNotepad(undefined as unknown as string, 'Content')).rejects.toThrow('UID is required to save coach notepad');
    });

    it('propagates Firestore errors', async () => {
      const error = new Error('Notepad save error');
      mockSetDoc.mockRejectedValue(error);
      await expect(firestoreService.saveCoachNotepad(UID, 'New coach notes')).rejects.toThrow('Notepad save error');
    });
  });

  // ==========================================
  // getProgressEntries
  // ==========================================
  describe('getProgressEntries', () => {
    it('returns entries sorted by date descending', async () => {
      const entries = [
        { id: 'p1', date: '2026-01-15', weight: 80 },
        { id: 'p2', date: '2026-01-10', weight: 82 },
        { id: 'p3', date: '2026-01-20', weight: 79 },
      ];
      mockGetDocs.mockResolvedValue(createQuerySnap(
        entries.map(e => createDocSnap(true, e))
      ));
      const result = await firestoreService.getProgressEntries(UID);
      expect(result).toHaveLength(3);
      expect(result[0].weight).toBe(79); // 2026-01-20
      expect(result[1].weight).toBe(80); // 2026-01-15
      expect(result[2].weight).toBe(82); // 2026-01-10
      expect(mockCollection).toHaveBeenCalledWith(expect.anything(), 'users', UID, 'progress');
    });

    it('returns empty array when no progress entries', async () => {
      mockGetDocs.mockResolvedValue(createQuerySnap([]));
      const result = await firestoreService.getProgressEntries(UID);
      expect(result).toEqual([]);
    });

    it('handles sorting when some dates are invalid or missing', async () => {
      const entries = [
        { id: 'p1', date: 'invalid' },
        { id: 'p2', date: '2026-01-10' },
      ];
      mockGetDocs.mockResolvedValue(createQuerySnap(
        entries.map(e => createDocSnap(true, e))
      ));
      const result = await firestoreService.getProgressEntries(UID);
      expect(result).toHaveLength(2);
    });

    it('throws when uid is empty string', async () => {
      await expect(firestoreService.getProgressEntries('')).rejects.toThrow('UID is required to fetch progress entries');
    });

    it('throws when uid is null', async () => {
      await expect(firestoreService.getProgressEntries(null as unknown as string)).rejects.toThrow('UID is required to fetch progress entries');
    });

    it('throws when uid is undefined', async () => {
      await expect(firestoreService.getProgressEntries(undefined as unknown as string)).rejects.toThrow('UID is required to fetch progress entries');
    });

    it('propagates Firestore errors', async () => {
      const error = new Error('Progress fetch error');
      mockGetDocs.mockRejectedValue(error);
      await expect(firestoreService.getProgressEntries(UID)).rejects.toThrow('Progress fetch error');
    });
  });

  // ==========================================
  // saveProgressEntry
  // ==========================================
  describe('saveProgressEntry', () => {
    it('saves entry, sets createdAt if missing, and adds updatedAt', async () => {
      mockSetDoc.mockResolvedValue(undefined);
      const entry = { id: 'p1', date: '2026-01-15', weight: 80, undefinedField: undefined };
      await firestoreService.saveProgressEntry(UID, entry as any);
      expect(mockSetDoc).toHaveBeenCalledTimes(1);
      const saved = mockSetDoc.mock.calls[0][1];
      expect(saved.createdAt).toBeDefined();
      expect(saved.updatedAt).toBeDefined();
      expect(saved.undefinedField).toBeUndefined();
      expect(Object.prototype.hasOwnProperty.call(saved, 'undefinedField')).toBe(false);
      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users', UID, 'progress', 'p1');
    });

    it('preserves existing createdAt', async () => {
      mockSetDoc.mockResolvedValue(undefined);
      const entry = { id: 'p1', date: '2026-01-15', weight: 80, createdAt: '2026-01-01T00:00:00.000Z' };
      await firestoreService.saveProgressEntry(UID, entry as any);
      const saved = mockSetDoc.mock.calls[0][1];
      expect(saved.createdAt).toBe('2026-01-01T00:00:00.000Z');
      expect(saved.updatedAt).toBeDefined();
    });

    it('throws when uid is empty string', async () => {
      await expect(firestoreService.saveProgressEntry('', { id: 'p1' } as any)).rejects.toThrow('UID is required to save progress entry');
    });

    it('throws when uid is null', async () => {
      await expect(firestoreService.saveProgressEntry(null as unknown as string, { id: 'p1' } as any)).rejects.toThrow('UID is required to save progress entry');
    });

    it('throws when uid is undefined', async () => {
      await expect(firestoreService.saveProgressEntry(undefined as unknown as string, { id: 'p1' } as any)).rejects.toThrow('UID is required to save progress entry');
    });

    it('throws when entry is null/undefined or missing id', async () => {
      await expect(firestoreService.saveProgressEntry(UID, null as unknown as any)).rejects.toThrow();
      await expect(firestoreService.saveProgressEntry(UID, undefined as unknown as any)).rejects.toThrow();
      await expect(firestoreService.saveProgressEntry(UID, { date: '2026' } as any)).rejects.toThrow();
    });

    it('propagates Firestore errors', async () => {
      const error = new Error('Progress save error');
      mockSetDoc.mockRejectedValue(error);
      const entry = { id: 'p1', date: '2026-01-15', weight: 80 };
      await expect(firestoreService.saveProgressEntry(UID, entry as any)).rejects.toThrow('Progress save error');
    });
  });

  // ==========================================
  // deleteProgressEntry
  // ==========================================
  describe('deleteProgressEntry', () => {
    it('deletes progress entry successfully', async () => {
      mockDeleteDoc.mockResolvedValue(undefined);
      await firestoreService.deleteProgressEntry(UID, 'p1');
      expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users', UID, 'progress', 'p1');
    });

    it('throws when uid is empty string', async () => {
      await expect(firestoreService.deleteProgressEntry('', 'p1')).rejects.toThrow('UID is required to delete progress entry');
    });

    it('throws when uid is null', async () => {
      await expect(firestoreService.deleteProgressEntry(null as unknown as string, 'p1')).rejects.toThrow('UID is required to delete progress entry');
    });

    it('throws when uid is undefined', async () => {
      await expect(firestoreService.deleteProgressEntry(undefined as unknown as string, 'p1')).rejects.toThrow('UID is required to delete progress entry');
    });

    it('throws when entryId is empty string', async () => {
      await expect(firestoreService.deleteProgressEntry(UID, '')).rejects.toThrow();
    });

    it('throws when entryId is null/undefined', async () => {
      await expect(firestoreService.deleteProgressEntry(UID, null as unknown as string)).rejects.toThrow();
      await expect(firestoreService.deleteProgressEntry(UID, undefined as unknown as string)).rejects.toThrow();
    });

    it('propagates Firestore errors', async () => {
      const error = new Error('Progress delete error');
      mockDeleteDoc.mockRejectedValue(error);
      await expect(firestoreService.deleteProgressEntry(UID, 'p1')).rejects.toThrow('Progress delete error');
    });
  });

  // ==========================================
  // getAchievements
  // ==========================================
  describe('getAchievements', () => {
    it('returns achievements successfully', async () => {
      const badges = [
        { id: 'b1', title: 'First Blood', unlocked: true, progress: 1, target: 1, category: 'Workout', description: '' },
      ];
      mockGetDocs.mockResolvedValue(createQuerySnap(
        badges.map(b => createDocSnap(true, b))
      ));
      const result = await firestoreService.getAchievements(UID);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('b1');
      expect(mockCollection).toHaveBeenCalledWith(expect.anything(), 'users', UID, 'achievements');
    });

    it('returns empty array when no badges', async () => {
      mockGetDocs.mockResolvedValue(createQuerySnap([]));
      const result = await firestoreService.getAchievements(UID);
      expect(result).toEqual([]);
    });

    it('throws when uid is empty string', async () => {
      await expect(firestoreService.getAchievements('')).rejects.toThrow('UID is required to fetch achievements');
    });

    it('throws when uid is null', async () => {
      await expect(firestoreService.getAchievements(null as unknown as string)).rejects.toThrow('UID is required to fetch achievements');
    });

    it('throws when uid is undefined', async () => {
      await expect(firestoreService.getAchievements(undefined as unknown as string)).rejects.toThrow('UID is required to fetch achievements');
    });

    it('propagates Firestore errors', async () => {
      const error = new Error('Achievements fetch error');
      mockGetDocs.mockRejectedValue(error);
      await expect(firestoreService.getAchievements(UID)).rejects.toThrow('Achievements fetch error');
    });
  });

  // ==========================================
  // saveAchievement
  // ==========================================
  describe('saveAchievement', () => {
    it('saves achievement badge successfully with cleaned data', async () => {
      mockSetDoc.mockResolvedValue(undefined);
      const badge: AchievementBadge = { id: 'b1', title: 'First Blood', unlocked: true, progress: 1, target: 1, category: 'Workout', description: '' };
      await firestoreService.saveAchievement(UID, badge);
      expect(mockSetDoc).toHaveBeenCalledTimes(1);
      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users', UID, 'achievements', 'b1');
    });

    it('throws when uid is empty string', async () => {
      await expect(firestoreService.saveAchievement('', { id: 'b1' } as any)).rejects.toThrow('UID is required to save achievement');
    });

    it('throws when uid is null', async () => {
      await expect(firestoreService.saveAchievement(null as unknown as string, { id: 'b1' } as any)).rejects.toThrow('UID is required to save achievement');
    });

    it('throws when uid is undefined', async () => {
      await expect(firestoreService.saveAchievement(undefined as unknown as string, { id: 'b1' } as any)).rejects.toThrow('UID is required to save achievement');
    });

    it('throws when badge is null/undefined or missing id', async () => {
      await expect(firestoreService.saveAchievement(UID, null as unknown as any)).rejects.toThrow();
      await expect(firestoreService.saveAchievement(UID, undefined as unknown as any)).rejects.toThrow();
      await expect(firestoreService.saveAchievement(UID, { title: 'First Blood' } as any)).rejects.toThrow();
    });

    it('propagates Firestore errors', async () => {
      const error = new Error('Achievement save error');
      mockSetDoc.mockRejectedValue(error);
      const badge = { id: 'b1', title: 'First Blood', unlocked: true, progress: 1, target: 1, category: 'Workout', description: '' };
      await expect(firestoreService.saveAchievement(UID, badge)).rejects.toThrow('Achievement save error');
    });
  });
});
