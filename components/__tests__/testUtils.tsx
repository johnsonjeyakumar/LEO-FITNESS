import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { UserProfile, Goal, Experience, Gender, Equipment, DietType, SplitPreference, WorkoutPlan, DailyLog, NutritionEntry, ProgressEntry, Note, AchievementBadge, WeeklyChallenge, MonthlyMilestone, ChatMessage } from '../../types';

export const mockProfile: UserProfile = {
  name: 'TestUser',
  fullName: 'TestUser',
  age: 30,
  weight: 80,
  height: 180,
  gender: Gender.MALE,
  experience: Experience.INTERMEDIATE,
  daysAvailable: 4,
  goal: Goal.MAINTENANCE,
  equipment: Equipment.FULL_GYM,
  dietType: DietType.ANY,
  splitPreference: SplitPreference.PPL,
  completedOnboarding: true,
  uid: 'test-uid',
  email: 'test@example.com',
};

export const mockWorkoutPlan: WorkoutPlan = {
  splitName: 'Push/Pull/Legs',
  description: 'A balanced 3-day split',
  schedule: [
    {
      dayName: 'Day 1 - Push',
      focus: 'Chest, Shoulders, Triceps',
      exercises: [
        { name: 'Bench Press', sets: 4, reps: '8-12', rest: '90s', muscleGroup: 'Chest', notes: 'Focus on form' },
        { name: 'Overhead Press', sets: 3, reps: '10-12', rest: '60s', muscleGroup: 'Shoulders' },
      ],
    },
    {
      dayName: 'Day 2 - Pull',
      focus: 'Back, Biceps',
      exercises: [
        { name: 'Barbell Row', sets: 4, reps: '8-10', rest: '90s', muscleGroup: 'Back', imageUrl: 'https://example.com/row.jpg' },
        { name: 'Pull Ups', sets: 3, reps: '8-12', rest: '60s', muscleGroup: 'Back' },
      ],
    },
  ],
  generatedAt: Date.now(),
};

export const mockDailyLogs: DailyLog[] = [
  { date: new Date().toDateString(), waterIntake: 2000, sleepHours: 8, mood: 'Good', workoutCompleted: true },
  { date: new Date(Date.now() - 86400000).toDateString(), waterIntake: 1500, sleepHours: 7, mood: 'Average', workoutCompleted: false },
];

export const mockNutritionEntries: NutritionEntry[] = [
  { id: 'n1', date: new Date().toISOString().split('T')[0], name: 'Chicken Breast', meal: 'Lunch', calories: 350, protein: 40, carbs: 0, fats: 8, food: 'Chicken', timestamp: Date.now() },
  { id: 'n2', date: new Date().toISOString().split('T')[0], name: 'Rice', meal: 'Lunch', calories: 200, protein: 4, carbs: 45, fats: 1, food: 'Rice', timestamp: Date.now() - 3600000 },
];

export const mockProgressEntries: ProgressEntry[] = [
  { id: 'p1', date: '2026-07-20', weight: 80, bodyFat: 15, chest: 104, waist: 82, arms: 38, thigh: 58, shoulders: 120, bmi: 24.7, notes: 'Feeling good' },
  { id: 'p2', date: '2026-07-13', weight: 81, bodyFat: 16, chest: 103, waist: 83, arms: 37, thigh: 57, shoulders: 119, bmi: 25.0 },
];

export const mockNotes: Note[] = [
  { id: 'note1', title: 'Great Push Day', content: 'Felt strong on bench press', type: 'workout', date: '7/20/2026', timestamp: Date.now() },
  { id: 'note2', title: 'Meal Prep', content: 'Prepped chicken and rice', type: 'diet', date: '7/19/2026', timestamp: Date.now() - 86400000 },
];

export const mockBadges: AchievementBadge[] = [
  { id: 'b1', title: 'First Workout', description: 'Complete your first workout', unlocked: true, unlockedAt: '2026-07-01T00:00:00Z', progress: 1, target: 1, category: 'Workout' },
  { id: 'b2', title: 'Streak Master', description: '7 day streak', unlocked: false, progress: 5, target: 7, category: 'Streak' },
  { id: 'b3', title: 'Nutrition Pro', description: 'Log 30 meals', unlocked: true, unlockedAt: '2026-07-15T00:00:00Z', progress: 30, target: 30, category: 'Nutrition' },
];

