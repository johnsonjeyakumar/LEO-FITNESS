import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockLogin = vi.fn();
const mockSetAuthView = vi.fn();

vi.mock('../../services/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

vi.mock('framer-motion', () => ({
  motion: { div: 'div', button: 'button', span: 'span', h1: 'h1', h2: 'h2', h3: 'h3', p: 'p', img: 'img' },
  AnimatePresence: ({ children }: any) => children,
}));

import Login from '../Login';

beforeEach(() => { vi.resetAllMocks(); });

const renderLogin = () => render(<Login setAuthView={mockSetAuthView} />);

describe('Login', () => {
  it('renders heading and form elements', () => {
    renderLogin();
    expect(screen.getByText('Initiate Protocol')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('shows error when submitting with empty fields', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByText('LOGIN TO INTERFACE'));
    expect(screen.getByText('Please fill in all fields.')).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('shows error with only email filled', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
    await user.click(screen.getByText('LOGIN TO INTERFACE'));
    expect(screen.getByText('Please fill in all fields.')).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('calls login on valid submission', async () => {
    mockLogin.mockImplementation(() => new Promise(r => setTimeout(r, 100)));
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await user.click(screen.getByText('LOGIN TO INTERFACE'));
    expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'password123');
  });

  it('displays invalid-credential error', async () => {
    mockLogin.mockRejectedValueOnce({ code: 'auth/invalid-credential' });
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByPlaceholderText('you@example.com'), 'bad@test.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrong');
    await user.click(screen.getByText('LOGIN TO INTERFACE'));
    await waitFor(() => { expect(screen.getByText('Incorrect email or password.')).toBeInTheDocument(); });
  });

  it('displays invalid-email error', async () => {
    mockLogin.mockRejectedValueOnce({ code: 'auth/invalid-email' });
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByPlaceholderText('you@example.com'), 'not-an-email@test.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'pass');
    await user.click(screen.getByText('LOGIN TO INTERFACE'));
    await waitFor(() => { expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument(); });
  });

  it('displays too-many-requests error', async () => {
    mockLogin.mockRejectedValueOnce({ code: 'auth/too-many-requests' });
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'pass');
    await user.click(screen.getByText('LOGIN TO INTERFACE'));
    await waitFor(() => { expect(screen.getByText('Too many attempts. Please try again later.')).toBeInTheDocument(); });
  });

  it('displays network-request-failed error', async () => {
    mockLogin.mockRejectedValueOnce({ code: 'auth/network-request-failed' });
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'pass');
    await user.click(screen.getByText('LOGIN TO INTERFACE'));
    await waitFor(() => { expect(screen.getByText('Network error. Check your internet connection.')).toBeInTheDocument(); });
  });

  it('displays generic error', async () => {
    mockLogin.mockRejectedValueOnce({ code: 'auth/unknown', message: 'Something went wrong' });
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'pass');
    await user.click(screen.getByText('LOGIN TO INTERFACE'));
    await waitFor(() => { expect(screen.getByText('Something went wrong')).toBeInTheDocument(); });
  });

  it('displays fallback message when error has no message', async () => {
    mockLogin.mockRejectedValueOnce({ code: 'auth/unknown' });
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'pass');
    await user.click(screen.getByText('LOGIN TO INTERFACE'));
    await waitFor(() => { expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument(); });
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderLogin();
    const passwordInput = screen.getByPlaceholderText('••••••••');
    expect(passwordInput).toHaveAttribute('type', 'password');
    const toggleBtn = screen.getByPlaceholderText('••••••••').parentElement!.querySelector('button')!;
    await user.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');
  });

  it('disables inputs during loading', async () => {
    mockLogin.mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'pass');
    await user.click(screen.getByText('LOGIN TO INTERFACE'));
    expect(screen.getByPlaceholderText('you@example.com')).toBeDisabled();
    expect(screen.getByPlaceholderText('••••••••')).toBeDisabled();
  });

  it('navigates to signup', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByText('Sign Up'));
    expect(mockSetAuthView).toHaveBeenCalledWith('signup');
  });

  it('navigates to forgot-password', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByText('Forgot Password?'));
    expect(mockSetAuthView).toHaveBeenCalledWith('forgot-password');
  });

  it('displays configuration-not-found error', async () => {
    mockLogin.mockRejectedValueOnce({ code: 'auth/configuration-not-found' });
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'pass');
    await user.click(screen.getByText('LOGIN TO INTERFACE'));
    await waitFor(() => { expect(screen.getByText(/Firebase Authentication is not configured/)).toBeInTheDocument(); });
  });
});
