import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { RegisterPage } from '../../pages/register.js';

const mockRegister = vi.fn();
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
      login: vi.fn(),
      register: mockRegister,
      logout: vi.fn(),
    }),
  };
});

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const renderRegister = () =>
    render(
      <MemoryRouter initialEntries={['/register']}>
        <RegisterPage />
      </MemoryRouter>,
    );

  it('renders the registration form', () => {
    renderRegister();

    expect(screen.getByRole('heading', { name: /register/i })).toBeDefined();
    expect(screen.getByLabelText(/name/i)).toBeDefined();
    expect(screen.getByLabelText(/email/i)).toBeDefined();
    expect(screen.getByLabelText(/password/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /register/i })).toBeDefined();
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.click(screen.getByRole('button', { name: /register/i }));

    expect(screen.getByText(/name is required/i)).toBeDefined();
    expect(screen.getByText(/invalid email/i)).toBeDefined();
    expect(screen.getByText(/password must be at least 8/i)).toBeDefined();
  });

  it('shows validation error for short password', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/name/i), 'Test User');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'short');
    await user.click(screen.getByRole('button', { name: /register/i }));

    expect(screen.getByText(/password must be at least 8/i)).toBeDefined();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('calls register and navigates on success', async () => {
    mockRegister.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/name/i), 'Test User');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('shows server error on registration failure', async () => {
    const { AxiosError } = await import('axios');
    const axiosErr = new AxiosError('Conflict', '409', undefined, undefined, {
      data: { error: { message: 'Email already in use' } },
      status: 409,
      statusText: 'Conflict',
      headers: {},
      config: { headers: {} as never },
    } as never);
    mockRegister.mockRejectedValueOnce(axiosErr);

    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/name/i), 'Test User');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
      expect(screen.getByText(/email already in use/i)).toBeDefined();
    });
  });

  it('has a link to login page', () => {
    renderRegister();

    expect(screen.getByRole('link', { name: /login/i })).toBeDefined();
  });
});
