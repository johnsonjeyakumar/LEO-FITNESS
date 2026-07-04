import {
  UserProfile,
  WorkoutSession,
  NutritionEntry,
  AdaptiveTrainingData,
  InsightReport,
  AnalyticsComparison,
  ProgressExport,
  DailyLog
} from '../types';

class AdaptiveTrainingService {
  private userId: string;

  constructor(userId: string = 'default') {
    this.userId = userId;
  }

  // Analyze user data and generate adaptive training recommendations
  async analyzeUserData(profile: UserProfile): Promise<AdaptiveTrainingData> {
    const sessions = this.getWorkoutSessions();
    const nutrition = this.getNutritionEntries();
    const logs = this.getDailyLogs();

    const consistencyScore = this.calculateConsistencyScore(sessions, logs);
    const fatigueTrend = this.calculateFatigueTrend(sessions);
    const missedSessions = this.calculateMissedSessions(logs);
    const performanceTrend = this.calculatePerformanceTrend(sessions);
    const weakestMuscleGroups = this.identifyWeakestMuscleGroups(sessions);

    const recommendedAdjustments = this.generateAdjustments(
      consistencyScore,
      fatigueTrend,
      missedSessions,
      performanceTrend,
      weakestMuscleGroups,
      profile
    );

    return {
      userId: this.userId,
      consistencyScore,
      fatigueTrend,
      missedSessions,
      performanceTrend,
      weakestMuscleGroups,
      recommendedAdjustments
    };
  }

  // Generate insight reports
  async generateInsightReport(period: 'weekly' | 'monthly'): Promise<InsightReport> {
    const sessions = this.getWorkoutSessions();
    const nutrition = this.getNutritionEntries();
    const logs = this.getDailyLogs();

    const { startDate, endDate } = this.getPeriodDates(period);

    const periodSessions = sessions.filter(s =>
      s.date >= startDate && s.date <= endDate
    );
    const periodNutrition = nutrition.filter(n =>
      n.date >= startDate && n.date <= endDate
    );

    const summary = {
      totalWorkouts: periodSessions.length,
      totalCalories: periodNutrition.reduce((sum, n) => sum + n.calories, 0),
      avgProteinIntake: periodNutrition.length > 0
        ? periodNutrition.reduce((sum, n) => sum + n.protein, 0) / periodNutrition.length
        : 0,
      consistencyScore: this.calculateConsistencyScore(periodSessions, logs),
      bestPerformingWorkout: this.getBestPerformingWorkout(periodSessions),
      weakestMuscleGroup: this.getWeakestMuscleGroup(periodSessions),
      adherenceRate: this.calculateAdherenceRate(periodSessions, logs, startDate, endDate)
    };

    const trends = {
      weightChange: this.calculateWeightChange(logs, startDate, endDate),
      strengthProgress: this.calculateStrengthProgress(periodSessions),
      consistencyTrend: this.determineConsistencyTrend(logs)
    };

    const recommendations = this.generateRecommendations(summary, trends);

    return {
      period,
      startDate,
      endDate,
      summary,
      trends,
      recommendations
    };
  }

  // Generate analytics comparison
  async generateComparison(currentPeriod: 'week' | 'month'): Promise<AnalyticsComparison> {
    const sessions = this.getWorkoutSessions();
    const logs = this.getDailyLogs();

    const current = this.getPeriodData(currentPeriod, 'current', sessions, logs);
    const previous = this.getPeriodData(currentPeriod, 'previous', sessions, logs);

    const differences = {
      workoutsChange: ((current.workouts - previous.workouts) / Math.max(previous.workouts, 1)) * 100,
      caloriesChange: ((current.calories - previous.calories) / Math.max(previous.calories, 1)) * 100,
      weightChange: current.avgWeight - previous.avgWeight,
      consistencyChange: current.consistency - previous.consistency
    };

    return {
      currentPeriod: current,
      previousPeriod: previous,
      differences
    };
  }

