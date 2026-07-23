import { firestoreService } from './firestoreService';
import { UserProfile, WorkoutSession, DailyLog, NutritionEntry, ProgressEntry, AchievementBadge, WeeklyChallenge, MonthlyMilestone } from '../types';

class GamificationService {
  // Update and fetch gamification data for the user
  async updateGamificationData(uid: string): Promise<{
    xp: number;
    level: number;
    currentStreak: number;
    longestStreak: number;
    badges: AchievementBadge[];
    weeklyChallenges: WeeklyChallenge[];
    monthlyMilestones: MonthlyMilestone[];
  }> {
    if (!uid) {
      throw new Error('UID is required for gamification calculations');
    }

    // 1. Fetch all dependencies from Firestore in parallel
    const [sessions, logs, nutrition, progress] = await Promise.all([
      firestoreService.getWorkoutSessions(uid),
      firestoreService.getDailyLogs(uid),
      firestoreService.getNutritionEntries(uid),
      firestoreService.getProgressEntries(uid),
    ]);

    // 2. Calculate Streaks (correct calendar day logic)
    const logsByDate = new Map<string, DailyLog>();
    logs.forEach(l => {
      logsByDate.set(new Date(l.date).toDateString(), l);
    });

    const todayStr = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    let currentStreak = 0;
    const hasWorkoutToday = logsByDate.get(todayStr)?.workoutCompleted || false;
    const hasWorkoutYesterday = logsByDate.get(yesterdayStr)?.workoutCompleted || false;

    if (hasWorkoutToday || hasWorkoutYesterday) {
      const startCheck = hasWorkoutToday ? new Date() : yesterday;
      while (true) {
        const checkStr = startCheck.toDateString();
        const log = logsByDate.get(checkStr);
        if (log && log.workoutCompleted) {
          currentStreak++;
          startCheck.setDate(startCheck.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Longest streak calculation
    let longestStreak = 0;
    let tempStreak = 0;
    const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let lastDate: Date | null = null;

    sortedLogs.forEach(l => {
      if (l.workoutCompleted) {
        const currentDate = new Date(l.date);
        if (lastDate) {
          const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays <= 1) {
            tempStreak++;
          } else {
            tempStreak = 1;
          }
        } else {
          tempStreak = 1;
        }
        lastDate = currentDate;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      }
    });

    // Capping / ensuring consistency
    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    // 3. XP & Level calculations
    // Formula: 100 XP per workout session, 25 XP per nutrition, 50 XP per progress entry, 10 XP per daily log
    const xp = (sessions.length * 100) + (nutrition.length * 25) + (progress.length * 50) + (logs.length * 10);
    const level = Math.floor(xp / 500) + 1;

    // 4. Achievement Badges Check
    const badgeDefinitions = [
      {
        id: 'first_workout',
        title: 'First Blood',
        description: 'Complete your first workout session.',
        target: 1,
        progress: sessions.length,
        category: 'Workout',
      },
      {
        id: 'consistency_3',
        title: 'Consistency Cadet',
        description: 'Achieve a 3-day workout streak.',
        target: 3,
        progress: longestStreak,
        category: 'Streak',
      },
      {
        id: 'consistency_7',
        title: 'Streak Commander',
        description: 'Achieve a 7-day workout streak.',
        target: 7,
        progress: longestStreak,
        category: 'Streak',
      },
      {
        id: 'heavy_metal',
        title: 'Heavy Metal',
        description: 'Lift a single-set weight of 100kg or more.',
        target: 100,
        progress: sessions.reduce((max, s) => {
          s.exercises.forEach(ex => {
            if (ex.weight && ex.weight.length > 0) {
              const exMax = Math.max(...ex.weight.filter(w => typeof w === 'number'));
              if (exMax > max) max = exMax;
            }
          });
          return max;
        }, 0),
        category: 'Strength',
      },
      {
        id: 'macro_master',
        title: 'Macro Master',
        description: 'Log nutrition entries on 5 separate days.',
        target: 5,
        progress: new Set(nutrition.map(n => n.date || new Date(n.timestamp || 0).toISOString().split('T')[0])).size,
        category: 'Nutrition',
      },
      {
        id: 'scale_crusher',
        title: 'Scale Crusher',
        description: 'Log at least 2 progress weight measurements.',
        target: 2,
        progress: progress.length,
        category: 'Progress',
      },
      {
        id: 'century_club',
        title: 'Century Club',
        description: 'Complete 10 total workout sessions.',
        target: 10,
        progress: sessions.length,
        category: 'Workout',
      },
      {
        id: 'sleep_warrior',
        title: 'Sleep Warrior',
        description: 'Log 8+ hours of sleep in at least 3 daily logs.',
        target: 3,
        progress: logs.filter(l => l.sleepHours >= 8).length,
        category: 'Health',
      },
    ];

    const badges: AchievementBadge[] = [];

    // Sync badges with Firestore
    const existingBadges = await firestoreService.getAchievements(uid);
    const existingBadgesMap = new Map(existingBadges.map(b => [b.id, b]));

    for (const def of badgeDefinitions) {
      const existing = existingBadgesMap.get(def.id);
      const unlocked = def.progress >= def.target;
      const unlockedAt = unlocked 
        ? (existing?.unlockedAt || new Date().toISOString()) 
        : undefined;

      const badge: AchievementBadge = {
        ...def,
        unlocked,
        unlockedAt,
        progress: Math.min(def.progress, def.target),
      };

      // Only save if status changed or it doesn't exist
      if (!existing || existing.unlocked !== unlocked || existing.progress !== badge.progress) {
        await firestoreService.saveAchievement(uid, badge);
      }
      badges.push(badge);
    }

    // 5. Weekly Challenges
    // Last 7 days calculations
    const sevenDaysAgoStr = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const weeklyWorkouts = sessions.filter(s => s.date >= sevenDaysAgoStr).length;
    const weeklyNutritionDates = new Set(
      nutrition
        .filter(n => (n.date || new Date(n.timestamp || 0).toISOString().split('T')[0]) >= sevenDaysAgoStr)
        .map(n => n.date || new Date(n.timestamp || 0).toISOString().split('T')[0])
    ).size;

    const weeklyChallenges: WeeklyChallenge[] = [
      {
        id: 'weekly_workouts',
        title: 'Workout Warrior',
        description: 'Complete 3 workout sessions in the last 7 days.',
        progress: Math.min(weeklyWorkouts, 3),
        target: 3,
        completed: weeklyWorkouts >= 3,
      },
      {
        id: 'weekly_nutrition',
        title: 'Calorie Commander',
        description: 'Log nutrition meals on 4 separate days in the last 7 days.',
        progress: Math.min(weeklyNutritionDates, 4),
        target: 4,
        completed: weeklyNutritionDates >= 4,
      },
    ];

    // 6. Monthly Milestones
    // Last 30 days calculations
    const thirtyDaysAgoStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthlyWorkouts = sessions.filter(s => s.date >= thirtyDaysAgoStr).length;
    const monthlyProgressLogs = progress.filter(p => p.date >= thirtyDaysAgoStr).length;

    const monthlyMilestones: MonthlyMilestone[] = [
      {
        id: 'monthly_consistency',
        title: 'Consistency Champ',
        description: 'Log 10 workouts in the last 30 days.',
        progress: Math.min(monthlyWorkouts, 10),
        target: 10,
        completed: monthlyWorkouts >= 10,
      },
      {
        id: 'monthly_progress',
        title: 'Measurement Master',
        description: 'Record 2 physical progress entries in the last 30 days.',
        progress: Math.min(monthlyProgressLogs, 2),
        target: 2,
        completed: monthlyProgressLogs >= 2,
      },
    ];

    // 7. Update User Profile with level, xp, active/longest streaks
    await firestoreService.updateUserProfile(uid, {
      xp,
      level,
      currentStreak,
      longestStreak,
    });

    return {
      xp,
      level,
      currentStreak,
      longestStreak,
      badges,
      weeklyChallenges,
      monthlyMilestones,
    };
  }
}

export const gamificationService = new GamificationService();
