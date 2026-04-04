import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

vi.mock('../lib/api-client.js', () => ({
  authApi: {
    me: () => Promise.reject(new Error('Not authenticated')),
  },
  postsApi: {
    list: () =>
      Promise.resolve({
        data: { data: [], meta: { page: 1, limit: 10, total: 0 } },
      }),
  },
  setTokens: vi.fn(),
  getAccessToken: () => null,
  getRefreshToken: () => null,
}));

import { App } from '../app.js';

describe('frontend smoke tests', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  });

  it('renders the App component without crashing', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByText('BlogApp')).toBeDefined();
    });
  });
});
