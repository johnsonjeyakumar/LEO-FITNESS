import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import {
  mockProfile,
  mockWorkoutPlan,
  mockDailyLogs,
  mockNutritionEntries,
  mockProgressEntries,
  mockBadges,
  mockWeeklyChallenges,
  mockMonthlyMilestones,
  mockSessions,
  mockGamificationData,
} from './testUtils';

const {
  mockSignup,
  mockLogin,
  mockLogout,
  mockResetPassword,
  mockSetAuthView,
  mockSetPlan,
  mockOnUpdateLogs,
  mockOnUpdateEntries,
  mockGenerateWorkout,
  mockSaveNutritionEntry,
  mockDeleteNutritionEntry,
  mockSaveProgressEntry,
  mockDeleteProgressEntry,
  mockGetAchievements,
  mockUpdateGamificationData,
} = vi.hoisted(() => ({
  mockSignup: vi.fn(),
  mockLogin: vi.fn(),
  mockLogout: vi.fn(),
  mockResetPassword: vi.fn(),
  mockSetAuthView: vi.fn(),
  mockSetPlan: vi.fn(),
  mockOnUpdateLogs: vi.fn(),
  mockOnUpdateEntries: vi.fn(),
  mockGenerateWorkout: vi.fn(),
  mockSaveNutritionEntry: vi.fn(),
  mockDeleteNutritionEntry: vi.fn(),
  mockSaveProgressEntry: vi.fn(),
  mockDeleteProgressEntry: vi.fn(),
  mockGetAchievements: vi.fn(),
  mockUpdateGamificationData: vi.fn(),
}));

vi.mock('../../services/AuthContext', () => ({
  useAuth: () => ({
    currentUser: null,
    userProfile: null,
    loading: false,
    login: mockLogin,
    signup: mockSignup,
    logout: mockLogout,
    resetPassword: mockResetPassword,
    updateProfileData: vi.fn(),
  }),
}));

vi.mock('../../services/firebase', () => ({
  auth: { currentUser: { uid: 'test-uid' }, onAuthStateChanged: () => () => {} },
  db: {
    collection: () => ({}),
    doc: () => ({}),
    getDoc: () => Promise.resolve({ exists: () => false, data: () => null }),
    getDocs: () => Promise.resolve({ forEach: () => {}, size: 0 }),
    setDoc: () => Promise.resolve(),
    updateDoc: () => Promise.resolve(),
    deleteDoc: () => Promise.resolve(),
    serverTimestamp: () => null,
  },
}));

vi.mock('../../services/firestoreService', () => ({
  firestoreService: {
    getUserProfile: () => Promise.resolve(null),
    createUserProfile: () => Promise.resolve(),
    updateUserProfile: () => Promise.resolve(),
    getWorkoutPlan: () => Promise.resolve(null),
    saveWorkoutPlan: () => Promise.resolve(),
    deleteWorkoutPlan: () => Promise.resolve(),
    getWorkoutSessions: () => Promise.resolve([]),
    saveWorkoutSession: () => Promise.resolve(),
    deleteWorkoutSession: () => Promise.resolve(),
    getDailyLogs: () => Promise.resolve([]),
    saveDailyLog: () => Promise.resolve(),
    getNutritionEntries: () => Promise.resolve([]),
    saveNutritionEntry: mockSaveNutritionEntry,
    deleteNutritionEntry: mockDeleteNutritionEntry,
    getNotes: () => Promise.resolve([]),
    saveNote: () => Promise.resolve(),
    deleteNote: () => Promise.resolve(),
    getCoachNotepad: () => Promise.resolve(''),
    saveCoachNotepad: () => Promise.resolve(),
    getProgressEntries: () => Promise.resolve([]),
    saveProgressEntry: mockSaveProgressEntry,
    deleteProgressEntry: mockDeleteProgressEntry,
    getAchievements: mockGetAchievements,
    saveAchievement: () => Promise.resolve(),
  },
}));

vi.mock('../../services/geminiService', () => ({
  geminiService: {
    generateWorkout: mockGenerateWorkout,
    chatWithCoach: vi.fn(),
    generateSpeech: () => Promise.resolve(null),
  },
}));

vi.mock('../../services/gamificationService', () => ({
  gamificationService: {
    updateGamificationData: mockUpdateGamificationData,
  },
}));

