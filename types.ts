export enum Goal {
  BULKING = 'Bulking',
  CUTTING = 'Cutting',
  MAINTENANCE = 'Maintenance',
  STRENGTH = 'Strength & Power',
  ATHLETIC = 'Athletic Performance',
}

export enum Experience {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
  ELITE = 'Elite',
}

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other',
}

export enum Equipment {
  FULL_GYM = 'Full Gym',
  DUMBBELLS_ONLY = 'Dumbbells Only',
  HOME_GYM = 'Home Gym (Barbell + Rack)',
  BODYWEIGHT = 'Bodyweight Only',
}

export enum DietType {
  ANY = 'Anything',
  VEGETARIAN = 'Vegetarian',
  VEGAN = 'Vegan',
  KETO = 'Keto',
  PALEO = 'Paleo',
}

export enum SplitPreference {
  PPL = 'Push/Pull/Legs',
  UPPER_LOWER = 'Upper/Lower',
  BRO_SPLIT = 'Body Part Split (Bro Split)',
  FULL_BODY = 'Full Body',
  HYBRID = 'Hybrid / Athlete',
}


export interface UserProfile {
  name: string;
  age: number;
  weight: number; // kg
  height: number; // cm
  gender: Gender;
  experience: Experience;
  daysAvailable: number;
  goal: Goal;
  equipment: Equipment;
  dietType: DietType;
  splitPreference: SplitPreference;
  injuries: string;

  completedOnboarding: boolean;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string; // seconds
  muscleGroup: string;
  notes?: string;
  recommendedWeight?: string; // e.g., "60-70% 1RM" or "20-25kg"
  imageUrl?: string; // URL to exercise demonstration image
}

export interface WorkoutDay {
  dayName: string;
  focus: string;
  exercises: Exercise[];
}

export interface WorkoutPlan {
  splitName: string;
  description: string;
  schedule: WorkoutDay[];
  generatedAt: number;
}

export interface MacroGoals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  audioData?: string; // Base64 PCM data
  timestamp: number;
}

export interface DailyLog {
  date: string;
  waterIntake: number; // ml
  sleepHours: number;
  mood: 'Good' | 'Average' | 'Bad';
  workoutCompleted: boolean;
}

export interface WorkoutSession {
  id: string;
  date: string;
  dayName: string;
  exercises: CompletedExercise[];
  duration: number; // minutes
  notes?: string;
  fatigueLevel: 1 | 2 | 3 | 4 | 5; // 1 = fresh, 5 = exhausted
  performanceRating: 1 | 2 | 3 | 4 | 5; // 1 = poor, 5 = excellent
}

export interface CompletedExercise {
  name: string;
  sets: number;
  reps: number[];
  weight?: number[];
  muscleGroup: string;
  notes?: string;
}

export interface NutritionEntry {
  id: string;
  date: string;
  meal: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  food: string;
}

export interface AdaptiveTrainingData {
  userId: string;
  consistencyScore: number; // 0-100
  fatigueTrend: number[]; // last 7 days
  missedSessions: number;
  performanceTrend: number[]; // last 30 days
  weakestMuscleGroups: string[];
  recommendedAdjustments: {
    volumeChange: number; // percentage
    intensityChange: number; // percentage
    splitRecommendation?: string;
    restDays: number;
  };
}

export interface InsightReport {
  period: 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  summary: {
    totalWorkouts: number;
    totalCalories: number;
    avgProteinIntake: number;
    consistencyScore: number;
    bestPerformingWorkout: string;
    weakestMuscleGroup: string;
    adherenceRate: number;
  };
  trends: {
    weightChange: number;
    strengthProgress: number;
    consistencyTrend: 'improving' | 'declining' | 'stable';
  };
  recommendations: string[];
}

export interface AnalyticsComparison {
  currentPeriod: {
    startDate: string;
    endDate: string;
    workouts: number;
    calories: number;
    avgWeight: number;
    consistency: number;
  };
  previousPeriod: {
    startDate: string;
    endDate: string;
    workouts: number;
    calories: number;
    avgWeight: number;
    consistency: number;
  };
  differences: {
    workoutsChange: number;
    caloriesChange: number;
    weightChange: number;
    consistencyChange: number;
  };
}

export interface ProgressExport {
  userName: string;
  period: string;
  achievements: string[];
  stats: {
    totalWorkouts: number;
    totalWeightLost: number;
    bestStreak: number;
    avgConsistency: number;
  };
  charts: {
    weightProgress: any[];
    workoutFrequency: any[];
    muscleGroupProgress: any[];
  };
  insights: string[];
}
