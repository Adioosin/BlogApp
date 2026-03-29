import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import type { PostDto } from '@blogapp/types';

import { postsApi } from '../lib/api-client.js';

function stripToPlainText(md: string): string {
  const html = marked.parse(md, { async: false }) as string;
  const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
  return clean;
}

export function HomePage() {
  const [posts, setPosts] = useState<PostDto[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const limit = 10;

  useEffect(() => {
    setIsLoading(true);
    setError('');
    postsApi
      .list({ page, limit })
      .then((res) => {
        setPosts(res.data.data);
        setTotal(res.data.meta.total);
      })
      .catch(() => setError('Failed to load posts'))
      .finally(() => setIsLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary mb-8">Recent Posts</h1>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <span className="ml-3 text-text-secondary">Loading posts...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-danger rounded-lg px-4 py-3 mb-6" role="alert">
          {error}
        </div>
      )}

      {!isLoading && !error && posts.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-lg text-text-secondary">No posts published yet.</p>
          <p className="text-sm text-text-muted mt-1">Check back soon for new content!</p>
        </div>
      )}

      <div className="space-y-6">
        {posts.map((post) => (
          <article
            key={post.id}
            className="bg-surface rounded-xl border border-border p-6 shadow-card hover:shadow-card-hover transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">
              <Link to={`/posts/${post.id}`} className="text-text-primary hover:text-primary-600 no-underline">
                {post.title}
              </Link>
            </h2>
            <p className="text-sm text-text-muted mb-3">
              By {post.author.name} &middot;{' '}
              {new Date(post.createdAt).toLocaleDateString()}
            </p>
            <p className="text-text-secondary leading-relaxed">
              {(() => {
                const text = stripToPlainText(post.content);
                return text.length > 200
                  ? `${text.slice(0, 200)}...`
                  : text;
              })()}
            </p>
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
