import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, WorkoutPlan, Exercise, DailyLog } from '../types';
import { geminiService } from '../services/geminiService';
import { Dumbbell, Clock, Repeat, RotateCcw, ChevronDown, ChevronUp, Zap, Sparkles, CheckCircle, Play, Pause, Timer, Target, Award, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import WorkoutChart from './WorkoutChart';

interface Props {
  profile: UserProfile;
  plan: WorkoutPlan | null;
  setPlan: (plan: WorkoutPlan) => Promise<void> | void;
  logs: DailyLog[];
  onUpdateLogs: (logs: DailyLog[]) => Promise<void> | void;
}

interface ExerciseCardProps {
  exercise: Exercise;
  exerciseId: string;
  dayName: string;
}

const WorkoutView: React.FC<Props> = ({ profile, plan, setPlan, logs, onUpdateLogs }) => {
  const [loading, setLoading] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [currentWorkout, setCurrentWorkout] = useState<string | null>(null);
  const [workoutTimer, setWorkoutTimer] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const toggleExerciseComplete = async (exerciseId: string) => {
    const newSet = new Set(completedExercises);
    if (newSet.has(exerciseId)) {
      newSet.delete(exerciseId);
    } else {
      newSet.add(exerciseId);
    }
    setCompletedExercises(newSet);

    // Save workout log via parent callback
    const today = new Date().toDateString();
    const updatedLogs = [...logs];
    const todayLogIndex = updatedLogs.findIndex((log: any) => log.date === today);

    if (todayLogIndex >= 0) {
      updatedLogs[todayLogIndex] = {
        ...updatedLogs[todayLogIndex],
        workoutCompleted: newSet.size > 0
      };
    } else {
      updatedLogs.push({
        date: today,
        workoutCompleted: newSet.size > 0,
        waterIntake: 0,
        sleepHours: 0,
        mood: 'Good'
      });
    }

    await onUpdateLogs(updatedLogs);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setWorkoutTimer((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isTimerRunning]);

  const toggleTimer = (dayName: string) => {
    if (currentWorkout === dayName && isTimerRunning) {
      setIsTimerRunning(false);
    } else {
      if (currentWorkout !== dayName) {
        setCurrentWorkout(dayName);
        setWorkoutTimer(0);
      }
      setIsTimerRunning(true);
    }
  };

  const generate = async () => {
    setLoading(true);
    try {
      const newPlan = await geminiService.generateWorkout(profile);
      await setPlan(newPlan);
    } catch (e) {
      console.error(e);
      alert("Failed to generate workout. Please check your API key.");
    } finally {
      setLoading(false);
    }
  };

  const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, exerciseId, dayName }) => {
    const isCompleted = completedExercises.has(exerciseId);
    const [imageExpanded, setImageExpanded] = useState(false);

    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
        className={`rounded-lg overflow-hidden mb-4 border transition-all ${isCompleted
          ? 'bg-green-500/10 border-green-500/50'
          : 'bg-black/40 border-white/10 hover:bg-white/5 hover:border-primary/50'
          }`}
      >
        <div className="flex flex-col md:flex-row">
          {/* Exercise Image */}
          {exercise.imageUrl && (
            <div
              className="md:w-48 h-48 md:h-auto relative overflow-hidden cursor-pointer group"
              onClick={() => setImageExpanded(!imageExpanded)}
            >
              <img
                src={exercise.imageUrl}
                alt={exercise.name}
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop'; // Fallback to gym background
                }}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-3">
                <span className="text-[10px] uppercase font-bold bg-primary/90 text-black px-2 py-1 rounded">
                  {exercise.muscleGroup}
                </span>
              </div>
            </div>
          )}

          {/* Exercise Details */}
          <div className="flex-1 p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3 flex-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExerciseComplete(exerciseId);
                  }}
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${isCompleted
                    ? 'bg-green-500 border-green-500 text-black'
                    : 'border-gray-500 hover:border-primary'
                    }`}
                >
                  {isCompleted && <CheckCircle size={14} />}
                </button>
                <div className="flex-1">
                  <h4 className={`font-bold text-lg font-display tracking-wide ${isCompleted ? 'line-through text-gray-400' : 'text-white'}`}>
                    {exercise.name}
                  </h4>
                  {exercise.recommendedWeight && (
                    <p className="text-xs text-primary font-mono mt-1">
                      💪 Recommended: {exercise.recommendedWeight}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-3 font-mono text-sm">
              <div className="bg-black/30 rounded p-2 border border-white/5">
                <div className="flex items-center gap-1 text-gray-400 text-xs mb-1">
                  <Repeat size={12} className="text-primary" />
                  <span>Sets</span>
                </div>
                <div className="text-white font-bold">{exercise.sets}</div>
              </div>
              <div className="bg-black/30 rounded p-2 border border-white/5">
                <div className="flex items-center gap-1 text-gray-400 text-xs mb-1">
                  <Dumbbell size={12} className="text-primary" />
                  <span>Reps</span>
                </div>
                <div className="text-white font-bold">{exercise.reps}</div>
              </div>
              <div className="bg-black/30 rounded p-2 border border-white/5">
                <div className="flex items-center gap-1 text-gray-400 text-xs mb-1">
                  <Clock size={12} className="text-primary" />
                  <span>Rest</span>
                </div>
                <div className="text-white font-bold">{exercise.rest}</div>
              </div>
            </div>

            {/* Notes */}
            {exercise.notes && (
              <div className="text-xs text-gray-400 bg-black/20 rounded p-3 border border-white/5 flex gap-2 items-start">
                <div className="w-1 h-1 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
                <span className="italic">{exercise.notes}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  if (!plan && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] p-6 text-center relative overflow-hidden">
        {/* Background Element */}
        <div className="absolute inset-0 z-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-transparent z-0"></div>

        <div className="relative z-10 max-w-lg">
          <div className="w-24 h-24 bg-card border border-primary rounded-full flex items-center justify-center mb-8 mx-auto shadow-[0_0_30px_rgba(255,94,0,0.3)]">
            <Zap size={48} className="text-primary" />
          </div>
          <h2 className="text-5xl font-display font-bold text-white mb-4 uppercase">No Plan Detected</h2>
          <p className="text-gray-400 mb-8 text-lg">
            Initialize the AI to generate a tactical {profile.daysAvailable}-day split based on your physiology and goals.
          </p>
          <button
            onClick={generate}
            className="bg-primary hover:bg-orange-600 text-black px-10 py-5 rounded font-display font-bold text-xl uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-105"
          >
            Generate Protocol
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)]">
        <div className="w-20 h-20 border-4 border-gray-800 border-t-primary rounded-full animate-spin mb-6"></div>
        <p className="text-white font-display font-bold text-2xl uppercase animate-pulse">Constructing Regimen...</p>
        <p className="text-primary text-sm mt-2 font-mono tracking-widest">ANALYZING BIOMETRICS</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 pb-32 max-w-7xl mx-auto">
      {/* Premium Header with Stats */}
      <div className="bg-gradient-to-r from-card via-card to-black border border-white/5 rounded-xl p-6 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2070&auto=format&fit=crop')] bg-cover opacity-5"></div>
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Award className="text-primary" size={24} />
                <span className="text-primary text-sm font-bold uppercase tracking-widest">Premium Protocol</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white uppercase leading-tight">{plan?.splitName}</h1>
              <p className="text-gray-400 max-w-2xl mt-3 text-sm sm:text-base">{plan?.description}</p>

              {/* Progress Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <div className="bg-black/30 rounded p-3 border border-white/10">
                  <div className="text-primary text-2xl font-bold">{completedExercises.size}</div>
                  <div className="text-xs text-gray-400 uppercase">Exercises Done</div>
                </div>
                <div className="bg-black/30 rounded p-3 border border-white/10">
                  <div className="text-green-400 text-2xl font-bold">
                    {plan ? Math.round((completedExercises.size / plan.schedule.reduce((acc, day) => acc + day.exercises.length, 0)) * 100) : 0}%
                  </div>
                  <div className="text-xs text-gray-400 uppercase">Complete</div>
                </div>
                <div className="bg-black/30 rounded p-3 border border-white/10">
                  <div className="text-blue-400 text-2xl font-bold">{currentWorkout ? formatTime(workoutTimer) : '00:00'}</div>
                  <div className="text-xs text-gray-400 uppercase">Current Session</div>
                </div>
                <div className="bg-black/30 rounded p-3 border border-white/10">
                  <div className="text-purple-400 text-2xl font-bold">
                    {plan?.schedule.filter(day => completedExercises.size >= day.exercises.length).length || 0}
                  </div>
                  <div className="text-xs text-gray-400 uppercase">Days Finished</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={generate}
                className="text-xs bg-card hover:bg-white/10 border border-white/10 text-white px-4 sm:px-6 py-3 rounded uppercase font-bold tracking-wider transition-colors flex items-center gap-2"
              >
                <RotateCcw size={14} /> Regenerate
              </button>
              <button className="text-xs bg-primary hover:bg-orange-600 text-black px-4 sm:px-6 py-3 rounded uppercase font-bold tracking-wider transition-colors flex items-center gap-2">
                <TrendingUp size={14} /> View Analytics
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Workout Analytics Charts */}
      <WorkoutChart plan={plan} />

      <div className="grid gap-4 sm:gap-6">
        {plan?.schedule.map((day, index) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            key={index}
            className="bg-card border border-white/5 rounded-xl overflow-hidden shadow-lg"
          >
            <button
              onClick={() => setExpandedDay(expandedDay === day.dayName ? null : day.dayName)}
              className={`w-full p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between transition-all duration-300 ${expandedDay === day.dayName ? 'bg-white/5' : 'hover:bg-white/5'}`}
            >
              <div className="text-left flex-1 w-full sm:w-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-display font-bold text-white text-xl sm:text-2xl uppercase">{day.dayName}</h3>
                    {currentWorkout === day.dayName && (
                      <div className="flex items-center gap-2 bg-primary/20 px-3 py-1 rounded-full animate-pulse">
                        <Timer size={14} className="text-primary" />
                        <span className="text-xs font-mono text-primary font-bold">{formatTime(workoutTimer)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleTimer(day.dayName); }}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono transition-colors ${
                        currentWorkout === day.dayName && isTimerRunning
                          ? 'bg-primary/20 text-primary border border-primary/30'
                          : 'text-gray-500 border border-white/10 hover:text-primary hover:border-primary/30'
                      }`}
                      aria-label={currentWorkout === day.dayName && isTimerRunning ? 'Pause timer' : 'Start timer'}
                    >
                      {currentWorkout === day.dayName && isTimerRunning ? <Pause size={12} /> : <Play size={12} />}
                      {currentWorkout === day.dayName ? formatTime(workoutTimer) : 'TIMER'}
                    </button>
                    <span className="text-xs text-gray-500 font-mono border border-white/10 px-2 py-1 rounded">{day.exercises.length} EXERCISES</span>
                    <span className="text-xs text-green-400 font-mono border border-green-500/30 px-2 py-1 rounded bg-green-500/10">
                      {Array.from(completedExercises).filter((id: string) => id.startsWith(`${day.dayName}-`)).length} / {day.exercises.length} DONE
                    </span>
                  </div>
                </div>
              </div>
            </button>

            <AnimatePresence>
              {expandedDay === day.dayName && (
                <motion.div
                  initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                  className="overflow-hidden bg-black/20"
                >
                  <div className="p-6 pt-2 border-t border-white/5">
                    <div className="h-4"></div>
                    {day.exercises.map((ex, i) => (
                      <ExerciseCard
                        key={i}
                        exercise={ex}
                        exerciseId={`${day.dayName}-${i}`}
                        dayName={day.dayName}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default WorkoutView;