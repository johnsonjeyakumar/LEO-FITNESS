import React, { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { UserProfile, WorkoutPlan, WorkoutSession, DailyLog, NutritionEntry, Note, ProgressEntry } from './types';
import IntroAnimation from './components/IntroAnimation';
import { LayoutDashboard, Dumbbell, Apple, MessageSquare, BookOpen, BarChart3, Menu, X, Lightbulb, LogOut, Loader2, Activity, Trophy, Calendar, Download } from 'lucide-react';

// Authentication imports
import { AuthProvider, useAuth } from './services/AuthContext';
import { firestoreService } from './services/firestoreService';
import { gamificationService } from './services/gamificationService';

// Lazy loading heavy view components for bundle optimization
const Onboarding = lazy(() => import('./components/OnboardingFlow'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const WorkoutView = lazy(() => import('./components/WorkoutView'));
const Nutrition = lazy(() => import('./components/Nutrition'));
const AICoach = lazy(() => import('./components/AICoach'));
const Notepad = lazy(() => import('./components/Notepad'));
const Analytics = lazy(() => import('./components/Analytics'));
const Progress = lazy(() => import('./components/Progress'));
const Achievements = lazy(() => import('./components/Achievements'));
const CalendarView = lazy(() => import('./components/CalendarView'));
const ExportCenter = lazy(() => import('./components/ExportCenter'));

const Login = lazy(() => import('./components/Login'));
const SignUp = lazy(() => import('./components/SignUp'));
const ForgotPassword = lazy(() => import('./components/ForgotPassword'));

const LoadingSkeleton = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500 space-y-4">
    <Loader2 className="animate-spin text-primary w-12 h-12" />
    <span className="font-display font-bold uppercase tracking-wider text-xs">Initiating Protocol...</span>
  </div>
);

const AppContent: React.FC = () => {
  const { currentUser, userProfile, loading, logout, updateProfileData } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'signup' | 'forgot-password'>('login');
  
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [nutritionEntries, setNutritionEntries] = useState<NutritionEntry[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [coachNotepad, setCoachNotepad] = useState<string>('');
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([]);
  
  const [view, setView] = useState<'dashboard' | 'workout' | 'nutrition' | 'coach' | 'analytics' | 'notepad' | 'progress' | 'achievements' | 'calendar' | 'export'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showIntro, setShowIntro] = useState(false); // Default to false
  const [isEditing, setIsEditing] = useState(false); // New state for editing

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) {
        setPlan(null);
        setSessions([]);
        setLogs([]);
        setNutritionEntries([]);
        setNotes([]);
        setCoachNotepad('');
        setProgressEntries([]);
        return;
      }
      setPlanLoading(true);
      try {
        // 1. Fetch Plan
        let currentPlan = await firestoreService.getWorkoutPlan(currentUser.uid);
        if (!currentPlan) {
          const localPlanStr = localStorage.getItem('iron_ai_plan');
          if (localPlanStr) {
            try {
              const localPlan = JSON.parse(localPlanStr);
              if (localPlan) {
                await firestoreService.saveWorkoutPlan(currentUser.uid, localPlan);
                currentPlan = localPlan;
              }
            } catch (e) {}
          }
        }
        setPlan(currentPlan);

        // 2. Fetch Sessions
        let userSessions = await firestoreService.getWorkoutSessions(currentUser.uid);
        if (userSessions.length === 0) {
          const localSessionsStr = localStorage.getItem('iron_ai_sessions');
          if (localSessionsStr) {
            try {
              const localSessions = JSON.parse(localSessionsStr);
              if (Array.isArray(localSessions) && localSessions.length > 0) {
                for (const s of localSessions) {
                  await firestoreService.saveWorkoutSession(currentUser.uid, s);
                }
                userSessions = localSessions;
              }
            } catch (e) {}
          }
        }
        setSessions(userSessions);

        // 3. Fetch Daily Logs
        let userLogs = await firestoreService.getDailyLogs(currentUser.uid);
        if (userLogs.length === 0) {
          const localLogsStr = localStorage.getItem('iron_ai_logs');
          if (localLogsStr) {
            try {
              const localLogs = JSON.parse(localLogsStr);
              if (Array.isArray(localLogs) && localLogs.length > 0) {
                for (const l of localLogs) {
                  await firestoreService.saveDailyLog(currentUser.uid, l);
                }
                userLogs = localLogs;
              }
            } catch (e) {}
          }
        }
        setLogs(userLogs);

        // 4. Fetch Nutrition
        let userNutrition = await firestoreService.getNutritionEntries(currentUser.uid);
        if (userNutrition.length === 0) {
          const local1Str = localStorage.getItem('nutrition_entries');
          const local2Str = localStorage.getItem('iron_ai_nutrition');
          let localEntries: any[] = [];
          try {
            if (local1Str) localEntries = JSON.parse(local1Str);
          } catch (e) {}
          try {
            if (local2Str) {
              const local2 = JSON.parse(local2Str);
              if (Array.isArray(local2)) {
                local2.forEach(item => {
                  if (!localEntries.some(e => e.id === item.id)) {
                    localEntries.push(item);
                  }
                });
              }
            }
          } catch (e) {}
          if (localEntries.length > 0) {
            for (const entry of localEntries) {
              await firestoreService.saveNutritionEntry(currentUser.uid, entry);
            }
            userNutrition = localEntries;
          }
        }
        setNutritionEntries(userNutrition);

        // 5. Fetch Notes
        let userNotes = await firestoreService.getNotes(currentUser.uid);
        if (userNotes.length === 0) {
          const localNotesStr = localStorage.getItem('iron_ai_notes');
          if (localNotesStr) {
            try {
              const localNotes = JSON.parse(localNotesStr);
              if (Array.isArray(localNotes) && localNotes.length > 0) {
                for (const n of localNotes) {
                  await firestoreService.saveNote(currentUser.uid, n);
                }
                userNotes = localNotes;
              }
            } catch (e) {}
          }
        }
        setNotes(userNotes);

        // 6. Fetch Coach Notepad
        let notepadContent = await firestoreService.getCoachNotepad(currentUser.uid);
        if (!notepadContent) {
          const localNotepad = localStorage.getItem('iron_ai_notepad');
          if (localNotepad) {
            await firestoreService.saveCoachNotepad(currentUser.uid, localNotepad);
            notepadContent = localNotepad;
          }
        }
        setCoachNotepad(notepadContent);

        // 7. Fetch Progress Entries
        let userProgress = await firestoreService.getProgressEntries(currentUser.uid);
        if (userProgress.length === 0) {
          const localProgressStr = localStorage.getItem('iron_ai_progress');
          if (localProgressStr) {
            try {
              const localProgress = JSON.parse(localProgressStr);
              if (Array.isArray(localProgress) && localProgress.length > 0) {
                for (const p of localProgress) {
                  await firestoreService.saveProgressEntry(currentUser.uid, p);
                }
                userProgress = localProgress;
              }
            } catch (e) {}
          }
        }
        setProgressEntries(userProgress);

      } catch (error) {
        console.error('Failed to load user data from Firestore:', error);
      } finally {
        setPlanLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  const handleSetPlan = useCallback(async (newPlan: WorkoutPlan) => {
    setPlan(newPlan);
    if (currentUser) {
      try {
        await firestoreService.saveWorkoutPlan(currentUser.uid, newPlan);
        localStorage.setItem('iron_ai_plan', JSON.stringify(newPlan));
      } catch (error) {
        console.error('Failed to save workout plan to Firestore:', error);
        localStorage.setItem('iron_ai_plan', JSON.stringify(newPlan));
      }
    } else {
      localStorage.setItem('iron_ai_plan', JSON.stringify(newPlan));
    }
  }, [currentUser]);

  const handleUpdateLogs = useCallback(async (updatedLogs: DailyLog[]) => {
    setLogs(updatedLogs);
    localStorage.setItem('iron_ai_logs', JSON.stringify(updatedLogs));
    if (currentUser) {
      try {
        const today = new Date().toDateString();
        const todayLog = updatedLogs.find(l => l.date === today);
        if (todayLog) {
          await firestoreService.saveDailyLog(currentUser.uid, todayLog);
        }
        // Silently update gamification in background
        await gamificationService.updateGamificationData(currentUser.uid);
      } catch (e) {
        console.error('Failed to save daily log or update gamification in Firestore:', e);
      }
    }
  }, [currentUser]);

  const handleUpdateNutritionEntries = useCallback(async (updatedEntries: NutritionEntry[]) => {
    setNutritionEntries(updatedEntries);
    localStorage.setItem('nutrition_entries', JSON.stringify(updatedEntries));
    if (currentUser) {
      gamificationService.updateGamificationData(currentUser.uid).catch(console.error);
    }
  }, [currentUser]);

  const handleUpdateNotes = useCallback(async (updatedNotes: Note[]) => {
    setNotes(updatedNotes);
    localStorage.setItem('iron_ai_notes', JSON.stringify(updatedNotes));
  }, []);

  const handleUpdateProgressEntries = useCallback(async (updatedProgress: ProgressEntry[]) => {
    setProgressEntries(updatedProgress);
    localStorage.setItem('iron_ai_progress', JSON.stringify(updatedProgress));
    if (currentUser) {
      gamificationService.updateGamificationData(currentUser.uid).catch(console.error);
    }
  }, [currentUser]);

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
    sessionStorage.setItem('intro_shown', 'true');
  }, []);

  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem('intro_shown');
    if (hasSeenIntro) {
      setShowIntro(false);
    }
  }, []);

  const handleOnboardingComplete = useCallback(async (newProfile: UserProfile) => {
    try {
      // Save profile to Firestore
      await updateProfileData({
        ...newProfile,
        completedOnboarding: true,
        onboardingCompleted: true
      });
      setIsEditing(false); // Exit edit mode if applicable

      // Play intro ONLY if it's a new user (not editing)
      if (!isEditing) {
        setShowIntro(true);
      }
    } catch (error) {
      console.error('Failed to save onboarding details to Firestore:', error);
      alert('Failed to save details. Please try again.');
    }
  }, [updateProfileData, isEditing]);

  const handleLogout = useCallback(async () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      try {
        await logout();
        setView('dashboard'); // reset default view
      } catch (error) {
        console.error('Failed to log out:', error);
      }
    }
  }, [logout]);

  // Loading state with premium styling
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin text-primary mb-4" size={48} />
        <span className="font-display font-bold text-xl uppercase tracking-widest text-primary animate-pulse">
          INITIALIZING PROTOCOLS...
        </span>
      </div>
    );
  }

  // Unauthenticated user - show Auth views
  if (!currentUser) {
    return (
      <Suspense fallback={<LoadingSkeleton />}>
        {authView === 'login' && <Login setAuthView={setAuthView} />}
        {authView === 'signup' && <SignUp setAuthView={setAuthView} />}
        {authView === 'forgot-password' && <ForgotPassword setAuthView={setAuthView} />}
      </Suspense>
    );
  }

  // Authenticated user but onboarding not completed (or is editing profile)
  if (!userProfile?.completedOnboarding || isEditing) {
    return (
      <Suspense fallback={<LoadingSkeleton />}>
        <Onboarding
          onComplete={handleOnboardingComplete}
          initialData={isEditing ? userProfile : undefined}
          mode={isEditing ? 'edit' : 'create'}
        />
      </Suspense>
    );
  }

  const NavItem = ({ id, icon: Icon, label }: any) => (
    <button
      onClick={() => {
        setView(id);
        setMobileMenuOpen(false);
      }}
      className={`flex items-center gap-3 w-full p-4 rounded transition-all group ${view === id
        ? 'bg-white/10 text-white border-r-2 border-primary'
        : 'text-gray-400 hover:bg-white/5 hover:text-white'
        }`}
    >
      <Icon size={20} className={view === id ? "text-primary" : "group-hover:text-white"} />
      <span className="font-display font-bold uppercase tracking-wider text-sm">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-black flex text-slate-200 font-sans selection:bg-primary selection:text-black">
      {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}
      
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-72 border-r border-white/10 bg-black p-6 fixed h-full z-20">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-10 h-10 bg-primary rounded flex items-center justify-center font-display font-bold text-2xl text-black">L</div>
          <span className="text-2xl font-display font-bold text-white tracking-tighter uppercase">LEO <span className="text-primary">.AI</span></span>
        </div>

        <nav className="space-y-2 flex-1">
          <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem id="workout" icon={Dumbbell} label="Workouts" />
          <NavItem id="nutrition" icon={Apple} label="Nutrition" />
          <NavItem id="coach" icon={MessageSquare} label="Leo Coach" />
          <NavItem id="progress" icon={Activity} label="Progress" />
          <NavItem id="analytics" icon={BarChart3} label="Analytics" />
          <NavItem id="achievements" icon={Trophy} label="Achievements" />
          <NavItem id="notepad" icon={BookOpen} label="Notepad" />
          <NavItem id="calendar" icon={Calendar} label="Calendar" />
          <NavItem id="export" icon={Download} label="Export Data" />
        </nav>

        <div className="pt-6 border-t border-white/10 space-y-4">
          <div className="px-3 py-2 bg-white/5 rounded-xl border border-white/5 mb-2 flex items-center gap-3">
            <img 
              src={userProfile?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.name || 'User')}&background=ff5e00&color=fff`} 
              className="w-8 h-8 rounded-full border border-primary" 
              alt="Profile"
            />
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">{userProfile?.name}</p>
              <p className="text-[10px] text-gray-500 truncate">{currentUser.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full p-3 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
          >
            <LogOut size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Log Out</span>
          </button>
          
          <button
            onClick={() => {
              setIsEditing(true);
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-3 w-full p-3 text-gray-500 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            <div className="w-[18px] flex justify-center"><i className="w-1 h-3 border-2 border-current rounded-sm"></i></div>
            <span className="text-xs font-bold uppercase tracking-wider">Edit Profile</span>
          </button>
          
          <button
            onClick={() => setShowSuggestions(true)}
            className="flex items-center gap-3 w-full p-3 text-gray-500 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            <Lightbulb size={18} className="text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider">Project Info</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 w-full bg-black/90 backdrop-blur-md border-b border-white/10 z-30 p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center font-display font-bold text-lg text-black">L</div>
          <span className="text-xl font-display font-bold text-white uppercase">LEOO</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white" aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/95 z-20 pt-24 p-6 lg:hidden">
          <nav className="space-y-4">
            <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem id="workout" icon={Dumbbell} label="Workouts" />
            <NavItem id="nutrition" icon={Apple} label="Nutrition" />
            <NavItem id="coach" icon={MessageSquare} label="Leo Coach" />
            <NavItem id="progress" icon={Activity} label="Progress" />
            <NavItem id="achievements" icon={Trophy} label="Achievements" />
            <NavItem id="notepad" icon={BookOpen} label="Notepad" />
            <NavItem id="calendar" icon={Calendar} label="Calendar" />
            <NavItem id="export" icon={Download} label="Export Data" />
            
            <div className="pt-6 border-t border-white/10 mt-8 flex items-center gap-3">
              <img 
                src={userProfile?.profileImage} 
                className="w-10 h-10 rounded-full border border-primary" 
                alt="Profile"
              />
              <div>
                <p className="text-sm font-bold text-white">{userProfile?.name}</p>
                <p className="text-xs text-gray-500">{currentUser.email}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full p-4 text-red-500 border border-red-900/30 rounded mt-4"
            >
              <LogOut size={20} />
              <span className="font-display font-bold uppercase">Log Out</span>
            </button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 pt-20 lg:pt-0 min-h-screen relative overflow-x-hidden">
        {/* Background Texture */}
        <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-40 pointer-events-none z-0"></div>

        <div className="relative z-10">
          <Suspense fallback={<LoadingSkeleton />}>
            {view === 'dashboard' && <Dashboard profile={userProfile} workoutPlan={plan} logs={logs} nutritionEntries={nutritionEntries} />}
            {view === 'workout' && <WorkoutView profile={userProfile} plan={plan} setPlan={handleSetPlan} logs={logs} onUpdateLogs={handleUpdateLogs} />}
            {view === 'nutrition' && <Nutrition profile={userProfile} entries={nutritionEntries} onUpdateEntries={handleUpdateNutritionEntries} />}
            {view === 'coach' && <div className="py-6"><AICoach profile={userProfile} /></div>}
            {view === 'progress' && <Progress profile={userProfile} entries={progressEntries} onUpdateEntries={handleUpdateProgressEntries} />}
            {view === 'analytics' && <Analytics profile={userProfile} />}
            {view === 'achievements' && <Achievements profile={userProfile} />}
            {view === 'notepad' && <Notepad notes={notes} onUpdateNotes={handleUpdateNotes} />}
            {view === 'calendar' && <CalendarView profile={userProfile} sessions={sessions} logs={logs} nutritionEntries={nutritionEntries} progressEntries={progressEntries} />}
            {view === 'export' && <ExportCenter profile={userProfile} sessions={sessions} logs={logs} nutritionEntries={nutritionEntries} progressEntries={progressEntries} />}
          </Suspense>
        </div>
      </main>

      {/* Suggestions Modal */}
      {showSuggestions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="bg-card border border-white/10 rounded-xl max-w-lg w-full p-8 shadow-2xl relative">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-display font-bold text-white uppercase">Naan Thanda Leo</h2>
              <button onClick={() => setShowSuggestions(false)} className="text-gray-400 hover:text-white" aria-label="Close suggestions"><X /></button>
            </div>
            <p className="text-gray-400 mb-6 text-sm leading-relaxed">
              This B.Tech project is engineered to provide an elite fitness experience.
            </p>
            <ul className="space-y-4 text-sm text-gray-300 max-h-[50vh] overflow-y-auto pr-2">
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span><strong>AI-Driven Customization:</strong> Workouts tailored to injuries, equipment, and experience.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span><strong>Advanced Tech Stack:</strong> Built with React, Tailwind, Framer Motion, and Google Gemini 2.5.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span><strong>Future Roadmap:</strong> Computer Vision for form correction and IoT integration for wearables.</span>
              </li>
            </ul>
            <button
              onClick={() => setShowSuggestions(false)}
              className="w-full mt-8 bg-white text-black hover:bg-primary transition-colors py-3 rounded font-bold uppercase tracking-wider"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;