import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { AxiosError } from 'axios';

import type { ApiError } from '@blogapp/types';

import { postsApi } from '../lib/api-client.js';

const postSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
});

export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditing);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    postsApi
      .get(id)
      .then((res) => {
        setTitle(res.data.data.title);
        setContent(res.data.data.content);
      })
      .catch(() => setServerError('Failed to load post'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError('');

    const result = postSchema.safeParse({ title, content });
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
      if (isEditing) {
        await postsApi.update(id, result.data);
      } else {
        await postsApi.create(result.data);
      }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <span className="ml-3 text-text-secondary">Loading...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-text-primary mb-8">{isEditing ? 'Edit Post' : 'New Post'}</h1>
      <div className="bg-surface rounded-xl border border-border shadow-card p-6 sm:p-8">
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {serverError && (
            <div className="bg-red-50 border border-red-200 text-danger rounded-lg px-4 py-3 text-sm" role="alert">
              {serverError}
            </div>
          )}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-text-primary mb-1.5">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={!!errors.title}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/20 text-lg"
              placeholder="Give your post a title..."
            />
            {errors.title && <span className="block text-sm text-danger mt-1">{errors.title}</span>}
          </div>
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-text-primary mb-1.5">
              Content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={15}
              aria-invalid={!!errors.content}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/20 resize-y leading-relaxed"
              placeholder="Write your post content here..."
            />
            {errors.content && <span className="block text-sm text-danger mt-1">{errors.content}</span>}
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting
                ? 'Saving...'
                : isEditing
                  ? 'Update Post'
                  : 'Create Draft'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
