# Architecture

## Component Tree

```mermaid
graph TB
    App --> AuthProvider
    AuthProvider --> AppContent

    subgraph "Auth Layer (unauthenticated)"
        AppContent --> Login
        AppContent --> SignUp
        AppContent --> ForgotPassword
    end

    subgraph "Onboarding"
        AppContent --> OnboardingFlow
    end

    subgraph "Main Application (authenticated)"
        AppContent --> Dashboard
        AppContent --> WorkoutView
        AppContent --> Nutrition
        AppContent --> Progress
        AppContent --> Achievements
        AppContent --> AICoach
        AppContent --> Analytics
        AppContent --> CalendarView
        AppContent --> ExportCenter
        AppContent --> Notepad
    end

    subgraph "Services"
        AuthProvider --> AuthContext
        Dashboard --> firestoreService
        Dashboard --> gamificationService
        WorkoutView --> geminiService
        WorkoutView --> firestoreService
        Nutrition --> firestoreService
        Achievements --> gamificationService
        AICoach --> geminiService
        AICoach --> contextBuilderService
        Analytics --> adaptiveTrainingService
        CalendarView --> firestoreService
        ExportCenter --> gamificationService
        ExportCenter --> firestoreService
    end

    subgraph "Firebase"
        AuthContext --> FirebaseAuth
        firestoreService --> Firestore
    end

    subgraph "AI"
        geminiService --> GeminiAPI
        contextBuilderService --> firestoreService
    end
```

## Data Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Component
    participant AS as App State
    participant FS as Firestore
    participant AI as Gemini API

    Note over U,AI: Authentication Flow
    U->>C: Login (email + password)
    C->>AS: signInWithEmailAndPassword
    AS->>FS: verify credentials
    FS-->>AS: UserCredential
    AS->>FS: fetchUserProfile(uid)
    FS-->>AS: UserProfile
    AS-->>C: render authenticated UI

    Note over U,AI: Workout Generation Flow
    U->>C: "Generate Protocol"
    C->>AS: setPlan(Loading)
    AS->>AI: generateWorkout(profile)
    AI-->>AS: WorkoutPlan (JSON)
    AS->>FS: saveWorkoutPlan(uid, plan)
    AS-->>C: render workout plan

    Note over U,AI: AI Chat Flow
    U->>C: type message
    C->>AS: buildUserContext(uid)
    AS->>FS: fetch all user data
    FS-->>AS: profile, sessions, nutrition, etc.
    AS-->>C: context string
    C->>AI: chatWithCoach(context + message)
    AI-->>C: stream response tokens
    C->>U: render streaming text
    C->>AI: generateSpeech(text)
    AI-->>C: audio data (base64 PCM)
```

## Routing Architecture

This application uses a **single-page architecture** without a traditional router. State-based view switching is managed in `App.tsx` via a `view` state variable:

```typescript
const [view, setView] = useState<
  'dashboard' | 'workout' | 'nutrition' | 'coach' | 'analytics' |
  'notepad' | 'progress' | 'achievements' | 'calendar' | 'export'
>('dashboard');
```

Each view corresponds to a lazy-loaded component:

```
Auth Gate (no user)    → Login / SignUp / ForgotPassword
Authenticated, no OB   → OnboardingFlow
Authenticated + OB     → Nav Sidebar + Main Content Area
  ├── dashboard  → Dashboard
  ├── workout    → WorkoutView
  ├── nutrition  → Nutrition
  ├── coach      → AICoach
  ├── progress   → Progress
  ├── analytics  → Analytics
  ├── achievements → Achievements
  ├── notepad    → Notepad
  ├── calendar   → CalendarView
  └── export     → ExportCenter
```

## State Management

State is managed at three levels:

| Level | Mechanism | Scope |
|-------|-----------|-------|
| **Auth** | React Context (`AuthContext`) | Current user, profile, auth actions |
| **App** | `useState` in `AppContent` | Workout plan, sessions, logs, nutrition, notes, progress |
| **Component** | Local `useState` | UI state (modals, forms, tabs, loading indicators) |

Data flows **top-down** via props from `AppContent` to child components. Updates flow **bottom-up** via callback props (`onUpdateEntries`, `handleSetPlan`, etc.) that persist to Firestore and update local state.

## Key Design Decisions

1. **State-based routing over React Router** — avoids context switching and keeps all state in one tree. Works well for a dashboard-style SPA with 10 views.

2. **Lazy-loaded components** — each view is a `React.lazy()` import, split into separate chunks by Vite.

3. **Firestore as single source of truth** — all user data is fetched on login and cached in app state. Mutations write to Firestore first, then update local state.

4. **localStorage fallback** — all data is also persisted locally as a fallback when Firestore is unavailable or during development.

5. **Field normalization** — `firestoreService` handles field name mapping between old/new schemas (e.g., `name` ↔ `fullName`, `goal` ↔ `fitnessGoal`, `completedOnboarding` ↔ `onboardingCompleted`).
