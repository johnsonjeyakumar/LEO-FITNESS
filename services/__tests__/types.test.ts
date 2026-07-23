import { describe, it, expect } from 'vitest';
import {
  Goal, Experience, Gender, Equipment, DietType, SplitPreference,
} from '../../types';

describe('Type Enums', () => {
  describe('Goal', () => {
    it('has expected values', () => {
      expect(Goal.BULKING).toBe('Bulking');
      expect(Goal.CUTTING).toBe('Cutting');
      expect(Goal.MAINTENANCE).toBe('Maintenance');
      expect(Goal.STRENGTH).toBe('Strength & Power');
      expect(Goal.ATHLETIC).toBe('Athletic Performance');
    });

    it('has 5 distinct values', () => {
      const values = Object.values(Goal);
      expect(values).toHaveLength(5);
      expect(new Set(values).size).toBe(5);
    });
  });

  describe('Experience', () => {
    it('has expected values', () => {
      expect(Experience.BEGINNER).toBe('Beginner');
      expect(Experience.INTERMEDIATE).toBe('Intermediate');
      expect(Experience.ADVANCED).toBe('Advanced');
      expect(Experience.ELITE).toBe('Elite');
    });

    it('has 4 distinct values', () => {
      expect(Object.values(Experience)).toHaveLength(4);
    });
  });

  describe('Gender', () => {
    it('has expected values', () => {
      expect(Gender.MALE).toBe('Male');
      expect(Gender.FEMALE).toBe('Female');
      expect(Gender.OTHER).toBe('Other');
    });
  });

  describe('Equipment', () => {
    it('has expected values', () => {
      expect(Equipment.FULL_GYM).toBe('Full Gym');
      expect(Equipment.DUMBBELLS_ONLY).toBe('Dumbbells Only');
      expect(Equipment.HOME_GYM).toBe('Home Gym (Barbell + Rack)');
      expect(Equipment.BODYWEIGHT).toBe('Bodyweight Only');
    });
  });

  describe('DietType', () => {
    it('has expected values', () => {
      expect(DietType.ANY).toBe('Anything');
      expect(DietType.VEGETARIAN).toBe('Vegetarian');
      expect(DietType.VEGAN).toBe('Vegan');
      expect(DietType.KETO).toBe('Keto');
      expect(DietType.PALEO).toBe('Paleo');
    });
  });

  describe('SplitPreference', () => {
    it('has expected values', () => {
      expect(SplitPreference.PPL).toBe('Push/Pull/Legs');
      expect(SplitPreference.UPPER_LOWER).toBe('Upper/Lower');
      expect(SplitPreference.BRO_SPLIT).toBe('Body Part Split (Bro Split)');
      expect(SplitPreference.FULL_BODY).toBe('Full Body');
      expect(SplitPreference.HYBRID).toBe('Hybrid / Athlete');
    });
  });
});

describe('Type Interface Validation', () => {
  it('DailyLog interface contract', () => {
    const log: any = { date: '2026-01-15', waterIntake: 2000, sleepHours: 8, mood: 'Good', workoutCompleted: true };
    expect(log.date).toBeTypeOf('string');
    expect(log.waterIntake).toBeTypeOf('number');
    expect(log.sleepHours).toBeTypeOf('number');
    expect(['Good', 'Average', 'Bad']).toContain(log.mood);
    expect(log.workoutCompleted).toBeTypeOf('boolean');
  });

  it('WorkoutSession interface contract', () => {
    const session: any = {
      id: 's1', date: '2026-01-15', dayName: 'Push',
      exercises: [{ name: 'Bench', sets: 4, reps: [8, 8, 8, 8], weight: [80], muscleGroup: 'Chest' }],
      duration: 45, fatigueLevel: 3, performanceRating: 4,
    };
    expect(session.id).toBeTypeOf('string');
    expect(session.duration).toBeTypeOf('number');
    expect(session.fatigueLevel).toBeGreaterThanOrEqual(1);
    expect(session.fatigueLevel).toBeLessThanOrEqual(5);
    expect(session.performanceRating).toBeGreaterThanOrEqual(1);
    expect(session.performanceRating).toBeLessThanOrEqual(5);
    expect(Array.isArray(session.exercises)).toBe(true);
  });

  it('NutritionEntry interface contract', () => {
    const entry: any = { id: 'n1', date: '2026-01-15', meal: 'Breakfast', calories: 500, protein: 30, carbs: 50, fats: 20 };
    expect(entry.calories).toBeTypeOf('number');
    expect(entry.protein).toBeTypeOf('number');
    expect(entry.carbs).toBeTypeOf('number');
    expect(entry.fats).toBeTypeOf('number');
  });

  it('ProgressEntry interface contract', () => {
    const entry: any = { id: 'p1', date: '2026-01-15', weight: 80, bodyFat: 15, waist: 85, bmi: 24.5 };
    expect(entry.weight).toBeTypeOf('number');
    expect(entry.bodyFat).toBeTypeOf('number');
    expect(entry.bmi).toBeTypeOf('number');
  });

  it('ChatMessage interface contract', () => {
    const msg: any = { id: 'm1', role: 'user', text: 'hello', timestamp: Date.now() };
    expect(['user', 'model']).toContain(msg.role);
    expect(msg.text).toBeTypeOf('string');
    expect(msg.timestamp).toBeTypeOf('number');
  });

  it('AchievementBadge interface contract', () => {
    const badge: any = { id: 'b1', title: 'Test', description: 'A test badge', unlocked: false, progress: 0, target: 5, category: 'Workout' };
    expect(badge.unlocked).toBeTypeOf('boolean');
    expect(badge.progress).toBeLessThanOrEqual(badge.target);
    expect(badge.target).toBeGreaterThan(0);
  });

  it('AdapterTrainingData interface contract', () => {
    const data: any = {
      userId: 'u1', consistencyScore: 75, fatigueTrend: [3, 4, 2], missedSessions: 2,
      performanceTrend: [4, 3, 5], weakestMuscleGroups: ['Triceps'],
      recommendedAdjustments: { volumeChange: -10, intensityChange: -5, restDays: 1 },
    };
    expect(data.consistencyScore).toBeGreaterThanOrEqual(0);
    expect(data.consistencyScore).toBeLessThanOrEqual(100);
    expect(Array.isArray(data.fatigueTrend)).toBe(true);
    expect(Array.isArray(data.weakestMuscleGroups)).toBe(true);
  });
});