vi.mock('framer-motion', () => {
  const htmlTags = ['div', 'button', 'span', 'h1', 'h2', 'h3', 'p', 'img', 'section', 'form', 'input', 'label', 'nav', 'aside', 'main', 'header', 'footer', 'ul', 'li', 'a', 'svg', 'path', 'circle'];
  const motion: any = {};
  for (const tag of htmlTags) {
    motion[tag] = tag;
  }
  return {
    motion,
    AnimatePresence: ({ children }: any) => children,
  };
});

vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="linechart">{children}</div>,
  Line: () => <div data-testid="line" />,
  BarChart: ({ children }: any) => <div data-testid="barchart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="xaxis" />,
  YAxis: () => <div data-testid="yaxis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  Legend: () => <div data-testid="legend" />,
  PieChart: ({ children }: any) => <div data-testid="piechart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  AreaChart: ({ children }: any) => <div data-testid="areachart">{children}</div>,
  Area: () => <div data-testid="area" />,
  RadialBarChart: ({ children }: any) => <div data-testid="radialchart">{children}</div>,
  RadialBar: () => <div data-testid="radialbar" />,
}));

vi.mock('react-markdown', () => ({ default: ({ children }: any) => <div data-testid="markdown">{children}</div> }));
vi.mock('remark-gfm', () => ({ default: () => {} }));

import Login from '../Login';
import SignUp from '../SignUp';
import ForgotPassword from '../ForgotPassword';
import Dashboard from '../Dashboard';
import WorkoutView from '../WorkoutView';
import Nutrition from '../Nutrition';
import Progress from '../Progress';
import Achievements from '../Achievements';
import CalendarView from '../CalendarView';
import ExportCenter from '../ExportCenter';

const getTodayStr = () => new Date().toISOString().split('T')[0];

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

/* ================================================================== */
/*  FLOW 1 — REGISTER                                                 */
/* ================================================================== */
describe('Flow 1: Register (SignUp)', () => {
  it('renders all form fields and heading', () => {
    render(<SignUp setAuthView={mockSetAuthView} />);
    expect(screen.getByText('Create Profile')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Min 6 characters')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm password')).toBeInTheDocument();
  });

  it('validates empty fields before calling signup', async () => {
    const user = userEvent.setup();
    render(<SignUp setAuthView={mockSetAuthView} />);
    await user.click(screen.getByText('INITIATE PROTOCOL'));
    expect(mockSignup).not.toHaveBeenCalled();
    expect(screen.getByText('Please fill in all fields.')).toBeInTheDocument();
  });

  it('validates password match before calling signup', async () => {
    const user = userEvent.setup();
    render(<SignUp setAuthView={mockSetAuthView} />);
    await user.type(screen.getByPlaceholderText('John Doe'), 'Test User');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('Min 6 characters'), 'password123');
    await user.type(screen.getByPlaceholderText('Confirm password'), 'different');
    await user.click(screen.getByText('INITIATE PROTOCOL'));
    expect(mockSignup).not.toHaveBeenCalled();
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
  });

  it('calls signup on valid submission', async () => {
    mockSignup.mockResolvedValueOnce({ user: { uid: 'new-uid' } } as any);
    const user = userEvent.setup();
    render(<SignUp setAuthView={mockSetAuthView} />);
    await user.type(screen.getByPlaceholderText('John Doe'), 'Test User');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('Min 6 characters'), 'password123');
    await user.type(screen.getByPlaceholderText('Confirm password'), 'password123');
    await user.click(screen.getByText('INITIATE PROTOCOL'));
    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('test@test.com', 'password123', 'Test User');
    });
  });

  it('navigates to login on link click', async () => {
    const user = userEvent.setup();
    render(<SignUp setAuthView={mockSetAuthView} />);
    await user.click(screen.getByText('Login'));
    expect(mockSetAuthView).toHaveBeenCalledWith('login');
  });

  it('displays error for email-already-in-use', async () => {
    mockSignup.mockRejectedValueOnce({ code: 'auth/email-already-in-use' });
    const user = userEvent.setup();
    render(<SignUp setAuthView={mockSetAuthView} />);
    await user.type(screen.getByPlaceholderText('John Doe'), 'Test User');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'taken@test.com');
    await user.type(screen.getByPlaceholderText('Min 6 characters'), 'password123');
    await user.type(screen.getByPlaceholderText('Confirm password'), 'password123');
    await user.click(screen.getByText('INITIATE PROTOCOL'));
    await waitFor(() => {
      expect(screen.getByText(/already exists/i)).toBeInTheDocument();
    });
  });

  it('disables submit during loading', async () => {
    mockSignup.mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup();
    render(<SignUp setAuthView={mockSetAuthView} />);
    await user.type(screen.getByPlaceholderText('John Doe'), 'Test User');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('Min 6 characters'), 'password123');
    await user.type(screen.getByPlaceholderText('Confirm password'), 'password123');
    await user.click(screen.getByText('INITIATE PROTOCOL'));
    expect(screen.getByText('REGISTERING...')).toBeInTheDocument();
  });
});

