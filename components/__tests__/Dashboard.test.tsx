import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Dashboard from '../Dashboard';
import { mockProfile, mockWorkoutPlan, mockDailyLogs, mockNutritionEntries } from './testUtils';

const renderDashboard = (props = {}) =>
  render(
    <Dashboard
      profile={mockProfile}
      workoutPlan={mockWorkoutPlan}
      logs={mockDailyLogs}
      nutritionEntries={mockNutritionEntries}
      {...props}
    />
  );

describe('Dashboard', () => {
  it('renders heading', () => {
    renderDashboard();
    expect(screen.getByText(/NEEYUM AGALAM DAA/)).toBeInTheDocument();
  });

  it('displays workout streak', () => {
    renderDashboard();
    expect(screen.getByText('Workout Streak')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('displays nutrition streak', () => {
    renderDashboard();
    expect(screen.getByText('Nutrition Streak')).toBeInTheDocument();
  });

  it('displays stats from logs', () => {
    renderDashboard({ logs: [mockDailyLogs[0]] });
    expect(screen.getByText('Workouts Completed')).toBeInTheDocument();
    expect(screen.getByText('Calories Burned')).toBeInTheDocument();
  });

  it('displays workout plan details when plan exists', () => {
    renderDashboard();
    expect(screen.getByText("Today's Focus")).toBeInTheDocument();
    expect(screen.getByText(mockWorkoutPlan.schedule[0].focus)).toBeInTheDocument();
  });

  it('displays empty state when no workout plan', () => {
    renderDashboard({ workoutPlan: null });
    expect(screen.getByText('No workout plan yet')).toBeInTheDocument();
  });

  it('displays profile quick stats', () => {
    renderDashboard();
    expect(screen.getByText(mockProfile.name)).toBeInTheDocument();
    expect(screen.getByText(`${mockProfile.age} years`)).toBeInTheDocument();
    expect(screen.getByText(`${mockProfile.height} cm`)).toBeInTheDocument();
  });

  it('displays goal', () => {
    renderDashboard();
    expect(screen.getByText(mockProfile.goal!)).toBeInTheDocument();
  });

  it('renders all stat cards', () => {
    renderDashboard();
    expect(screen.getByText('Workouts Completed')).toBeInTheDocument();
    expect(screen.getByText('Calories Burned')).toBeInTheDocument();
    expect(screen.getByText('Current Weight')).toBeInTheDocument();
    expect(screen.getByText('Goal')).toBeInTheDocument();
  });

  it('shows 0 streak when no logs match today', () => {
    const pastLogs = [{ date: new Date(Date.now() - 86400000 * 2).toDateString(), waterIntake: 2000, sleepHours: 8, mood: 'Good' as const, workoutCompleted: true }];
    renderDashboard({ logs: pastLogs });
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('shows 0 for workouts completed when none exist', () => {
    renderDashboard({ logs: [] });
    expect(screen.getByText('Workouts Completed')).toBeInTheDocument();
  });

  it('handles null plan gracefully', () => {
    renderDashboard({ workoutPlan: null });
    expect(screen.queryByText(mockWorkoutPlan.schedule[0].focus)).not.toBeInTheDocument();
  });

  it('displays streak zero message', () => {
    renderDashboard({ logs: [], nutritionEntries: [] });
    expect(screen.getByText('Start your streak today!')).toBeInTheDocument();
    expect(screen.getByText('Log your meals today!')).toBeInTheDocument();
  });
});
