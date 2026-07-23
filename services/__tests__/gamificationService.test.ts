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

import { gamificationService } from '../gamificationService';

const UID = 'test-uid';

function mockSnap(exists: boolean, data: any = null) {
  return { exists: () => exists, data: () => data };
}

function mockQuerySnap(docs: any[] = []) {
  return { forEach(cb: (d: any) => void) { docs.forEach(d => cb(mockSnap(true, d))); } };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('gamificationService.updateGamificationData', () => {
  it('throws without uid', async () => {
    await expect(gamificationService.updateGamificationData('')).rejects.toThrow('UID is required');
  });

  it('calculates streaks from daily logs', async () => {
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000);

    mockGetDocs.mockImplementation((ref: any) => {
      const path = mockCollection.mock.calls.map(c => c.join('/')).join('/') || '';
      if (mockCollection.mock.calls.length > 0) {
        const lastCall = mockCollection.mock.calls[mockCollection.mock.calls.length - 1];
        const colPath = lastCall.join('/');
        if (colPath.includes('dailyLogs')) {
          return Promise.resolve(mockQuerySnap([
            { date: today.toDateString(), workoutCompleted: true, waterIntake: 2000, sleepHours: 8, mood: 'Good' },
            { date: yesterday.toDateString(), workoutCompleted: true, waterIntake: 1500, sleepHours: 7, mood: 'Good' },
            { date: twoDaysAgo.toDateString(), workoutCompleted: true, waterIntake: 1800, sleepHours: 6, mood: 'Average' },
          ]));
        }
        if (colPath.includes('workoutSessions')) {
          return Promise.resolve(mockQuerySnap([]));
        }
        if (colPath.includes('nutritionLogs')) {
          return Promise.resolve(mockQuerySnap([]));
        }
        if (colPath.includes('progress')) {
          return Promise.resolve(mockQuerySnap([]));
        }
        if (colPath.includes('achievements')) {
          return Promise.resolve(mockQuerySnap([]));
        }
      }
      return Promise.resolve(mockQuerySnap([]));
    });

    mockUpdateDoc.mockResolvedValue(undefined);

    const result = await gamificationService.updateGamificationData(UID);

    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
  });

  it('handles todays workout missing but yesterday present', async () => {
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);

    mockGetDocs.mockImplementation(() => {
      const lastCall = mockCollection.mock.calls[mockCollection.mock.calls.length - 1];
      const path = lastCall.join('/');
      if (path.includes('dailyLogs')) {
        return Promise.resolve(mockQuerySnap([
          { date: yesterday.toDateString(), workoutCompleted: true, waterIntake: 2000, sleepHours: 8, mood: 'Good' },
        ]));
      }
      return Promise.resolve(mockQuerySnap([]));
    });
    mockUpdateDoc.mockResolvedValue(undefined);

    const result = await gamificationService.updateGamificationData(UID);
    expect(result.currentStreak).toBe(1);
  });

  it('handles no workout logs at all', async () => {
    mockGetDocs.mockImplementation(() => Promise.resolve(mockQuerySnap([])));
    mockUpdateDoc.mockResolvedValue(undefined);

    const result = await gamificationService.updateGamificationData(UID);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
    expect(result.xp).toBe(0);
    expect(result.level).toBe(1);
  });

  it('calculates XP correctly', async () => {
    mockGetDocs.mockImplementation(() => {
      const lastCall = mockCollection.mock.calls[mockCollection.mock.calls.length - 1];
      const path = lastCall.join('/');
      if (path.includes('dailyLogs')) {
        return Promise.resolve(mockQuerySnap([
          { date: '2026-01-15', workoutCompleted: true, waterIntake: 2000, sleepHours: 8, mood: 'Good' },
        ]));
      }
      if (path.includes('workoutSessions')) {
        return Promise.resolve(mockQuerySnap([
          { id: '1', date: '2026-01-15', dayName: 'Push', exercises: [], duration: 45 },
          { id: '2', date: '2026-01-14', dayName: 'Pull', exercises: [], duration: 50 },
        ]));
      }
      if (path.includes('nutritionLogs')) {
        return Promise.resolve(mockQuerySnap([
          { id: 'n1', date: '2026-01-15', meal: 'Breakfast', calories: 500, protein: 30, carbs: 50, fats: 20 },
        ]));
      }
      if (path.includes('progress')) {
        return Promise.resolve(mockQuerySnap([
          { id: 'p1', date: '2026-01-15', weight: 80 },
        ]));
      }
      if (path.includes('achievements')) {
        return Promise.resolve(mockQuerySnap([]));
      }
      return Promise.resolve(mockQuerySnap([]));
    });
    mockUpdateDoc.mockResolvedValue(undefined);

    const result = await gamificationService.updateGamificationData(UID);
    expect(result.xp).toBe(285);
    expect(result.level).toBe(1);
  });

  it('awards first_workout badge when sessions >= 1', async () => {
    let callCount = 0;
    mockGetDocs.mockImplementation(() => {
      callCount++;
      const lastCall = mockCollection.mock.calls[mockCollection.mock.calls.length - 1];
      const path = lastCall.join('/');
      if (path.includes('achievements')) return Promise.resolve(mockQuerySnap([]));
      if (path.includes('workoutSessions')) {
        return Promise.resolve(mockQuerySnap([
          { id: '1', date: '2026-01-15', dayName: 'Push', exercises: [], duration: 45 },
        ]));
      }
      return Promise.resolve(mockQuerySnap([]));
    });
    mockUpdateDoc.mockResolvedValue(undefined);
    mockSetDoc.mockResolvedValue(undefined);

    const result = await gamificationService.updateGamificationData(UID);
    const firstBlood = result.badges.find(b => b.id === 'first_workout');
    expect(firstBlood).toBeDefined();
    expect(firstBlood!.unlocked).toBe(true);
    expect(firstBlood!.progress).toBe(1);
  });

  it('does not award century_club when sessions < 10', async () => {
    mockGetDocs.mockImplementation(() => {
      const lastCall = mockCollection.mock.calls[mockCollection.mock.calls.length - 1];
      const path = lastCall.join('/');
      if (path.includes('achievements')) return Promise.resolve(mockQuerySnap([]));
      return Promise.resolve(mockQuerySnap([]));
    });
    mockUpdateDoc.mockResolvedValue(undefined);
    mockSetDoc.mockResolvedValue(undefined);

    const result = await gamificationService.updateGamificationData(UID);
    const centuryClub = result.badges.find(b => b.id === 'century_club');
    expect(centuryClub).toBeDefined();
    expect(centuryClub!.unlocked).toBe(false);
    expect(centuryClub!.progress).toBe(0);
  });

  it('awards consistency_3 badge when streak >= 3', async () => {
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);
    const twoDA = new Date(Date.now() - 2 * 86400000);

    mockGetDocs.mockImplementation(() => {
      const lastCall = mockCollection.mock.calls[mockCollection.mock.calls.length - 1];
      const path = lastCall.join('/');
      if (path.includes('dailyLogs')) {
        return Promise.resolve(mockQuerySnap([
          { date: today.toDateString(), workoutCompleted: true, waterIntake: 2000, sleepHours: 8, mood: 'Good' },
          { date: yesterday.toDateString(), workoutCompleted: true, waterIntake: 2000, sleepHours: 8, mood: 'Good' },
          { date: twoDA.toDateString(), workoutCompleted: true, waterIntake: 2000, sleepHours: 8, mood: 'Good' },
        ]));
      }
      if (path.includes('achievements')) return Promise.resolve(mockQuerySnap([]));
      return Promise.resolve(mockQuerySnap([]));
    });
    mockUpdateDoc.mockResolvedValue(undefined);
    mockSetDoc.mockResolvedValue(undefined);

    const result = await gamificationService.updateGamificationData(UID);
    const badge = result.badges.find(b => b.id === 'consistency_3');
    expect(badge!.unlocked).toBe(true);
  });

  it('calculates weekly challenges correctly', async () => {
    const recentDate = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
    const oldDate = new Date(Date.now() - 20 * 86400000).toISOString().split('T')[0];

    mockGetDocs.mockImplementation(() => {
      const lastCall = mockCollection.mock.calls[mockCollection.mock.calls.length - 1];
      const path = lastCall.join('/');
      if (path.includes('workoutSessions')) {
        return Promise.resolve(mockQuerySnap([
          { id: '1', date: recentDate, dayName: 'Push', exercises: [], duration: 45 },
          { id: '2', date: recentDate, dayName: 'Push', exercises: [], duration: 30 },
          { id: '3', date: recentDate, dayName: 'Push', exercises: [], duration: 60 },
        ]));
      }
      if (path.includes('nutritionLogs')) {
        return Promise.resolve(mockQuerySnap([
          { id: 'n1', date: recentDate, meal: 'B', calories: 500, protein: 30, carbs: 50, fats: 20 },
          { id: 'n2', date: recentDate, meal: 'L', calories: 600, protein: 40, carbs: 60, fats: 25 },
          { id: 'n3', date: recentDate, meal: 'D', calories: 700, protein: 50, carbs: 70, fats: 30 },
          { id: 'n4', date: oldDate, meal: 'Old', calories: 400, protein: 20, carbs: 40, fats: 15 },
        ]));
      }
      if (path.includes('achievements')) return Promise.resolve(mockQuerySnap([]));
      return Promise.resolve(mockQuerySnap([]));
    });
    mockUpdateDoc.mockResolvedValue(undefined);
    mockSetDoc.mockResolvedValue(undefined);

    const result = await gamificationService.updateGamificationData(UID);

    expect(result.weeklyChallenges).toHaveLength(2);
    const workoutChallenge = result.weeklyChallenges.find(c => c.id === 'weekly_workouts');
    expect(workoutChallenge!.progress).toBe(3);
    expect(workoutChallenge!.completed).toBe(true);
  });

  it('returns monthly milestones', async () => {
    const recentDate = new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0];

    mockGetDocs.mockImplementation(() => {
      const lastCall = mockCollection.mock.calls[mockCollection.mock.calls.length - 1];
      const path = lastCall.join('/');
      if (path.includes('workoutSessions')) {
        return Promise.resolve(mockQuerySnap(Array.from({ length: 12 }, (_, i) => ({
          id: `s${i}`, date: recentDate, dayName: 'Push', exercises: [], duration: 45,
        }))));
      }
      if (path.includes('progress')) {
        return Promise.resolve(mockQuerySnap([
          { id: 'p1', date: recentDate, weight: 80 },
          { id: 'p2', date: recentDate, weight: 79 },
        ]));
      }
      if (path.includes('achievements')) return Promise.resolve(mockQuerySnap([]));
      return Promise.resolve(mockQuerySnap([]));
    });
    mockUpdateDoc.mockResolvedValue(undefined);
    mockSetDoc.mockResolvedValue(undefined);

    const result = await gamificationService.updateGamificationData(UID);
    expect(result.monthlyMilestones).toHaveLength(2);
    const monthlyConsistency = result.monthlyMilestones.find(m => m.id === 'monthly_consistency');
    expect(monthlyConsistency!.completed).toBe(true);
    expect(monthlyConsistency!.progress).toBe(10);
  });

  it('syncs badges with existing firestore state', async () => {
    mockGetDocs.mockImplementation(() => {
      const lastCall = mockCollection.mock.calls[mockCollection.mock.calls.length - 1];
      const path = lastCall.join('/');
      if (path.includes('workoutSessions')) {
        return Promise.resolve(mockQuerySnap([
          { id: 's1', date: '2026-01-15', dayName: 'Push', exercises: [], duration: 45, fatigueLevel: 3, performanceRating: 4 },
        ]));
      }
      if (path.includes('achievements')) {
        return Promise.resolve(mockQuerySnap([
          { id: 'first_workout', title: 'First Blood', description: '', unlocked: true, unlockedAt: '2026-01-01T00:00:00Z', progress: 1, target: 1, category: 'Workout' },
        ]));
      }
      return Promise.resolve(mockQuerySnap([]));
    });
    mockUpdateDoc.mockResolvedValue(undefined);
    mockSetDoc.mockResolvedValue(undefined);

    const result = await gamificationService.updateGamificationData(UID);
    const firstBlood = result.badges.find(b => b.id === 'first_workout');
    expect(firstBlood!.unlocked).toBe(true);
    expect(firstBlood!.unlockedAt).toBe('2026-01-01T00:00:00Z');
  });
});