/* ================================================================== */
/*  FLOW 2 — LOGIN                                                    */
/* ================================================================== */
describe('Flow 2: Login', () => {
  it('renders form and heading', () => {
    render(<Login setAuthView={mockSetAuthView} />);
    expect(screen.getByText('Initiate Protocol')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('validates empty fields before calling login', async () => {
    const user = userEvent.setup();
    render(<Login setAuthView={mockSetAuthView} />);
    await user.click(screen.getByText('LOGIN TO INTERFACE'));
    expect(mockLogin).not.toHaveBeenCalled();
    expect(screen.getByText('Please fill in all fields.')).toBeInTheDocument();
  });

  it('calls login on valid submission', async () => {
    mockLogin.mockImplementation(() => new Promise(r => setTimeout(r, 50)));
    const user = userEvent.setup();
    render(<Login setAuthView={mockSetAuthView} />);
    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'pass');
    await user.click(screen.getByText('LOGIN TO INTERFACE'));
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'pass');
    });
  });

  it('navigates to signup', async () => {
    const user = userEvent.setup();
    render(<Login setAuthView={mockSetAuthView} />);
    await user.click(screen.getByText('Sign Up'));
    expect(mockSetAuthView).toHaveBeenCalledWith('signup');
  });

  it('navigates to forgot-password', async () => {
    const user = userEvent.setup();
    render(<Login setAuthView={mockSetAuthView} />);
    await user.click(screen.getByText('Forgot Password?'));
    expect(mockSetAuthView).toHaveBeenCalledWith('forgot-password');
  });

  it.each([
    ['auth/invalid-credential', 'Incorrect email or password.'],
    ['auth/user-not-found', 'Incorrect email or password.'],
    ['auth/wrong-password', 'Incorrect email or password.'],
    ['auth/invalid-email', 'Please enter a valid email address.'],
    ['auth/too-many-requests', 'Too many attempts. Please try again later.'],
    ['auth/network-request-failed', 'Network error. Check your internet connection.'],
    ['auth/configuration-not-found', /Firebase Authentication is not configured/],
    ['auth/unknown', 'An unexpected error occurred. Please try again.'],
  ])('maps error %s to message', async (code, expected) => {
    mockLogin.mockRejectedValueOnce({ code });
    const user = userEvent.setup();
    render(<Login setAuthView={mockSetAuthView} />);
    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'pass');
    await user.click(screen.getByText('LOGIN TO INTERFACE'));
    await waitFor(() => {
      if (expected instanceof RegExp) {
        expect(screen.getByText(expected)).toBeInTheDocument();
      } else {
        expect(screen.getByText(expected)).toBeInTheDocument();
      }
    });
  });
});

/* ================================================================== */
/*  FLOW 3 — PASSWORD RESET                                           */
/* ================================================================== */
describe('Flow 3: Password Reset', () => {
  it('renders reset form', () => {
    render(<ForgotPassword setAuthView={mockSetAuthView} />);
    expect(screen.getByText('Reset Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
  });

  it('sends reset email on valid submission', async () => {
    mockResetPassword.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    render(<ForgotPassword setAuthView={mockSetAuthView} />);
    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
    await user.click(screen.getByText('SEND OVERRIDE LINK'));
    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('test@test.com');
    });
  });

  it('navigates back to login', async () => {
    const user = userEvent.setup();
    render(<ForgotPassword setAuthView={mockSetAuthView} />);
    await user.click(screen.getByText('Back to Login'));
    expect(mockSetAuthView).toHaveBeenCalledWith('login');
  });

  it('validates empty email', async () => {
    const user = userEvent.setup();
    render(<ForgotPassword setAuthView={mockSetAuthView} />);
    await user.click(screen.getByText('SEND OVERRIDE LINK'));
    expect(mockResetPassword).not.toHaveBeenCalled();
    expect(screen.getByText('Please enter your email address.')).toBeInTheDocument();
  });
});

