import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Nutrition from '../Nutrition';
import { mockProfile, mockNutritionEntries } from './testUtils';

const mockOnUpdateEntries = vi.fn();
const mockSaveNutritionEntry = vi.fn();
const mockDeleteNutritionEntry = vi.fn();

vi.mock('../../services/firebase', () => ({
  auth: { currentUser: { uid: 'test-uid' } },
}));

vi.mock('../../services/firestoreService', () => ({
  firestoreService: {
    saveNutritionEntry: (...args: any[]) => mockSaveNutritionEntry(...args),
    deleteNutritionEntry: (...args: any[]) => mockDeleteNutritionEntry(...args),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const renderNutrition = (props = {}) =>
  render(
    <Nutrition
      profile={mockProfile}
      entries={mockNutritionEntries}
      onUpdateEntries={mockOnUpdateEntries}
      {...props}
    />
  );

describe('Nutrition', () => {
  it('renders header and macro progress cards', () => {
    renderNutrition();
    expect(screen.getByText('Nutrition Tracker')).toBeInTheDocument();
    expect(screen.getByText(/Calories/)).toBeInTheDocument();
    expect(screen.getByText(/Protein/)).toBeInTheDocument();
    expect(screen.getByText(/Carbs/)).toBeInTheDocument();
    expect(screen.getByText(/Fats/)).toBeInTheDocument();
  });

  it('shows daily goals calculated from profile', () => {
    renderNutrition();
    const calRegex = /\d+\s*\/\s*\d+/;
    expect(screen.getByText(calRegex)).toBeInTheDocument();
  });

  it('renders add nutrition entry button', () => {
    renderNutrition();
    expect(screen.getByText('Add Nutrition Entry')).toBeInTheDocument();
  });

  it('opens add form on button click', async () => {
    const user = userEvent.setup();
    renderNutrition();
    await user.click(screen.getByText('Add Nutrition Entry'));
    expect(screen.getByText('Add Nutrition')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g., Chicken Breast')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('kcal')).toBeInTheDocument();
  });

  it('shows today entries', () => {
    renderNutrition();
    expect(screen.getByText("Today's Entries")).toBeInTheDocument();
    expect(screen.getByText('Chicken Breast')).toBeInTheDocument();
    expect(screen.getByText('Rice')).toBeInTheDocument();
  });

  it('submits new entry form', async () => {
    mockSaveNutritionEntry.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderNutrition({ entries: [] });
    await user.click(screen.getByText('Add Nutrition Entry'));
    await user.type(screen.getByPlaceholderText('e.g., Chicken Breast'), 'Test Meal');
    await user.type(screen.getByPlaceholderText('kcal'), '500');
    await user.type(screen.getAllByPlaceholderText('g')[0], '30');
    await user.type(screen.getAllByPlaceholderText('g')[1], '40');
    await user.type(screen.getAllByPlaceholderText('g')[2], '10');
    await user.click(screen.getByText('Add Entry'));
    await waitFor(() => {
      expect(mockSaveNutritionEntry).toHaveBeenCalled();
      expect(mockOnUpdateEntries).toHaveBeenCalled();
    });
  });

  it('edits an existing entry', async () => {
    mockSaveNutritionEntry.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderNutrition();
    const editBtn = screen.getByLabelText('Edit Chicken Breast');
    await user.click(editBtn);
    expect(screen.getByText('Edit Entry')).toBeInTheDocument();
    const nameInput = screen.getByPlaceholderText('e.g., Chicken Breast');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Meal');
    await user.click(screen.getByText('Update Entry'));
    await waitFor(() => {
      expect(mockOnUpdateEntries).toHaveBeenCalled();
    });
  });

  it('deletes an entry after confirmation', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockDeleteNutritionEntry.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderNutrition();
    const deleteBtn = screen.getByLabelText('Delete Chicken Breast');
    await user.click(deleteBtn);
    expect(confirmSpy).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockDeleteNutritionEntry).toHaveBeenCalled();
      expect(mockOnUpdateEntries).toHaveBeenCalled();
    });
    confirmSpy.mockRestore();
  });

  it('does not delete if confirmation is cancelled', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const user = userEvent.setup();
    renderNutrition();
    const deleteBtn = screen.getByLabelText('Delete Chicken Breast');
    await user.click(deleteBtn);
    expect(mockDeleteNutritionEntry).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('closes form on cancel', async () => {
    const user = userEvent.setup();
    renderNutrition();
    await user.click(screen.getByText('Add Nutrition Entry'));
    await user.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Add Nutrition')).not.toBeInTheDocument();
  });

  it('shows empty state when no entries', () => {
    renderNutrition({ entries: [] });
    expect(screen.getByText('No entries for today. Add your first meal!')).toBeInTheDocument();
  });

  it('shows progress percentages', () => {
    renderNutrition();
    expect(screen.getByText(/% of daily goal/)).toBeInTheDocument();
  });

  it('handles save error gracefully', async () => {
    mockSaveNutritionEntry.mockRejectedValueOnce(new Error('Save failed'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    renderNutrition({ entries: [] });
    await user.click(screen.getByText('Add Nutrition Entry'));
    await user.type(screen.getByPlaceholderText('e.g., Chicken Breast'), 'Test');
    await user.type(screen.getByPlaceholderText('kcal'), '100');
    await user.type(screen.getAllByPlaceholderText('g')[0], '10');
    await user.type(screen.getAllByPlaceholderText('g')[1], '10');
    await user.type(screen.getAllByPlaceholderText('g')[2], '10');
    await user.click(screen.getByText('Add Entry'));
    await waitFor(() => {
      expect(mockOnUpdateEntries).toHaveBeenCalled();
    });
    consoleSpy.mockRestore();
  });

  it('renders macronutrient breakdown per entry', () => {
    renderNutrition();
    expect(screen.getByText(/350 kcal/)).toBeInTheDocument();
    expect(screen.getByText(/40g protein/)).toBeInTheDocument();
  });
});
