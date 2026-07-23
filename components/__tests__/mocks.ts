export const mockFirebase = {
  auth: {
    currentUser: { uid: 'test-uid', email: 'test@example.com' },
    onAuthStateChanged: vi.fn(() => vi.fn()),
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
  },
  db: {},
};

export const mockFirestoreService = {
  getUserProfile: vi.fn(),
  createUserProfile: vi.fn(),
  updateUserProfile: vi.fn(),
  saveNutritionEntry: vi.fn(),
  deleteNutritionEntry: vi.fn(),
  saveProgressEntry: vi.fn(),
  deleteProgressEntry: vi.fn(),
  getAchievements: vi.fn(),
  saveNote: vi.fn(),
  deleteNote: vi.fn(),
  saveDailyLog: vi.fn(),
  getWorkoutPlan: vi.fn(),
};

export const mockGeminiService = {
  generateWorkout: vi.fn(),
  chatWithCoach: vi.fn(),
  generateSpeech: vi.fn(),
};

export const mockGamificationService = {
  updateGamificationData: vi.fn(),
};

export const mockAdaptiveTrainingService = {
  generateInsightReport: vi.fn(),
  generateComparison: vi.fn(),
  generateProgressExport: vi.fn(),
};

export const mockContextBuilderService = {
  buildUserContext: vi.fn(),
};

export const mockUseAuth = {
  currentUser: { uid: 'test-uid', email: 'test@example.com' },
  userProfile: null,
  loading: false,
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
  resetPassword: vi.fn(),
  updateProfileData: vi.fn(),
};

export function setupAuthMock(overrides = {}) {
  const merged = { ...mockUseAuth, ...overrides };
  vi.mocked(useAuthModule.useAuth).mockReturnValue(merged);
  return merged;
}

import * as useAuthModule from '../../services/AuthContext';