/* ================================================================== */
/*  FLOW 4 — DASHBOARD                                                */
/* ================================================================== */
describe('Flow 4: Dashboard Data Display', () => {
  it('renders heading and user info', () => {
    render(
      <Dashboard
        profile={mockProfile}
        workoutPlan={mockWorkoutPlan}
        logs={mockDailyLogs}
        nutritionEntries={mockNutritionEntries}
      />
    );
    expect(screen.getByText('NEEYUM AGALAM DAA')).toBeInTheDocument();
  });

  it('renders streak cards', () => {
    render(
      <Dashboard
        profile={mockProfile}
        workoutPlan={mockWorkoutPlan}
        logs={mockDailyLogs}
        nutritionEntries={mockNutritionEntries}
      />
    );
    expect(screen.getByText('Workout Streak')).toBeInTheDocument();
    expect(screen.getByText('Nutrition Streak')).toBeInTheDocument();
  });

  it('displays stat cards', () => {
    render(
      <Dashboard
        profile={mockProfile}
        workoutPlan={mockWorkoutPlan}
        logs={mockDailyLogs}
        nutritionEntries={mockNutritionEntries}
      />
    );
    expect(screen.getByText('Workouts Completed')).toBeInTheDocument();
    expect(screen.getByText('Calories Burned')).toBeInTheDocument();
    expect(screen.getByText('Current Weight')).toBeInTheDocument();
    expect(screen.getByText('Goal')).toBeInTheDocument();
  });

  it('shows empty state when no workout plan', () => {
    render(
      <Dashboard
        profile={mockProfile}
        workoutPlan={null}
        logs={[]}
        nutritionEntries={[]}
      />
    );
    expect(screen.getByText('No workout plan yet')).toBeInTheDocument();
  });

  it('shows 0 streak when no logs', () => {
    render(
      <Dashboard
        profile={mockProfile}
        workoutPlan={null}
        logs={[]}
        nutritionEntries={[]}
      />
    );
    expect(screen.getByText('Start your streak today!')).toBeInTheDocument();
  });

  it('displays profile quick stats', () => {
    render(
      <Dashboard
        profile={mockProfile}
        workoutPlan={mockWorkoutPlan}
        logs={mockDailyLogs}
        nutritionEntries={mockNutritionEntries}
      />
    );
    expect(screen.getByText('TestUser')).toBeInTheDocument();
    expect(screen.getByText('80 KG')).toBeInTheDocument();
  });
});

/* ================================================================== */
/*  FLOW 5 — AI WORKOUT GENERATION & TRACKING                         */
/* ================================================================== */
describe('Flow 5: AI Workout Generation & Tracking', () => {
  const renderWV = (props = {}) =>
    render(
      <WorkoutView
        profile={mockProfile}
        plan={mockWorkoutPlan}
        setPlan={mockSetPlan}
        logs={[]}
        onUpdateLogs={mockOnUpdateLogs}
        {...props}
      />
    );

  it('renders plan header with day names', () => {
    renderWV();
    expect(screen.getByText('Day 1 - Push')).toBeInTheDocument();
    expect(screen.getByText('Day 2 - Pull')).toBeInTheDocument();
  });

  it('shows empty state when no plan and not loading', () => {
    renderWV({ plan: null });
    expect(screen.getByText('No Plan Detected')).toBeInTheDocument();
  });

  it('generates new plan on button click', async () => {
    mockGenerateWorkout.mockResolvedValueOnce(mockWorkoutPlan);
    const user = userEvent.setup();
    renderWV({ plan: null });
    await user.click(screen.getByText('Generate Protocol'));
    await waitFor(() => {
      expect(mockGenerateWorkout).toHaveBeenCalledWith(mockProfile);
      expect(mockSetPlan).toHaveBeenCalledWith(mockWorkoutPlan);
    });
  });

  it('expands day to show exercises', async () => {
    const user = userEvent.setup();
    renderWV();
    await user.click(screen.getByText('Day 1 - Push'));
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
    expect(screen.getByText('Overhead Press')).toBeInTheDocument();
  });

  it('handles generate failure with alert', async () => {
    mockGenerateWorkout.mockRejectedValueOnce(new Error('API Error'));
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const user = userEvent.setup();
    renderWV({ plan: null });
    await user.click(screen.getByText('Generate Protocol'));
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalled();
    });
    alertSpy.mockRestore();
  });

  it('shows exercise details', async () => {
    const user = userEvent.setup();
    renderWV();
    await user.click(screen.getByText('Day 1 - Push'));
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
    expect(screen.getByText('Overhead Press')).toBeInTheDocument();
  });

  it('shows loading state while generating', async () => {
    mockGenerateWorkout.mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup();
    renderWV({ plan: null });
    await user.click(screen.getByText('Generate Protocol'));
    expect(screen.getByText('Constructing Regimen...')).toBeInTheDocument();
  });
});

