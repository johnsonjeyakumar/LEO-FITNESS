import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Goal, Experience, Gender, Equipment, SplitPreference } from '../../types';

const mockDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();
const mockCollection = vi.fn();
const mockGetDocs = vi.fn();
const mockServerTimestamp = vi.fn(() => null);

const mockLocalStorage: Record<string, string> = {};
const mockLocalStorageObj = {
  getItem: (key: string) => mockLocalStorage[key] ?? null,
  setItem: (key: string, value: string) => { mockLocalStorage[key] = value; },
  removeItem: (key: string) => { delete mockLocalStorage[key]; },
  clear: () => { Object.keys(mockLocalStorage).forEach(k => delete mockLocalStorage[k]); },
  length: 0,
  key: (_: number) => null,
};
Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorageObj, writable: true });

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
  auth: {
    currentUser: { uid: 'test-uid' },
  },
}));

import { adaptiveTrainingService } from '../adaptiveTrainingService';

const mockProfile = {
  name: 'Test User',
  age: 28,
  gender: Gender.MALE as Gender,
  weight: 80,
  height: 180,
  experience: Experience.INTERMEDIATE as Experience,
  goal: Goal.STRENGTH as Goal,
  daysAvailable: 5,
  equipment: Equipment.FULL_GYM as Equipment,
  splitPreference: SplitPreference.PPL as SplitPreference,
  injuries: 'None',
  completedOnboarding: true,
};

function mockSnap(exists: boolean, data: any = null) {
  return { exists: () => exists, data: () => data };
}

function mockQuerySnap(docs: any[] = []) {
  return { forEach(cb: (d: any) => void) { docs.forEach(d => cb(mockSnap(true, d))); } };
}

let getDocsCallIndex = 0;

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  getDocsCallIndex = 0;
  mockGetDocs.mockImplementation(() => {
    getDocsCallIndex++;
    return Promise.resolve(mockQuerySnap([]));
  });
  mockGetDoc.mockResolvedValue(mockSnap(false));
});

