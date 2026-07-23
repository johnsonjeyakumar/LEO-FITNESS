import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, WorkoutPlan, WorkoutSession, DailyLog, NutritionEntry, Note, ProgressEntry, AchievementBadge } from '../types';

export const firestoreService = {
  /**
   * Retrieves a user profile document from Firestore.
   * @param uid Firebase User UID
   */
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    if (!uid) throw new Error('UID is required to fetch profile');
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      return userDocSnap.data() as UserProfile;
    }
    return null;
  },

  /**
   * Creates a basic, retry-safe user profile document in Firestore (pre-onboarding).
   * Does not write placeholder/fake biometric data.
   */
  async createUserProfile(uid: string, email: string, name: string): Promise<void> {
    if (!uid) throw new Error('UID is required to create profile');
    const userDocRef = doc(db, 'users', uid);
    const basicProfile = {
      uid,
      name,
      fullName: name, // support field mappings
      email,
      profileImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ff5e00&color=fff`,
      onboardingCompleted: false,
      completedOnboarding: false,
    };
    await setDoc(userDocRef, {
      ...basicProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
  },

  /**
   * Updates an existing user profile in Firestore.
   */
  async updateUserProfile(uid: string, profileData: Partial<UserProfile>): Promise<void> {
    if (!uid) throw new Error('UID is required to update profile');
    const userDocRef = doc(db, 'users', uid);
    
    // Ensure mapping exists for both old and new field naming requirements
    const updates: any = {
      ...profileData,
      updatedAt: serverTimestamp()
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

    // Remove any undefined values to avoid Firestore serialization errors
    Object.keys(updates).forEach(key => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });

    await updateDoc(userDocRef, updates);
  },

  /**
   * Retrieves the current workout plan from Firestore under users/{uid}/workoutPlans/currentPlan.
   * @param uid Firebase User UID
   */
  async getWorkoutPlan(uid: string): Promise<WorkoutPlan | null> {
    if (!uid) throw new Error('UID is required to fetch workout plan');
    const planDocRef = doc(db, 'users', uid, 'workoutPlans', 'currentPlan');
    const planDocSnap = await getDoc(planDocRef);
    if (planDocSnap.exists()) {
      return planDocSnap.data() as WorkoutPlan;
    }
    return null;
  },

  /**
   * Saves the current workout plan to Firestore under users/{uid}/workoutPlans/currentPlan.
   * @param uid Firebase User UID
   * @param plan The WorkoutPlan object
   */
  async saveWorkoutPlan(uid: string, plan: WorkoutPlan): Promise<void> {
    if (!uid) throw new Error('UID is required to save workout plan');
    const planDocRef = doc(db, 'users', uid, 'workoutPlans', 'currentPlan');
    
    // Ensure no undefined values exist in the plan object before writing to Firestore
    const cleanedPlan = JSON.parse(JSON.stringify(plan));
    cleanedPlan.updatedAt = new Date().toISOString();
    
    await setDoc(planDocRef, cleanedPlan);
  },

  /**
   * Deletes the current workout plan from Firestore.
   * @param uid Firebase User UID
   */
  async deleteWorkoutPlan(uid: string): Promise<void> {
    if (!uid) throw new Error('UID is required to delete workout plan');
    const planDocRef = doc(db, 'users', uid, 'workoutPlans', 'currentPlan');
    await deleteDoc(planDocRef);
  },

  /**
   * Retrieves all workout sessions for a user from Firestore.
   */
  async getWorkoutSessions(uid: string): Promise<WorkoutSession[]> {
    if (!uid) throw new Error('UID is required to fetch workout sessions');
    const sessionsColRef = collection(db, 'users', uid, 'workoutSessions');
    const querySnapshot = await getDocs(sessionsColRef);
    const sessions: WorkoutSession[] = [];
    querySnapshot.forEach((docSnap) => {
      sessions.push(docSnap.data() as WorkoutSession);
    });
    // Order by date descending
    return sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  /**
   * Saves a single completed workout session to Firestore.
   */
  async saveWorkoutSession(uid: string, session: WorkoutSession): Promise<void> {
    if (!uid) throw new Error('UID is required to save workout session');
    const sessionDocRef = doc(db, 'users', uid, 'workoutSessions', session.id);
    const cleanedSession = JSON.parse(JSON.stringify(session));
    cleanedSession.updatedAt = new Date().toISOString();
    await setDoc(sessionDocRef, cleanedSession);
  },

  /**
   * Deletes a single workout session from Firestore.
   */
  async deleteWorkoutSession(uid: string, sessionId: string): Promise<void> {
    if (!uid) throw new Error('UID is required to delete workout session');
    const sessionDocRef = doc(db, 'users', uid, 'workoutSessions', sessionId);
    await deleteDoc(sessionDocRef);
  },

  /**
   * Retrieves all daily logs for streaks and consistency from Firestore.
   */
  async getDailyLogs(uid: string): Promise<DailyLog[]> {
    if (!uid) throw new Error('UID is required to fetch daily logs');
    const logsColRef = collection(db, 'users', uid, 'dailyLogs');
    const querySnapshot = await getDocs(logsColRef);
    const logs: DailyLog[] = [];
    querySnapshot.forEach((docSnap) => {
      logs.push(docSnap.data() as DailyLog);
    });
    // Order by date descending
    return logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  /**
   * Saves or updates a daily log.
   */
  async saveDailyLog(uid: string, log: DailyLog): Promise<void> {
    if (!uid) throw new Error('UID is required to save daily log');
    // Replace spaces and special characters in date to ensure it is a valid firestore key
    const safeDateId = log.date.replace(/[^a-zA-Z0-9-]/g, '_');
    const logDocRef = doc(db, 'users', uid, 'dailyLogs', safeDateId);
    const cleanedLog = JSON.parse(JSON.stringify(log));
    cleanedLog.updatedAt = new Date().toISOString();
    await setDoc(logDocRef, cleanedLog);
  },

  /**
   * Retrieves all nutrition entries from Firestore.
   */
  async getNutritionEntries(uid: string): Promise<NutritionEntry[]> {
    if (!uid) throw new Error('UID is required to fetch nutrition entries');
    const nutritionColRef = collection(db, 'users', uid, 'nutritionLogs');
    const querySnapshot = await getDocs(nutritionColRef);
    const entries: NutritionEntry[] = [];
    querySnapshot.forEach((docSnap) => {
      entries.push(docSnap.data() as NutritionEntry);
    });
    // Order by timestamp descending
    return entries.sort((a, b) => {
      const timeA = (a as any).timestamp || new Date(a.date).getTime() || 0;
      const timeB = (b as any).timestamp || new Date(b.date).getTime() || 0;
      return timeB - timeA;
    });
  },

  /**
   * Saves a single nutrition entry to Firestore.
   */
  async saveNutritionEntry(uid: string, entry: any): Promise<void> {
    if (!uid) throw new Error('UID is required to save nutrition entry');
    const entryDocRef = doc(db, 'users', uid, 'nutritionLogs', entry.id);
    const cleanedEntry = JSON.parse(JSON.stringify(entry));
    
    // Field normalization for key mismatch resolution
    if (!cleanedEntry.meal && cleanedEntry.name) {
      cleanedEntry.meal = cleanedEntry.name;
    }
    if (!cleanedEntry.food && cleanedEntry.name) {
      cleanedEntry.food = cleanedEntry.name;
    }
    if (!cleanedEntry.name && cleanedEntry.meal) {
      cleanedEntry.name = cleanedEntry.meal;
    }
    if (!cleanedEntry.date && cleanedEntry.timestamp) {
      cleanedEntry.date = new Date(cleanedEntry.timestamp).toISOString().split('T')[0];
    }
    
    cleanedEntry.updatedAt = new Date().toISOString();
    await setDoc(entryDocRef, cleanedEntry);
  },

  /**
   * Deletes a nutrition entry from Firestore.
   */
  async deleteNutritionEntry(uid: string, entryId: string): Promise<void> {
    if (!uid) throw new Error('UID is required to delete nutrition entry');
    const entryDocRef = doc(db, 'users', uid, 'nutritionLogs', entryId);
    await deleteDoc(entryDocRef);
  },

  /**
   * Retrieves all training journal notes from Firestore.
   */
  async getNotes(uid: string): Promise<Note[]> {
    if (!uid) throw new Error('UID is required to fetch notes');
    const notesColRef = collection(db, 'users', uid, 'notes');
    const querySnapshot = await getDocs(notesColRef);
    const notes: Note[] = [];
    querySnapshot.forEach((docSnap) => {
      // Exclude special coach_notepad doc from main notes listing
      if (docSnap.id !== 'coach_notepad') {
        notes.push(docSnap.data() as Note);
      }
    });
    // Order by timestamp descending
    return notes.sort((a, b) => b.timestamp - a.timestamp);
  },

  /**
   * Saves a note to Firestore.
   */
  async saveNote(uid: string, note: Note): Promise<void> {
    if (!uid) throw new Error('UID is required to save note');
    const noteDocRef = doc(db, 'users', uid, 'notes', note.id);
    const cleanedNote = JSON.parse(JSON.stringify(note));
    cleanedNote.updatedAt = new Date().toISOString();
    await setDoc(noteDocRef, cleanedNote);
  },

  /**
   * Deletes a note from Firestore.
   */
  async deleteNote(uid: string, noteId: string): Promise<void> {
    if (!uid) throw new Error('UID is required to delete note');
    const noteDocRef = doc(db, 'users', uid, 'notes', noteId);
    await deleteDoc(noteDocRef);
  },

  /**
   * Retrieves the AI Coach notepad string from Firestore.
   */
  async getCoachNotepad(uid: string): Promise<string> {
    if (!uid) throw new Error('UID is required to fetch coach notepad');
    const notepadDocRef = doc(db, 'users', uid, 'notes', 'coach_notepad');
    const docSnap = await getDoc(notepadDocRef);
    if (docSnap.exists()) {
      return docSnap.data().content || '';
    }
    return '';
  },

  /**
   * Saves the AI Coach notepad string to Firestore.
   */
  async saveCoachNotepad(uid: string, content: string): Promise<void> {
    if (!uid) throw new Error('UID is required to save coach notepad');
    const notepadDocRef = doc(db, 'users', uid, 'notes', 'coach_notepad');
    await setDoc(notepadDocRef, {
      id: 'coach_notepad',
      title: 'Coach Notepad',
      content,
      type: 'workout',
      source: 'coach_notepad',
      timestamp: Date.now(),
      updatedAt: new Date().toISOString()
    });
  },

  /**
   * Retrieves all progress measurements for a user from Firestore.
   */
  async getProgressEntries(uid: string): Promise<ProgressEntry[]> {
    if (!uid) throw new Error('UID is required to fetch progress entries');
    const progressColRef = collection(db, 'users', uid, 'progress');
    const querySnapshot = await getDocs(progressColRef);
    const entries: ProgressEntry[] = [];
    querySnapshot.forEach((docSnap) => {
      entries.push(docSnap.data() as ProgressEntry);
    });
    // Order by date descending (newest first)
    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  /**
   * Saves or updates a single progress entry.
   */
  async saveProgressEntry(uid: string, entry: ProgressEntry): Promise<void> {
    if (!uid) throw new Error('UID is required to save progress entry');
    const entryDocRef = doc(db, 'users', uid, 'progress', entry.id);
    const cleanedEntry = JSON.parse(JSON.stringify(entry));
    
    cleanedEntry.updatedAt = new Date().toISOString();
    if (!cleanedEntry.createdAt) {
      cleanedEntry.createdAt = new Date().toISOString();
    }
    
    await setDoc(entryDocRef, cleanedEntry);
  },

  /**
   * Deletes a single progress entry from Firestore.
   */
  async deleteProgressEntry(uid: string, entryId: string): Promise<void> {
    if (!uid) throw new Error('UID is required to delete progress entry');
    const entryDocRef = doc(db, 'users', uid, 'progress', entryId);
    await deleteDoc(entryDocRef);
  },

  /**
   * Retrieves all unlocked/progressing achievement badges from users/{uid}/achievements.
   */
  async getAchievements(uid: string): Promise<AchievementBadge[]> {
    if (!uid) throw new Error('UID is required to fetch achievements');
    const colRef = collection(db, 'users', uid, 'achievements');
    const querySnapshot = await getDocs(colRef);
    const badges: AchievementBadge[] = [];
    querySnapshot.forEach((docSnap) => {
      badges.push(docSnap.data() as AchievementBadge);
    });
    return badges;
  },

  /**
   * Saves or updates a single achievement badge document.
   */
  async saveAchievement(uid: string, badge: AchievementBadge): Promise<void> {
    if (!uid) throw new Error('UID is required to save achievement');
    const docRef = doc(db, 'users', uid, 'achievements', badge.id);
    const cleaned = JSON.parse(JSON.stringify(badge));
    await setDoc(docRef, cleaned);
  }
};
