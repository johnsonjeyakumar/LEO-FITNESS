import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Goal, Experience, Gender, Equipment, SplitPreference } from '../../types';

const { mockStartChat, mockSendMessage, mockGenerateContent, mockGetGenerativeModel } = vi.hoisted(() => {
  const mockStartChat = vi.fn();
  const mockSendMessage = vi.fn();
  const mockGenerateContent = vi.fn();
  const mockGetGenerativeModel = vi.fn(function() {
    return {
      generateContent: mockGenerateContent,
      startChat: mockStartChat,
    };
  });
  return { mockStartChat, mockSendMessage, mockGenerateContent, mockGetGenerativeModel };
});

vi.mock('@google/generative-ai', () => {
  const MockGoogleGenerativeAI = vi.fn(function() {
    return { getGenerativeModel: mockGetGenerativeModel };
  });
  return { GoogleGenerativeAI: MockGoogleGenerativeAI };
});

const mockProfile = {
  name: 'Test User',
  age: 28,
  gender: Gender.MALE as Gender,
  weight: 80,
  height: 180,
  experience: Experience.INTERMEDIATE as Experience,
  goal: Goal.STRENGTH as Goal,
  daysAvailable: 5,
  equipment: Equipment.FULL_GYM as Equipment,
  splitPreference: SplitPreference.PPL as SplitPreference,
  injuries: 'None',
  completedOnboarding: true,
};

const VALID_KEY = 'valid-key-12345';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('geminiService', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('generateWorkout', () => {
    it('throws when API key is not configured', async () => {
      process.env.VITE_GEMINI_API_KEY = '';
      const { geminiService: gs } = await import('../geminiService');
      await expect(gs.generateWorkout(mockProfile)).rejects.toThrow('API key is not configured');
    });

    it('uses demo plan when API call fails', async () => {
      process.env.VITE_GEMINI_API_KEY = VALID_KEY;
      const { geminiService: gs } = await import('../geminiService');

      const result = await gs.generateWorkout(mockProfile);
      expect(result.splitName).toContain('Day');
      expect(result.schedule).toHaveLength(3);
      expect(result.generatedAt).toBeDefined();
    });

    it('uses demo plan when API call succeeds but returns invalid JSON', async () => {
      process.env.VITE_GEMINI_API_KEY = VALID_KEY;
      const response = { response: { text: function () { return 'not valid json at all'; } } };
      mockGenerateContent.mockResolvedValue(response);

      const { geminiService: gs } = await import('../geminiService');
      const result = await gs.generateWorkout(mockProfile);
      expect(result.splitName).toContain('Day');
      expect(result.schedule).toHaveLength(3);
    });

    it('parses JSON from API response with markdown fences', async () => {
      process.env.VITE_GEMINI_API_KEY = VALID_KEY;
      const validResponse = {
        splitName: 'Custom Split',
        description: 'A test plan',
        schedule: [
          { dayName: 'Day 1', focus: 'Chest', exercises: [
            { name: 'Bench Press', sets: 4, reps: '8-10', rest: '90s', muscleGroup: 'Chest', recommendedWeight: '70%', notes: '' },
          ]},
          { dayName: 'Day 2', focus: 'Back', exercises: [
            { name: 'Rows', sets: 4, reps: '8-10', rest: '90s', muscleGroup: 'Back', recommendedWeight: '70%', notes: '' },
          ]},
        ],
      };
      const response = { response: { text: function () { return '```json\n' + JSON.stringify(validResponse) + '\n```'; } } };
      mockGenerateContent.mockResolvedValue(response);

      const { geminiService: gs } = await import('../geminiService');
      const result = await gs.generateWorkout(mockProfile);
      expect(result.splitName).toBe('Custom Split');
      expect(result.schedule).toHaveLength(2);
    });
  });

  describe('chatWithCoach', () => {
    it('returns mock response when no model initialized', async () => {
      process.env.VITE_GEMINI_API_KEY = '';
      const { geminiService: gs } = await import('../geminiService');
      const result = await gs.chatWithCoach([], 'hello', mockProfile);
      expect(result).toContain('COACH LEO');
    });

    it('returns chest workout response for chest query', async () => {
      process.env.VITE_GEMINI_API_KEY = VALID_KEY;
      const { geminiService: gs } = await import('../geminiService');
      const result = await gs.chatWithCoach([], 'give me a chest workout', mockProfile);
      expect(result).toContain('PUSH DAY');
      expect(result).toContain('Bench Press');
    });

    it('returns leg workout response for leg query', async () => {
      process.env.VITE_GEMINI_API_KEY = VALID_KEY;
      const { geminiService: gs } = await import('../geminiService');
      const result = await gs.chatWithCoach([], 'leg day routine', mockProfile);
      expect(result).toContain('LEG DAY');
      expect(result).toContain('Squats');
    });

    it('returns arm specialization for arm query', async () => {
      process.env.VITE_GEMINI_API_KEY = VALID_KEY;
      const { geminiService: gs } = await import('../geminiService');
      const result = await gs.chatWithCoach([], 'bicep workout', mockProfile);
      expect(result).toContain('ARM SPECIALIZATION');
    });

    it('returns mock on API error', async () => {
      process.env.VITE_GEMINI_API_KEY = VALID_KEY;
      mockStartChat.mockReturnValue({ sendMessage: mockSendMessage });
      mockSendMessage.mockRejectedValue(new Error('API error'));

      const { geminiService: gs } = await import('../geminiService');
      const result = await gs.chatWithCoach([], 'hello', mockProfile, 'context');
      expect(result).toContain('COACH LEO');
    });
  });

  describe('generateSpeech', () => {
    it('returns null (not implemented)', async () => {
      process.env.VITE_GEMINI_API_KEY = VALID_KEY;
      const { geminiService: gs } = await import('../geminiService');
      const result = await gs.generateSpeech('hello');
      expect(result).toBeNull();
    });
  });
});
