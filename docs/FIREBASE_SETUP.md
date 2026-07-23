# Firebase Setup

## Project Configuration

This project is configured for the Firebase project `leo-fitness-c0aa7`.

**Firebase services used:**
- **Authentication** — Email/Password sign-in
- **Cloud Firestore** — User data, workout plans, sessions, nutrition, progress

---

## Environment Variables

Firebase configuration is loaded from environment variables with fallbacks to the development project:

```env
VITE_FIREBASE_API_KEY=AIzaSyBqn23kKtOWXvfVt--vRRpw3Ai_-8TVNUU
VITE_FIREBASE_AUTH_DOMAIN=leo-fitness-c0aa7.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=leo-fitness-c0aa7
VITE_FIREBASE_STORAGE_BUCKET=leo-fitness-c0aa7.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=762537186112
VITE_FIREBASE_APP_ID=1:762537186112:web:9c69c5d3a57da09a2a20a5
VITE_FIREBASE_MEASUREMENT_ID=G-1EMP5FTMEP
```

To use your own Firebase project, set these in `.env.local` and they override the defaults.

---

## Firestore Schema

### Collection: `users/{uid}`

The root document storing user profile data.

```
users/{uid}
├── uid: string
├── name: string
├── fullName: string
├── email: string
├── profileImage: string (URL)
├── age: number
├── weight: number (kg)
├── height: number (cm)
├── gender: "Male" | "Female" | "Other"
├── experience: "Beginner" | "Intermediate" | "Advanced" | "Elite"
├── goal: "Bulking" | "Cutting" | "Maintenance" | "Strength & Power" | "Athletic Performance"
├── daysAvailable: number
├── equipment: "Full Gym" | "Dumbbells Only" | "Home Gym" | "Bodyweight Only"
├── dietType: "Anything" | "Vegetarian" | "Vegan" | "Keto" | "Paleo"
├── splitPreference: "Push/Pull/Legs" | "Upper/Lower" | "Body Part Split" | "Full Body" | "Hybrid"
├── injuries: string
├── completedOnboarding: boolean
├── onboardingCompleted: boolean (legacy field)
├── activityLevel: string
├── fitnessGoal: string (legacy)
├── xp: number
├── level: number
├── currentStreak: number
├── longestStreak: number
├── createdAt: timestamp
└── updatedAt: timestamp
```

### Subcollections under `users/{uid}`

**`workoutPlans/currentPlan`**
```
{
  splitName: string,
  description: string,
  generatedAt: number,
  schedule: [
    {
      dayName: string,
      focus: string,
      exercises: [
        {
          name: string,
          sets: number,
          reps: string,
          rest: string,
          muscleGroup: string,
          recommendedWeight: string,
          notes: string,
          imageUrl: string (optional)
        }
      ]
    }
  ],
  updatedAt: string (ISO)
}
```

**`workoutSessions/{sessionId}`**
```
{
  id: string,
  date: string (ISO),
  dayName: string,
  exercises: [
    {
      name: string,
      sets: number,
      reps: number[],
      weight: number[],
      muscleGroup: string,
      notes: string,
      completed: boolean (optional)
    }
  ],
  duration: number (minutes),
  notes: string,
  fatigueLevel: 1-5,
  performanceRating: 1-5,
  intensityRating: number (optional),
  updatedAt: string (ISO)
}
```

**`dailyLogs/{safeDateId}`**
```
{
  date: string (toDateString),
  waterIntake: number (ml),
  sleepHours: number,
  mood: "Good" | "Average" | "Bad",
  workoutCompleted: boolean,
  updatedAt: string (ISO)
}
```

**`nutritionLogs/{entryId}`**
```
{
  id: string,
  date: string (ISO),
  name: string,
  meal: string (alias for name),
  food: string (alias for name),
  calories: number,
  protein: number,
  carbs: number,
  fats: number,
  timestamp: number (epoch),
  updatedAt: string (ISO)
}
```

**`progress/{entryId}`**
```
{
  id: string,
  date: string (ISO),
  weight: number,
  bodyFat: number (optional),
  chest: number (cm, optional),
  waist: number (cm, optional),
  arms: number (cm, optional),
  thigh: number (cm, optional),
  shoulders: number (cm, optional),
  bmi: number (optional),
  notes: string (optional),
  createdAt: string (ISO),
  updatedAt: string (ISO)
}
```

**`notes/{noteId}`**
```
{
  id: string,
  title: string,
  content: string,
  type: "workout" | "diet",
  date: string (ISO),
  timestamp: number (epoch),
  updatedAt: string (ISO)
}
```

Special document `notes/coach_notepad` stores the AI coach's persistent memory:
```
{
  id: "coach_notepad",
  title: "Coach Notepad",
  content: string,
  type: "workout",
  source: "coach_notepad",
  timestamp: number,
  updatedAt: string (ISO)
}
```

**`achievements/{badgeId}`**
```
{
  id: string,
  title: string,
  description: string,
  unlocked: boolean,
  unlockedAt: string (ISO, optional),
  progress: number,
  target: number,
  category: string
}
```

---

## Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;

      // All subcollections inherit parent rules
      match /{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Component
    participant AC as AuthContext
    participant FA as Firebase Auth
    participant FS as Firestore

    Note over U,FS: Sign Up
    U->>C: fill form, click Register
    C->>AC: signup(email, password, name)
    AC->>FA: createUserWithEmailAndPassword
    FA-->>AC: UserCredential
    AC->>FS: createUserProfile(uid, email, name)
    FS-->>AC: profile created
    AC-->>C: user authenticated

    Note over U,FS: Login
    U->>C: fill form, click Login
    C->>AC: login(email, password)
    AC->>FA: signInWithEmailAndPassword
    FA-->>AC: UserCredential
    AC->>FS: getUserProfile(uid)
    FS-->>AC: UserProfile
    AC-->>C: render app

    Note over U,FS: Auth State Change
    FA->>AC: onAuthStateChanged(user)
    alt user exists
        AC->>FS: getUserProfile(uid)
        FS-->>AC: profile
        AC-->>C: authenticated state
    else no user
        AC-->>C: unauthenticated state
    end
```

---

## Field Name Mapping

The application and Firestore use two sets of field names for backward compatibility:

| Frontend Field | Firestore Field |
|----------------|-----------------|
| `name` | ↔ `fullName` |
| `goal` | ↔ `fitnessGoal` |
| `completedOnboarding` | ↔ `onboardingCompleted` |

The `firestoreService.updateUserProfile()` method automatically syncs both fields on every write.