  // Generate progress export data
  async generateProgressExport(profile: UserProfile, period: string): Promise<ProgressExport> {
    const sessions = this.getWorkoutSessions();
    const logs = this.getDailyLogs();

    const achievements = this.getAchievements(sessions, logs);
    const stats = {
      totalWorkouts: sessions.length,
      totalWeightLost: this.calculateTotalWeightLost(logs),
      bestStreak: this.calculateBestStreak(logs),
      avgConsistency: this.calculateAverageConsistency(logs)
    };

    const charts = {
      weightProgress: this.generateWeightProgressChart(logs),
      workoutFrequency: this.generateWorkoutFrequencyChart(sessions),
      muscleGroupProgress: this.generateMuscleGroupProgressChart(sessions)
    };

    const insights = this.generateProgressInsights(stats, achievements);

    return {
      userName: profile.name,
      period,
      achievements,
      stats,
      charts,
      insights
    };
  }

  // Private helper methods
  private getWorkoutSessions(): WorkoutSession[] {
    try {
      return JSON.parse(localStorage.getItem('iron_ai_sessions') || '[]');
    } catch {
      return [];
    }
  }

  private getNutritionEntries(): NutritionEntry[] {
    try {
      return JSON.parse(localStorage.getItem('iron_ai_nutrition') || '[]');
    } catch {
      return [];
    }
  }

  private getDailyLogs(): DailyLog[] {
    try {
      return JSON.parse(localStorage.getItem('iron_ai_logs') || '[]');
    } catch {
      return [];
    }
  }

  private calculateConsistencyScore(sessions: WorkoutSession[], logs: DailyLog[]): number {
    if (logs.length === 0) return 0;

    const completedWorkouts = logs.filter(log => log.workoutCompleted).length;
    const totalDays = logs.length;

    return Math.round((completedWorkouts / totalDays) * 100);
  }

  private calculateFatigueTrend(sessions: WorkoutSession[]): number[] {
    return sessions.slice(-7).map(s => s.fatigueLevel);
  }

  private calculateMissedSessions(logs: DailyLog[]): number {
    const plannedDays = logs.length;
    const completedDays = logs.filter(log => log.workoutCompleted).length;
    return plannedDays - completedDays;
  }

  private calculatePerformanceTrend(sessions: WorkoutSession[]): number[] {
    return sessions.slice(-30).map(s => s.performanceRating);
  }

