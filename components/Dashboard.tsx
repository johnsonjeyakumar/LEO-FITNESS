import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, WorkoutPlan } from '../types';
import { Trophy, Flame, Activity, TrendingUp, Droplets, Dumbbell, Target, Calendar, CheckCircle, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  profile: UserProfile;
  workoutPlan: WorkoutPlan | null;
}

const Dashboard: React.FC<Props> = ({ profile, workoutPlan }) => {
  // Calculate streaks for workouts and nutrition
  const streaks = useMemo(() => {
    try {
      const logs = JSON.parse(localStorage.getItem('iron_ai_logs') || '[]');
      const nutritionEntries = JSON.parse(localStorage.getItem('nutrition_entries') || '[]');

      let workoutStreak = 0;
      let nutritionStreak = 0;
      const today = new Date().toDateString();

      // Check if today is logged for workouts
      const todayWorkoutLog = logs.find((log: any) => log.date === today);
      if (todayWorkoutLog?.workoutCompleted) {
        workoutStreak = 1;
        // Count consecutive days backwards from today
        for (let i = 1; i < logs.length; i++) {
          const logDate = new Date(logs[i].date);
          const expectedDate = new Date();
          expectedDate.setDate(expectedDate.getDate() - i);

          if (logDate.toDateString() === expectedDate.toDateString() && logs[i].workoutCompleted) {
            workoutStreak++;
          } else {
            break;
          }
        }
      }

      // Check if today has nutrition entries
      const todayNutritionEntries = nutritionEntries.filter((entry: any) =>
        new Date(entry.timestamp).toDateString() === today
      );
      if (todayNutritionEntries.length > 0) {
        nutritionStreak = 1;
        // Count consecutive days backwards from today
        for (let i = 1; ; i++) {
          const checkDate = new Date();
          checkDate.setDate(checkDate.getDate() - i);
          const checkDateString = checkDate.toDateString();

          const dayEntries = nutritionEntries.filter((entry: any) =>
            new Date(entry.timestamp).toDateString() === checkDateString
          );

          if (dayEntries.length > 0) {
            nutritionStreak++;
          } else {
            break;
          }
        }
      }

      return { workoutStreak, nutritionStreak };
    } catch (e) {
      return { workoutStreak: 0, nutritionStreak: 0 };
    }
  }, []);

  // Calculate basic stats
  const stats = useMemo(() => {
    try {
      const logs = JSON.parse(localStorage.getItem('iron_ai_logs') || '[]');
      const workoutsCompleted = logs.filter((log: any) => log.workoutCompleted).length;
      const totalCalories = logs.reduce((sum: number, log: any) => sum + (log.caloriesBurned || 0), 0);

      return {
        workoutsCompleted,
        totalCalories,
        currentWeight: profile.weight
      };
    } catch (e) {
      return {
        workoutsCompleted: 0,
        totalCalories: 0,
        currentWeight: profile.weight
      };
    }
  }, [profile.weight]);

  const StatCard = ({ title, value, icon: Icon, delay, subtitle }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-card border border-white/5 rounded-xl p-6 relative overflow-hidden group hover:border-primary/50 transition-all"
    >
      <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-gradient-to-br from-primary to-transparent opacity-10 group-hover:opacity-20 blur-2xl transition-all duration-500" />
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title}</p>
          <h3 className="text-3xl font-display font-bold text-white mt-1">{value}</h3>
          {subtitle && <p className="text-gray-400 text-sm mt-1">{subtitle}</p>}
        </div>
        <div className="p-3 rounded bg-white/5 text-primary">
          <Icon size={24} />
        </div>
      </div>
      <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden mt-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '70%' }}
          transition={{ duration: 1, delay: delay + 0.2 }}
          className="h-full bg-primary"
        />
      </div>
    </motion.div>
  );

  return (
    <div className="p-6 lg:p-10 pb-32 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl lg:text-5xl font-display font-bold text-white uppercase tracking-tight mb-2">
          NEEYUM AGALAM DAA <span className="text-primary">LEO</span>
        </h1>
        <p className="text-gray-400">Track your progress and stay consistent</p>
      </div>

      {/* Streak Tracking */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-8 text-center"
        >
          <div className="flex items-center justify-center mb-4">
            <Flame className="text-orange-400 mr-3" size={32} />
            <div>
              <h3 className="text-2xl font-display font-bold text-white uppercase">Workout Streak</h3>
              <p className="text-orange-400 text-sm">Consecutive days</p>
            </div>
          </div>
          <div className="text-6xl font-display font-bold text-white mb-2">{streaks.workoutStreak}</div>
          <div className="text-gray-300 text-sm">
            {streaks.workoutStreak === 0 ? "Start your streak today!" : `${streaks.workoutStreak} day${streaks.workoutStreak !== 1 ? 's' : ''} in a row`}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl p-8 text-center"
        >
          <div className="flex items-center justify-center mb-4">
            <Target className="text-blue-400 mr-3" size={32} />
            <div>
              <h3 className="text-2xl font-display font-bold text-white uppercase">Nutrition Streak</h3>
              <p className="text-blue-400 text-sm">Consecutive days logged</p>
            </div>
          </div>
          <div className="text-6xl font-display font-bold text-white mb-2">{streaks.nutritionStreak}</div>
          <div className="text-gray-300 text-sm">
            {streaks.nutritionStreak === 0 ? "Log your meals today!" : `${streaks.nutritionStreak} day${streaks.nutritionStreak !== 1 ? 's' : ''} in a row`}
          </div>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Workouts Completed"
          value={stats.workoutsCompleted}
          icon={Trophy}
          delay={0.3}
          subtitle="Total sessions"
        />
        <StatCard
          title="Calories Burned"
          value={`${stats.totalCalories.toLocaleString()}`}
          icon={Activity}
          delay={0.4}
          subtitle="Total burned"
        />
        <StatCard
          title="Current Weight"
          value={`${stats.currentWeight} KG`}
          icon={TrendingUp}
          delay={0.5}
          subtitle="Latest measurement"
        />
        <StatCard
          title="Goal"
          value={profile.goal}
          icon={CheckCircle}
          delay={0.6}
          subtitle="Fitness objective"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-card border border-white/5 rounded-xl p-6"
        >
          <h3 className="text-xl font-display font-bold text-white mb-4 uppercase">Today's Focus</h3>
          {workoutPlan ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="text-primary" size={20} />
                <span className="text-white font-bold">{workoutPlan.schedule[0].dayName}</span>
              </div>
              <div className="text-2xl font-display font-bold text-primary uppercase">
                {workoutPlan.schedule[0].focus}
              </div>
              <div className="space-y-2">
                {workoutPlan.schedule[0].exercises.slice(0, 3).map((ex, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <Dumbbell className="text-gray-400" size={16} />
                    <span className="text-gray-300">{ex.name}</span>
                    <span className="text-gray-500 ml-auto">{ex.sets} × {ex.reps}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Dumbbell className="mx-auto text-gray-600 mb-4" size={48} />
              <p className="text-gray-400">No workout plan available</p>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-card border border-white/5 rounded-xl p-6"
        >
          <h3 className="text-xl font-display font-bold text-white mb-4 uppercase">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Profile</span>
              <span className="text-white font-bold">{profile.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Age</span>
              <span className="text-white font-bold">{profile.age} years</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Height</span>
              <span className="text-white font-bold">{profile.height} cm</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Diet Type</span>
              <span className="text-white font-bold">{profile.dietType}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;