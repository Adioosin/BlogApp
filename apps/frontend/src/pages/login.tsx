import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { AxiosError } from 'axios';

import type { ApiError } from '@blogapp/types';

import { useAuth } from '../hooks/use-auth.js';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError('');

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await login(result.data);
      navigate('/dashboard');
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data) {
        const apiError = err.response.data as ApiError;
        setServerError(apiError.error.message);
      } else {
        setServerError('An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center py-8">
      <div className="w-full max-w-md">
        <div className="bg-surface rounded-xl border border-border shadow-card p-8">
          <h1 className="text-2xl font-bold text-text-primary text-center mb-6">Login</h1>
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {serverError && (
              <div className="bg-danger/10 border border-danger/30 text-danger rounded-lg px-4 py-3 text-sm" role="alert">
                {serverError}
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!errors.email}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/20"
                placeholder="you@example.com"
              />
              {errors.email && <span className="block text-sm text-danger mt-1">{errors.email}</span>}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!errors.password}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/20"
                placeholder="••••••••"
              />
              {errors.password && <span className="block text-sm text-danger mt-1">{errors.password}</span>}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-2.5 text-sm font-semibold text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:opacity-90"
              style={{ background: 'var(--color-primary)' }}
            >
              {isSubmitting ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <p className="text-center text-sm text-text-secondary mt-6">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-medium hover:opacity-80 no-underline" style={{ color: 'var(--color-primary)' }}>
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