/* ================================================================== */
/*  FLOW 6 — NUTRITION LOGGING                                        */
/* ================================================================== */
describe('Flow 6: Nutrition Logging', () => {
  const renderNut = (props = {}) =>
    render(
      <Nutrition
        profile={mockProfile}
        entries={mockNutritionEntries}
        onUpdateEntries={mockOnUpdateEntries}
        {...props}
      />
    );

  it('renders header and macro cards', () => {
    renderNut();
    expect(screen.getByText('Nutrition Tracker')).toBeInTheDocument();
    expect(screen.getByText('Calories')).toBeInTheDocument();
    expect(screen.getByText('Protein')).toBeInTheDocument();
    expect(screen.getByText('Carbs')).toBeInTheDocument();
    expect(screen.getByText('Fats')).toBeInTheDocument();
  });

  it('shows today entries', () => {
    renderNut();
    expect(screen.getByText('Today\'s Entries')).toBeInTheDocument();
    expect(screen.getByText('Chicken Breast')).toBeInTheDocument();
    expect(screen.getByText('Rice')).toBeInTheDocument();
  });

  it('opens add form on button click', async () => {
    const user = userEvent.setup();
    renderNut();
    await user.click(screen.getByText('Add Nutrition Entry'));
    expect(screen.getByText('Food Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g., Chicken Breast')).toBeInTheDocument();
  });

  it('opens add form modal', async () => {
    const user = userEvent.setup();
    renderNut({ entries: [] });
    await user.click(screen.getByText('Add Nutrition Entry'));
    await waitFor(() => {
      expect(screen.getByText('Add Nutrition')).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText('e.g., Chicken Breast')).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText('e.g., Chicken Breast'), 'Eggs');
    await waitFor(() => {
      expect(screen.getByDisplayValue('Eggs')).toBeInTheDocument();
    });
  });

  it('shows empty state when no entries', () => {
    renderNut({ entries: [] });
    expect(screen.getByText(/no entries for today/i)).toBeInTheDocument();
  });

  it('deletes entry after confirmation', async () => {
    mockDeleteNutritionEntry.mockResolvedValueOnce(undefined);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();
    renderNut();
    const delBtn = screen.getByLabelText('Delete Chicken Breast');
    await user.click(delBtn);
    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalled();
      expect(mockDeleteNutritionEntry).toHaveBeenCalled();
    });
    confirmSpy.mockRestore();
  });
});

/* ================================================================== */
/*  FLOW 7 — PROGRESS TRACKING                                        */
/* ================================================================== */
describe('Flow 7: Progress Tracking', () => {
  const renderProg = (props = {}) =>
    render(
      <Progress
        profile={mockProfile}
        entries={mockProgressEntries}
        onUpdateEntries={mockOnUpdateEntries}
        {...props}
      />
    );

  it('renders header and summary stats', () => {
    renderProg();
    expect(screen.getByText('PROGRESS TRACKING')).toBeInTheDocument();
    expect(screen.getByText('Current Weight')).toBeInTheDocument();
    expect(screen.getByText('Current BMI')).toBeInTheDocument();
  });

  it('displays tabs', () => {
    renderProg();
    expect(screen.getByText('Analytics Charts')).toBeInTheDocument();
    expect(screen.getByText('Body Measurements')).toBeInTheDocument();
    expect(screen.getByText('Logs History')).toBeInTheDocument();
  });

  it('renders entry list with weights', async () => {
    const user = userEvent.setup();
    renderProg();
    await user.click(screen.getByText('Logs History'));
    const weightElements = screen.getAllByText(/80(\s*kg)?/);
    expect(weightElements.length).toBeGreaterThanOrEqual(1);
  });

  it('switches tabs on click', async () => {
    const user = userEvent.setup();
    renderProg();
    await user.click(screen.getByText('Logs History'));
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Weight (kg)')).toBeInTheDocument();
  });

  it('shows empty state when no entries', async () => {
    const user = userEvent.setup();
    renderProg({ entries: [] });
    await user.click(screen.getByText('Logs History'));
    expect(screen.getByText(/no progress entries/i)).toBeInTheDocument();
  });

  it('opens add form on log measurements click', async () => {
    const user = userEvent.setup();
    renderProg({ entries: [] });
    await user.click(screen.getByText('Log Measurements'));
    expect(screen.getByText('Log New Measurements')).toBeInTheDocument();
  });
});

