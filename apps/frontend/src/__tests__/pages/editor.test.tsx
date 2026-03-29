import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { EditorPage } from '../../pages/editor.js';

const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockGet = vi.fn();
const mockPublish = vi.fn();
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
    publish: (...args: unknown[]) => mockPublish(...args),
  },
  uploadApi: {
    image: vi.fn(),
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

  it('renders the new post form with TipTap editor', () => {
    renderEditor();

    expect(screen.getByRole('heading', { name: /new post/i })).toBeDefined();
    expect(screen.getByLabelText(/title/i)).toBeDefined();
    expect(screen.getByRole('toolbar', { name: /formatting/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /save draft/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /publish/i })).toBeDefined();
  });

  it('shows toolbar buttons for formatting', () => {
    renderEditor();

    expect(screen.getByTitle('Bold')).toBeDefined();
    expect(screen.getByTitle('Italic')).toBeDefined();
    expect(screen.getByTitle('Heading 1')).toBeDefined();
    expect(screen.getByTitle('Heading 2')).toBeDefined();
    expect(screen.getByTitle('Bullet list')).toBeDefined();
    expect(screen.getByTitle('Code block')).toBeDefined();
    expect(screen.getByTitle('Link')).toBeDefined();
    expect(screen.getByTitle('Upload image')).toBeDefined();
  });

  it('shows validation error when title is empty', async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole('button', { name: /save draft/i }));

    expect(screen.getByText(/title is required/i)).toBeDefined();
  });

  it('creates a post with content and navigates to dashboard', async () => {
    mockCreate.mockResolvedValueOnce({
      data: { data: { id: '1', title: 'My Post', content: '# Hello' } },
    });

    const user = userEvent.setup();
    renderEditor();

    await user.type(screen.getByLabelText(/title/i), 'My Post');

    // Type into the TipTap editor (it renders a contenteditable div)
    const editorContent = document.querySelector('.tiptap');
    if (editorContent) {
      editorContent.innerHTML = '<p>Hello World</p>';
      editorContent.dispatchEvent(new Event('input', { bubbles: true }));
    }

    await user.click(screen.getByRole('button', { name: /save draft/i }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
    });

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('shows publish and save draft buttons for new posts', () => {
    renderEditor();

    expect(screen.getByRole('button', { name: /save draft/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /publish/i })).toBeDefined();
  });

  it('creates then publishes when publish button is clicked', async () => {
    mockCreate.mockResolvedValueOnce({
      data: { data: { id: 'new-post-id', title: 'My Post', content: 'content' } },
    });
    mockPublish.mockResolvedValueOnce({
      data: { data: { id: 'new-post-id', isPublished: true } },
    });

    const user = userEvent.setup();
    renderEditor();

    await user.type(screen.getByLabelText(/title/i), 'My Post');

    const editorContent = document.querySelector('.tiptap');
    if (editorContent) {
      editorContent.innerHTML = '<p>Some content</p>';
      editorContent.dispatchEvent(new Event('input', { bubbles: true }));
    }

    await user.click(screen.getByRole('button', { name: /publish/i }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(mockPublish).toHaveBeenCalledWith('new-post-id');
    });
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('shows server error on API failure', async () => {
    const { AxiosError } = await import('axios');
    const error = new AxiosError('fail', '400', undefined, undefined, {
      data: { error: { message: 'Title already exists' } },
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: { headers: {} as Record<string, string> },
    });
    mockCreate.mockRejectedValueOnce(error);

    const user = userEvent.setup();
    renderEditor();

    await user.type(screen.getByLabelText(/title/i), 'Duplicate');

    const editorContent = document.querySelector('.tiptap');
    if (editorContent) {
      editorContent.innerHTML = '<p>Content</p>';
      editorContent.dispatchEvent(new Event('input', { bubbles: true }));
    }

    await user.click(screen.getByRole('button', { name: /save draft/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
    });
  });
});
