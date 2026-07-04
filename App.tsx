import React, { useState, useEffect } from 'react';
import { UserProfile, WorkoutPlan } from './types';
import Onboarding from './components/OnboardingFlow';
import Dashboard from './components/Dashboard';
import WorkoutView from './components/WorkoutView';
import Nutrition from './components/Nutrition';
import AICoach from './components/AICoach';
import Notepad from './components/Notepad';
import Analytics from './components/Analytics';
import IntroAnimation from './components/IntroAnimation';
import { LayoutDashboard, Dumbbell, Apple, MessageSquare, BookOpen, BarChart3, Menu, X, Lightbulb, LogOut } from 'lucide-react';


const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [view, setView] = useState<'dashboard' | 'workout' | 'nutrition' | 'coach' | 'analytics' | 'notepad'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showIntro, setShowIntro] = useState(false); // Default to false
  const [isEditing, setIsEditing] = useState(false); // New state for editing




  useEffect(() => {
    // Load data from local storage with error handling
    try {
      const savedProfile = localStorage.getItem('iron_ai_profile');
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      }
    } catch (e) {
      console.error("Failed to parse profile", e);
      localStorage.removeItem('iron_ai_profile');
    }

    try {
      const savedPlan = localStorage.getItem('iron_ai_plan');
      if (savedPlan) {
        setPlan(JSON.parse(savedPlan));
      }
    } catch (e) {
      console.error("Failed to parse plan", e);
      localStorage.removeItem('iron_ai_plan');
    }
  }, []);


  const handleIntroComplete = () => {
    setShowIntro(false);
    sessionStorage.setItem('intro_shown', 'true');
  };

  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem('intro_shown');
    if (hasSeenIntro) {
      setShowIntro(false);
    }
  }, []);


  const handleOnboardingComplete = (newProfile: UserProfile) => {
    setProfile(newProfile);
    localStorage.setItem('iron_ai_profile', JSON.stringify(newProfile));
    setIsEditing(false); // Exit edit mode if applicable

    // Play intro ONLY if it's a new user (not editing)
    if (!isEditing) {
      setShowIntro(true);
    }
  };


  const resetApp = () => {
    if (window.confirm("Are you sure you want to reset your profile?")) {
      localStorage.clear();
      window.location.reload();
    }
  }

  if (!profile || isEditing) {
    return (
      <Onboarding
        onComplete={handleOnboardingComplete}
        initialData={isEditing ? profile : undefined}
        mode={isEditing ? 'edit' : 'create'}
      />
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
          <NavItem id="analytics" icon={BarChart3} label="Analytics" />
          <NavItem id="notepad" icon={BookOpen} label="Notepad" />
        </nav>

        <div className="pt-6 border-t border-white/10 space-y-4">
          <button
            onClick={resetApp}
            className="flex items-center gap-3 w-full p-3 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
          >
            <LogOut size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Reset Profile</span>
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
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white">
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
            <NavItem id="notepad" icon={BookOpen} label="Notepad" />
            <button
              onClick={resetApp}
              className="flex items-center gap-3 w-full p-4 text-red-500 border border-red-900/30 rounded mt-8"
            >
              <LogOut size={20} />
              <span className="font-display font-bold uppercase">Reset Profile</span>
            </button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 pt-20 lg:pt-0 min-h-screen relative overflow-x-hidden">
        {/* Background Texture */}
        <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-40 pointer-events-none z-0"></div>

        <div className="relative z-10">
          {view === 'dashboard' && <Dashboard profile={profile} workoutPlan={plan} />}
          {view === 'workout' && <WorkoutView profile={profile} plan={plan} setPlan={(p) => { setPlan(p); setView('workout'); }} />}
          {view === 'nutrition' && <Nutrition profile={profile} />}
          {view === 'coach' && <div className="py-6"><AICoach profile={profile} /></div>}
          {view === 'analytics' && <Analytics profile={profile} />}
          {view === 'notepad' && <Notepad />}
        </div>
      </main>

      {/* Suggestions Modal */}
      {showSuggestions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="bg-card border border-white/10 rounded-xl max-w-lg w-full p-8 shadow-2xl relative">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-display font-bold text-white uppercase">Naan Thanda Leo</h2>
              <button onClick={() => setShowSuggestions(false)} className="text-gray-400 hover:text-white"><X /></button>
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

export default App;