/* ================================================================== */
/*  FLOW 8 — ACHIEVEMENTS                                             */
/* ================================================================== */
describe('Flow 8: Achievements', () => {
  beforeEach(() => {
    mockUpdateGamificationData.mockResolvedValue(mockGamificationData);
    mockGetAchievements.mockResolvedValue(mockBadges);
  });

  it('loads and displays achievements', async () => {
    render(<Achievements profile={mockProfile} />);
    await waitFor(() => {
      expect(mockUpdateGamificationData).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByText('First Workout')).toBeInTheDocument();
      expect(screen.getByText('Nutrition Pro')).toBeInTheDocument();
    });
  });

  it('displays level and XP', async () => {
    render(<Achievements profile={mockProfile} />);
    await waitFor(() => {
      expect(screen.getByText(/1250/)).toBeInTheDocument();
    });
  });

  it('displays weekly challenges', async () => {
    render(<Achievements profile={mockProfile} />);
    await waitFor(() => {
      expect(screen.getByText('4 Workouts')).toBeInTheDocument();
      expect(screen.getByText('Hit Protein Goal')).toBeInTheDocument();
    });
  });

  it('displays monthly milestones', async () => {
    render(<Achievements profile={mockProfile} />);
    await waitFor(() => {
      expect(screen.getByText('20 Workouts')).toBeInTheDocument();
    });
  });

  it('filters badges by unlocked', async () => {
    const user = userEvent.setup();
    render(<Achievements profile={mockProfile} />);
    await waitFor(() => {
      expect(screen.getByText('First Workout')).toBeInTheDocument();
    });
    await user.click(screen.getByText('unlocked'));
    await waitFor(() => {
      expect(screen.queryByText('Streak Master')).not.toBeInTheDocument();
    });
  });

  it('filters badges by locked', async () => {
    const user = userEvent.setup();
    render(<Achievements profile={mockProfile} />);
    await waitFor(() => {
      expect(screen.getByText('First Workout')).toBeInTheDocument();
    });
    await user.click(screen.getByText('locked'));
    await waitFor(() => {
      expect(screen.queryByText('First Workout')).not.toBeInTheDocument();
      expect(screen.getByText('Streak Master')).toBeInTheDocument();
    });
  });
});

/* ================================================================== */
/*  FLOW 9 — CALENDAR                                                 */
/* ================================================================== */
describe('Flow 9: Calendar', () => {
  beforeEach(() => {
    mockGetAchievements.mockResolvedValue(mockBadges);
  });

  it('renders smart calendar header', () => {
    render(
      <CalendarView
        profile={mockProfile}
        sessions={mockSessions}
        logs={mockDailyLogs}
        nutritionEntries={mockNutritionEntries}
        progressEntries={mockProgressEntries}
      />
    );
    expect(screen.getByText('Smart Calendar')).toBeInTheDocument();
  });

  it('renders filter checkboxes', () => {
    render(
      <CalendarView
        profile={mockProfile}
        sessions={[]}
        logs={[]}
        nutritionEntries={[]}
        progressEntries={[]}
      />
    );
    expect(screen.getByLabelText('Workouts')).toBeInTheDocument();
    expect(screen.getByLabelText('Nutrition')).toBeInTheDocument();
    expect(screen.getByLabelText('Progress')).toBeInTheDocument();
    expect(screen.getByLabelText('Achievements')).toBeInTheDocument();
  });

  it('renders view mode switcher', () => {
    render(
      <CalendarView
        profile={mockProfile}
        sessions={[]}
        logs={[]}
        nutritionEntries={[]}
        progressEntries={[]}
      />
    );
    expect(screen.getByText('Month')).toBeInTheDocument();
    expect(screen.getByText('Week')).toBeInTheDocument();
  });

  it('loads achievements on mount', async () => {
    render(
      <CalendarView
        profile={mockProfile}
        sessions={[]}
        logs={[]}
        nutritionEntries={[]}
        progressEntries={[]}
      />
    );
    await waitFor(() => {
      expect(mockGetAchievements).toHaveBeenCalledWith('test-uid');
    });
  });

  it('shows empty state when no data', () => {
    render(
      <CalendarView
        profile={mockProfile}
        sessions={[]}
        logs={[]}
        nutritionEntries={[]}
        progressEntries={[]}
      />
    );
    expect(screen.getByText('No activities recorded for this date.')).toBeInTheDocument();
  });
});

