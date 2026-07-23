import { firestoreService } from './firestoreService';
import { UserProfile, WorkoutPlan, WorkoutSession, DailyLog, NutritionEntry, Note, ProgressEntry } from '../types';

interface CachedContext {
  contextString: string;
  timestamp: number;
}

class ContextBuilderService {
  private cache: Map<string, CachedContext> = new Map();
  private CACHE_DURATION = 15000; // 15 seconds cache

  async buildUserContext(uid: string, forceRefresh = false): Promise<string> {
    if (!uid) return '';

    const cached = this.cache.get(uid);
    const now = Date.now();
    if (!forceRefresh && cached && (now - cached.timestamp < this.CACHE_DURATION)) {
      console.log('[ContextBuilder] Using cached user context');
      return cached.contextString;
    }

    console.log('[ContextBuilder] Fetching fresh user context from Firestore...');

    // Fetch all user details in parallel with individual error catch boundaries
    const [
      profileResult,
      planResult,
      sessionsResult,
      nutritionResult,
      progressResult,
      notesResult,
      notepadResult
    ] = await Promise.all([
      this.safeFetch(() => firestoreService.getUserProfile(uid), null),
      this.safeFetch(() => firestoreService.getWorkoutPlan(uid), null),
      this.safeFetch(() => firestoreService.getWorkoutSessions(uid), []),
      this.safeFetch(() => firestoreService.getNutritionEntries(uid), []),
      this.safeFetch(() => firestoreService.getProgressEntries(uid), []),
      this.safeFetch(() => firestoreService.getNotes(uid), []),
      this.safeFetch(() => firestoreService.getCoachNotepad(uid), '')
    ]);

    // Format sub-sections cleanly and concisely to minimize tokens
    const contextSections: string[] = [];

    // 1. Profile Context
    if (profileResult) {
      contextSections.push(`### Biometrics & Profile
- Name: ${profileResult.name}
- Age: ${profileResult.age || 'Not set'}
- Gender: ${profileResult.gender || 'Not set'}
- Height: ${profileResult.height || 'Not set'} cm
- Weight: ${profileResult.weight || 'Not set'} kg
- Goal: ${profileResult.goal || 'Not set'}
- Experience Level: ${profileResult.experience || 'Not set'}
- Splitting Preference: ${profileResult.splitPreference || 'Not set'}
- Equipment Access: ${profileResult.equipment || 'Not set'}
- Injuries/Limitations: ${profileResult.injuries || 'None'}`);
    }

    // 2. Workout Plan Context
    if (planResult) {
      contextSections.push(`### Current Workout Plan
- Program Name: ${planResult.splitName}
- Description: ${planResult.description}
- Schedule Days: ${planResult.schedule.map(d => `${d.dayName} (${d.focus})`).join(', ')}`);
    }

    // 3. Last 10 Workout Sessions
    if (sessionsResult && sessionsResult.length > 0) {
      const last10Sessions = [...sessionsResult]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);
      
      const sessionLines = last10Sessions.map(s => {
        const completedEx = s.exercises.filter(ex => ex.completed).length;
        return `- ${s.date}: Completed ${s.dayName} (${completedEx}/${s.exercises.length} exercises done, Duration: ${s.duration} mins, Intensity: ${s.intensityRating}/10)`;
      });
      contextSections.push(`### Last 10 Workout Sessions\n${sessionLines.join('\n')}`);
    }

    // 4. Last 7 Days Nutrition Logs
    if (nutritionResult && nutritionResult.length > 0) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentNutrition = nutritionResult.filter(n => {
        const entryDate = new Date(n.date || n.timestamp);
        return entryDate >= sevenDaysAgo;
      });

      if (recentNutrition.length > 0) {
        const dailySummary: Record<string, { cals: number; prot: number; carbs: number; fats: number; items: string[] }> = {};
        
        recentNutrition.forEach(n => {
          const dStr = n.date || new Date(n.timestamp).toLocaleDateString();
          if (!dailySummary[dStr]) {
            dailySummary[dStr] = { cals: 0, prot: 0, carbs: 0, fats: 0, items: [] };
          }
          dailySummary[dStr].cals += n.calories || 0;
          dailySummary[dStr].prot += n.protein || 0;
          dailySummary[dStr].carbs += n.carbs || 0;
          dailySummary[dStr].fats += n.fats || 0;
          dailySummary[dStr].items.push(n.name || n.meal || n.food || '');
        });

        const nutritionLines = Object.entries(dailySummary).map(([date, sum]) => 
          `- ${date}: ${sum.cals} kcal, Protein: ${sum.prot}g, Carbs: ${sum.carbs}g, Fats: ${sum.fats}g (Meals: ${sum.items.join(', ')})`
        );
        contextSections.push(`### Last 7 Days Nutrition\n${nutritionLines.join('\n')}`);
      }
    }

    // 5. Latest Progress Entry (Biometric Measurements)
    if (progressResult && progressResult.length > 0) {
      const latestProgress = progressResult[0];
      contextSections.push(`### Latest Physical Progress Log (${latestProgress.date})
- Weight: ${latestProgress.weight} kg (BMI: ${latestProgress.bmi || 'N/A'})
- Body Fat: ${latestProgress.bodyFat ? `${latestProgress.bodyFat}%` : 'Not logged'}
- Waist: ${latestProgress.waist ? `${latestProgress.waist} cm` : 'Not logged'}
- Arms: ${latestProgress.arms ? `${latestProgress.arms} cm` : 'Not logged'}
- Chest: ${latestProgress.chest ? `${latestProgress.chest} cm` : 'Not logged'}
- Thighs: ${latestProgress.thigh ? `${latestProgress.thigh} cm` : 'Not logged'}
- Shoulders: ${latestProgress.shoulders ? `${latestProgress.shoulders} cm` : 'Not logged'}
- Notes: ${latestProgress.notes || 'None'}`);
    }

    // 6. Notes & Journal
    const personalNotesLines: string[] = [];
    if (notepadResult) {
      personalNotesLines.push(`- Coach Notepad: "${notepadResult}"`);
    }
    if (notesResult && notesResult.length > 0) {
      const recentNotes = [...notesResult]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5);
      recentNotes.forEach(n => {
        personalNotesLines.push(`- Journal Note (${n.date}, Type: ${n.type}): ${n.title} - "${n.content}"`);
      });
    }
    if (personalNotesLines.length > 0) {
      contextSections.push(`### Notes & Journal\n${personalNotesLines.join('\n')}`);
    }

    const contextString = contextSections.join('\n\n');
    
    // Store in cache
    this.cache.set(uid, {
      contextString,
      timestamp: Date.now()
    });

    return contextString;
  }

  // Clear cache helper (e.g. on logout)
  clearCache(uid?: string) {
    if (uid) {
      this.cache.delete(uid);
    } else {
      this.cache.clear();
    }
  }

  private async safeFetch<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
    try {
      const res = await fn();
      return res ?? fallback;
    } catch (e) {
      console.warn('[ContextBuilder] Sub-fetch failed:', e);
      return fallback;
    }
  }
}

export const contextBuilderService = new ContextBuilderService();
