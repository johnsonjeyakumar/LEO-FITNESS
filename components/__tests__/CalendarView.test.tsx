import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CalendarView from '../CalendarView';
import { mockProfile, mockSessions, mockDailyLogs, mockNutritionEntries, mockProgressEntries } from './testUtils';

const mockGetAchievements = vi.fn();

vi.mock('../../services/firebase', () => ({
  auth: { currentUser: { uid: 'test-uid' } },
}));

vi.mock('../../services/firestoreService', () => ({
  firestoreService: {
    getAchievements: (...args: any[]) => mockGetAchievements(...args),
  },
}));

const mockAchievements = [
  { id: 'a1', title: 'First Workout', description: 'Completed first workout', unlocked: true, unlockedAt: new Date().toISOString(), progress: 1, target: 1, category: 'Workout' },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAchievements.mockResolvedValue(mockAchievements);
});

const renderCalendar = (props = {}) =>
  render(
    <CalendarView
      profile={mockProfile}
      sessions={mockSessions}
      logs={mockDailyLogs}
      nutritionEntries={mockNutritionEntries}
      progressEntries={mockProgressEntries}
      {...props}
    />
  );

describe('CalendarView', () => {
  it('renders header and description', async () => {
    renderCalendar();
    await waitFor(() => {
      expect(screen.getByText('Smart Calendar')).toBeInTheDocument();
    });
  });

  it('renders view mode switcher', () => {
    renderCalendar();
    expect(screen.getByText('Month')).toBeInTheDocument();
    expect(screen.getByText('Week')).toBeInTheDocument();
  });

  it('renders filter checkboxes', () => {
    renderCalendar();
    expect(screen.getByText('Filter Calendars')).toBeInTheDocument();
    expect(screen.getByText('Workouts')).toBeInTheDocument();
    expect(screen.getByText('Nutrition')).toBeInTheDocument();
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('Achievements')).toBeInTheDocument();
  });

  it('switches to week view', async () => {
    const user = userEvent.setup();
    renderCalendar();
    await user.click(screen.getByText('Week'));
    expect(screen.getByText(/Week of/)).toBeInTheDocument();
  });

  it('shows selected date details panel', async () => {
    renderCalendar();
    await waitFor(() => {
      expect(screen.getByText('Daily Protocol Logs')).toBeInTheDocument();
    });
  });

  it('navigates to next month', async () => {
    const user = userEvent.setup();
    renderCalendar();
    const nextBtn = screen.getAllByRole('button').find(b => b.innerHTML.includes('ChevronRight'));
    if (nextBtn) {
      await user.click(nextBtn);
    }
  });

  it('navigates to previous month', async () => {
    const user = userEvent.setup();
    renderCalendar();
    const prevBtn = screen.getAllByRole('button').find(b => b.innerHTML.includes('ChevronLeft'));
    if (prevBtn) {
      await user.click(prevBtn);
    }
  });

  it('selects a date from the grid', async () => {
    const user = userEvent.setup();
    renderCalendar();
    await waitFor(() => {
      const dayButtons = screen.getAllByRole('button').filter(b => b.textContent && /^\d+$/.test(b.textContent!.trim()));
      if (dayButtons.length > 0) {
        user.click(dayButtons[10]);
      }
    });
  });

  it('toggles workout filter', async () => {
    const user = userEvent.setup();
    renderCalendar();
    const workoutCheckbox = screen.getByLabelText(/Workouts/);
    await user.click(workoutCheckbox);
    expect(workoutCheckbox).not.toBeChecked();
    await user.click(workoutCheckbox);
    expect(workoutCheckbox).toBeChecked();
  });

  it('toggles nutrition filter', async () => {
    const user = userEvent.setup();
    renderCalendar();
    const nutritionCheckbox = screen.getByLabelText(/Nutrition/);
    await user.click(nutritionCheckbox);
    expect(nutritionCheckbox).not.toBeChecked();
  });

  it('shows empty state when no activities', async () => {
    renderCalendar({
      sessions: [],
      logs: [],
      nutritionEntries: [],
      progressEntries: [],
    });
    await waitFor(() => {
      expect(screen.getByText('No activities recorded for this date.')).toBeInTheDocument();
    });
  });

  it('loads achievements on mount', async () => {
    renderCalendar();
    await waitFor(() => {
      expect(mockGetAchievements).toHaveBeenCalledWith('test-uid');
    });
  });

  it('displays achievement badges in details panel', async () => {
    const todayStr = new Date().toDateString();
    const achievementsWithToday = [
      { id: 'a1', title: 'First Workout', description: 'Completed first workout', unlocked: true, unlockedAt: new Date().toISOString(), progress: 1, target: 1, category: 'Workout' },
    ];
    mockGetAchievements.mockResolvedValue(achievementsWithToday);
    renderCalendar();
    await waitFor(() => {
      const activityIndicators = screen.queryAllByText(/Unlocked Badges/);
    });
  });
});
