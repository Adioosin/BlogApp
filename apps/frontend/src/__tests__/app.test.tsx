import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { App } from '../app.js';

describe('frontend smoke tests', () => {
  it('renders the App component without crashing', () => {
    render(<App />);

    expect(screen.getByText(/blogapp/i)).toBeDefined();
  });
});