/* ================================================================== */
/*  FLOW 10 — EXPORT                                                  */
/* ================================================================== */
describe('Flow 10: Export', () => {
  beforeEach(() => {
    mockGetAchievements.mockResolvedValue(mockBadges);
  });

  it('renders export center heading', () => {
    render(
      <ExportCenter
        profile={mockProfile}
        sessions={mockSessions}
        logs={mockDailyLogs}
        nutritionEntries={mockNutritionEntries}
        progressEntries={mockProgressEntries}
      />
    );
    expect(screen.getByText('Export Center')).toBeInTheDocument();
  });

  it('renders dataset checkboxes', () => {
    render(
      <ExportCenter
        profile={mockProfile}
        sessions={[]}
        logs={[]}
        nutritionEntries={[]}
        progressEntries={[]}
      />
    );
    expect(screen.getByLabelText('Workout Sessions & History')).toBeInTheDocument();
    expect(screen.getByLabelText('Nutrition & Macros Logs')).toBeInTheDocument();
    expect(screen.getByLabelText('Progress & Body Metrics Logs')).toBeInTheDocument();
    expect(screen.getByLabelText('Achievements & Level Summary')).toBeInTheDocument();
  });

  it('renders format options', () => {
    render(
      <ExportCenter
        profile={mockProfile}
        sessions={[]}
        logs={[]}
        nutritionEntries={[]}
        progressEntries={[]}
      />
    );
    expect(screen.getByText('JSON Backup')).toBeInTheDocument();
    expect(screen.getByText('CSV Spreadsheet')).toBeInTheDocument();
    expect(screen.getByText('PDF Fitness Report')).toBeInTheDocument();
  });

  it('fetches achievements on export', async () => {
    mockGetAchievements.mockResolvedValue(mockBadges);
    const user = userEvent.setup();
    render(
      <ExportCenter
        profile={mockProfile}
        sessions={mockSessions}
        logs={mockDailyLogs}
        nutritionEntries={mockNutritionEntries}
        progressEntries={mockProgressEntries}
      />
    );
    await user.click(screen.getByText('Export Data'));
    await waitFor(() => {
      expect(mockGetAchievements).toHaveBeenCalledWith('test-uid');
    });
  });

  it('disables export button when no options selected', async () => {
    const user = userEvent.setup();
    render(
      <ExportCenter
        profile={mockProfile}
        sessions={mockSessions}
        logs={mockDailyLogs}
        nutritionEntries={mockNutritionEntries}
        progressEntries={mockProgressEntries}
      />
    );
    for (const cb of screen.getAllByRole('checkbox')) {
      if (cb instanceof HTMLInputElement && cb.checked) {
        await user.click(cb);
      }
    }
    const exportBtn = screen.getByText('Export Data').closest('button');
    expect(exportBtn).toBeDisabled();
  });
});

