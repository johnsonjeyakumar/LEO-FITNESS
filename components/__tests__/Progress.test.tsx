import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Progress from '../Progress';
import { mockProfile, mockProgressEntries } from './testUtils';

const mockOnUpdateEntries = vi.fn();
const mockSaveProgressEntry = vi.fn();
const mockDeleteProgressEntry = vi.fn();

vi.mock('../../services/firebase', () => ({
  auth: { currentUser: { uid: 'test-uid' } },
}));

vi.mock('../../services/firestoreService', () => ({
  firestoreService: {
    saveProgressEntry: (...args: any[]) => mockSaveProgressEntry(...args),
    deleteProgressEntry: (...args: any[]) => mockDeleteProgressEntry(...args),
  },
}));

vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="linechart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="xaxis" />,
  YAxis: () => <div data-testid="yaxis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const renderProgress = (props = {}) =>
  render(
    <Progress
      profile={mockProfile}
      entries={mockProgressEntries}
      onUpdateEntries={mockOnUpdateEntries}
      {...props}
    />
  );

describe('Progress', () => {
  it('renders component with header', () => {
    renderProgress();
    expect(screen.getByText('PROGRESS TRACKING')).toBeInTheDocument();
  });

  it('shows summary stats from entries', () => {
    renderProgress();
    expect(screen.getByText('80 kg')).toBeInTheDocument();
  });

  it('shows weekly trend', () => {
    renderProgress();
    expect(screen.getByText('Weekly Trend')).toBeInTheDocument();
  });

  it('shows monthly trend', () => {
    renderProgress();
    expect(screen.getByText('Monthly Trend')).toBeInTheDocument();
  });

  it('shows BMI value', () => {
    renderProgress();
    expect(screen.getByText('24.7')).toBeInTheDocument();
  });

  it('renders tab navigation', () => {
    renderProgress();
    expect(screen.getByText('Analytics Charts')).toBeInTheDocument();
    expect(screen.getByText('Body Measurements')).toBeInTheDocument();
    expect(screen.getByText('Logs History')).toBeInTheDocument();
  });

  it('switches to measurements tab', async () => {
    const user = userEvent.setup();
    renderProgress();
    await user.click(screen.getByText('Body Measurements'));
    expect(screen.getByText('Circumference Stats (cm)')).toBeInTheDocument();
  });

  it('switches to logs tab and shows entries table', async () => {
    const user = userEvent.setup();
    renderProgress();
    await user.click(screen.getByText('Logs History'));
    expect(screen.getByText('2 Entries Logged')).toBeInTheDocument();
    expect(screen.getByText('2026-07-20')).toBeInTheDocument();
  });

  it('shows empty state in logs when no entries', () => {
    renderProgress({ entries: [] });
    expect(screen.getByText('Not Logged')).toBeInTheDocument();
  });

  it('opens add form and submits', async () => {
    mockSaveProgressEntry.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderProgress({ entries: [] });
    await user.click(screen.getByText('Log Measurements'));
    expect(screen.getByText('Log New Measurements')).toBeInTheDocument();
    await user.click(screen.getByText('Save Entry'));
    await waitFor(() => {
      expect(mockOnUpdateEntries).toHaveBeenCalled();
    });
  });

  it('edits an existing entry from logs tab', async () => {
    mockSaveProgressEntry.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderProgress();
    await user.click(screen.getByText('Logs History'));
    const editBtn = screen.getByLabelText('Edit entry from 2026-07-20');
    await user.click(editBtn);
    expect(screen.getByText('Edit Entry')).toBeInTheDocument();
    await user.click(screen.getByText('Update Entry'));
    await waitFor(() => {
      expect(mockOnUpdateEntries).toHaveBeenCalled();
    });
  });

  it('deletes entry after confirmation', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockDeleteProgressEntry.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderProgress();
    await user.click(screen.getByText('Logs History'));
    const deleteBtn = screen.getByLabelText('Delete entry from 2026-07-20');
    await user.click(deleteBtn);
    expect(confirmSpy).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockDeleteProgressEntry).toHaveBeenCalled();
    });
    confirmSpy.mockRestore();
  });

  it('shows weight chart when entries exist', () => {
    renderProgress();
    expect(screen.getByTestId('linechart')).toBeInTheDocument();
  });

  it('shows BMI chart when entries exist', () => {
    renderProgress();
    const linecharts = screen.getAllByTestId('linechart');
    expect(linecharts.length).toBeGreaterThanOrEqual(2);
  });

  it('shows progress tips in measurements tab', async () => {
    const user = userEvent.setup();
    renderProgress();
    await user.click(screen.getByText('Body Measurements'));
    expect(screen.getByText('Progress Tips')).toBeInTheDocument();
  });

  it('shows latest entry notes when present', async () => {
    const user = userEvent.setup();
    renderProgress();
    await user.click(screen.getByText('Body Measurements'));
    expect(screen.getByText('"Feeling good"')).toBeInTheDocument();
  });

  it('closes form on cancel', async () => {
    const user = userEvent.setup();
    renderProgress();
    await user.click(screen.getByText('Log Measurements'));
    await user.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Log New Measurements')).not.toBeInTheDocument();
  });

  it('handles save error gracefully', async () => {
    mockSaveProgressEntry.mockRejectedValueOnce(new Error('Save failed'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    renderProgress({ entries: [] });
    await user.click(screen.getByText('Log Measurements'));
    await user.click(screen.getByText('Save Entry'));
    await waitFor(() => {
      expect(mockOnUpdateEntries).toHaveBeenCalled();
    });
    consoleSpy.mockRestore();
  });

  it('displays "Not Tracked" for missing measurements', async () => {
    const user = userEvent.setup();
    const entriesWithoutMeasures = [{ ...mockProgressEntries[0], shoulders: undefined }];
    renderProgress({ entries: entriesWithoutMeasures });
    await user.click(screen.getByText('Body Measurements'));
    const notTracked = screen.getAllByText('Not Tracked');
    expect(notTracked.length).toBeGreaterThanOrEqual(1);
  });
});
