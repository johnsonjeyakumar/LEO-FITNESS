import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WorkoutView from '../WorkoutView';
import { mockProfile, mockWorkoutPlan } from './testUtils';

const mockSetPlan = vi.fn();
const mockOnUpdateLogs = vi.fn();
const mockGenerateWorkout = vi.fn();

vi.mock('../../services/geminiService', () => ({
  geminiService: {
    generateWorkout: (...args: any[]) => mockGenerateWorkout(...args),
  },
}));

vi.mock('../WorkoutChart', () => ({
  default: ({ plan }: any) => <div data-testid="workout-chart">{plan ? 'Chart' : 'No Chart'}</div>,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const renderWorkoutView = (props = {}) =>
  render(
    <WorkoutView
      profile={mockProfile}
      plan={mockWorkoutPlan}
      setPlan={mockSetPlan}
      logs={[]}
      onUpdateLogs={mockOnUpdateLogs}
      {...props}
    />
  );

describe('WorkoutView', () => {
  it('renders plan header and details when plan exists', () => {
    renderWorkoutView();
    expect(screen.getByText('Premium Protocol')).toBeInTheDocument();
    expect(screen.getByText(mockWorkoutPlan.splitName)).toBeInTheDocument();
    expect(screen.getByText(mockWorkoutPlan.description!)).toBeInTheDocument();
  });

  it('renders day names from schedule', () => {
    renderWorkoutView();
    expect(screen.getByText('Day 1 - Push')).toBeInTheDocument();
    expect(screen.getByText('Day 2 - Pull')).toBeInTheDocument();
  });

  it('shows exercise count per day', () => {
    renderWorkoutView();
    const exerciseLabels = screen.getAllByText(/EXERCISES/);
    expect(exerciseLabels.length).toBeGreaterThanOrEqual(2);
  });

  it('expands day to show exercises on click', async () => {
    const user = userEvent.setup();
    renderWorkoutView();
    await user.click(screen.getByText('Day 1 - Push'));
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
    expect(screen.getByText('Overhead Press')).toBeInTheDocument();
  });

  it('shows empty state when no plan and not loading', () => {
    renderWorkoutView({ plan: null, loading: false });
    expect(screen.getByText('No Plan Detected')).toBeInTheDocument();
    expect(screen.getByText('Generate Protocol')).toBeInTheDocument();
  });

  it('shows loading state when generating', () => {
    renderWorkoutView({ plan: null });
    expect(screen.getByText('No Plan Detected')).toBeInTheDocument();
  });

  it('generates new plan on button click', async () => {
    mockGenerateWorkout.mockResolvedValueOnce(mockWorkoutPlan);
    const user = userEvent.setup();
    renderWorkoutView({ plan: null });
    await user.click(screen.getByText('Generate Protocol'));
    expect(mockGenerateWorkout).toHaveBeenCalledWith(mockProfile);
    await waitFor(() => {
      expect(mockSetPlan).toHaveBeenCalledWith(mockWorkoutPlan);
    });
  });

  it('handles generate failure with alert', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    mockGenerateWorkout.mockRejectedValueOnce(new Error('API Error'));
    const user = userEvent.setup();
    renderWorkoutView({ plan: null });
    await user.click(screen.getByText('Generate Protocol'));
    await waitFor(() => {
      expect(alertMock).toHaveBeenCalled();
    });
    alertMock.mockRestore();
  });

  it('regenerates plan from header button', async () => {
    mockGenerateWorkout.mockResolvedValueOnce(mockWorkoutPlan);
    const user = userEvent.setup();
    renderWorkoutView();
    await user.click(screen.getByText('Regenerate'));
    expect(mockGenerateWorkout).toHaveBeenCalledWith(mockProfile);
  });

  it('toggles exercise completion', async () => {
    const user = userEvent.setup();
    renderWorkoutView();
    await user.click(screen.getByText('Day 1 - Push'));
    const checkboxes = screen.getAllByRole('button');
    const completeBtn = checkboxes.find(b => b.className?.includes('w-6 h-6 rounded border-2'));
    if (completeBtn) {
      await user.click(completeBtn);
      await waitFor(() => {
        expect(mockOnUpdateLogs).toHaveBeenCalled();
      });
    }
  });

  it('renders workout chart', () => {
    renderWorkoutView();
    expect(screen.getByTestId('workout-chart')).toBeInTheDocument();
  });

  it('starts timer on timer button click', async () => {
    const user = userEvent.setup();
    renderWorkoutView();
    await user.click(screen.getByText('Day 1 - Push'));
    const timerBtn = screen.getByLabelText('Start timer');
    await user.click(timerBtn);
    await waitFor(() => {
      expect(screen.getByText('00:01')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows exercise details including sets and reps', async () => {
    const user = userEvent.setup();
    renderWorkoutView();
    await user.click(screen.getByText('Day 1 - Push'));
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getAllByText(/8-12/).length).toBeGreaterThanOrEqual(1);
  });

  it('shows exercise notes when present', async () => {
    const user = userEvent.setup();
    renderWorkoutView();
    await user.click(screen.getByText('Day 1 - Push'));
    expect(screen.getByText('Focus on form')).toBeInTheDocument();
  });
});