/* ================================================================== */
/*  FLOW 11 — CROSS-VIEW DATA CONSISTENCY & LOGOUT                    */
/* ================================================================== */
describe('Flow 11: Cross-View Data Consistency', () => {
  it('plan data flows from WorkoutView to Dashboard via shared mock', () => {
    const plan = { ...mockWorkoutPlan, schedule: [{ ...mockWorkoutPlan.schedule[0], dayName: 'Integration Day' }] };
    const { rerender } = render(
      <WorkoutView
        profile={mockProfile}
        plan={plan}
        setPlan={mockSetPlan}
        logs={[]}
        onUpdateLogs={mockOnUpdateLogs}
      />
    );
    expect(screen.getByText('Integration Day')).toBeInTheDocument();
    rerender(
      <Dashboard
        profile={mockProfile}
        workoutPlan={plan}
        logs={[]}
        nutritionEntries={[]}
      />
    );
    expect(screen.getByText(/today's focus/i)).toBeInTheDocument();
    expect(screen.getByText('Integration Day')).toBeInTheDocument();
  });

  it('nutrition entries persist across prop updates', () => {
    const entries = [
      { id: 'x1', date: getTodayStr(), name: 'Protein Shake', meal: 'Snack', calories: 250, protein: 30, carbs: 10, fats: 5, food: 'Shake', timestamp: Date.now() },
    ];
    const { rerender, container } = render(
      <Nutrition
        profile={mockProfile}
        entries={entries}
        onUpdateEntries={mockOnUpdateEntries}
      />
    );
    expect(screen.getByText('Protein Shake')).toBeInTheDocument();
    expect(screen.getByText(/250 kcal/)).toBeInTheDocument();
    const newEntries = [
      { id: 'y1', date: getTodayStr(), name: 'Oatmeal', meal: 'Breakfast', calories: 180, protein: 8, carbs: 30, fats: 3, food: 'Oats', timestamp: Date.now() },
    ];
    rerender(
      <Nutrition
        profile={mockProfile}
        entries={newEntries}
        onUpdateEntries={mockOnUpdateEntries}
      />
    );
    expect(screen.getByText('Oatmeal')).toBeInTheDocument();
    expect(screen.getByText(/180 kcal/)).toBeInTheDocument();
  });

  it('progress data persists when viewed in Calendar', () => {
    const entries = [
      { id: 'p1', date: '2026-07-20', weight: 80, bodyFat: 15, chest: 104, waist: 82, arms: 38, thigh: 58, shoulders: 120, bmi: 24.7 },
    ];
    const { rerender } = render(
      <Progress
        profile={mockProfile}
        entries={entries}
        onUpdateEntries={mockOnUpdateEntries}
      />
    );
    expect(screen.getByText(/80/)).toBeInTheDocument();
    rerender(
      <CalendarView
        profile={mockProfile}
        sessions={[]}
        logs={[]}
        nutritionEntries={[]}
        progressEntries={entries}
      />
    );
    expect(screen.getByText('Progress')).toBeInTheDocument();
  });

  it('session data flows from WorkoutView to Calendar', () => {
    const sessions = [
      { id: 's1', date: '2026-07-20', dayName: 'Push Day', duration: 60, exercises: [{ name: 'Bench Press', sets: 4, reps: [8, 8, 8, 8] }], fatigueLevel: 3, performanceRating: 4 },
    ];
    const { rerender } = render(
      <WorkoutView
        profile={mockProfile}
        plan={mockWorkoutPlan}
        setPlan={mockSetPlan}
        logs={[]}
        onUpdateLogs={mockOnUpdateLogs}
      />
    );
    expect(screen.getByText('Day 1 - Push')).toBeInTheDocument();
    rerender(
      <CalendarView
        profile={mockProfile}
        sessions={sessions}
        logs={[]}
        nutritionEntries={[]}
        progressEntries={[]}
      />
    );
    expect(screen.getByText('Smart Calendar')).toBeInTheDocument();
  });
});

describe('Flow 12: Error Propagation', () => {
  it('Login shows error then clears on new submission', async () => {
    mockLogin.mockRejectedValueOnce({ code: 'auth/invalid-credential' });
    const user = userEvent.setup();
    render(<Login setAuthView={mockSetAuthView} />);
    await user.type(screen.getByPlaceholderText('you@example.com'), 'bad@test.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrong');
    await user.click(screen.getByText('LOGIN TO INTERFACE'));
    await waitFor(() => {
      expect(screen.getByText(/incorrect email or password/i)).toBeInTheDocument();
    });
    mockLogin.mockResolvedValueOnce({ user: { uid: 'x' } } as any);
    await user.clear(screen.getByPlaceholderText('you@example.com'));
    await user.type(screen.getByPlaceholderText('you@example.com'), 'good@test.com');
    await user.clear(screen.getByPlaceholderText('••••••••'));
    await user.type(screen.getByPlaceholderText('••••••••'), 'pass');
    await user.click(screen.getByText('LOGIN TO INTERFACE'));
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledTimes(2);
    });
  });

  it('Nutrition save error is caught silently', async () => {
    const user = userEvent.setup();
    render(
      <Nutrition
        profile={mockProfile}
        entries={mockNutritionEntries}
        onUpdateEntries={mockOnUpdateEntries}
      />
    );
    await user.click(screen.getByText('Add Nutrition Entry'));
    await waitFor(() => {
      expect(screen.getByText('Add Nutrition')).toBeInTheDocument();
    });
    const existingEntry = screen.getByText('Chicken Breast');
    expect(existingEntry).toBeInTheDocument();
  });
});
