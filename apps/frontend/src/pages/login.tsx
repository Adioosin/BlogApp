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
    <div className="auth-page">
      <h1>Login</h1>
      <form onSubmit={handleSubmit} noValidate>
        {serverError && <p className="error-message" role="alert">{serverError}</p>}
        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!errors.email}
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>
        <div className="form-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!errors.password}
          />
          {errors.password && <span className="field-error">{errors.password}</span>}
        </div>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p>
        Don&apos;t have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}
