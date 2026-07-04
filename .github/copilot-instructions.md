# AI Agent Instructions for Naan Thanda Leo

## Project Overview
This is a React/TypeScript fitness coaching app using Google's Gemini AI. It generates personalized workout plans, provides nutrition guidance, and offers an AI-powered chat coach named "Leo".

## Architecture
- **Main App**: `App.tsx` manages global state (profile, workout plan) and view switching
- **Components**: Modular screens in `components/` (Onboarding, Dashboard, WorkoutView, Nutrition, AICoach)
- **Services**: `geminiService.ts` handles all AI interactions via Google GenAI
- **Data Flow**: User profile → AI generates workout plan → stored in localStorage with keys `iron_ai_profile` and `iron_ai_plan`
- **State Management**: React hooks with localStorage persistence; no external state libraries

## Key Patterns
- **Animation**: Use Framer Motion for all UI transitions (e.g., `motion.div` with `initial/animate` props)
- **Icons**: Lucide React icons (e.g., `import { Dumbbell } from 'lucide-react'`)
- **Charts**: Recharts for data visualization (e.g., `ResponsiveContainer` with `AreaChart`)
- **Styling**: Tailwind CSS with custom gradients and glassmorphism effects
- **Error Handling**: Try/catch with console.error for localStorage operations

## Development Workflow
- **Start Dev Server**: `npm run dev` (Vite on port 3000)
- **Build**: `npm run build` (outputs to `dist/`)
- **Environment**: Set `GEMINI_API_KEY` in `.env.local`; accessed via `process.env.API_KEY` in code
- **API Integration**: Gemini service uses streaming for chat; handles audio decoding for voice responses

## Code Examples
- **Component Structure**: Export default functional component with typed props from `types.ts`
- **AI Calls**: `await geminiService.generateWorkout(profile)` returns `WorkoutPlan`
- **Local Storage**: `localStorage.setItem('iron_ai_profile', JSON.stringify(profile))`
- **Animation**: `<motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.2}}>`

## Conventions
- **Naming**: PascalCase for components, camelCase for variables
- **Types**: All interfaces in `types.ts`; enums for dropdown options
- **Imports**: Relative paths for local files, absolute for node_modules
- **Async**: Use async/await for all API calls; loading states with `useState(false)`

Focus on fitness domain logic: workout splits, macro calculations, progressive overload principles.</content>
<parameter name="filePath">c:\naan-thanda-leo\.github\copilot-instructions.md