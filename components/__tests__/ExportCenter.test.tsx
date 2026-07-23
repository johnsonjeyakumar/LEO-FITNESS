import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ExportCenter from '../ExportCenter';
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

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAchievements.mockResolvedValue([]);
});

const renderExportCenter = (props = {}) =>
  render(
    <ExportCenter
      profile={mockProfile}
      sessions={mockSessions}
      logs={mockDailyLogs}
      nutritionEntries={mockNutritionEntries}
      progressEntries={mockProgressEntries}
      {...props}
    />
  );

describe('ExportCenter', () => {
  it('renders header and description', () => {
    renderExportCenter();
    expect(screen.getByText('Export Center')).toBeInTheDocument();
    expect(screen.getByText(/Download backups, CSV logs/)).toBeInTheDocument();
  });

  it('renders export configuration panel', () => {
    renderExportCenter();
    expect(screen.getByText('Export Configuration')).toBeInTheDocument();
    expect(screen.getByText('Start Date')).toBeInTheDocument();
    expect(screen.getByText('End Date')).toBeInTheDocument();
  });

  it('renders include datasets checkboxes', () => {
    renderExportCenter();
    expect(screen.getByText('Include Datasets')).toBeInTheDocument();
    expect(screen.getByText('Workout Sessions & History')).toBeInTheDocument();
    expect(screen.getByText('Nutrition & Macros Logs')).toBeInTheDocument();
    expect(screen.getByText('Progress & Body Metrics Logs')).toBeInTheDocument();
    expect(screen.getByText('Achievements & Level Summary')).toBeInTheDocument();
  });

  it('renders format options', () => {
    renderExportCenter();
    expect(screen.getByText('Choose Format')).toBeInTheDocument();
    expect(screen.getByText('JSON Backup')).toBeInTheDocument();
    expect(screen.getByText('CSV Spreadsheet')).toBeInTheDocument();
    expect(screen.getByText('PDF Fitness Report')).toBeInTheDocument();
  });

  it('selects different format', async () => {
    const user = userEvent.setup();
    renderExportCenter();
    await user.click(screen.getByText('CSV Spreadsheet'));
    await user.click(screen.getByText('PDF Fitness Report'));
  });

  it('toggles dataset checkboxes', async () => {
    const user = userEvent.setup();
    renderExportCenter();
    const workoutCheckbox = screen.getByLabelText(/Workout Sessions/);
    await user.click(workoutCheckbox);
    expect(workoutCheckbox).not.toBeChecked();
    await user.click(workoutCheckbox);
    expect(workoutCheckbox).toBeChecked();
  });

  it('disables export button when no options selected', async () => {
    const user = userEvent.setup();
    renderExportCenter();
    const workoutCheckbox = screen.getByLabelText(/Workout Sessions/);
    const nutritionCheckbox = screen.getByLabelText(/Nutrition/);
    const progressCheckbox = screen.getByLabelText(/Progress/);
    const achievementCheckbox = screen.getByLabelText(/Achievements/);
    await user.click(workoutCheckbox);
    await user.click(nutritionCheckbox);
    await user.click(progressCheckbox);
    await user.click(achievementCheckbox);
    expect(screen.getByText('Export Data')).toBeDisabled();
  });

  it('exports JSON on button click', async () => {
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue({
      setAttribute: vi.fn(),
      click: vi.fn(),
    } as any);
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => {} as any);
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => {} as any);
    mockGetAchievements.mockResolvedValue([]);
    const user = userEvent.setup();
    renderExportCenter();
    await user.click(screen.getByText('Export Data'));
    await waitFor(() => {
      expect(createElementSpy).toHaveBeenCalled();
    });
    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it('shows success message after export', async () => {
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue({
      setAttribute: vi.fn(),
      click: vi.fn(),
    } as any);
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => {} as any);
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => {} as any);
    const user = userEvent.setup();
    renderExportCenter();
    await user.click(screen.getByText('Export Data'));
    await waitFor(() => {
      expect(screen.getByText('Export generated successfully!')).toBeInTheDocument();
    });
    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it('shows processing state during export', async () => {
    mockGetAchievements.mockImplementationOnce(() => new Promise(() => {}));
    const user = userEvent.setup();
    renderExportCenter();
    await user.click(screen.getByText('Export Data'));
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });
});
