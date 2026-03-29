import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { LoginPage } from '../../pages/login.js';

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../hooks/use-auth.js', async () => {
  const actual = await vi.importActual<typeof import('../../hooks/use-auth.js')>('../../hooks/use-auth.js');
  return {
    ...actual,
    useAuth: () => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: mockLogin,
      register: vi.fn(),
      logout: vi.fn(),
    }),
  };
});

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const renderLogin = () =>
    render(
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>,
    );

  it('renders the login form', () => {
    renderLogin();

    expect(screen.getByRole('heading', { name: /login/i })).toBeDefined();
    expect(screen.getByLabelText(/email/i)).toBeDefined();
    expect(screen.getByLabelText(/password/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /login/i })).toBeDefined();
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(screen.getByText(/invalid email/i)).toBeDefined();
    expect(screen.getByText(/password is required/i)).toBeDefined();
  });

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email/i), 'notanemail');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(screen.getByText(/invalid email/i)).toBeDefined();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('calls login and navigates on success', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('shows server error on login failure', async () => {
    const { AxiosError } = await import('axios');
    const axiosErr = new AxiosError('Bad Request', '400', undefined, undefined, {
      data: { error: { message: 'Invalid credentials' } },
      status: 401,
      statusText: 'Unauthorized',
      headers: {},
      config: { headers: {} as never },
    } as never);
    mockLogin.mockRejectedValueOnce(axiosErr);

    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
      expect(screen.getByText(/invalid credentials/i)).toBeDefined();
    });
  });

  it('has a link to register page', () => {
    renderLogin();

    expect(screen.getByRole('link', { name: /register/i })).toBeDefined();
  });
});
