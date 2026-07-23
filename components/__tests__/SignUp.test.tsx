import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SignUp from '../SignUp';

const mockSignup = vi.fn();
const mockSetAuthView = vi.fn();

vi.mock('../../services/AuthContext', () => ({
  useAuth: () => ({
    signup: mockSignup,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const renderSignUp = () => render(<SignUp setAuthView={mockSetAuthView} />);

describe('SignUp', () => {
  it('renders heading and form fields', () => {
    renderSignUp();
    expect(screen.getByText('Create Profile')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Min 6 characters')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm password')).toBeInTheDocument();
    expect(screen.getByText('INITIATE PROTOCOL')).toBeInTheDocument();
  });

  it('shows error when submitting with empty fields', async () => {
    const user = userEvent.setup();
    renderSignUp();
    await user.click(screen.getByText('INITIATE PROTOCOL'));
    expect(screen.getByText('Please fill in all fields.')).toBeInTheDocument();
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderSignUp();
    await user.type(screen.getByPlaceholderText('John Doe'), 'Test User');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('Min 6 characters'), 'password123');
    await user.type(screen.getByPlaceholderText('Confirm password'), 'different');
    await user.click(screen.getByText('INITIATE PROTOCOL'));
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it('shows error when password is too short', async () => {
    const user = userEvent.setup();
    renderSignUp();
    await user.type(screen.getByPlaceholderText('John Doe'), 'Test User');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('Min 6 characters'), 'ab');
    await user.type(screen.getByPlaceholderText('Confirm password'), 'ab');
    await user.click(screen.getByText('INITIATE PROTOCOL'));
    expect(screen.getByText('Password must be at least 6 characters.')).toBeInTheDocument();
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it('calls signup on valid submission and shows loading', async () => {
    mockSignup.mockResolvedValueOnce({ user: { uid: '123' } });
    const user = userEvent.setup();
    renderSignUp();
    await user.type(screen.getByPlaceholderText('John Doe'), 'Test User');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('Min 6 characters'), 'password123');
    await user.type(screen.getByPlaceholderText('Confirm password'), 'password123');
    await user.click(screen.getByText('INITIATE PROTOCOL'));
    expect(screen.getByText('REGISTERING...')).toBeInTheDocument();
    expect(mockSignup).toHaveBeenCalledWith('test@test.com', 'password123', 'Test User');
    await waitFor(() => {
      expect(screen.queryByText('REGISTERING...')).not.toBeInTheDocument();
    });
  });

  it('displays email-already-in-use error', async () => {
    mockSignup.mockRejectedValueOnce({ code: 'auth/email-already-in-use' });
    const user = userEvent.setup();
    renderSignUp();
    await user.type(screen.getByPlaceholderText('John Doe'), 'Test User');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'existing@test.com');
    await user.type(screen.getByPlaceholderText('Min 6 characters'), 'password123');
    await user.type(screen.getByPlaceholderText('Confirm password'), 'password123');
    await user.click(screen.getByText('INITIATE PROTOCOL'));
    await waitFor(() => {
      expect(screen.getByText('An account already exists with this email.')).toBeInTheDocument();
    });
  });

  it('displays weak-password error', async () => {
    mockSignup.mockRejectedValueOnce({ code: 'auth/weak-password' });
    const user = userEvent.setup();
    renderSignUp();
    await user.type(screen.getByPlaceholderText('John Doe'), 'Test User');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('Min 6 characters'), 'weak123');
    await user.type(screen.getByPlaceholderText('Confirm password'), 'weak123');
    await user.click(screen.getByText('INITIATE PROTOCOL'));
    await waitFor(() => {
      expect(screen.getByText('Please choose a stronger password.')).toBeInTheDocument();
    });
  });

  it('displays invalid-email error', async () => {
    mockSignup.mockRejectedValueOnce({ code: 'auth/invalid-email' });
    const user = userEvent.setup();
    renderSignUp();
    await user.type(screen.getByPlaceholderText('John Doe'), 'Test User');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'bad');
    await user.type(screen.getByPlaceholderText('Min 6 characters'), 'password123');
    await user.type(screen.getByPlaceholderText('Confirm password'), 'password123');
    await user.click(screen.getByText('INITIATE PROTOCOL'));
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument();
    });
  });

  it('displays network-request-failed error', async () => {
    mockSignup.mockRejectedValueOnce({ code: 'auth/network-request-failed' });
    const user = userEvent.setup();
    renderSignUp();
    await user.type(screen.getByPlaceholderText('John Doe'), 'Test User');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('Min 6 characters'), 'password123');
    await user.type(screen.getByPlaceholderText('Confirm password'), 'password123');
    await user.click(screen.getByText('INITIATE PROTOCOL'));
    await waitFor(() => {
      expect(screen.getByText('Network error. Check your internet connection.')).toBeInTheDocument();
    });
  });

  it('displays generic error message', async () => {
    mockSignup.mockRejectedValueOnce(new Error('Custom error'));
    const user = userEvent.setup();
    renderSignUp();
    await user.type(screen.getByPlaceholderText('John Doe'), 'Test User');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('Min 6 characters'), 'password123');
    await user.type(screen.getByPlaceholderText('Confirm password'), 'password123');
    await user.click(screen.getByText('INITIATE PROTOCOL'));
    await waitFor(() => {
      expect(screen.getByText('Custom error')).toBeInTheDocument();
    });
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderSignUp();
    const passwordInput = screen.getByPlaceholderText('Min 6 characters');
    const confirmInput = screen.getByPlaceholderText('Confirm password');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(confirmInput).toHaveAttribute('type', 'password');
    const toggleButton = screen.getAllByRole('button').find(b => b.innerHTML.includes('Eye') || b.innerHTML.includes('EyeOff'));
    if (toggleButton) await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(confirmInput).toHaveAttribute('type', 'text');
  });

  it('navigates to login on link click', async () => {
    const user = userEvent.setup();
    renderSignUp();
    await user.click(screen.getByText('Login'));
    expect(mockSetAuthView).toHaveBeenCalledWith('login');
  });

  it('disables submit button during loading', async () => {
    mockSignup.mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup();
    renderSignUp();
    await user.type(screen.getByPlaceholderText('John Doe'), 'Test User');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('Min 6 characters'), 'password123');
    await user.type(screen.getByPlaceholderText('Confirm password'), 'password123');
    await user.click(screen.getByText('INITIATE PROTOCOL'));
    expect(screen.getByText('REGISTERING...')).toBeInTheDocument();
  });
});
