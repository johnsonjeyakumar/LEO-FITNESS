<div align="center">
<<<<<<< HEAD
  <h1>NAAN THANDA LEO</h1>
  <h3>Elite AI Fitness Commander</h3>
</div>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite" alt="Vite 6" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?logo=firebase" alt="Firebase" />
  <img src="https://img.shields.io/badge/Gemini-2.0-8E75B2?logo=googlegemini" alt="Gemini 2.0" />
  <img src="https://img.shields.io/badge/Capacitor-8-119EFF?logo=capacitor" alt="Capacitor 8" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License MIT" />
  <br/>
  <a href="#features">Features</a> •
  <a href="docs/ARCHITECTURE.md">Architecture</a> •
  <a href="docs/TESTING.md">Testing</a> •
  <a href="docs/DEPLOYMENT.md">Deployment</a> •
  <a href="docs/CONTRIBUTING.md">Contributing</a>
=======
  <h1 align="center">NAAN THANDA LEO</h1>
  <h3 align="center">Elite AI Fitness Commander</h3>
</div>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a>
>>>>>>> 3c50204b6f6401d3fe61679a14f59cac0e926379
</p>

---

<<<<<<< HEAD
## Overview

**Naan Thanda Leo** is a full-stack, AI-driven fitness application that delivers hyper-personalized workout and nutrition plans. Built with **React 19**, **TypeScript**, **Firebase**, and **Google Gemini 2.0**, it adapts to each user's biometrics, injuries, equipment, and goals in real time.

This project serves as a **B.Tech capstone** demonstrating modern full-stack engineering — from real-time AI streaming and gamification to adaptive training analytics and cross-platform mobile deployment via Capacitor.

---

## Features

| Module | Highlights |
|--------|------------|
| **AI Workout Generator** | Gemini 2.0 generates periodized, injury-aware plans with exercise images |
| **AI Coach (Chat)** | Real-time streaming chat with full user context awareness + TTS voice synthesis |
| **Dashboard** | Workout/nutrition streaks, daily briefing, gamified XP & level system |
| **Nutrition Tracker** | Macro logging with personalized daily goals (BMR + TDEE based) |
| **Progress Tracking** | Weight, body fat, circumference measurements with Recharts visualizations |
| **Smart Analytics** | Weekly/monthly insight reports, period-over-period comparison, JSON export |
| **Gamification** | 8 achievement badges, weekly challenges, monthly milestones |
| **Calendar View** | Visual workout, log, nutrition, and progress calendar |
| **Adaptive Training** | Fatigue trends, weakest muscle detection, volume/intensity adjustments |

---

## Tech Stack

```mermaid
graph TD
    subgraph Frontend
        R[React 19 + TypeScript] --> V[Vite 6]
        R --> FM[Framer Motion]
        R --> RC[Recharts]
        R --> LR[Lucide React]
        R --> RM[react-markdown + remark-gfm]
    end
    subgraph Backend
        FB[Firebase] --> A[Auth]
        FB --> FS[Firestore]
    end
    subgraph AI
        GM[Gemini 2.0 Flash] --> WG[Workout Generation]
        GM --> CC[Coach Chat]
        GM --> TS[TTS Synthesis]
    end
    subgraph Mobile
        CP[Capacitor 8] --> AN[Android]
        CP --> IO[iOS]
    end
    R --> FB
    R --> GM
```

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Framework** | React 19, TypeScript 5.8 | UI with strict typing |
| **Build** | Vite 6 | Fast dev server & optimized production builds |
| **Backend** | Firebase Auth + Firestore | Authentication, user data, NoSQL storage |
| **AI** | Google Gemini 2.0 Flash | Workout generation, coaching chat, speech |
| **Animation** | Framer Motion | UI transitions, micro-interactions |
| **Charts** | Recharts | Weight trends, muscle group analysis |
| **Mobile** | Capacitor 8 | Native Android/iOS deployment |
| **Testing** | Vitest + Testing Library | Unit & integration tests |
| **CI/CD** | GitHub Actions | Lint, typecheck, test, build, Firebase deploy |

---

## Quick Start

### Prerequisites

- Node.js 20+
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

### Installation

