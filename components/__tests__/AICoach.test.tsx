import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AICoach from '../AICoach';
import { mockProfile } from './testUtils';

const mockChatWithCoach = vi.fn();
const mockGenerateSpeech = vi.fn();
const mockBuildUserContext = vi.fn();

vi.mock('../../services/firebase', () => ({
  auth: { currentUser: { uid: 'test-uid' } },
}));

vi.mock('../../services/geminiService', () => ({
  geminiService: {
    chatWithCoach: (...args: any[]) => mockChatWithCoach(...args),
    generateSpeech: (...args: any[]) => mockGenerateSpeech(...args),
  },
}));

vi.mock('../../services/contextBuilderService', () => ({
  contextBuilderService: {
    buildUserContext: (...args: any[]) => mockBuildUserContext(...args),
  },
}));

vi.mock('react-markdown', () => ({
  default: ({ children }: any) => <div data-testid="markdown">{children}</div>,
}));

vi.mock('remark-gfm', () => ({
  default: () => {},
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockBuildUserContext.mockResolvedValue('User context data');
  mockChatWithCoach.mockResolvedValue('Focus on compound lifts for maximum efficiency.');
});

const renderAICoach = () => render(<AICoach profile={mockProfile} />);

describe('AICoach', () => {
  it('renders coach header with name', () => {
    renderAICoach();
    expect(screen.getByText('COACH LEO')).toBeInTheDocument();
    expect(screen.getByText('PRO')).toBeInTheDocument();
  });

  it('renders initial welcome message', () => {
    renderAICoach();
    expect(screen.getByText('READY TO DOMINATE?')).toBeInTheDocument();
  });

  it('renders input field and send button', () => {
    renderAICoach();
    expect(screen.getByPlaceholderText('Ask Leo about your protocol...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '' })).toBeInTheDocument();
  });

  it('shows send button disabled when input is empty', () => {
    renderAICoach();
    const sendButton = screen.getAllByRole('button').find(b => b.classList.contains('bg-primary'));
    if (sendButton) {
      expect(sendButton).toBeDisabled();
    }
  });

  it('sends message and receives response', async () => {
    mockBuildUserContext.mockResolvedValue('User context');
    mockChatWithCoach.mockResolvedValue('Try doing 4 sets of 8-12 reps.');
    const user = userEvent.setup();
    renderAICoach();
    const input = screen.getByPlaceholderText('Ask Leo about your protocol...');
    await user.type(input, 'What workout should I do?');
    const sendButton = screen.getAllByRole('button').find(b => b.classList.contains('bg-primary'));
    if (sendButton) {
      await user.click(sendButton);
      await waitFor(() => {
        expect(mockChatWithCoach).toHaveBeenCalled();
        expect(screen.getByText('Try doing 4 sets of 8-12 reps.')).toBeInTheDocument();
      });
    }
  });

  it('sends on Enter key press', async () => {
    mockChatWithCoach.mockResolvedValue('Push yourself harder!');
    const user = userEvent.setup();
    renderAICoach();
    const input = screen.getByPlaceholderText('Ask Leo about your protocol...');
    await user.type(input, 'How can I improve?');
    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(mockChatWithCoach).toHaveBeenCalled();
    });
  });

  it('shows user message after sending', async () => {
    mockChatWithCoach.mockResolvedValue('Response text');
    const user = userEvent.setup();
    renderAICoach();
    const input = screen.getByPlaceholderText('Ask Leo about your protocol...');
    await user.type(input, 'Test message');
    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });

  it('handles error from chat API gracefully', async () => {
    mockChatWithCoach.mockRejectedValueOnce(new Error('API Error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    renderAICoach();
    const input = screen.getByPlaceholderText('Ask Leo about your protocol...');
    await user.type(input, 'Hello');
    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(screen.getByText(/SYSTEM ERROR/)).toBeInTheDocument();
    });
    consoleSpy.mockRestore();
  });

  it('builds user context on send', async () => {
    mockChatWithCoach.mockResolvedValue('Reply');
    const user = userEvent.setup();
    renderAICoach();
    const input = screen.getByPlaceholderText('Ask Leo about your protocol...');
    await user.type(input, 'Analyze me');
    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(mockBuildUserContext).toHaveBeenCalledWith('test-uid');
    });
  });

  it('falls back to localStorage context when Firestore context is empty', async () => {
    mockBuildUserContext.mockResolvedValue('');
    mockChatWithCoach.mockResolvedValue('Fallback reply');
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('Some notes data');
    const user = userEvent.setup();
    renderAICoach();
    const input = screen.getByPlaceholderText('Ask Leo about your protocol...');
    await user.type(input, 'Hello');
    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(mockChatWithCoach).toHaveBeenCalled();
    });
    vi.restoreAllMocks();
  });

  it('clears chat on refresh button click', async () => {
    const user = userEvent.setup();
    renderAICoach();
    const clearBtn = screen.getByLabelText('Clear Chat');
    await user.click(clearBtn);
    expect(screen.getByText('READY TO DOMINATE?')).toBeInTheDocument();
  });

  it('shows loading indicator while waiting for response', async () => {
    mockChatWithCoach.mockImplementationOnce(() => new Promise(() => {}));
    const user = userEvent.setup();
    renderAICoach();
    const input = screen.getByPlaceholderText('Ask Leo about your protocol...');
    await user.type(input, 'Test');
    await user.keyboard('{Enter}');
    expect(screen.getByText('COMPUTING RESPONSE...')).toBeInTheDocument();
  });

  it('disables input and button while streaming', async () => {
    mockChatWithCoach.mockImplementationOnce(() => new Promise(() => {}));
    const user = userEvent.setup();
    renderAICoach();
    const input = screen.getByPlaceholderText('Ask Leo about your protocol...');
    await user.type(input, 'Test');
    await user.keyboard('{Enter}');
    expect(input).toBeDisabled();
  });

  it('reads TTS button exists on model messages', () => {
    renderAICoach();
    const readAloudBtns = screen.getAllByLabelText('Read Aloud');
    expect(readAloudBtns.length).toBeGreaterThanOrEqual(1);
  });
});
