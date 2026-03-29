import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { AxiosError } from 'axios';

import type { ApiError } from '@blogapp/types';

import { postsApi } from '../lib/api-client.js';
import { RichTextEditor } from '../components/rich-text-editor.js';

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
  const [isPublished, setIsPublished] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditing);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    postsApi
      .get(id)
      .then((res) => {
        setTitle(res.data.data.title);
        setContent(res.data.data.content);
        setIsPublished(res.data.data.isPublished);
      })
      .catch(() => setServerError('Failed to load post'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const save = async (andPublish: boolean) => {
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

    if (andPublish) {
      setIsPublishing(true);
    } else {
      setIsSubmitting(true);
    }

    try {
      let postId = id;
      if (isEditing) {
        await postsApi.update(id, result.data);
      } else {
        const res = await postsApi.create(result.data);
        postId = res.data.data.id;
      }

      if (andPublish && postId) {
        await postsApi.publish(postId);
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
      setIsPublishing(false);
    }
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    await save(false);
  };

  const handlePublish = async () => {
    await save(true);
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
        <form onSubmit={handleSaveDraft} noValidate className="space-y-6">
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
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Content
            </label>
            <RichTextEditor content={content} onChange={setContent} />
            {errors.content && <span className="block text-sm text-danger mt-1">{errors.content}</span>}
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={isSubmitting || isPublishing}
              className="px-6 py-2.5 text-sm font-medium rounded-lg border border-border text-text-secondary bg-surface hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Save Draft'}
            </button>
            {!isPublished && (
              <button
                type="button"
                onClick={handlePublish}
                disabled={isSubmitting || isPublishing}
                className="px-6 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPublishing ? 'Publishing...' : 'Publish'}
              </button>
            )}
            {isPublished && (
              <button
                type="button"
                onClick={() => save(false).then(() => navigate('/dashboard'))}
                disabled={isSubmitting || isPublishing}
                className="px-6 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Updating...' : 'Update Post'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
