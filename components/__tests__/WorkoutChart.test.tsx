import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import WorkoutChart from '../WorkoutChart';
import { mockWorkoutPlan } from './testUtils';

vi.mock('recharts', () => ({
  BarChart: ({ children }: any) => <div data-testid="barchart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="xaxis" />,
  YAxis: () => <div data-testid="yaxis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="piechart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
}));

describe('WorkoutChart', () => {
  it('renders empty state when no plan', () => {
    render(<WorkoutChart plan={null} />);
    expect(screen.getByText('Generate a workout plan to see analytics')).toBeInTheDocument();
  });

  it('renders charts when plan is provided', () => {
    render(<WorkoutChart plan={mockWorkoutPlan} />);
    expect(screen.getByText('Muscle Group Volume')).toBeInTheDocument();
    expect(screen.getByText('Split Overview')).toBeInTheDocument();
    expect(screen.getByText('Weekly Training Volume')).toBeInTheDocument();
  });

  it('displays training days count', () => {
    render(<WorkoutChart plan={mockWorkoutPlan} />);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Training Days')).toBeInTheDocument();
  });

  it('displays total exercises', () => {
    render(<WorkoutChart plan={mockWorkoutPlan} />);
    expect(screen.getByText('Total Exercises')).toBeInTheDocument();
  });

  it('displays total sets', () => {
    render(<WorkoutChart plan={mockWorkoutPlan} />);
    expect(screen.getByText('Total Sets')).toBeInTheDocument();
  });

  it('displays muscle groups count', () => {
    render(<WorkoutChart plan={mockWorkoutPlan} />);
    expect(screen.getByText('Muscle Groups')).toBeInTheDocument();
  });
});
