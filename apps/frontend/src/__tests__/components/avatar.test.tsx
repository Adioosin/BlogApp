import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar } from '../../components/avatar.js';

describe('Avatar', () => {
  it('renders the first letter of the name uppercased', () => {
    render(<Avatar name="adam" size="md" />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('applies sm size classes', () => {
    const { container } = render(<Avatar name="Bob" size="sm" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('22px');
    expect(el.style.height).toBe('22px');
  });

  it('applies lg size classes', () => {
    const { container } = render(<Avatar name="Bob" size="lg" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('48px');
    expect(el.style.height).toBe('48px');
  });

  it('uses md as default size', () => {
    const { container } = render(<Avatar name="Carol" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('34px');
  });
});
