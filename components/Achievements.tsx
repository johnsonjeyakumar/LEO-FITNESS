import React, { useState, useEffect } from 'react';
import { UserProfile, AchievementBadge, WeeklyChallenge, MonthlyMilestone } from '../types';
import { auth } from '../services/firebase';
import { gamificationService } from '../services/gamificationService';
import { Trophy, Flame, Award, Zap, Star, Shield, CheckCircle, Lock, Calendar, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  profile: UserProfile;
}

const Achievements: React.FC<Props> = ({ profile }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    xp: number;
    level: number;
    currentStreak: number;
    longestStreak: number;
    badges: AchievementBadge[];
    weeklyChallenges: WeeklyChallenge[];
    monthlyMilestones: MonthlyMilestone[];
  } | null>(null);

  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  useEffect(() => {
    const fetchGamificationData = async () => {
      const uid = auth.currentUser?.uid;
      if (uid) {
        try {
          const res = await gamificationService.updateGamificationData(uid);
          setData(res);
        } catch (e) {
          console.error('Failed to load achievements:', e);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchGamificationData();
  }, [profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary w-12 h-12" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 lg:p-10 pb-32 max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl lg:text-5xl font-display font-bold text-white uppercase tracking-tight mb-2">
            GOALS & ACHIEVEMENTS
          </h1>
          <p className="text-gray-400">Unlock badges, level up, and maintain your streak protocol</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Trophy className="w-16 h-16 text-gray-700 mb-4" />
          <p className="text-lg font-display font-bold text-white mb-2">No achievements yet</p>
          <p className="text-sm text-gray-500 max-w-md text-center">
            Start logging your workouts, tracking nutrition, and maintaining streaks
            to earn XP, unlock badges, and level up.
          </p>
        </div>
      </div>
    );
  }

  const nextLevelXp = data.level * 500;
  const prevLevelXp = (data.level - 1) * 500;
  const currentLevelProgress = data.xp - prevLevelXp;
  const levelXpRequired = nextLevelXp - prevLevelXp;
  const xpPercentage = Math.min((currentLevelProgress / levelXpRequired) * 100, 100);

  const filteredBadges = data.badges.filter(b => {
    if (filter === 'unlocked') return b.unlocked;
    if (filter === 'locked') return !b.unlocked;
    return true;
  });

  return (
    <div className="p-6 lg:p-10 pb-32 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl lg:text-5xl font-display font-bold text-white uppercase tracking-tight mb-2">
          GOALS & ACHIEVEMENTS
        </h1>
        <p className="text-gray-400">Unlock badges, level up, and maintain your streak protocol</p>
      </div>

      {/* Level Card & Streak Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Level Card */}
        <div className="bg-card border border-white/5 rounded-xl p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Leveling Protocol</span>
              <h2 className="text-3xl font-display font-bold text-white mt-1">LEVEL {data.level}</h2>
            </div>
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
              <Shield size={28} />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2 text-sm">
              <span className="text-gray-400">{data.xp} Total XP</span>
              <span className="text-gray-400">{currentLevelProgress} / {levelXpRequired} XP to Level {data.level + 1}</span>
            </div>
            <div className="w-full bg-gray-800 h-3 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpPercentage}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="bg-primary h-full rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Streak Card */}
        <div className="bg-card border border-white/5 rounded-xl p-6 flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Workout Streaks</span>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-display font-bold text-orange-500">{data.currentStreak}</span>
              <span className="text-gray-400 text-sm">Days Active</span>
            </div>
            <p className="text-xs text-gray-500">Record Streak: {data.longestStreak} days</p>
          </div>
          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              className={`w-20 h-20 rounded-full flex items-center justify-center ${
                data.currentStreak > 0 
                  ? 'bg-orange-500/20 text-orange-500 shadow-lg shadow-orange-500/10' 
                  : 'bg-white/5 text-gray-600'
              }`}
            >
              <Flame size={44} className={data.currentStreak > 0 ? "fill-orange-500/10 animate-pulse" : ""} />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Challenges & Milestones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Weekly Challenges */}
        <div className="bg-card border border-white/5 rounded-xl p-6 space-y-6">
          <h3 className="text-lg font-display font-bold text-white uppercase flex items-center gap-2">
            <Zap className="text-primary" /> Weekly Challenges
          </h3>
          <div className="space-y-4">
            {data.weeklyChallenges.map(challenge => (
              <div key={challenge.id} className="p-4 bg-white/5 rounded-lg border border-white/5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-white">{challenge.title}</h4>
                    <p className="text-xs text-gray-400 mt-1">{challenge.description}</p>
                  </div>
                  {challenge.completed ? (
                    <span className="text-green-400 flex items-center gap-1 text-xs font-bold bg-green-500/10 px-2 py-0.5 rounded-full">
                      <CheckCircle size={12} /> Unlocked
                    </span>
                  ) : (
                    <span className="text-primary flex items-center gap-1 text-xs font-bold bg-primary/10 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>Progress</span>
                    <span>{challenge.progress} / {challenge.target}</span>
                  </div>
                  <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${challenge.completed ? 'bg-green-400' : 'bg-primary'}`}
                      style={{ width: `${(challenge.progress / challenge.target) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Milestones */}
        <div className="bg-card border border-white/5 rounded-xl p-6 space-y-6">
          <h3 className="text-lg font-display font-bold text-white uppercase flex items-center gap-2">
            <Star className="text-primary" /> Monthly Milestones
          </h3>
          <div className="space-y-4">
            {data.monthlyMilestones.map(milestone => (
              <div key={milestone.id} className="p-4 bg-white/5 rounded-lg border border-white/5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-white">{milestone.title}</h4>
                    <p className="text-xs text-gray-400 mt-1">{milestone.description}</p>
                  </div>
                  {milestone.completed ? (
                    <span className="text-green-400 flex items-center gap-1 text-xs font-bold bg-green-500/10 px-2 py-0.5 rounded-full">
                      <CheckCircle size={12} /> Unlocked
                    </span>
                  ) : (
                    <span className="text-primary flex items-center gap-1 text-xs font-bold bg-primary/10 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>Progress</span>
                    <span>{milestone.progress} / {milestone.target}</span>
                  </div>
                  <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${milestone.completed ? 'bg-green-400' : 'bg-primary'}`}
                      style={{ width: `${(milestone.progress / milestone.target) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Badges Dashboard */}
      <div className="bg-card border border-white/5 rounded-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h3 className="text-xl font-display font-bold text-white uppercase flex items-center gap-2">
            <Trophy className="text-primary" /> Achievement Badges
          </h3>
          {/* Filters */}
          <div className="flex gap-2">
            {(['all', 'unlocked', 'locked'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                  filter === f
                    ? 'bg-primary text-black'
                    : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {filteredBadges.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredBadges.map(badge => (
              <div 
                key={badge.id}
                className={`relative p-5 rounded-xl border flex flex-col items-center text-center space-y-4 transition-all duration-300 ${
                  badge.unlocked 
                    ? 'bg-primary/5 border-primary/20 hover:border-primary/40' 
                    : 'bg-black/20 border-white/5 opacity-60'
                }`}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center relative ${
                  badge.unlocked ? 'bg-primary/20 text-primary' : 'bg-white/5 text-gray-500'
                }`}>
                  {badge.unlocked ? <Award size={36} /> : <Lock size={28} />}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white uppercase tracking-wider">{badge.title}</h4>
                  <p className="text-[11px] text-gray-400 mt-2 min-h-[32px] leading-relaxed">{badge.description}</p>
                </div>
                <div className="w-full pt-2 border-t border-white/5 space-y-1">
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>Progress</span>
                    <span>{badge.progress} / {badge.target}</span>
                  </div>
                  <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${badge.unlocked ? 'bg-primary' : 'bg-gray-600'}`}
                      style={{ width: `${(badge.progress / badge.target) * 100}%` }}
                    />
                  </div>
                </div>
                {badge.unlocked && badge.unlockedAt && (
                  <div className="absolute top-2 right-2 text-[8px] text-gray-500 flex items-center gap-1">
                    <Calendar size={10} />
                    {new Date(badge.unlockedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 text-sm">
            No badges match the selected filter.
          </div>
        )}
      </div>
    </div>
  );
};

export default Achievements;
