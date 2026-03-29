import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { EditorPage } from '../../pages/editor.js';

const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockGet = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../lib/api-client.js', () => ({
  postsApi: {
    create: (...args: unknown[]) => mockCreate(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

describe('EditorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const renderEditor = () =>
    render(
      <MemoryRouter initialEntries={['/editor']}>
        <EditorPage />
      </MemoryRouter>,
    );

  it('renders the new post form', () => {
    renderEditor();

    expect(screen.getByRole('heading', { name: /new post/i })).toBeDefined();
    expect(screen.getByLabelText(/title/i)).toBeDefined();
    expect(screen.getByLabelText(/content/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /create draft/i })).toBeDefined();
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole('button', { name: /create draft/i }));

    expect(screen.getByText(/title is required/i)).toBeDefined();
    expect(screen.getByText(/content is required/i)).toBeDefined();
  });

  it('creates a post and navigates to dashboard', async () => {
    mockCreate.mockResolvedValueOnce({
      data: { data: { id: '1', title: 'My Post', content: 'Content' } },
    });

    const user = userEvent.setup();
    renderEditor();

    await user.type(screen.getByLabelText(/title/i), 'My Post');
    await user.type(screen.getByLabelText(/content/i), 'Content');
    await user.click(screen.getByRole('button', { name: /create draft/i }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        title: 'My Post',
        content: 'Content',
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });
});
