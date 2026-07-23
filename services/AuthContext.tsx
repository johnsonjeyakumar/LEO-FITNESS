import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  UserCredential
} from 'firebase/auth';
import { auth } from './firebase';
import { UserProfile, Goal } from '../types';
import { firestoreService } from './firestoreService';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserCredential>;
  signup: (email: string, password: string, fullName: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfileData: (profileData: Partial<UserProfile & { fullName?: string; activityLevel?: string; fitnessGoal?: Goal }>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sign up a new user
  const signup = async (email: string, password: string, fullName: string): Promise<UserCredential> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create basic Firestore document (without fake/placeholder fitness data)
    await firestoreService.createUserProfile(user.uid, email, fullName);

    // Set local state to basic profile
    const initialProfile: UserProfile = {
      uid: user.uid,
      name: fullName,
      fullName: fullName,
      email: email,
      profileImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=ff5e00&color=fff`,
      onboardingCompleted: false,
      completedOnboarding: false,
    };

    setUserProfile(initialProfile);
    return userCredential;
  };

  // Log in existing user
  const login = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Log out current user
  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setUserProfile(null);
  };

  // Reset password
  const resetPassword = (email: string) => {
    return sendPasswordResetEmail(auth, email);
  };

  // Update profile details in Firestore
  const updateProfileData = async (
    profileData: Partial<UserProfile & { fullName?: string; activityLevel?: string; fitnessGoal?: Goal }>
  ) => {
    if (!currentUser) throw new Error('No authenticated user found');

    await firestoreService.updateUserProfile(currentUser.uid, profileData);

    // Refresh local profile state
    setUserProfile((prev) => {
      if (!prev) return null;

      const updates: any = {
        ...profileData
      };

      if (profileData.name !== undefined) {
        updates.fullName = profileData.name;
      }
      if (profileData.fullName !== undefined) {
        updates.name = profileData.fullName;
      }
      if (profileData.goal !== undefined) {
        updates.fitnessGoal = profileData.goal;
      }
      if (profileData.fitnessGoal !== undefined) {
        updates.goal = profileData.fitnessGoal;
      }
      if (profileData.completedOnboarding !== undefined) {
        updates.onboardingCompleted = profileData.completedOnboarding;
      }
      if (profileData.onboardingCompleted !== undefined) {
        updates.completedOnboarding = profileData.onboardingCompleted;
      }

      return {
        ...prev,
        ...profileData,
        name: updates.name ?? prev.name,
        fullName: updates.fullName ?? (prev as any).fullName,
        goal: updates.goal ?? prev.goal,
        fitnessGoal: updates.fitnessGoal ?? (prev as any).fitnessGoal,
        completedOnboarding: updates.completedOnboarding ?? prev.completedOnboarding,
        onboardingCompleted: updates.onboardingCompleted ?? (prev as any).onboardingCompleted
      } as UserProfile;
    });
  };

  // Subscribe to Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const profile = await firestoreService.getUserProfile(user.uid);

          if (profile) {
            setUserProfile({
              ...profile,
              // Fallback/normalization for UI fields
              name: profile.fullName || profile.name || '',
              completedOnboarding: profile.onboardingCompleted || profile.completedOnboarding || false,
              goal: profile.fitnessGoal || profile.goal || Goal.MAINTENANCE
            } as UserProfile);
          } else {
            // Profile document doesn't exist in Firestore, create basic profile (retry-safe)
            const name = user.displayName || user.email?.split('@')[0] || 'User';
            await firestoreService.createUserProfile(user.uid, user.email || '', name);

            const basicProfile: UserProfile = {
              uid: user.uid,
              name: name,
              fullName: name,
              email: user.email || '',
              profileImage: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ff5e00&color=fff`,
              completedOnboarding: false,
              onboardingCompleted: false,
            };
            setUserProfile(basicProfile);
          }
        } catch (error) {
          console.error('Failed to load or initialize user profile in Firestore:', error);
          // Fallback to minimal state to prevent blocking app loading
          setUserProfile({
            uid: user.uid,
            name: user.displayName || user.email?.split('@')[0] || 'User',
            email: user.email || '',
            completedOnboarding: false,
          } as UserProfile);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    login,
    signup,
    logout,
    resetPassword,
    updateProfileData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