```bash
git clone https://github.com/your-org/naan-thanda-leo.git
cd naan-thanda-leo/public

# Install dependencies
npm install

# Configure environment (copy and fill in)
cp .env.example .env.local
# Edit .env.local with your Gemini API key

# Start development server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## Project Structure

```
public/
├── App.tsx                        # Root component with routing & state
├── index.tsx                      # Entry point
├── types.ts                       # All TypeScript interfaces & enums
├── components/
│   ├── Login.tsx                  # Email/password authentication
│   ├── SignUp.tsx                 # User registration
│   ├── ForgotPassword.tsx         # Password reset
│   ├── OnboardingFlow.tsx         # Multi-step profile setup
│   ├── Dashboard.tsx              # Home screen with streaks & stats
│   ├── WorkoutView.tsx            # AI plan display, timer, session logging
│   ├── Nutrition.tsx              # Macro tracking, entry CRUD
│   ├── Progress.tsx               # Weight/measurements logs & charts
│   ├── Achievements.tsx           # Badge display & gamification
│   ├── AICoach.tsx                # Chat interface with streaming AI
│   ├── Analytics.tsx              # Insight reports & comparisons
│   ├── CalendarView.tsx           # Monthly activity calendar
│   ├── ExportCenter.tsx           # Data export (JSON)
│   ├── Notepad.tsx                # Training journal
│   ├── WorkoutChart.tsx           # Reusable Recharts wrapper
│   ├── IntroAnimation.tsx         # Splash animation
│   └── __tests__/                 # Component test files
├── services/
│   ├── firebase.ts                # Firebase init & config
│   ├── AuthContext.tsx            # Auth state provider
│   ├── firestoreService.ts        # Firestore CRUD abstraction
│   ├── geminiService.ts           # Gemini API integration
│   ├── contextBuilderService.ts   # AI context assembly
│   ├── adaptiveTrainingService.ts # Analytics & insights engine
│   ├── gamificationService.ts     # Streaks, XP, badges logic
│   └── __tests__/                 # Service test files
├── docs/                          # Documentation
├── .github/workflows/             # CI/CD pipeline
└── dist/                          # Production build output
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/ARCHITECTURE.md) | Component tree, data flow, route design, Mermaid diagrams |
| [Firebase Setup](docs/FIREBASE_SETUP.md) | Firestore schema, security rules, auth configuration |
| [AI Workflow](docs/AI_WORKFLOW.md) | Gemini integration, prompt engineering, streaming, TTS |
| [Testing](docs/TESTING.md) | Test strategy, mock patterns, running & writing tests |
| [Deployment](docs/DEPLOYMENT.md) | Firebase Hosting, Capacitor mobile, environment variables |
| [Contributing](docs/CONTRIBUTING.md) | PR workflow, code style, commit conventions |
| [Troubleshooting](docs/TROUBLESHOOTING.md) | Common issues, Firebase errors, build failures |

---

## License

Distributed under the MIT License.
=======
## 🦁 About The Project

**Naan Thanda Leo** is not just a fitness app; it's an elite training command center. Built for the **B.Tech Project**, it leverages advanced AI to provide a hyper-personalized fitness experience. Whether you're cutting, bulking, or training for performance, Leo adapts to your biometrics, injuries, and goals in real-time.

## ⚡ Features

### 🧠 AI Coach (Leo)
- **Powered by Google Gemini 2.5**: Ask for workout advice, form tips, or motivation.
- **Real-Time Streaming**: Experience chat interaction that feels alive with streaming text responses.
- **Voice Synthesis**: Leo talks back. Hear your briefings in the coach's voice.
- **Context-Aware**: Knows your previous workouts, injuries, and nutrition logs to give tailored advice.

### 📊 Command Dashboard
- **Streak Tracking**: specialized tracking for both Workout and Nutrition consistency.
- **Daily Briefing**: View today's focus, quick stats, and upcoming targets at a glance.
- **Gamification**: Earn visual ranks and maintain streaks to stay motivated.

### 🍎 Precision Nutrition
- **Macro Tracking**: Log meals and track Calories, Protein, Carbs, and Fats against personalized daily goals.
- **Progress Visualization**: Instant visual feedback on your daily intake with animated progress bars.

### 📈 Smart Analytics
- **Performance Trends**: Visualize your weight changes, consistency scores, and volume metrics over time.
- **Muscle Focus**: See which muscle groups you're hitting the hardest (and neglecting).

### 🛡️ Adaptive Training System
- **Injury Detection**: Onboarding flow captures injuries and limitations.
- **Dynamic Adjustments**: The system (and Coach Leo) suggests workout modifications protecting your vulnerable areas.

## 🛠️ Tech Stack

- **Core**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Framer Motion (Animations)
- **AI**: Google Gemini API (Generative Language & Vision)
- **Icons**: Lucide React
- **Charts**: Recharts

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- A Google Gemini API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/naan-thanda-leo.git
   cd naan-thanda-leo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

4. **Run the Command Center**
   ```bash
   npm run dev
   ```

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
>>>>>>> 3c50204b6f6401d3fe61679a14f59cac0e926379