  private identifyWeakestMuscleGroups(sessions: WorkoutSession[]): string[] {
    const muscleGroups = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core'];
    const performanceByMuscle: { [key: string]: number[] } = {};

    sessions.forEach(session => {
      session.exercises.forEach(exercise => {
        if (!performanceByMuscle[exercise.muscleGroup]) {
          performanceByMuscle[exercise.muscleGroup] = [];
        }
        // Calculate average performance for this exercise
        const avgReps = exercise.reps.reduce((a, b) => a + b, 0) / exercise.reps.length;
        performanceByMuscle[exercise.muscleGroup].push(avgReps);
      });
    });

    const avgPerformance = Object.entries(performanceByMuscle).map(([muscle, performances]) => ({
      muscle,
      avg: performances.reduce((a, b) => a + b, 0) / performances.length
    }));

    return avgPerformance
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 2)
      .map(item => item.muscle);
  }

  private generateAdjustments(
    consistency: number,
    fatigue: number[],
    missed: number,
    performance: number[],
    weakMuscles: string[],
    profile: UserProfile
  ) {
    let volumeChange = 0;
    let intensityChange = 0;
    let restDays = 0;
    let splitRecommendation: string | undefined;

    // High fatigue - reduce volume and intensity
    const avgFatigue = fatigue.reduce((a, b) => a + b, 0) / Math.max(fatigue.length, 1);
    if (avgFatigue > 3.5) {
      volumeChange = -15;
      intensityChange = -10;
      restDays = 1;
    }
    // Low consistency - reduce volume to build habit
    else if (consistency < 60) {
      volumeChange = -10;
      intensityChange = -5;
    }
    // Good consistency and low fatigue - increase intensity
    else if (consistency > 80 && avgFatigue < 2.5) {
      intensityChange = 10;
      volumeChange = 5;
    }

    // Recommend split based on weak muscles
    if (weakMuscles.includes('Legs')) {
      splitRecommendation = 'Push/Pull/Legs with extra leg focus';
    } else if (weakMuscles.includes('Back')) {
      splitRecommendation = 'Upper/Lower with back emphasis';
    }

    return {
      volumeChange,
      intensityChange,
      splitRecommendation,
      restDays
    };
  }

  private getPeriodDates(period: 'weekly' | 'monthly') {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date();

    if (period === 'weekly') {
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate
    };
  }

  private getBestPerformingWorkout(sessions: WorkoutSession[]): string {
    if (sessions.length === 0) return 'None';

    const workoutRatings = sessions.reduce((acc, session) => {
      acc[session.dayName] = acc[session.dayName] || [];
      acc[session.dayName].push(session.performanceRating);
      return acc;
    }, {} as { [key: string]: number[] });

    const avgRatings = Object.entries(workoutRatings).map(([day, ratings]) => ({
      day,
      avg: ratings.reduce((a, b) => a + b, 0) / ratings.length
    }));

    return avgRatings.sort((a, b) => b.avg - a.avg)[0]?.day || 'None';
  }

  private getWeakestMuscleGroup(sessions: WorkoutSession[]): string {
    return this.identifyWeakestMuscleGroups(sessions)[0] || 'None';
  }

  private calculateAdherenceRate(sessions: WorkoutSession[], logs: DailyLog[], startDate: string, endDate: string): number {
    const periodLogs = logs.filter(log => log.date >= startDate && log.date <= endDate);
    if (periodLogs.length === 0) return 0;

    const completed = periodLogs.filter(log => log.workoutCompleted).length;
    return Math.round((completed / periodLogs.length) * 100);
  }

  private calculateWeightChange(logs: DailyLog[], startDate: string, endDate: string): number {
    const periodLogs = logs.filter(log => log.date >= startDate && log.date <= endDate);
    if (periodLogs.length < 2) return 0;

    // This would need actual weight tracking - for now return mock data
    return -0.5; // kg lost
  }

  private calculateStrengthProgress(sessions: WorkoutSession[]): number {
    if (sessions.length < 2) return 0;

    // Calculate improvement in total volume
    const recent = sessions.slice(-3);
    const earlier = sessions.slice(-6, -3);

    if (earlier.length === 0) return 0;

    const recentVolume = recent.reduce((sum, s) =>
      sum + s.exercises.reduce((exSum, ex) => exSum + ex.sets * ex.reps.reduce((a, b) => a + b, 0), 0), 0
    );

    const earlierVolume = earlier.reduce((sum, s) =>
      sum + s.exercises.reduce((exSum, ex) => exSum + ex.sets * ex.reps.reduce((a, b) => a + b, 0), 0), 0
    );

    return earlierVolume > 0 ? ((recentVolume - earlierVolume) / earlierVolume) * 100 : 0;
  }

  private determineConsistencyTrend(logs: DailyLog[]): 'improving' | 'declining' | 'stable' {
    if (logs.length < 14) return 'stable';

    const recent = logs.slice(-7);
    const previous = logs.slice(-14, -7);

    const recentRate = recent.filter(l => l.workoutCompleted).length / recent.length;
    const previousRate = previous.filter(l => l.workoutCompleted).length / previous.length;

    const diff = recentRate - previousRate;

    if (diff > 0.1) return 'improving';
    if (diff < -0.1) return 'declining';
    return 'stable';
  }

  private generateRecommendations(summary: any, trends: any): string[] {
    const recommendations = [];

    if (summary.consistencyScore < 70) {
      recommendations.push('Focus on building workout consistency - aim for 80%+ adherence rate');
    }

    if (trends.consistencyTrend === 'declining') {
      recommendations.push('Your consistency is declining - consider simplifying your routine');
    }

    if (summary.avgProteinIntake < 1.6) {
      recommendations.push('Increase protein intake to support muscle recovery and growth');
    }

    if (trends.weightChange > 0) {
      recommendations.push('Monitor caloric intake as weight is trending upward');
    }

    return recommendations;
  }

  private getPeriodData(
    period: 'week' | 'month',
    type: 'current' | 'previous',
    sessions: WorkoutSession[],
    logs: DailyLog[]
  ) {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    if (period === 'week') {
      if (type === 'current') {
        startDate.setDate(now.getDate() - 7);
        endDate = now;
      } else {
        startDate.setDate(now.getDate() - 14);
        endDate.setDate(now.getDate() - 7);
      }
    } else {
      if (type === 'current') {
        startDate.setMonth(now.getMonth() - 1);
        endDate = now;
      } else {
        startDate.setMonth(now.getMonth() - 2);
        endDate.setMonth(now.getMonth() - 1);
      }
    }

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const periodSessions = sessions.filter(s => s.date >= startStr && s.date <= endStr);
    const periodLogs = logs.filter(l => l.date >= startStr && l.date <= endStr);

    return {
      startDate: startStr,
      endDate: endStr,
      workouts: periodSessions.length,
      calories: periodSessions.reduce((sum, s) => sum + (s.duration * 8), 0), // Rough estimate
      avgWeight: 70, // Mock data - would need weight tracking
      consistency: periodLogs.length > 0
        ? (periodLogs.filter(l => l.workoutCompleted).length / periodLogs.length) * 100
        : 0
    };
  }

  private getAchievements(sessions: WorkoutSession[], logs: DailyLog[]): string[] {
    const achievements = [];

    const totalWorkouts = sessions.length;
    if (totalWorkouts >= 50) achievements.push('50+ Workouts Completed');
    if (totalWorkouts >= 100) achievements.push('Century Club Member');

    const bestStreak = this.calculateBestStreak(logs);
    if (bestStreak >= 30) achievements.push('30-Day Streak Master');
    if (bestStreak >= 7) achievements.push('Week Warrior');

    const avgConsistency = this.calculateAverageConsistency(logs);
    if (avgConsistency >= 90) achievements.push('Consistency Champion');

    return achievements;
  }

  private calculateTotalWeightLost(logs: DailyLog[]): number {
    // Mock calculation - would need actual weight tracking
    return 2.5;
  }

  private calculateBestStreak(logs: DailyLog[]): number {
    let maxStreak = 0;
    let currentStreak = 0;

    logs.forEach(log => {
      if (log.workoutCompleted) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });

    return maxStreak;
  }

  private calculateAverageConsistency(logs: DailyLog[]): number {
    if (logs.length === 0) return 0;
    const completed = logs.filter(l => l.workoutCompleted).length;
    return (completed / logs.length) * 100;
  }

  private generateWeightProgressChart(logs: DailyLog[]): any[] {
    // Mock weight progress data
    return [
      { date: 'Jan', weight: 75 },
      { date: 'Feb', weight: 74.5 },
      { date: 'Mar', weight: 73.8 },
      { date: 'Apr', weight: 73.2 },
      { date: 'May', weight: 72.8 },
      { date: 'Jun', weight: 72.5 }
    ];
  }

  private generateWorkoutFrequencyChart(sessions: WorkoutSession[]): any[] {
    const frequency: { [key: string]: number } = {};

    sessions.forEach(session => {
      const month = new Date(session.date).toLocaleDateString('en-US', { month: 'short' });
      frequency[month] = (frequency[month] || 0) + 1;
    });

    return Object.entries(frequency).map(([month, count]) => ({ month, workouts: count }));
  }

  private generateMuscleGroupProgressChart(sessions: WorkoutSession[]): any[] {
    const progress: { [key: string]: number } = {};

    sessions.forEach(session => {
      session.exercises.forEach(exercise => {
        progress[exercise.muscleGroup] = (progress[exercise.muscleGroup] || 0) + 1;
      });
    });

    return Object.entries(progress).map(([muscle, sessions]) => ({ muscle, sessions }));
  }

  private generateProgressInsights(stats: any, achievements: string[]): string[] {
    const insights = [];

    if (stats.totalWorkouts > 0) {
      insights.push(`Completed ${stats.totalWorkouts} workouts total`);
    }

    if (stats.totalWeightLost > 0) {
      insights.push(`Lost ${stats.totalWeightLost}kg during this period`);
    }

    if (stats.bestStreak > 0) {
      insights.push(`Achieved a ${stats.bestStreak}-day workout streak`);
    }

    if (achievements.length > 0) {
      insights.push(`Earned ${achievements.length} achievement${achievements.length > 1 ? 's' : ''}`);
    }

    return insights;
  }
}

export const adaptiveTrainingService = new AdaptiveTrainingService();
