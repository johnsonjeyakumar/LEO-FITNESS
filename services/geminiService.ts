import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { UserProfile, WorkoutPlan, ChatMessage } from "../types";

// --- Service Class ---

class GeminiService {
  private genAI: GoogleGenerativeAI | null;
  private model: GenerativeModel | null;

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    console.log('API Key loaded:', apiKey ? 'Present' : 'Missing');
    if (!apiKey || apiKey === 'YOUR_VALID_API_KEY_HERE') {
      console.warn('Gemini API key is not set or is invalid. Please set VITE_GEMINI_API_KEY in .env.local with a valid key from https://aistudio.google.com/app/apikey');
      this.genAI = null as any;
      this.model = null as any;
      return;
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    });
  }

  async generateWorkout(profile: UserProfile): Promise<WorkoutPlan> {
    if (!this.model) {
      throw new Error('Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in .env.local');
    }

    const prompt = `You are an elite strength and conditioning coach "Leo". Create a high-intensity, structured workout plan for a user with the following profile:

User Profile:
- Age: ${profile.age}
- Gender: ${profile.gender}
- Weight: ${profile.weight}kg
- Height: ${profile.height}cm
- Experience: ${profile.experience}
- Goal: ${profile.goal}
- Days Available: ${profile.daysAvailable}
- Equipment Access: ${profile.equipment}
- Injuries/Limitations: ${profile.injuries || "None"}
- Preferred Split: ${profile.splitPreference || "Push/Pull/Legs"}

Requirements:
- Create a ${profile.daysAvailable}-day workout split using the "${profile.splitPreference}" structure.

- Each day should have a clear focus area and 5-7 exercises
- Include sets, reps, rest times, muscle groups, and recommended weights
- For weights, provide percentages of 1RM or specific weight ranges based on experience level
- Consider equipment limitations and injuries carefully
- Make it progressive and challenging with proper periodization
- Include compound movements first, then isolation exercises
- Add form cues and safety notes where critical

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "splitName": "string (e.g., 'Push-Pull-Legs Split')",
  "description": "string (detailed description of the program philosophy)",
  "schedule": [
    {
      "dayName": "string (e.g., 'Day 1 - Push')",
      "focus": "string (e.g., 'Chest, Shoulders, Triceps')",
      "exercises": [
        {
          "name": "string (exercise name)",
          "sets": number,
          "reps": "string (e.g., '8-10' or '12-15')",
          "rest": "string (e.g., '90s' or '2 min')",
          "muscleGroup": "string (primary muscle)",
          "recommendedWeight": "string (e.g., '70-75% 1RM' or '15-20kg')",
          "notes": "string (form cues, optional)"
        }
      ]
    }
  ]
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();

      // Clean up response
      if (text.startsWith('```json')) {
        text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (text.startsWith('```')) {
        text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // Remove any leading/trailing whitespace and potential markdown
      text = text.trim();

      const plan = JSON.parse(text);

      // Validate the response structure
      if (!plan.splitName || !plan.description || !Array.isArray(plan.schedule)) {
        throw new Error('Invalid workout plan structure received from API');
      }

      // Add exercise images to each exercise
      const enrichedPlan = await this.addExerciseImages(plan);

      return { ...enrichedPlan, generatedAt: Date.now() };
    } catch (error) {
      console.error("Gemini Workout Generation Error:", error);
      console.warn("Using demo workout plan as fallback");

      // Return a comprehensive demo plan to showcase features
      const demoPlan = await this.getDemoWorkoutPlan(profile);
      return demoPlan;
    }
  }

  private async getDemoWorkoutPlan(profile: UserProfile): Promise<WorkoutPlan> {
    const plan: WorkoutPlan = {
      splitName: `${profile.daysAvailable}-Day Push-Pull-Legs Split`,
      description: `A comprehensive ${profile.daysAvailable}-day training program designed for ${profile.experience.toLowerCase()} lifters targeting ${profile.goal.toLowerCase()}. This split optimizes muscle recovery while maximizing growth stimulus through strategic volume distribution.`,
      schedule: [
        {
          dayName: "Day 1 - Push",
          focus: "Chest, Shoulders, Triceps",
          exercises: [
            {
              name: "Barbell Bench Press",
              sets: 4,
              reps: "8-10",
              rest: "2 min",
              muscleGroup: "Chest",
              recommendedWeight: "70-75% 1RM",
              notes: "Keep shoulder blades retracted, lower bar to mid-chest, drive through heels"
            },
            {
              name: "Incline Dumbbell Press",
              sets: 3,
              reps: "10-12",
              rest: "90s",
              muscleGroup: "Chest",
              recommendedWeight: "60-65% 1RM",
              notes: "30-45 degree incline, squeeze at the top, control the descent"
            },
            {
              name: "Overhead Press",
              sets: 4,
              reps: "8-10",
              rest: "2 min",
              muscleGroup: "Shoulders",
              recommendedWeight: "65-70% 1RM",
              notes: "Brace core, full lockout overhead, avoid excessive back arch"
            },
            {
              name: "Lateral Raises",
              sets: 3,
              reps: "12-15",
              rest: "60s",
              muscleGroup: "Shoulders",
              recommendedWeight: "Light-Moderate",
              notes: "Slight bend in elbows, lead with elbows, control the negative"
            },
            {
              name: "Tricep Dips",
              sets: 3,
              reps: "10-12",
              rest: "90s",
              muscleGroup: "Triceps",
              recommendedWeight: "Bodyweight or +10-20kg",
              notes: "Lean forward slightly, full range of motion, elbows at 90 degrees"
            },
            {
              name: "Cable Tricep Pushdowns",
              sets: 3,
              reps: "12-15",
              rest: "60s",
              muscleGroup: "Triceps",
              recommendedWeight: "Moderate",
              notes: "Keep elbows pinned, full extension, squeeze at bottom"
            }
          ]
        },
        {
          dayName: "Day 2 - Pull",
          focus: "Back, Biceps, Rear Delts",
          exercises: [
            {
              name: "Deadlifts",
              sets: 4,
              reps: "6-8",
              rest: "3 min",
              muscleGroup: "Back",
              recommendedWeight: "75-80% 1RM",
              notes: "Neutral spine, drive through heels, hip hinge pattern, brace core"
            },
            {
              name: "Pull-Ups",
              sets: 4,
              reps: "8-12",
              rest: "2 min",
              muscleGroup: "Back",
              recommendedWeight: "Bodyweight or +5-15kg",
              notes: "Full hang to chin over bar, retract shoulder blades, control descent"
            },
            {
              name: "Barbell Rows",
              sets: 4,
              reps: "8-10",
              rest: "90s",
              muscleGroup: "Back",
              recommendedWeight: "65-70% 1RM",
              notes: "Hinge at hips, pull to lower chest, squeeze shoulder blades"
            },
            {
              name: "Face Pulls",
              sets: 3,
              reps: "15-20",
              rest: "60s",
              muscleGroup: "Rear Delts",
              recommendedWeight: "Light-Moderate",
              notes: "Pull to face level, external rotation, squeeze rear delts"
            },
            {
              name: "Barbell Curls",
              sets: 3,
              reps: "10-12",
              rest: "90s",
              muscleGroup: "Biceps",
              recommendedWeight: "Moderate",
              notes: "No swinging, full range, squeeze at top"
            },
            {
              name: "Hammer Curls",
              sets: 3,
              reps: "12-15",
              rest: "60s",
              muscleGroup: "Biceps",
              recommendedWeight: "Moderate",
              notes: "Neutral grip, control the weight, focus on brachialis"
            }
          ]
        },
        {
          dayName: "Day 3 - Legs",
          focus: "Quads, Hamstrings, Glutes, Calves",
          exercises: [
            {
              name: "Barbell Squats",
              sets: 4,
              reps: "8-10",
              rest: "3 min",
              muscleGroup: "Quads",
              recommendedWeight: "70-75% 1RM",
              notes: "Depth to parallel or below, knees track over toes, chest up"
            },
            {
              name: "Romanian Deadlifts",
              sets: 4,
              reps: "10-12",
              rest: "2 min",
              muscleGroup: "Hamstrings",
              recommendedWeight: "60-65% 1RM",
              notes: "Slight knee bend, hinge at hips, feel hamstring stretch"
            },
            {
              name: "Leg Press",
              sets: 3,
              reps: "12-15",
              rest: "90s",
              muscleGroup: "Quads",
              recommendedWeight: "Heavy",
              notes: "Feet shoulder-width, push through heels, full range"
            },
            {
              name: "Walking Lunges",
              sets: 3,
              reps: "12-15 each",
              rest: "90s",
              muscleGroup: "Quads",
              recommendedWeight: "Moderate DBs",
              notes: "Long stride, knee doesn't pass toes, upright torso"
            },
            {
              name: "Leg Curls",
              sets: 3,
              reps: "12-15",
              rest: "60s",
              muscleGroup: "Hamstrings",
              recommendedWeight: "Moderate",
              notes: "Full contraction, control the eccentric, squeeze at top"
            },
            {
              name: "Standing Calf Raises",
              sets: 4,
              reps: "15-20",
              rest: "60s",
              muscleGroup: "Calves",
              recommendedWeight: "Heavy",
              notes: "Full stretch at bottom, pause at top, slow and controlled"
            }
          ]
        }
      ],
      generatedAt: Date.now()
    };

    // Add images to the demo plan
    const enrichedPlan = await this.addExerciseImages(plan);
    return enrichedPlan;
  }

  private async addExerciseImages(plan: WorkoutPlan): Promise<WorkoutPlan> {
    // Map of exercise keywords to curated image URLs
    const exerciseImageMap: Record<string, string> = {
      'bench press': 'https://images.pexels.com/photos/3837757/pexels-photo-3837757.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
      'squat': 'https://images.pexels.com/photos/4162449/pexels-photo-4162449.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
      'deadlift': 'https://images.pexels.com/photos/3490348/pexels-photo-3490348.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
      'pull': 'https://images.pexels.com/photos/3289711/pexels-photo-3289711.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
      'row': 'https://images.pexels.com/photos/4162487/pexels-photo-4162487.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
      'press': 'https://images.pexels.com/photos/3837757/pexels-photo-3837757.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
      'curl': 'https://images.pexels.com/photos/3490383/pexels-photo-3490383.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
      'raise': 'https://images.pexels.com/photos/4162451/pexels-photo-4162451.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
      'dip': 'https://images.pexels.com/photos/4162451/pexels-photo-4162451.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
      'lunge': 'https://images.pexels.com/photos/4162487/pexels-photo-4162487.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
      'calf': 'https://images.pexels.com/photos/3490348/pexels-photo-3490348.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
      'tricep': 'https://images.pexels.com/photos/3837757/pexels-photo-3837757.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
      'leg': 'https://images.pexels.com/photos/4162449/pexels-photo-4162449.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
      'chest': 'https://images.pexels.com/photos/3837757/pexels-photo-3837757.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
      'shoulder': 'https://images.pexels.com/photos/4162451/pexels-photo-4162451.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
      'back': 'https://images.pexels.com/photos/4162487/pexels-photo-4162487.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
      'bicep': 'https://images.pexels.com/photos/3490383/pexels-photo-3490383.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
    };

    const enrichedSchedule = plan.schedule.map((day) => {
      const enrichedExercises = day.exercises.map((exercise) => {
        // Find matching image based on exercise name keywords
        const exerciseLower = exercise.name.toLowerCase();
        let imageUrl = '';

        for (const [keyword, url] of Object.entries(exerciseImageMap)) {
          if (exerciseLower.includes(keyword)) {
            imageUrl = url;
            break;
          }
        }

        // Fallback to a placeholder if no match found
        if (!imageUrl) {
          // Create a gradient placeholder based on muscle group
          const colorMap: Record<string, string> = {
            'Chest': 'from-red-600 to-orange-600',
            'Back': 'from-blue-600 to-cyan-600',
            'Shoulders': 'from-yellow-600 to-amber-600',
            'Legs': 'from-green-600 to-emerald-600',
            'Quads': 'from-green-600 to-emerald-600',
            'Hamstrings': 'from-green-700 to-teal-700',
            'Biceps': 'from-purple-600 to-pink-600',
            'Triceps': 'from-orange-600 to-red-600',
            'Calves': 'from-teal-600 to-cyan-600',
            'Glutes': 'from-lime-600 to-green-600',
            'Rear Delts': 'from-amber-600 to-orange-600',
          };

          const gradient = colorMap[exercise.muscleGroup] || 'from-gray-600 to-gray-800';
          imageUrl = `https://via.placeholder.com/400x300/${gradient.replace('from-', '').replace('-600', '').replace(' to-', '/')}?text=${encodeURIComponent(exercise.name)}`;
        }

        return {
          ...exercise,
          imageUrl
        };
      });

      return {
        ...day,
        exercises: enrichedExercises
      };
    });

    return {
      ...plan,
      schedule: enrichedSchedule
    };
  }

  async chatWithCoach(history: ChatMessage[], newMessage: string, profile: UserProfile, context?: string): Promise<string> {
    console.log('chatWithCoach called with history length:', history.length, 'newMessage:', newMessage.substring(0, 50));

    if (!this.model) {
      console.log('Model not initialized, using mock response');
      return this.getMockResponse(newMessage, profile);
    }

    // Enhanced System Prompt for "Leo"
    // - Deep knowledge of biomechanics and hypertrophy.
    // - Explicit instruction to use context/memory.
    // - Strict formatting rules.
    const systemInstruction = `You are Leo, an elite, world-class strength and conditioning coach. You are not just a cheerleader; you are a tactical expert in human performance.

**CORE IDENTITY:**
- **Name:** Leo
- **Role:** Elite Performance Coach.
- **Tone:** Direct, Intense, Knowledgeable, No-nonsense but motivating. Use emojis to emphasize points but don't be childish.
- **Philosophy:** Evidence-based training (biomechanics, progressive overload) mixed with "in the trenches" intensity. NO BRO-SCIENCE.
- **Objective:** Optimize the user's physique and performance efficiently.

**USER CONTEXT (LEARN THIS):**
- **User Name:** ${profile.name}
- **Goal:** ${profile.goal}
- **Experience:** ${profile.experience}
- **Injuries:** ${profile.injuries || "None"} (Memorize this. NEVER suggest exercises that aggravate these.)
- **Split:** ${profile.splitPreference || "Push/Pull/Legs"}
- **Session Context:** ${context || "No specific context provided."} (Analyze this for previous logs, nutrition, or notes.)

**CRITICAL INSTRUCTIONS:**
1.  **ANALYZE INPUT:** Before answering, check the 'Session Context' and conversation history. If the user mentions a specific pain or preference earlier, REMEMBER IT.
2.  **BIOMECHANICS FIRST:** When suggesting exercises, explain *why* (e.g., "Incline DB Press targets the clavicular head of the pec major").
3.  **SPECIFICITY:** If asked for a "chest workout", do not just list 3 exercises. Give Sets, Reps, Rest, and **Cues**.
    - *Bad:* "Do bench press."
    - *Good:* "Barbell Bench Press: 3 sets x 8-10 reps. Control the eccentric. 2 min rest."
4.  **FORMATTING RULES:**
    - **ALWAYS** use standard Markdown.
    - **LISTS:** Use bullet points ( - ) for workouts, steps, or tips.
    - **HEADERS:** Use bold headers (###) for sections.
    - **NO WALLS OF TEXT:** Break paragraphs up.
5.  **CORRECTION:** If the user implies something incorrect (e.g., "I want to spot reduce belly fat"), CORRECT THEM politely but firmly with facts.

**KNOWLEDGE BASE (ANATOMY & BIOMECHANICS):**
*Use this map to generate accurate advice. Do not hallucinate muscles.*

- **CHEST (Pectoralis Major):**
    - *Clavicular (Upper):* Incline Press (15-30°), Low-to-High Cable Flyes, Reverse Grip Bench.
    - *Sternal (Mid):* Flat Press, chest-level Flyes.
    - *Costal (Lower):* Dips (forward lean), High-to-Low Cable Flyes, Decline Press.
- **BACK:**
    - *Latissimus Dorsi (Width):* Vertical Pulls (Pull-ups, Lat Pulldowns - neutral grip).
    - *Upper Back (Thickness - Traps/Rhomboids):* Wide Grip Rows, Face Pulls, Kelso Shrugs.
    - *Erector Spinae:* Deadlifts, Rack Pulls, Back Extensions.
- **SHOULDERS (Deltoids):**
    - *Anterior (Front):* Overhead Press, Front Raises (often overworked).
    - *Lateral (Side):* Lateral Raises (lead with elbows), Upright Rows (wide grip).
    - *Posterior (Rear):* Face Pulls, Reverse Peck Deck, Rear Delt Swings.
- **ARMS (Biceps, Triceps, Forearms):**
    - *Biceps:* Long Head (Incline Curl - stretch), Short Head (Preacher Curl - tension).
    - *Triceps:* Long Head (Overhead extension), Lateral/Medial (Pushdowns, Dips).
    - *Forearms:* Brachioradialis (Hammer Curls), Flexors (Wrist Curls).
- **LEGS (Quads, Hams, Glutes, Calves):**
    - *Quads:* Knee Extension focus (Squats, Leg Extensions, Lunges).
    - *Hamstrings:* Knee Flexion (Leg Curls) & Hip Extension (RDLs).
    - *Glutes:* Hip Thrusts, Deep Squats, Kickbacks.
    - *Calves:* Gastrocnemius (Standing Raises - straight leg), Soleus (Seated Raises - bent knee).
- **ABS / CORE:**
    - *Upper Abs (Rectus Abdominis):* Crunches, Cable Crunches.
    - *Lower Abs:* Leg Raises, Hanging Knee Raises.
    - *Obliques:* Russian Twists, Woodchoppers, Bicycle Crunches.

Respond as Leo. Get straight to the point.`;

    try {
      const chat = this.model.startChat({
        history: history.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        })),
        systemInstruction: systemInstruction,
        generationConfig: {
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      });
      console.log('Sending message to Gemini...');
      const result = await chat.sendMessage(newMessage);
      const response = await result.response;
      const text = response.text().trim();
      console.log('Gemini response:', text.substring(0, 100));
      return text;
    } catch (error) {
      console.error("Gemini Chat Error:", error);
      console.log('Falling back to mock response');
      return this.getMockResponse(newMessage, profile);
    }
  }

  private getMockResponse(message: string, profile: UserProfile): string {
    const lowerMessage = message.toLowerCase();
    const name = profile.name;

    // --- ABS / CORE ---
    if (lowerMessage.includes('abs') || lowerMessage.includes('core') || lowerMessage.includes('belly') || lowerMessage.includes('six pack') || lowerMessage.includes('oblique')) {
      return `### 🍫 CORE CRUSHER
Abs are made in the kitchen, revealed in the gym.

**The Workout:**
1.  **Hanging Leg Raises (Lower Abs)**
    - 3 sets x 10-15 reps
    - *Cue: Don't swing. Control the legs down.*
2.  **Cable Crunches (Upper Abs)**
    - 3 sets x 15-20 reps
    - *Cue: Round your back. crunch down, don't pull with arms.*
3.  **Russian Twists (Obliques)**
    - 3 sets x 20 reps (total)
    - *Cue: Control the rotation.*
4.  **Plank**
    - 3 sets x Failure
    - *Cue: Squeeze glutes and core.*`;
    }

    // --- LEGS (Detailed) ---
    if (lowerMessage.includes('calf') || lowerMessage.includes('calves')) {
      return `### 💎 DIAMOND CALVES
Calves are stubborn, but we are stubborn-er.

**The Workout:**
1.  **Standing Calf Raises (Gastrocnemius)**
    - 4 sets x 15-20 reps
    - *Cue: Keep legs straight. Full stretch at bottom. Pause at top.*
2.  **Seated Calf Raises (Soleus)**
    - 4 sets x 15-20 reps
    - *Cue: Knees bent at 90 degrees. Slow tempo.*`;
    }

    if (lowerMessage.includes('glute')) {
      return `### 🍑 GLUTE BUILDER
Power and aesthetics.

**The Workout:**
1.  **Barbell Hip Thrusts**
    - 4 sets x 8-12 reps
    - *Cue: Chin tucked. Drive hips to ceiling.*
2.  **Glute Kickbacks (Cable)**
    - 3 sets x 15 reps
    - *Cue: Squeeze at full extension.*`;
    }

    if (lowerMessage.includes('leg') || lowerMessage.includes('quad') || lowerMessage.includes('squat') || lowerMessage.includes('ham')) {
      return `### 🦵 LEG DAY PROTOCOL
Listen up, **${name}**. We don't skip legs. We destroy them.

**The Mission:**
Total lower body annihilation. Focus on full Range of Motion (ROM).

**The Workout:**
1.  **Barbell Back Squats (Quads/Glutes)**
    - 4 sets x 6-8 reps
    - *Cue: Break at the hips and knees simultaneously. Depth is king.*
2.  **Romanian Deadlifts (Hamstrings/Glutes)**
    - 3 sets x 10-12 reps
    - *Cue: Hips back. Feel the stretch in the hammies. Don't round your back.*
3.  **Leg Press (Quads)**
    - 3 sets x 12-15 reps
    - *Cue: Feet shoulder-width. Drive through heels.*
4.  **Walking Lunges (Unilateral)**
    - 3 sets x 12 reps (each leg)
    - *Cue: Keep your torso upright.*
5.  **Standing Calf Raises**
    - 4 sets x 15-20 reps
    - *Cue: Paused at the bottom, squeeze at the top.*`;
    }

    // --- PULL / BACK (Detailed) ---
    if (lowerMessage.includes('trap')) {
      return `### ⛰️ MOUNTAIN TOP TRAPS
Look powerful in a t-shirt.

**The Workout:**
1.  **Barbell Shrugs**
    - 4 sets x 12-15 reps
    - *Cue: Shrug UP, not rolling back.*
2.  **Face Pulls (High Pull)**
    - 4 sets x 15-20 reps
    - *Cue: Squeeze upper back hard.*`;
    }

    if (lowerMessage.includes('back') || lowerMessage.includes('pull') || lowerMessage.includes('lat') || lowerMessage.includes('wing')) {
      return `### 🦅 PULL DAY: BUILD THE WINGS
Width and Thickness, **${name}**.

**The Workout:**
1.  **Deadlifts (Erectors/Base)**
    - 3 sets x 5 reps
    - *Cue: Slack out of the bar. Drive the floor away.*
2.  **Weighted Pull-Ups (Lats)**
    - 3 sets x 8-10 reps
    - *Cue: Drive elbows down to pockets.*
3.  **Chest-Supported Rows (Rhomboids/Traps)**
    - 3 sets x 10-12 reps
    - *Cue: Squeeze the shoulder blades together.*
4.  **Face Pulls (Rear Delts/Rotators)**
    - 3 sets x 15-20 reps
    - *Cue: Protect those shoulders. External rotation.*
5.  **Barbell Curls (Biceps)**
    - 3 sets x 10-12 reps
    - *Cue: Strict form. No swinging.*`;
    }

    // --- PUSH / CHEST (Detailed) ---
    if (lowerMessage.includes('upper chest') || lowerMessage.includes('incline')) {
      return `### 🛡️ UPPER CHEST SPECIALIZATION
Fill out that collarbone area.

**The Workout:**
1.  **Incline Barbell Press (30 degrees)**
    - 4 sets x 8-10 reps
2.  **Incline Dumbbell Flyes**
    - 3 sets x 12-15 reps
    - *Cue: Big stretch.*
3.  **Reverse Grip Bench Press**
    - 3 sets x 10-12 reps
    - *Cue: Highly underrated for upper pecs.*`;
    }

    if (lowerMessage.includes('chest') || lowerMessage.includes('push') || lowerMessage.includes('press') || lowerMessage.includes('pec')) {
      return `### 🛡️ PUSH DAY: ARMOR BUILDING
Time to push the earth away, **${name}**.

**The Workout:**
1.  **Flat Barbell Bench Press (Sternal Pec)**
    - 4 sets x 6-8 reps
    - *Cue: Retract scapula. Leg drive.*
2.  **Incline Dumbbell Press (Clavicular Pec)**
    - 3 sets x 10-12 reps
    - *Cue: Set bench to 30 degrees. Target the upper chest.*
3.  **Lateral Raises (Side Delt)**
    - 4 sets x 15-20 reps
    - *Cue: Lead with the elbows. Isolate the side delt.*
4.  **Tricep Pushdowns (Lateral Head)**
    - 3 sets x 12-15 reps
    - *Cue: Spread the rope at the bottom.*
5.  **Overhead Tricep Extensions (Long Head)**
    - 3 sets x 12-15 reps
    - *Cue: Stretch the long head of the tricep.*`;
    }

    // --- SHOULDERS SPECIFIC ---
    if (lowerMessage.includes('rear delt')) {
      return `### 👁️ REAR DELT RECON
Essential for shoulder health.

**The Workout:**
1.  **Face Pulls**
    - 4 sets x 15-20 reps
2.  **Reverse Pec Deck**
    - 4 sets x 15-20 reps
3.  **Bent Over Dumbbell Swings**
    - 3 sets x 20 reps (Burnout)`;
    }

    if (lowerMessage.includes('shoulder') || lowerMessage.includes('delt')) {
      return `### 💣 3D SHOULDERS
We want width and thickness.

**The Workout:**
1.  **Seated Dumbbell Overhead Press (Anterior)**
    - 4 sets x 8-10 reps
2.  **Cable Lateral Raises (Lateral)**
    - 4 sets x 12-15 reps
    - *Cue: Constant tension. Don't use momentum.*
3.  **Reverse Pec Deck (Posterior)**
    - 3 sets x 15-20 reps
    - *Cue: Rear delts are often neglected. Hit them hard for shoulder health.*
4.  **Dumbbell Shrugs (Traps)**
    - 3 sets x 12-15 reps
    - *Cue: Pause at the top.*`;
    }

    // --- ARMS SPECIFIC ---
    if (lowerMessage.includes('forearm')) {
      return `### 🧗 FOREARM IRON
Grip strength is everything.

**The Workout:**
1.  **Hammer Curls (Brachioradialis)**
    - 4 sets x 10-12 reps
2.  **Wrist Curls (Flexors)**
    - 3 sets x 15-20 reps
3.  **Reverse Barbell Curls (Extensors)**
    - 3 sets x 12-15 reps`;
    }

    if (lowerMessage.includes('arm') || lowerMessage.includes('bicep') || lowerMessage.includes('tricep') || lowerMessage.includes('gun')) {
      return `### 💪 ARM SPECIALIZATION
Sleeve-busting time.

**Biceps:**
1.  **Incline Dumbbell Curls (Long Head)**: 3 x 12
2.  **Preacher Curls (Short Head)**: 3 x 12
3.  **Hammer Curls (Brachioradialis)**: 3 x 12

**Triceps:**
1.  **Close-Grip Bench Press**: 3 x 8-10 (Compound mass builder)
2.  **Skull Crushers**: 3 x 10-12
3.  **Single Arm Cable Pushdowns**: 3 x 15 (Isolation finish)`;
    }

    // --- GENERAL / INTRO ---
    return `### 🧠 COACH LEO: READY
I'm here to optimize your training, **${name}**.

**My Protocols Cover:**
- 🏋️‍♂️ **Hypertrophy & Strength** (Detailed splits)
- 🥗 **Nutrition & Macros** (Fueling performance)
- 🩹 **Injury Prevention** (Biomechanics)
- 📈 **Log Analysis** (Reviewing your past data)

**Tell me exactly what you want to hit today.**
*e.g., "Give me a high-volume chest workout" or "How do I fix my squat form?"*`;
  }

  async generateSpeech(text: string): Promise<AudioBuffer | null> {
    // TTS not implemented in this fallback
    return null;
  }
}

export const geminiService = new GeminiService();