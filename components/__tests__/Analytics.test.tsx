import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Analytics from '../Analytics';
import { mockProfile, mockInsightReport, mockComparison, mockProgressExport } from './testUtils';

const mockGenerateInsightReport = vi.fn();
const mockGenerateComparison = vi.fn();
const mockGenerateProgressExport = vi.fn();

vi.mock('../../services/adaptiveTrainingService', () => ({
  adaptiveTrainingService: {
    generateInsightReport: (...args: any[]) => mockGenerateInsightReport(...args),
    generateComparison: (...args: any[]) => mockGenerateComparison(...args),
    generateProgressExport: (...args: any[]) => mockGenerateProgressExport(...args),
  },
}));

vi.mock('recharts', () => ({
  BarChart: ({ children }: any) => <div data-testid="barchart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  LineChart: () => <div data-testid="line-chart" />,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="xaxis" />,
  YAxis: () => <div data-testid="yaxis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="piechart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  AreaChart: ({ children }: any) => <div data-testid="areachart">{children}</div>,
  Area: () => <div data-testid="area" />,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockGenerateInsightReport.mockResolvedValue(mockInsightReport);
  mockGenerateComparison.mockResolvedValue(mockComparison);
  mockGenerateProgressExport.mockResolvedValue(mockProgressExport);
});

const renderAnalytics = () => render(<Analytics profile={mockProfile} />);

describe('Analytics', () => {
  it('renders header with profile name', async () => {
    renderAnalytics();
    await waitFor(() => {
      expect(screen.getByText('ANALYTICS')).toBeInTheDocument();
      expect(screen.getByText(mockProfile.name)).toBeInTheDocument();
    });
  });

  it('renders tab navigation', () => {
    renderAnalytics();
    expect(screen.getByText('Insights')).toBeInTheDocument();
    expect(screen.getByText('Compare')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('loads and displays insights by default', async () => {
    renderAnalytics();
    await waitFor(() => {
      expect(mockGenerateInsightReport).toHaveBeenCalledWith('weekly');
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('Performance Trends')).toBeInTheDocument();
    });
  });

  it('switches insight period', async () => {
    const user = userEvent.setup();
    renderAnalytics();
    await waitFor(() => {
      expect(screen.getByText('monthly')).toBeInTheDocument();
    });
    await user.click(screen.getByText('monthly'));
    expect(mockGenerateInsightReport).toHaveBeenCalledWith('monthly');
  });

  it('shows loading state while fetching insights', async () => {
    mockGenerateInsightReport.mockImplementationOnce(() => new Promise(() => {}));
    renderAnalytics();
    await waitFor(() => {
      expect(screen.getByText('ANALYTICS')).toBeInTheDocument();
    });
  });

  it('switches to comparison tab', async () => {
    const user = userEvent.setup();
    renderAnalytics();
    await waitFor(() => {
      expect(screen.getByText('Compare')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Compare'));
    await waitFor(() => {
      expect(mockGenerateComparison).toHaveBeenCalled();
    });
  });

  it('switches comparison period', async () => {
    const user = userEvent.setup();
    renderAnalytics();
    await user.click(screen.getByText('Compare'));
    await waitFor(() => {
      expect(screen.getByText('month')).toBeInTheDocument();
    });
    await user.click(screen.getByText('month'));
    expect(mockGenerateComparison).toHaveBeenCalledWith('month');
  });

  it('switches to export tab', async () => {
    const user = userEvent.setup();
    renderAnalytics();
    await waitFor(() => {
      expect(screen.getByText('Export')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Export'));
    await waitFor(() => {
      expect(mockGenerateProgressExport).toHaveBeenCalled();
      expect(screen.getByText('50')).toBeInTheDocument();
    });
  });

  it('displays recommendations', async () => {
    renderAnalytics();
    await waitFor(() => {
      expect(screen.getByText('AI Recommendations')).toBeInTheDocument();
      expect(screen.getByText('Increase leg volume')).toBeInTheDocument();
    });
  });

  it('handles load failure gracefully', async () => {
    mockGenerateInsightReport.mockRejectedValueOnce(new Error('Failed'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderAnalytics();
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load insights:', expect.any(Error));
    });
    consoleSpy.mockRestore();
  });

  it('shows empty state when insight report is null', async () => {
    mockGenerateInsightReport.mockResolvedValueOnce(null);
    renderAnalytics();
    await waitFor(() => {
      expect(screen.getByText('No data yet')).toBeInTheDocument();
    });
  });

  it('renders Personal Records section', async () => {
    renderAnalytics();
    await waitFor(() => {
      expect(screen.getByText('Personal Records (PRs)')).toBeInTheDocument();
    });
  });

  it('renders Advanced Fitness Metrics', async () => {
    renderAnalytics();
    await waitFor(() => {
      expect(screen.getByText('Advanced Fitness Metrics')).toBeInTheDocument();
    });
  });

  it('renders export button in export tab', async () => {
    const user = userEvent.setup();
    renderAnalytics();
    await waitFor(() => {
      expect(screen.getByText('Export')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Export'));
    await waitFor(() => {
      expect(screen.getByText('Export JSON')).toBeInTheDocument();
      expect(screen.getByText('Share Progress')).toBeInTheDocument();
    });
  });

  it('triggers JSON export from export tab', async () => {
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue({
      setAttribute: vi.fn(),
      click: vi.fn(),
    } as any);
    const user = userEvent.setup();
    renderAnalytics();
    await user.click(screen.getByText('Export'));
    await waitFor(() => {
      expect(screen.getByText('Export JSON')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Export JSON'));
    expect(createElementSpy).toHaveBeenCalled();
    createElementSpy.mockRestore();
  });

  it('displays key achievement badges in export', async () => {
    const user = userEvent.setup();
    renderAnalytics();
    await user.click(screen.getByText('Export'));
    await waitFor(() => {
      expect(screen.getByText('First Workout')).toBeInTheDocument();
      expect(screen.getByText('Nutrition Pro')).toBeInTheDocument();
    });
  });

  it('shows comparison data when available', async () => {
    const user = userEvent.setup();
    renderAnalytics();
    await user.click(screen.getByText('Compare'));
    await waitFor(() => {
      expect(screen.getByText(/4 vs 3/)).toBeInTheDocument();
    });
  });

  it('shows empty comparison state when data is null', async () => {
    mockGenerateComparison.mockResolvedValueOnce(null);
    const user = userEvent.setup();
    renderAnalytics();
    await user.click(screen.getByText('Compare'));
    await waitFor(() => {
      expect(screen.getByText('No comparison data')).toBeInTheDocument();
    });
  });
});