describe('adaptiveTrainingService', () => {
  describe('analyzeUserData', () => {
    it('returns 0 consistency score when no logs', async () => {
      const result = await adaptiveTrainingService.analyzeUserData(mockProfile);
      expect(result.consistencyScore).toBe(0);
      expect(result.missedSessions).toBe(0);
    });

    it('calculates consistency from logged data', async () => {
      mockGetDocs.mockImplementation(() => {
        getDocsCallIndex++;
        if (getDocsCallIndex === 3) {
          return Promise.resolve(mockQuerySnap([
            { date: '2026-01-15', workoutCompleted: true, waterIntake: 2000, sleepHours: 8, mood: 'Good' },
            { date: '2026-01-14', workoutCompleted: true, waterIntake: 1500, sleepHours: 7, mood: 'Good' },
            { date: '2026-01-13', workoutCompleted: false, waterIntake: 1800, sleepHours: 6, mood: 'Average' },
          ]));
        }
        return Promise.resolve(mockQuerySnap([]));
      });
      const result = await adaptiveTrainingService.analyzeUserData(mockProfile);
      expect(result.consistencyScore).toBe(67);
    });

    it('identifies weakest muscle groups from sessions', async () => {
      mockGetDocs.mockImplementation(() => {
        getDocsCallIndex++;
        if (getDocsCallIndex === 1) {
          return Promise.resolve(mockQuerySnap([
            {
              id: 's1', date: '2026-01-15', dayName: 'Push', duration: 45,
              exercises: [
                { name: 'Bench Press', muscleGroup: 'Chest', sets: 4, reps: [8, 8, 8, 8], weight: [80, 80, 80, 80] },
                { name: 'Overhead Press', muscleGroup: 'Shoulders', sets: 3, reps: [10, 10, 10], weight: [40, 40, 40] },
                { name: 'Tricep Pushdown', muscleGroup: 'Triceps', sets: 3, reps: [12, 12, 12], weight: [20, 20, 20] },
              ],
              fatigueLevel: 3, performanceRating: 4,
            },
            {
              id: 's2', date: '2026-01-14', dayName: 'Pull', duration: 50,
              exercises: [
                { name: 'Deadlift', muscleGroup: 'Back', sets: 4, reps: [5, 5, 5, 5], weight: [120, 120, 120, 120] },
                { name: 'Pull-Up', muscleGroup: 'Back', sets: 3, reps: [10, 8, 6], weight: [0, 0, 0] },
                { name: 'BB Curl', muscleGroup: 'Biceps', sets: 3, reps: [12, 10, 8], weight: [25, 25, 25] },
              ],
              fatigueLevel: 4, performanceRating: 3,
            },
            {
              id: 's3', date: '2026-01-13', dayName: 'Legs', duration: 60,
              exercises: [
                { name: 'Squat', muscleGroup: 'Legs', sets: 4, reps: [8, 8, 8, 8], weight: [100, 100, 100, 100] },
                { name: 'RDL', muscleGroup: 'Hamstrings', sets: 3, reps: [10, 10, 10], weight: [60, 60, 60] },
                { name: 'Leg Curl', muscleGroup: 'Hamstrings', sets: 3, reps: [12, 12, 12], weight: [30, 30, 30] },
              ],
              fatigueLevel: 5, performanceRating: 5,
            },
          ]));
        }
        return Promise.resolve(mockQuerySnap([]));
      });

      const result = await adaptiveTrainingService.analyzeUserData(mockProfile);
      expect(result.weakestMuscleGroups).toHaveLength(2);
      expect(result.weakestMuscleGroups[0]).toBe('Back');
      expect(result.fatigueTrend).toEqual([3, 4, 5]);
      expect(result.performanceTrend).toEqual([4, 3, 5]);
    });

    it('generates adjustments for high fatigue', async () => {
      mockGetDocs.mockImplementation(() => {
        getDocsCallIndex++;
        if (getDocsCallIndex === 1) {
          return Promise.resolve(mockQuerySnap([
            { id: 's1', date: '2026-01-15', dayName: 'Push', exercises: [], duration: 45, fatigueLevel: 5, performanceRating: 3 },
            { id: 's2', date: '2026-01-14', dayName: 'Push', exercises: [], duration: 45, fatigueLevel: 4, performanceRating: 4 },
            { id: 's3', date: '2026-01-13', dayName: 'Push', exercises: [], duration: 45, fatigueLevel: 5, performanceRating: 2 },
          ]));
        }
        return Promise.resolve(mockQuerySnap([]));
      });

      const result = await adaptiveTrainingService.analyzeUserData(mockProfile);
      expect(result.recommendedAdjustments.volumeChange).toBe(-15);
      expect(result.recommendedAdjustments.intensityChange).toBe(-10);
      expect(result.recommendedAdjustments.restDays).toBe(1);
    });

    it('generates adjustments for low consistency', async () => {
      mockGetDocs.mockImplementation(() => {
        getDocsCallIndex++;
        if (getDocsCallIndex === 3) {
          return Promise.resolve(mockQuerySnap([
            { date: '2026-01-15', workoutCompleted: false, waterIntake: 2000, sleepHours: 8, mood: 'Good' },
            { date: '2026-01-14', workoutCompleted: true, waterIntake: 1500, sleepHours: 7, mood: 'Good' },
            { date: '2026-01-13', workoutCompleted: false, waterIntake: 1800, sleepHours: 6, mood: 'Average' },
          ]));
        }
        return Promise.resolve(mockQuerySnap([]));
      });

      const result = await adaptiveTrainingService.analyzeUserData(mockProfile);
      expect(result.consistencyScore).toBeLessThan(60);
      expect(result.recommendedAdjustments.volumeChange).toBe(-10);
      expect(result.recommendedAdjustments.intensityChange).toBe(-5);
    });
  });

  describe('generateInsightReport', () => {
    it('generates weekly report with period filtering', async () => {
      mockGetDocs.mockImplementation(() => {
        getDocsCallIndex++;
        return Promise.resolve(mockQuerySnap([
          { id: '1', date: new Date().toISOString().split('T')[0], dayName: 'Push', exercises: [{ name: 'Bench', muscleGroup: 'Chest', sets: 4, reps: [8, 8, 8, 8], weight: [80, 80, 80, 80] }], duration: 45, fatigueLevel: 3, performanceRating: 4 },
        ]));
      });

      const result = await adaptiveTrainingService.generateInsightReport('weekly');
      expect(result.period).toBe('weekly');
      expect(result.summary.totalWorkouts).toBeGreaterThanOrEqual(0);
    });

    it('calculates fitness score with all components', async () => {
      const recentDateStr = new Date().toISOString().split('T')[0];

      mockGetDocs.mockImplementation(() => {
        getDocsCallIndex++;
        if (getDocsCallIndex === 1) {
          return Promise.resolve(mockQuerySnap([
            { id: '1', date: recentDateStr, dayName: 'Push', exercises: [
              { name: 'Bench', muscleGroup: 'Chest', sets: 4, reps: [8, 8, 8, 8], weight: [80, 80, 80, 80] },
            ], duration: 45, fatigueLevel: 3, performanceRating: 4 },
          ]));
        }
        if (getDocsCallIndex === 2) {
          return Promise.resolve(mockQuerySnap([
            { id: 'n1', date: recentDateStr, meal: 'B', calories: 500, protein: 30, carbs: 50, fats: 20 },
          ]));
        }
        if (getDocsCallIndex === 3) {
          return Promise.resolve(mockQuerySnap([
            { date: recentDateStr, workoutCompleted: true, waterIntake: 2000, sleepHours: 8, mood: 'Good' },
          ]));
        }
        if (getDocsCallIndex === 4) {
          return Promise.resolve(mockQuerySnap([
            { id: 'p1', date: recentDateStr, weight: 80 },
          ]));
        }
        return Promise.resolve(mockQuerySnap([]));
      });
      mockGetDoc.mockResolvedValue(mockSnap(true, { content: '' }));

      const result = await adaptiveTrainingService.generateInsightReport('monthly');
      expect(result.summary.fitnessScore).toBeGreaterThan(0);
      expect(result.recommendations).toBeDefined();
    });

    it('handles empty data gracefully', async () => {
      const result = await adaptiveTrainingService.generateInsightReport('weekly');
      expect(result.summary.totalWorkouts).toBe(0);
      expect(result.summary.totalCalories).toBe(0);
      expect(result.summary.avgProteinIntake).toBe(0);
      expect(result.summary.bestPerformingWorkout).toBe('None');
      expect(result.summary.weakestMuscleGroup).toBe('None');
    });
  });

  describe('generateComparison', () => {
    it('compares current vs previous week', async () => {
      const result = await adaptiveTrainingService.generateComparison('week');
      expect(result.currentPeriod).toBeDefined();
      expect(result.previousPeriod).toBeDefined();
      expect(result.differences).toBeDefined();
    });

    it('calculates weight change correctly', async () => {
      const result = await adaptiveTrainingService.generateComparison('month');
      expect(typeof result.differences.weightChange).toBe('number');
    });
  });

  describe('generateProgressExport', () => {
    it('generates export with empty data', async () => {
      const result = await adaptiveTrainingService.generateProgressExport(mockProfile, 'weekly');
      expect(result.userName).toBe('Test User');
      expect(result.stats.totalWorkouts).toBe(0);
      expect(result.achievements).toEqual([]);
      expect(result.insights.length).toBe(0);
    });

    it('generates achievements based on history', async () => {
      mockGetDocs.mockImplementation(() => {
        getDocsCallIndex++;
        if (getDocsCallIndex === 1) {
          return Promise.resolve(mockQuerySnap(
            Array.from({ length: 55 }, (_, i) => ({
              id: `s${i}`, date: '2026-01-15', dayName: 'Push',
              exercises: [{ name: 'Bench', muscleGroup: 'Chest', sets: 4, reps: [8, 8, 8, 8], weight: [80, 80, 80, 80] }],
              duration: 45, fatigueLevel: 3, performanceRating: 4,
            }))
          ));
        }
        if (getDocsCallIndex === 2) {
          return Promise.reject(new Error('Fallback to localStorage'));
        }
        return Promise.resolve(mockQuerySnap([]));
      });
      localStorage.setItem('iron_ai_logs', JSON.stringify(
        Array.from({ length: 35 }, (_, i) => ({
          date: `2026-01-${String(i + 1).padStart(2, '0')}`, workoutCompleted: true, waterIntake: 2000, sleepHours: 8, mood: 'Good',
        }))
      ));

      const result = await adaptiveTrainingService.generateProgressExport(mockProfile, 'monthly');
      expect(result.achievements).toContain('50+ Workouts Completed');
      expect(result.achievements).toContain('Week Warrior');
    });

    it('generates progress insights', async () => {
      mockGetDocs.mockImplementation(() => {
        getDocsCallIndex++;
        if (getDocsCallIndex === 1) {
          return Promise.resolve(mockQuerySnap(
            Array.from({ length: 10 }, (_, i) => ({
              id: `s${i}`, date: '2026-01-15', dayName: 'Push',
              exercises: [], duration: 45, fatigueLevel: 3, performanceRating: 4,
            }))
          ));
        }
        if (getDocsCallIndex === 2) {
          return Promise.reject(new Error('Fallback to localStorage'));
        }
        return Promise.resolve(mockQuerySnap([]));
      });
      localStorage.setItem('iron_ai_logs', JSON.stringify(
        Array.from({ length: 10 }, (_, i) => ({
          date: `2026-01-${String(i + 1).padStart(2, '0')}`,
          workoutCompleted: true, waterIntake: 2000, sleepHours: 8, mood: 'Good',
        }))
      ));

      const result = await adaptiveTrainingService.generateProgressExport(mockProfile, 'all');
      expect(result.insights.length).toBeGreaterThan(0);
      expect(result.insights[0]).toContain('Completed');
    });
  });

  describe('getProgressHistory', () => {
    it('returns empty array for empty uid', async () => {
      const result = await adaptiveTrainingService.getProgressHistory('');
      expect(result).toEqual([]);
    });

    it('fetches progress entries from firestore', async () => {
      const entries = [
        { id: 'p1', date: '2026-01-15', weight: 80 },
        { id: 'p2', date: '2026-01-10', weight: 82 },
      ];
      mockGetDocs.mockResolvedValue(mockQuerySnap(entries));

      const result = await adaptiveTrainingService.getProgressHistory('some-uid');
      expect(result).toHaveLength(2);
    });

    it('returns empty array on fetch failure', async () => {
      mockGetDocs.mockRejectedValue(new Error('Network error'));
      const result = await adaptiveTrainingService.getProgressHistory('some-uid');
      expect(result).toEqual([]);
    });
  });
});
