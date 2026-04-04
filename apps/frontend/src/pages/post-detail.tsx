import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import type { CommentDto, PostDto } from '@blogapp/types';

import { useAuth } from '../hooks/use-auth.js';
import { commentsApi, postsApi } from '../lib/api-client.js';
import { Avatar } from '../components/avatar.js';

function renderMarkdown(md: string): string {
  const raw = marked.parse(md, { async: false }) as string;
  return DOMPurify.sanitize(raw);
}

function estimateReadTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  const [post, setPost] = useState<PostDto | null>(null);
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentError, setCommentError] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setError('');
    Promise.all([postsApi.get(id), commentsApi.list(id)])
      .then(([postRes, commentsRes]) => {
        setPost(postRes.data.data);
        setComments(commentsRes.data.data);
      })
      .catch(() => setError('Failed to load post'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !commentBody.trim()) return;
    setCommentError('');
    setIsSubmittingComment(true);
    try {
      const res = await commentsApi.create(id, { body: commentBody.trim() });
      setComments((prev) => [res.data.data, ...prev]);
      setCommentBody('');
    } catch {
      setCommentError('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentsApi.delete(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      // silent fail
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <span className="ml-3 text-text-secondary">Loading...</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-danger/10 border border-danger/30 text-danger rounded-xl px-4 py-3" role="alert">
        {error}
      </div>
    );
  }
  if (!post) return <p className="text-text-secondary">Post not found.</p>;

  const readTime = estimateReadTime(post.content);

  return (
    <div className="max-w-[680px] mx-auto pt-4">
      <article className="mb-12">
        {/* Tag + read time */}
        <div className="flex items-center gap-3 mb-4">
          {post.tags?.[0] && (
            <span
              className="text-xs font-medium px-2.5 py-0.5 rounded-full"
              style={{
                background: 'var(--color-primary-subtle)',
                color: 'var(--color-primary)',
                border: '1px solid var(--color-primary-subtle-border)',
              }}
            >
              {post.tags[0]}
            </span>
          )}
          <span className="text-sm text-text-muted">{readTime} min read</span>
          {!post.isPublished && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/30">
              Draft
            </span>
          )}
        </div>

        {/* Title */}
        <h1
          className="text-4xl font-black text-text-primary mb-5 leading-tight"
          style={{ letterSpacing: '-0.03em' }}
        >
          {post.title}
        </h1>

        {/* Author row */}
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border">
          <Avatar name={post.author.name} size="md" />
          <div>
            <div className="text-sm font-semibold text-text-primary">{post.author.name}</div>
            <div className="text-xs text-text-muted">
              {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Cover image */}
        {post.coverImage && (
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full rounded-xl mb-8"
            style={{ maxHeight: '400px', objectFit: 'cover' }}
          />
        )}

        {/* Body */}
        <div
          className="prose max-w-none"
          style={{ fontSize: '17px', lineHeight: '1.75' }}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
        />
      </article>

      {/* Comments */}
      {post.isPublished && (
        <section className="border-t border-border pt-10">
          <h2 className="text-xl font-bold text-text-primary mb-6">
            {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
          </h2>

          {isAuthenticated && (
            <form onSubmit={handleAddComment} className="mb-8">
              {commentError && (
                <div className="bg-danger/10 border border-danger/30 text-danger rounded-xl px-4 py-3 text-sm mb-4" role="alert">
                  {commentError}
                </div>
              )}
              <textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Write a comment..."
                rows={3}
                aria-label="Comment"
                className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow resize-y"
              />
              <div className="flex justify-end mt-3">
                <button
                  type="submit"
                  disabled={isSubmittingComment || !commentBody.trim()}
                  className="px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:opacity-90"
                  style={{ background: 'var(--color-primary)' }}
                >
                  {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </form>
          )}

          {!isAuthenticated && (
            <p className="text-text-secondary mb-6">
              <Link to="/login" className="font-medium hover:opacity-80 no-underline" style={{ color: 'var(--color-primary)' }}>
                Sign in
              </Link>{' '}
              to leave a comment.
            </p>
          )}

          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar name={comment.author.name} size="sm" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-text-primary">{comment.author.name}</span>
                      <span className="text-text-muted text-xs">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {user?.id === comment.authorId && (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-xs text-text-muted hover:text-danger transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-text-primary leading-relaxed">{comment.body}</p>
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-center text-text-muted py-4">No comments yet. Be the first to comment!</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
