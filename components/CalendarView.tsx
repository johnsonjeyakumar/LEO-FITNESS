import React, { useState, useEffect } from 'react';
import { UserProfile, WorkoutSession, DailyLog, NutritionEntry, Note, ProgressEntry, AchievementBadge } from '../types';
import { firestoreService } from '../services/firestoreService';
import { auth } from '../services/firebase';
import { ChevronLeft, ChevronRight, Filter, Dumbbell, Apple, Activity, Trophy, Calendar, CheckCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  profile: UserProfile;
  sessions: WorkoutSession[];
  logs: DailyLog[];
  nutritionEntries: NutritionEntry[];
  progressEntries: ProgressEntry[];
}

const CalendarView: React.FC<Props> = ({ profile, sessions, logs, nutritionEntries, progressEntries }) => {
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day; // start on Sunday
    return new Date(today.setDate(diff));
  });

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [achievements, setAchievements] = useState<AchievementBadge[]>([]);
  const [loadingAchievements, setLoadingAchievements] = useState(true);

  // Filters state
  const [filters, setFilters] = useState({
    workouts: true,
    nutrition: true,
    progress: true,
    achievements: true,
  });

  useEffect(() => {
    const fetchAchievements = async () => {
      const uid = auth.currentUser?.uid;
      if (uid) {
        try {
          const res = await firestoreService.getAchievements(uid);
          setAchievements(res);
        } catch (e) {
          console.error('Failed to load achievements in calendar:', e);
        } finally {
          setLoadingAchievements(false);
        }
      }
    };
    fetchAchievements();
  }, []);

  // Format a Date as YYYY-MM-DD local string
  const formatDateString = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Check what activities occurred on a given day
  const getDayActivities = (date: Date) => {
    const dateStr = formatDateString(date);
    const dateReadable = date.toDateString();

    const dayWorkouts = sessions.filter(s => s.date === dateStr);
    const dayDailyLog = logs.find(l => {
      // daily log date is either a raw string date (e.g., 'Thu Jul 16 2026') or ISO YYYY-MM-DD
      const logDate = new Date(l.date).toDateString();
      return logDate === dateReadable;
    });

    const dayNutrition = nutritionEntries.filter(n => {
      const nDate = n.date || new Date(n.timestamp || 0).toISOString().split('T')[0];
      return nDate === dateStr || new Date(nDate).toDateString() === dateReadable;
    });

    const dayProgress = progressEntries.filter(p => p.date === dateStr);
    const dayAchievements = achievements.filter(a => {
      if (!a.unlocked || !a.unlockedAt) return false;
      return new Date(a.unlockedAt).toDateString() === dateReadable;
    });

    return {
      workouts: dayWorkouts,
      dailyLog: dayDailyLog,
      nutrition: dayNutrition,
      progress: dayProgress,
      achievements: dayAchievements,
    };
  };

  // Handlers for Month switching
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Handlers for Week switching
  const handlePrevWeek = () => {
    const newWeek = new Date(currentWeekStart);
    newWeek.setDate(newWeek.getDate() - 7);
    setCurrentWeekStart(newWeek);
  };
  const handleNextWeek = () => {
    const newWeek = new Date(currentWeekStart);
    newWeek.setDate(newWeek.getDate() + 7);
    setCurrentWeekStart(newWeek);
  };

  // Monthly Grid Calculation
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonthDays = [];
  const prevMonthDate = new Date(year, month, 0);
  const totalPrevDays = prevMonthDate.getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    prevMonthDays.push(new Date(year, month - 1, totalPrevDays - i));
  }

  const currentMonthDays = [];
  for (let i = 1; i <= daysInMonth; i++) {
    currentMonthDays.push(new Date(year, month, i));
  }

  const nextMonthDays = [];
  const remainingCells = 42 - (prevMonthDays.length + currentMonthDays.length);
  for (let i = 1; i <= remainingCells; i++) {
    nextMonthDays.push(new Date(year, month + 1, i));
  }

  const allGridDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];

  // Weekly Grid Calculation
  const startOfWeek = new Date(currentWeekStart);
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    weekDays.push(day);
  }

  const selectedActivities = getDayActivities(selectedDate);
  const selectedDateStr = selectedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="p-6 lg:p-10 pb-32 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-white uppercase tracking-tight mb-2">
            Smart Calendar
          </h1>
          <p className="text-gray-400">Audit your historical training sessions, macro intake, and progress logs</p>
        </div>

        {/* View mode switcher */}
        <div className="flex bg-white/5 p-1 rounded-lg border border-white/5">
          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-2 rounded text-xs font-bold uppercase transition-all ${
              viewMode === 'month' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-4 py-2 rounded text-xs font-bold uppercase transition-all ${
              viewMode === 'week' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            Week
          </button>
        </div>
      </div>

      {/* Filter Options */}
      <div className="bg-card border border-white/5 rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between">
        <span className="text-xs text-gray-500 uppercase font-bold tracking-wider flex items-center gap-2">
          <Filter size={14} /> Filter Calendars
        </span>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-xs font-bold text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.workouts}
              onChange={e => setFilters({ ...filters, workouts: e.target.checked })}
              className="accent-primary rounded text-black"
            />
            <span className="flex items-center gap-1"><Dumbbell size={12} className="text-red-400" /> Workouts</span>
          </label>
          <label className="flex items-center gap-2 text-xs font-bold text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.nutrition}
              onChange={e => setFilters({ ...filters, nutrition: e.target.checked })}
              className="accent-primary rounded text-black"
            />
            <span className="flex items-center gap-1"><Apple size={12} className="text-green-400" /> Nutrition</span>
          </label>
          <label className="flex items-center gap-2 text-xs font-bold text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.progress}
              onChange={e => setFilters({ ...filters, progress: e.target.checked })}
              className="accent-primary rounded text-black"
            />
            <span className="flex items-center gap-1"><Activity size={12} className="text-blue-400" /> Progress</span>
          </label>
          <label className="flex items-center gap-2 text-xs font-bold text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.achievements}
              onChange={e => setFilters({ ...filters, achievements: e.target.checked })}
              className="accent-primary rounded text-black"
            />
            <span className="flex items-center gap-1"><Trophy size={12} className="text-yellow-400" /> Achievements</span>
          </label>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Grid panel */}
        <div className="lg:col-span-2 bg-card border border-white/5 rounded-xl p-6 space-y-6">
          {/* Calendar Navigation header */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-display font-bold text-white uppercase">
              {viewMode === 'month' 
                ? currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })
                : `Week of ${startOfWeek.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
              }
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={viewMode === 'month' ? handlePrevMonth : handlePrevWeek} 
                className="p-2 bg-white/5 border border-white/5 rounded-lg text-gray-400 hover:text-white"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={viewMode === 'month' ? handleNextMonth : handleNextWeek} 
                className="p-2 bg-white/5 border border-white/5 rounded-lg text-gray-400 hover:text-white"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Month Mode Calendar Grid */}
          {viewMode === 'month' && (
            <div className="space-y-2">
              {/* Days of Week */}
              <div className="grid grid-cols-7 gap-2 text-center text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
              </div>

              {/* Monthly Days Grid */}
              <div className="grid grid-cols-7 gap-2">
                {allGridDays.map((day, idx) => {
                  const isCurrentMonth = day.getMonth() === month;
                  const isSelected = formatDateString(day) === formatDateString(selectedDate);
                  const isToday = formatDateString(day) === formatDateString(new Date());
                  const dayAct = getDayActivities(day);

                  const hasWorkouts = filters.workouts && (dayAct.workouts.length > 0 || dayAct.dailyLog?.workoutCompleted);
                  const hasNutrition = filters.nutrition && dayAct.nutrition.length > 0;
                  const hasProgress = filters.progress && dayAct.progress.length > 0;
                  const hasAchievements = filters.achievements && dayAct.achievements.length > 0;

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDate(day)}
                      className={`min-h-[70px] p-1.5 rounded-lg border flex flex-col justify-between items-start transition-all ${
                        isSelected 
                          ? 'bg-primary/20 border-primary text-white shadow-lg shadow-primary/5' 
                          : isToday
                          ? 'bg-white/5 border-primary/40 text-white'
                          : isCurrentMonth
                          ? 'bg-white/5 border-white/5 text-gray-300 hover:border-white/10'
                          : 'bg-black/25 border-transparent text-gray-600 cursor-not-allowed hover:bg-black/35'
                      }`}
                    >
                      <span className="text-xs font-bold">{day.getDate()}</span>

                      {/* Small activity dot tags */}
                      <div className="flex flex-wrap gap-1 mt-1 w-full">
                        {hasWorkouts && <span className="w-1.5 h-1.5 rounded-full bg-red-500" title="Workout" />}
                        {hasNutrition && <span className="w-1.5 h-1.5 rounded-full bg-green-500" title="Nutrition" />}
                        {hasProgress && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Progress" />}
                        {hasAchievements && <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" title="Achievement" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Week Mode Calendar List */}
          {viewMode === 'week' && (
            <div className="space-y-4">
              {weekDays.map((day, idx) => {
                const isSelected = formatDateString(day) === formatDateString(selectedDate);
                const isToday = formatDateString(day) === formatDateString(new Date());
                const dayAct = getDayActivities(day);

                const hasWorkouts = filters.workouts && (dayAct.workouts.length > 0 || dayAct.dailyLog?.workoutCompleted);
                const hasNutrition = filters.nutrition && dayAct.nutrition.length > 0;
                const hasProgress = filters.progress && dayAct.progress.length > 0;
                const hasAchievements = filters.achievements && dayAct.achievements.length > 0;

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(day)}
                    className={`w-full p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left transition-all ${
                      isSelected 
                        ? 'bg-primary/20 border-primary shadow-lg shadow-primary/5' 
                        : isToday 
                        ? 'bg-white/5 border-primary/40'
                        : 'bg-white/5 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                        {day.toLocaleDateString(undefined, { weekday: 'long' })}
                      </span>
                      <h4 className="text-base font-bold text-white mt-0.5">
                        {day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </h4>
                    </div>

                    {/* Indicators list */}
                    <div className="flex flex-wrap gap-2">
                      {hasWorkouts && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase bg-red-500/10 text-red-400 px-2.5 py-1 rounded-full border border-red-500/20">
                          <Dumbbell size={10} /> Workout
                        </span>
                      )}
                      {hasNutrition && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase bg-green-500/10 text-green-400 px-2.5 py-1 rounded-full border border-green-500/20">
                          <Apple size={10} /> Nutrition
                        </span>
                      )}
                      {hasProgress && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full border border-blue-500/20">
                          <Activity size={10} /> Progress
                        </span>
                      )}
                      {hasAchievements && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase bg-yellow-500/10 text-yellow-400 px-2.5 py-1 rounded-full border border-yellow-500/20">
                          <Trophy size={10} /> Badge
                        </span>
                      )}
                      {!hasWorkouts && !hasNutrition && !hasProgress && !hasAchievements && (
                        <span className="text-[10px] text-gray-600 uppercase font-bold tracking-wider">No Activity</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Day details panel */}
        <div className="bg-card border border-white/5 rounded-xl p-6 space-y-6">
          <div>
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Daily Protocol Logs</span>
            <h3 className="text-lg font-display font-bold text-white uppercase mt-0.5">{selectedDateStr}</h3>
          </div>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* Workouts detail */}
            {filters.workouts && (selectedActivities.workouts.length > 0 || selectedActivities.dailyLog?.workoutCompleted) && (
              <div className="space-y-2">
                <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Dumbbell size={10} /> Workouts Completed
                </span>
                {selectedActivities.workouts.map(s => (
                  <div key={s.id} className="p-3 bg-white/5 rounded-lg border border-white/5 space-y-2 text-xs">
                    <div className="flex justify-between font-bold text-white">
                      <span>{s.dayName}</span>
                      <span className="text-gray-400">{s.duration} min</span>
                    </div>
                    <ul className="space-y-1 text-gray-400 text-[11px]">
                      {s.exercises.map((ex, i) => (
                        <li key={i} className="flex justify-between">
                          <span>{ex.name}</span>
                          <span>{ex.sets} sets x {ex.reps && ex.reps[0]} reps</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {!selectedActivities.workouts.length && selectedActivities.dailyLog?.workoutCompleted && (
                  <div className="p-3 bg-white/5 rounded-lg border border-white/5 text-xs text-gray-300 flex items-center gap-1.5">
                    <CheckCircle size={14} className="text-green-400" />
                    <span>Workout protocol marked completed</span>
                  </div>
                )}
              </div>
            )}

            {/* Nutrition detail */}
            {filters.nutrition && selectedActivities.nutrition.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Apple size={10} /> Nutrition Entries
                </span>
                {selectedActivities.nutrition.map(n => (
                  <div key={n.id} className="p-3 bg-white/5 rounded-lg border border-white/5 text-xs">
                    <div className="flex justify-between font-bold text-white mb-1">
                      <span>{n.name}</span>
                      <span>{n.calories} kcal</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-400">
                      <span>Protein: {n.protein}g</span>
                      <span>Carbs: {n.carbs}g</span>
                      <span>Fat: {n.fats}g</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Progress detail */}
            {filters.progress && selectedActivities.progress.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Activity size={10} /> Progress logs
                </span>
                {selectedActivities.progress.map(p => (
                  <div key={p.id} className="p-3 bg-white/5 rounded-lg border border-white/5 text-xs space-y-1.5">
                    <div className="flex justify-between font-bold text-white">
                      <span>Weight: {p.weight} kg</span>
                      {p.bmi && <span>BMI: {p.bmi}</span>}
                    </div>
                    {p.bodyFat && <div className="text-[11px] text-gray-400">Body Fat: {p.bodyFat}%</div>}
                    {p.notes && <p className="text-[10px] text-gray-500 italic mt-1">{p.notes}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Achievements detail */}
            {filters.achievements && selectedActivities.achievements.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Trophy size={10} /> Unlocked Badges
                </span>
                {selectedActivities.achievements.map(a => (
                  <div key={a.id} className="p-3 bg-white/5 rounded-lg border border-white/5 text-xs flex gap-2.5 items-center">
                    <div className="w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center">
                      <Trophy size={16} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs">{a.title}</h4>
                      <p className="text-[10px] text-gray-400">{a.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {(!filters.workouts || (!selectedActivities.workouts.length && !selectedActivities.dailyLog?.workoutCompleted)) &&
             (!filters.nutrition || !selectedActivities.nutrition.length) &&
             (!filters.progress || !selectedActivities.progress.length) &&
             (!filters.achievements || !selectedActivities.achievements.length) && (
              <div className="text-center py-10 text-gray-500 text-xs flex flex-col items-center justify-center gap-2">
                <Info size={24} />
                <span>No activities recorded for this date.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
