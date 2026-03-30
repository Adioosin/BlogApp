import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { LikeButton } from '../../components/like-button.js';

const mockNavigate = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../hooks/use-auth.js', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../lib/api-client.js', () => ({
  likesApi: {
    like: vi.fn().mockResolvedValue({}),
    unlike: vi.fn().mockResolvedValue({}),
  },
}));

const { likesApi } = await import('../../lib/api-client.js');
const mockedLikesApi = vi.mocked(likesApi);

const renderButton = (props: {
  postId?: string;
  initialLikeCount?: number;
  initialLikedByMe?: boolean;
}) =>
  render(
    <MemoryRouter>
      <LikeButton
        postId={props.postId ?? 'post-1'}
        initialLikeCount={props.initialLikeCount ?? 0}
        initialLikedByMe={props.initialLikedByMe ?? false}
      />
    </MemoryRouter>,
  );

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('LikeButton', () => {
  describe('rendering', () => {
    it('shows the initial like count', () => {
      mockUseAuth.mockReturnValue({ isAuthenticated: false });
      renderButton({ initialLikeCount: 5 });

      expect(screen.getByRole('button').textContent).toContain('5');
    });

    it('is not pressed when initialLikedByMe is false', () => {
      mockUseAuth.mockReturnValue({ isAuthenticated: false });
      renderButton({ initialLikedByMe: false });

      expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('false');
    });

    it('is pressed when initialLikedByMe is true', () => {
      mockUseAuth.mockReturnValue({ isAuthenticated: false });
      renderButton({ initialLikedByMe: true });

      expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('true');
    });
  });

  describe('authenticated user', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ isAuthenticated: true });
    });

    it('calls likesApi.like and increments count when clicking an unliked post', async () => {
      const user = userEvent.setup();
      renderButton({ initialLikeCount: 3, initialLikedByMe: false });

      await user.click(screen.getByRole('button'));

      expect(screen.getByRole('button').textContent).toContain('4');
      expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('true');
      await waitFor(() => expect(mockedLikesApi.like).toHaveBeenCalledWith('post-1'));
    });

    it('calls likesApi.unlike and decrements count when clicking a liked post', async () => {
      const user = userEvent.setup();
      renderButton({ initialLikeCount: 3, initialLikedByMe: true });

      await user.click(screen.getByRole('button'));

      expect(screen.getByRole('button').textContent).toContain('2');
      expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('false');
      await waitFor(() => expect(mockedLikesApi.unlike).toHaveBeenCalledWith('post-1'));
    });

    it('reverts optimistic state when the API call fails', async () => {
      mockedLikesApi.like.mockRejectedValueOnce(new Error('Network error'));

      const user = userEvent.setup();
      renderButton({ initialLikeCount: 3, initialLikedByMe: false });

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('button').textContent).toContain('3');
        expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('false');
      });
    });

    it('disables the button while the request is pending', async () => {
      let resolve: () => void;
      mockedLikesApi.like.mockReturnValueOnce(
        new Promise<void>((res) => {
          resolve = res;
        }) as never,
      );

      const user = userEvent.setup();
      renderButton({ initialLikeCount: 0, initialLikedByMe: false });

      await user.click(screen.getByRole('button'));

      expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(true);

      resolve!();
      await waitFor(() =>
        expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(false),
      );
    });
  });

  describe('guest user', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ isAuthenticated: false });
    });

    it('navigates to /login instead of calling the API', async () => {
      const user = userEvent.setup();
      renderButton({ initialLikeCount: 2, initialLikedByMe: false });

      await user.click(screen.getByRole('button'));

      expect(mockNavigate).toHaveBeenCalledWith('/login');
      expect(mockedLikesApi.like).not.toHaveBeenCalled();
      expect(mockedLikesApi.unlike).not.toHaveBeenCalled();
    });

    it('does not change like count when a guest clicks', async () => {
      const user = userEvent.setup();
      renderButton({ initialLikeCount: 2, initialLikedByMe: false });

      await user.click(screen.getByRole('button'));

      expect(screen.getByRole('button').textContent).toContain('2');
    });
  });
});
