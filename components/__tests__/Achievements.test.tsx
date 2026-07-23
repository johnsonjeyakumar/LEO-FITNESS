import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Achievements from '../Achievements';
import { mockProfile, mockGamificationData } from './testUtils';

const mockUpdateGamificationData = vi.fn();

vi.mock('../../services/firebase', () => ({
  auth: { currentUser: { uid: 'test-uid' } },
}));

vi.mock('../../services/gamificationService', () => ({
  gamificationService: {
    updateGamificationData: (...args: any[]) => mockUpdateGamificationData(...args),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdateGamificationData.mockResolvedValue(mockGamificationData);
});

const renderAchievements = () => render(<Achievements profile={mockProfile} />);

describe('Achievements', () => {
  it('shows loading state initially', () => {
    mockUpdateGamificationData.mockImplementationOnce(() => new Promise(() => {}));
    renderAchievements();
    expect(screen.getByText('GOALS & ACHIEVEMENTS')).toBeInTheDocument();
  });

  it('displays level and XP after loading', async () => {
    renderAchievements();
    await waitFor(() => {
      expect(screen.getByText('LEVEL 3')).toBeInTheDocument();
      expect(screen.getByText(/1250 Total XP/)).toBeInTheDocument();
    });
  });

  it('displays streak info', async () => {
    renderAchievements();
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText(/Record Streak: 12 days/)).toBeInTheDocument();
    });
  });

  it('displays weekly challenges', async () => {
    renderAchievements();
    await waitFor(() => {
      expect(screen.getByText('Weekly Challenges')).toBeInTheDocument();
      expect(screen.getByText('4 Workouts')).toBeInTheDocument();
      expect(screen.getByText('Hit Protein Goal')).toBeInTheDocument();
    });
  });

  it('displays monthly milestones', async () => {
    renderAchievements();
    await waitFor(() => {
      expect(screen.getByText('Monthly Milestones')).toBeInTheDocument();
      expect(screen.getByText('20 Workouts')).toBeInTheDocument();
    });
  });

  it('displays badges with filter buttons', async () => {
    renderAchievements();
    await waitFor(() => {
      expect(screen.getByText('Achievement Badges')).toBeInTheDocument();
      expect(screen.getByText('First Workout')).toBeInTheDocument();
      expect(screen.getByText('Streak Master')).toBeInTheDocument();
      expect(screen.getByText('Nutrition Pro')).toBeInTheDocument();
    });
  });

  it('filters badges by unlocked', async () => {
    const user = userEvent.setup();
    renderAchievements();
    await waitFor(() => {
      expect(screen.getByText('unlocked')).toBeInTheDocument();
    });
    await user.click(screen.getByText('unlocked'));
    expect(screen.getByText('First Workout')).toBeInTheDocument();
    expect(screen.getByText('Nutrition Pro')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText('Streak Master')).not.toBeInTheDocument();
    });
  });

  it('filters badges by locked', async () => {
    const user = userEvent.setup();
    renderAchievements();
    await waitFor(() => {
      expect(screen.getByText('locked')).toBeInTheDocument();
    });
    await user.click(screen.getByText('locked'));
    await waitFor(() => {
      expect(screen.getByText('Streak Master')).toBeInTheDocument();
      expect(screen.queryByText('First Workout')).not.toBeInTheDocument();
    });
  });

  it('shows empty state when no data returned', async () => {
    mockUpdateGamificationData.mockResolvedValueOnce(null);
    renderAchievements();
    await waitFor(() => {
      expect(screen.getByText('No achievements yet')).toBeInTheDocument();
    });
  });

  it('shows unmatched filter message', async () => {
    const user = userEvent.setup();
    const data = { ...mockGamificationData, badges: [] };
    mockUpdateGamificationData.mockResolvedValue(data);
    renderAchievements();
    await waitFor(() => {
      expect(screen.getByText('locked')).toBeInTheDocument();
    });
    await user.click(screen.getByText('locked'));
    await waitFor(() => {
      expect(screen.getByText('No badges match the selected filter.')).toBeInTheDocument();
    });
  });

  it('shows unlocked date on unlocked badges', async () => {
    renderAchievements();
    await waitFor(() => {
      const dates = screen.getAllByText(/7\/1\/2026|7\/15\/2026/);
      expect(dates.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('handles fetch error gracefully', async () => {
    mockUpdateGamificationData.mockRejectedValueOnce(new Error('Fetch failed'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderAchievements();
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });
    consoleSpy.mockRestore();
  });
});
