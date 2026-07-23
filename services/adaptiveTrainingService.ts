import {
  UserProfile,
  WorkoutSession,
  NutritionEntry,
  AdaptiveTrainingData,
  InsightReport,
  AnalyticsComparison,
  ProgressExport,
  DailyLog,
  ProgressEntry
} from '../types';
import { auth } from './firebase';
import { firestoreService } from './firestoreService';

class AdaptiveTrainingService {
  private userId: string;

  constructor(userId: string = 'default') {
    this.userId = userId;
  }

  // Analyze user data and generate adaptive training recommendations
  async analyzeUserData(profile: UserProfile): Promise<AdaptiveTrainingData> {
    const sessions = await this.getWorkoutSessions();
    const nutrition = await this.getNutritionEntries();
    const logs = await this.getDailyLogs();

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
    const sessions = await this.getWorkoutSessions();
    const nutrition = await this.getNutritionEntries();
    const logs = await this.getDailyLogs();

    const { startDate, endDate } = this.getPeriodDates(period);

    const periodSessions = sessions.filter(s =>
      s.date >= startDate && s.date <= endDate
    );
    const periodNutrition = nutrition.filter(n =>
      n.date >= startDate && n.date <= endDate
    );

    // 1. Calories and Protein Trend
    const caloriesProteinTrend: any[] = [];
    const groupedNutrition: Record<string, { calories: number; protein: number }> = {};
    periodNutrition.forEach(n => {
      const dStr = n.date || new Date(n.timestamp).toISOString().split('T')[0];
      if (!groupedNutrition[dStr]) {
        groupedNutrition[dStr] = { calories: 0, protein: 0 };
      }
      groupedNutrition[dStr].calories += n.calories || 0;
      groupedNutrition[dStr].protein += n.protein || 0;
    });
    Object.entries(groupedNutrition)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .forEach(([date, val]) => {
        caloriesProteinTrend.push({
          date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          calories: val.calories,
          protein: val.protein
        });
      });

    // 2. Workout Duration Trend
    const durationTrend: any[] = [];
    const groupedDuration: Record<string, number> = {};
    periodSessions.forEach(s => {
      const dStr = s.date;
      groupedDuration[dStr] = (groupedDuration[dStr] || 0) + (s.duration || 0);
    });
    Object.entries(groupedDuration)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .forEach(([date, dur]) => {
        durationTrend.push({
          date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          duration: dur
        });
      });

    // 3. Personal Records (PRs)
    const prs: { exercise: string; weight: number }[] = [];
    const prMap: Record<string, number> = {};
    sessions.forEach(s => {
      s.exercises.forEach(ex => {
        if (ex.weight && ex.weight.length > 0) {
          const maxWeight = Math.max(...ex.weight.filter(w => typeof w === 'number' && w > 0));
          if (maxWeight > 0) {
            if (!prMap[ex.name] || maxWeight > prMap[ex.name]) {
              prMap[ex.name] = maxWeight;
            }
          }
        }
      });
    });
    Object.entries(prMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .forEach(([exercise, weight]) => {
        prs.push({ exercise, weight });
      });

    // 4. Muscle Focus Data (Pie Chart compatible list)
    const muscleMap: Record<string, number> = {};
    periodSessions.forEach(s => {
      s.exercises.forEach(ex => {
        if (ex.muscleGroup) {
          muscleMap[ex.muscleGroup] = (muscleMap[ex.muscleGroup] || 0) + (ex.sets || 1);
        }
      });
    });
    const sliceColors = ['#ff5e00', '#fbbf24', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316'];
    const muscleFocus = Object.entries(muscleMap).map(([name, value], idx) => ({
      name,
      value,
      fill: sliceColors[idx % sliceColors.length]
    }));

    // 5. Performance History Area Chart data
    const performanceHistory: any[] = [];
    const groupedPerformance: Record<string, { ratingSum: number; count: number }> = {};
    periodSessions.forEach(s => {
      const dStr = s.date;
      if (!groupedPerformance[dStr]) {
        groupedPerformance[dStr] = { ratingSum: 0, count: 0 };
      }
      groupedPerformance[dStr].ratingSum += s.performanceRating || 3;
      groupedPerformance[dStr].count += 1;
    });
    Object.entries(groupedPerformance)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .forEach(([date, val]) => {
        performanceHistory.push({
          name: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          performance: Math.round((val.ratingSum / val.count) * 20)
        });
      });

    // 6. AI Fitness Score & Goal Completion
    const consistencyScore = this.calculateConsistencyScore(periodSessions, logs);
    
    const weekDuration = period === 'weekly' ? 1 : 4.3;
    const targetWorkouts = Math.round(3 * weekDuration);
    const workoutsScore = Math.min(Math.round((periodSessions.length / Math.max(targetWorkouts, 1)) * 100), 100);

    const targetProtein = 130;
    const avgProtein = periodNutrition.length > 0
      ? periodNutrition.reduce((sum, n) => sum + n.protein, 0) / periodNutrition.length
      : 0;
    const nutritionScore = Math.min(Math.round((avgProtein / targetProtein) * 100), 100);

    const progressList = await this.getProgressEntries();
    const hasProgress = progressList.some(p => {
      const pDate = new Date(p.date);
      const daysDiff = (new Date().getTime() - pDate.getTime()) / (1000 * 3600 * 24);
      return daysDiff <= 30;
    });
    const progressScore = hasProgress ? 100 : 50;

    const fitnessScore = Math.round(
      (consistencyScore * 0.35) + 
      (workoutsScore * 0.35) + 
      (nutritionScore * 0.20) + 
      (progressScore * 0.10)
    );

    const goalCompletion = Math.round(
      (consistencyScore * 0.5) + (workoutsScore * 0.5)
    );

    const summary = {
      totalWorkouts: periodSessions.length,
      totalCalories: periodNutrition.reduce((sum, n) => sum + n.calories, 0),
      avgProteinIntake: avgProtein,
      consistencyScore,
      bestPerformingWorkout: this.getBestPerformingWorkout(periodSessions),
      weakestMuscleGroup: this.getWeakestMuscleGroup(periodSessions),
      adherenceRate: this.calculateAdherenceRate(periodSessions, logs, startDate, endDate),
      fitnessScore,
      goalCompletion,
      muscleFocus
    };

    const trends = {
      weightChange: await this.calculateWeightChange(logs, startDate, endDate),
      strengthProgress: this.calculateStrengthProgress(periodSessions),
      consistencyTrend: this.determineConsistencyTrend(logs),
      performanceHistory
    };

    const recommendations = this.generateRecommendations(summary, trends);

    return {
      period,
      startDate,
      endDate,
      summary,
      trends,
      recommendations,
      caloriesProteinTrend,
      durationTrend,
      prs
    };
  }

  // Generate analytics comparison
  async generateComparison(currentPeriod: 'week' | 'month'): Promise<AnalyticsComparison> {
    const sessions = await this.getWorkoutSessions();
    const logs = await this.getDailyLogs();
    const nutrition = await this.getNutritionEntries();
    const progressList = await this.getProgressEntries();

    const current = await this.getPeriodData(currentPeriod, 'current', sessions, logs, nutrition, progressList);
    const previous = await this.getPeriodData(currentPeriod, 'previous', sessions, logs, nutrition, progressList);

    const differences = {
      workoutsChange: previous.workouts > 0 
        ? ((current.workouts - previous.workouts) / previous.workouts) * 100 
        : (current.workouts > 0 ? 100 : 0),
      caloriesChange: previous.calories > 0 
        ? ((current.calories - previous.calories) / previous.calories) * 100 
        : (current.calories > 0 ? 100 : 0),
      weightChange: parseFloat((current.avgWeight - previous.avgWeight).toFixed(1)),
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
    const sessions = await this.getWorkoutSessions();
    const logs = await this.getDailyLogs();

    const achievements = this.getAchievements(sessions, logs);
    const stats = {
      totalWorkouts: sessions.length,
      totalWeightLost: await this.calculateTotalWeightLost(),
      bestStreak: this.calculateBestStreak(logs),
      avgConsistency: this.calculateAverageConsistency(logs)
    };

    const charts = {
      weightProgress: await this.generateWeightProgressChart(),
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
  private async getWorkoutSessions(): Promise<WorkoutSession[]> {
    const uid = auth.currentUser?.uid;
    if (uid) {
      try {
        return await firestoreService.getWorkoutSessions(uid);
      } catch (e) {
        console.error('Failed to fetch sessions from Firestore:', e);
      }
    }
    try {
      return JSON.parse(localStorage.getItem('iron_ai_sessions') || '[]');
    } catch {
      return [];
    }
  }

  private async getNutritionEntries(): Promise<NutritionEntry[]> {
    const uid = auth.currentUser?.uid;
    if (uid) {
      try {
        return await firestoreService.getNutritionEntries(uid);
      } catch (e) {
        console.error('Failed to fetch nutrition from Firestore:', e);
      }
    }
    try {
      const local1 = JSON.parse(localStorage.getItem('nutrition_entries') || '[]');
      const local2 = JSON.parse(localStorage.getItem('iron_ai_nutrition') || '[]');
      const merged = [...local1];
      local2.forEach((item: any) => {
        if (!merged.some(m => m.id === item.id)) {
          merged.push(item);
        }
      });
      return merged;
    } catch {
      return [];
    }
  }

  private async getDailyLogs(): Promise<DailyLog[]> {
    const uid = auth.currentUser?.uid;
    if (uid) {
      try {
        return await firestoreService.getDailyLogs(uid);
      } catch (e) {
        console.error('Failed to fetch daily logs from Firestore:', e);
      }
    }
    try {
      return JSON.parse(localStorage.getItem('iron_ai_logs') || '[]');
    } catch {
      return [];
    }
  }

  // Public helper method so Leo AI can retrieve progress history
  async getProgressHistory(uid: string): Promise<ProgressEntry[]> {
    if (!uid) return [];
    try {
      return await firestoreService.getProgressEntries(uid);
    } catch (e) {
      console.error('Failed to get progress history for AI:', e);
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

  private async calculateWeightChange(logs: DailyLog[], startDate: string, endDate: string): Promise<number> {
    const progressList = await this.getProgressEntries();
    const periodProgress = progressList
      .filter(p => p.date >= startDate && p.date <= endDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (periodProgress.length < 2) return 0;
    
    const earliest = periodProgress[0].weight;
    const latest = periodProgress[periodProgress.length - 1].weight;
    return parseFloat((latest - earliest).toFixed(1));
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

  private async getPeriodData(
    period: 'week' | 'month',
    type: 'current' | 'previous',
    sessions: WorkoutSession[],
    logs: DailyLog[],
    nutrition: NutritionEntry[],
    progressList: ProgressEntry[]
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
    const periodNutrition = nutrition.filter(n => {
      const nDate = n.date || new Date(n.timestamp).toISOString().split('T')[0];
      return nDate >= startStr && nDate <= endStr;
    });

    const calories = periodNutrition.reduce((sum, n) => sum + (n.calories || 0), 0);

    const periodProgress = progressList.filter(p => p.date >= startStr && p.date <= endStr);
    const avgWeight = periodProgress.length > 0
      ? periodProgress.reduce((sum, p) => sum + p.weight, 0) / periodProgress.length
      : (progressList.length > 0 ? progressList[0].weight : 70);

    return {
      startDate: startStr,
      endDate: endStr,
      workouts: periodSessions.length,
      calories,
      avgWeight: parseFloat(avgWeight.toFixed(1)),
      consistency: periodLogs.length > 0
        ? Math.round((periodLogs.filter(l => l.workoutCompleted).length / periodLogs.length) * 100)
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

  private async calculateTotalWeightLost(): Promise<number> {
    const progressList = await this.getProgressEntries();
    if (progressList.length < 2) return 0;
    const sorted = [...progressList].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const earliest = sorted[0].weight;
    const latest = sorted[sorted.length - 1].weight;
    return parseFloat((earliest - latest).toFixed(1));
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

  private async generateWeightProgressChart(): Promise<any[]> {
    const progressList = await this.getProgressEntries();
    return progressList
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(p => ({
        month: new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        weight: p.weight
      }));
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
  private async getProgressEntries(): Promise<ProgressEntry[]> {
    const uid = auth.currentUser?.uid;
    if (uid) {
      try {
        return await firestoreService.getProgressEntries(uid);
      } catch (e) {
        console.error('Failed to fetch progress entries in AdaptiveTraining:', e);
      }
    }
    return [];
  }
}

export const adaptiveTrainingService = new AdaptiveTrainingService();
