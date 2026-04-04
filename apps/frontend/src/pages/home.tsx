import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import type { PostDto } from '@blogapp/types';

import { useAuth } from '../hooks/use-auth.js';
import { postsApi } from '../lib/api-client.js';
import { Avatar } from '../components/avatar.js';

function stripToPlainText(md: string): string {
  const html = marked.parse(md, { async: false }) as string;
  const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
  return clean;
}

function gradientForName(name: string): string {
  const gradients = [
    'linear-gradient(135deg, #d1fae5, #dbeafe)',
    'linear-gradient(135deg, #dbeafe, #fce7f3)',
    'linear-gradient(135deg, #fef3c7, #fce7f3)',
    'linear-gradient(135deg, #ede9fe, #dbeafe)',
    'linear-gradient(135deg, #d1fae5, #fef3c7)',
  ];
  const index = name.charCodeAt(0) % gradients.length;
  return gradients[index];
}

export function HomePage() {
  const { user } = useAuth();
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
    <div className="max-w-[720px] mx-auto">
      {/* Hero bio section */}
      <div className="mb-8 pb-8 border-b border-border">
        <div className="flex items-center gap-4 mb-3">
          {user ? (
            <Avatar name={user.name} size="lg" />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)' }}
            />
          )}
          <div>
            <div className="text-lg font-bold text-text-primary" style={{ letterSpacing: '-0.02em' }}>
              {user?.name ?? 'BlogApp'}
            </div>
            <div className="text-sm text-text-secondary">
              Writing about software, design, and the web.
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <span className="ml-3 text-text-secondary">Loading posts...</span>
        </div>
      )}

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger rounded-xl px-4 py-3 mb-6" role="alert">
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

      <div className="flex flex-col gap-1">
        {posts.map((post) => {
          const excerpt = stripToPlainText(post.content);
          const tag = (post as PostDto & { tags?: string[] }).tags?.[0];
          const thumbnail = (post as PostDto & { coverImage?: string }).coverImage;

          return (
            <article
              key={post.id}
              className="bg-surface rounded-xl border border-border p-4 shadow-card hover:shadow-card-hover transition-shadow flex gap-4 items-start group"
            >
              <div className="flex-1 min-w-0">
                {tag && (
                  <div className="mb-2">
                    <span
                      className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                      style={{
                        background: 'var(--color-primary-subtle)',
                        color: 'var(--color-primary)',
                        border: '1px solid var(--color-primary-subtle-border)',
                      }}
                    >
                      {tag}
                    </span>
                  </div>
                )}
                <h2 className="text-base font-bold text-text-primary mb-1.5 leading-snug" style={{ letterSpacing: '-0.02em' }}>
                  <Link
                    to={`/posts/${post.id}`}
                    className="no-underline group-hover:text-primary transition-colors"
                    style={{ color: 'inherit' }}
                  >
                    {post.title}
                  </Link>
                </h2>
                {excerpt && (
                  <p className="text-sm text-text-secondary leading-relaxed mb-2.5 line-clamp-2">
                    {excerpt}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <Avatar name={post.author.name} size="sm" />
                  <span className="text-xs text-text-muted">
                    {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
              <div
                className="w-20 h-20 rounded-lg flex-shrink-0"
                style={{
                  background: thumbnail ? `url(${thumbnail}) center/cover` : gradientForName(post.title),
                }}
              />
            </article>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-surface text-text-secondary hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>
          <span className="text-sm text-text-muted">Page {page} of {totalPages}</span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:opacity-90"
            style={{ background: 'var(--color-primary)' }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
