import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import type { PostDto } from '@blogapp/types';

import { postsApi } from '../lib/api-client.js';

export function DashboardPage() {
  const [posts, setPosts] = useState<PostDto[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const limit = 10;

  useEffect(() => {
    setIsLoading(true);
    setError('');
    postsApi
      .myPosts({ page, limit })
      .then((res) => {
        setPosts(res.data.data);
        setTotal(res.data.meta.total);
      })
      .catch(() => setError('Failed to load your posts'))
      .finally(() => setIsLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / limit);

  const handlePublish = async (id: string) => {
    setActionError('');
    try {
      const res = await postsApi.publish(id);
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? res.data.data : p)),
      );
    } catch {
      setActionError('Failed to publish post. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    setActionError('');
    try {
      await postsApi.delete(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      setTotal((prev) => prev - 1);
    } catch {
      setActionError('Failed to delete post. Please try again.');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-text-primary">My Posts</h1>
        <Link
          to="/editor"
          className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors no-underline"
        >
          New Post
        </Link>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <span className="ml-3 text-text-secondary">Loading your posts...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-danger rounded-lg px-4 py-3 mb-6" role="alert">
          {error}
        </div>
      )}

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-danger rounded-lg px-4 py-3 mb-6" role="alert">
          {actionError}
        </div>
      )}

      {!isLoading && !error && posts.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">✍️</div>
          <p className="text-lg text-text-secondary">You haven&apos;t written any posts yet.</p>
          <Link
            to="/editor"
            className="inline-flex items-center mt-4 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors no-underline"
          >
            Write your first post
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {posts.map((post) => (
          <article
            key={post.id}
            className="bg-surface rounded-xl border border-border p-5 shadow-card"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-lg font-semibold truncate">
                    <Link to={`/posts/${post.id}`} className="text-text-primary hover:text-primary-600 no-underline">
                      {post.title}
                    </Link>
                  </h2>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    post.isPublished
                      ? 'bg-green-50 text-success border border-green-200'
                      : 'bg-amber-50 text-warning border border-amber-200'
                  }`}>
                    {post.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
                <p className="text-sm text-text-muted">
                  {new Date(post.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to={`/editor/${post.id}`}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg border border-border text-text-secondary hover:bg-surface-hover transition-colors no-underline"
                >
                  Edit
                </Link>
                {!post.isPublished && (
                  <button
                    type="button"
                    onClick={() => handlePublish(post.id)}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                  >
                    Publish
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(post.id)}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg text-danger border border-red-200 hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-10">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-surface text-text-secondary hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-text-muted">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-surface text-text-secondary hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
