import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ForgotPassword from '../ForgotPassword';

const mockResetPassword = vi.fn();
const mockSetAuthView = vi.fn();

vi.mock('../../services/AuthContext', () => ({
  useAuth: () => ({
    resetPassword: mockResetPassword,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const renderForgotPassword = () => render(<ForgotPassword setAuthView={mockSetAuthView} />);

describe('ForgotPassword', () => {
  it('renders heading and form', () => {
    renderForgotPassword();
    expect(screen.getByText('Reset Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByText('SEND OVERRIDE LINK')).toBeInTheDocument();
  });

  it('shows error when submitting with empty email', async () => {
    const user = userEvent.setup();
    renderForgotPassword();
    await user.click(screen.getByText('SEND OVERRIDE LINK'));
    expect(screen.getByText('Please enter your email address.')).toBeInTheDocument();
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('calls resetPassword on valid submission and shows success', async () => {
    mockResetPassword.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderForgotPassword();
    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
    await user.click(screen.getByText('SEND OVERRIDE LINK'));
    expect(mockResetPassword).toHaveBeenCalledWith('test@test.com');
    await waitFor(() => {
      expect(screen.getByText(/Password reset email has been sent/)).toBeInTheDocument();
    });
  });

  it('displays user-not-found error', async () => {
    mockResetPassword.mockRejectedValueOnce({ code: 'auth/user-not-found' });
    const user = userEvent.setup();
    renderForgotPassword();
    await user.type(screen.getByPlaceholderText('you@example.com'), 'missing@test.com');
    await user.click(screen.getByText('SEND OVERRIDE LINK'));
    await waitFor(() => {
      expect(screen.getByText('No account found with this email.')).toBeInTheDocument();
    });
  });

  it('displays invalid-email error', async () => {
    mockResetPassword.mockRejectedValueOnce({ code: 'auth/invalid-email' });
    const user = userEvent.setup();
    renderForgotPassword();
    await user.type(screen.getByPlaceholderText('you@example.com'), 'bad');
    await user.click(screen.getByText('SEND OVERRIDE LINK'));
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument();
    });
  });

  it('displays generic error', async () => {
    mockResetPassword.mockRejectedValueOnce(new Error('Server error'));
    const user = userEvent.setup();
    renderForgotPassword();
    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
    await user.click(screen.getByText('SEND OVERRIDE LINK'));
    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    mockResetPassword.mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup();
    renderForgotPassword();
    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
    await user.click(screen.getByText('SEND OVERRIDE LINK'));
    expect(screen.getByText('SENDING LINK...')).toBeInTheDocument();
  });

  it('navigates back to login', async () => {
    const user = userEvent.setup();
    renderForgotPassword();
    await user.click(screen.getByText('Back to Login'));
    expect(mockSetAuthView).toHaveBeenCalledWith('login');
  });
});