export const mockWeeklyChallenges: WeeklyChallenge[] = [
  { id: 'w1', title: '4 Workouts', description: 'Complete 4 workouts this week', progress: 3, target: 4, completed: false },
  { id: 'w2', title: 'Hit Protein Goal', description: 'Hit protein goal for 5 days', progress: 5, target: 5, completed: true },
];

export const mockMonthlyMilestones: MonthlyMilestone[] = [
  { id: 'm1', title: '20 Workouts', description: 'Complete 20 workouts this month', progress: 18, target: 20, completed: false },
];

export const mockChatMessages: ChatMessage[] = [
  { id: 'init', role: 'model', text: 'Welcome to LEO AI Coach!', timestamp: Date.now() },
  { id: 'msg1', role: 'user', text: 'What workout should I do today?', timestamp: Date.now() + 1000 },
  { id: 'msg2', role: 'model', text: 'Try a push workout focusing on chest and triceps.', timestamp: Date.now() + 2000 },
];

export const mockSessions: any[] = [
  { id: 's1', date: '2026-07-20', dayName: 'Push Day', duration: 60, exercises: [{ name: 'Bench Press', sets: 4, reps: [8, 8, 8, 8] }], fatigueLevel: 3, performanceRating: 4 },
];

export const mockInsightReport: any = {
  period: 'weekly',
  startDate: '2026-07-14',
  endDate: '2026-07-20',
  summary: {
    totalWorkouts: 4,
    totalCalories: 2400,
    avgProteinIntake: 120.5,
    consistencyScore: 75,
    bestPerformingWorkout: 'Push Day',
    weakestMuscleGroup: 'Legs',
    adherenceRate: 85,
    fitnessScore: 72,
    goalCompletion: 68,
    muscleFocus: [{ name: 'Chest', value: 40, fill: '#ff5e00' }, { name: 'Back', value: 30, fill: '#3b82f6' }],
  },
  trends: {
    weightChange: -0.5,
    strengthProgress: 5,
    consistencyTrend: 'improving' as const,
    performanceHistory: [{ name: 'Week 1', performance: 70 }, { name: 'Week 2', performance: 80 }],
  },
  recommendations: ['Increase leg volume', 'Add more protein to breakfast'],
  caloriesProteinTrend: [{ date: 'Mon', calories: 2000, protein: 100 }, { date: 'Tue', calories: 2200, protein: 120 }],
  durationTrend: [{ date: 'Mon', duration: 45 }, { date: 'Tue', duration: 50 }],
  prs: [{ exercise: 'Bench Press', weight: 100 }],
};

export const mockComparison: any = {
  currentPeriod: { startDate: '2026-07-14', endDate: '2026-07-20', workouts: 4, calories: 2400, avgWeight: 80, consistency: 75 },
  previousPeriod: { startDate: '2026-07-07', endDate: '2026-07-13', workouts: 3, calories: 2000, avgWeight: 81, consistency: 60 },
  differences: { workoutsChange: 33.3, caloriesChange: 20, weightChange: -1, consistencyChange: 25 },
};

export const mockProgressExport: any = {
  userName: 'TestUser',
  period: 'Last 6 Months',
  achievements: ['First Workout', 'Nutrition Pro'],
  stats: { totalWorkouts: 50, totalWeightLost: 3, bestStreak: 12, avgConsistency: 74.5 },
  charts: { weightProgress: [], workoutFrequency: [], muscleGroupProgress: [] },
  insights: ['Consistency is improving', 'Increase protein intake'],
};

export const mockGamificationData = {
  xp: 1250,
  level: 3,
  currentStreak: 5,
  longestStreak: 12,
  badges: mockBadges,
  weeklyChallenges: mockWeeklyChallenges,
  monthlyMilestones: mockMonthlyMilestones,
};
