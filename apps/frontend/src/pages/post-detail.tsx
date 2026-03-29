import DOMPurify from 'dompurify';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import type { CommentDto, PostDto } from '@blogapp/types';

import { useAuth } from '../hooks/use-auth.js';
import { commentsApi, postsApi } from '../lib/api-client.js';

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

    Promise.all([
      postsApi.get(id),
      commentsApi.list(id),
    ])
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
      // Silently fail for now
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
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-danger rounded-lg px-4 py-3" role="alert">
        {error}
      </div>
    );
  }
  if (!post) return <p className="text-text-secondary">Post not found.</p>;

  return (
    <div className="max-w-3xl mx-auto">
      <article className="bg-surface rounded-xl border border-border shadow-card p-6 sm:p-8 mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-3">{post.title}</h1>
        <div className="flex items-center gap-2 text-sm text-text-muted mb-6">
          <span>By {post.author.name}</span>
          <span>&middot;</span>
          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
          {!post.isPublished && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-warning border border-amber-200 ml-2">
              Draft
            </span>
          )}
        </div>
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
        />
      </article>

      {post.isPublished && (
        <section className="bg-surface rounded-xl border border-border shadow-card p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-text-primary mb-6">
            Comments ({comments.length})
          </h2>

          {isAuthenticated && (
            <form onSubmit={handleAddComment} className="mb-8">
              {commentError && (
                <div className="bg-red-50 border border-red-200 text-danger rounded-lg px-4 py-3 text-sm mb-4" role="alert">
                  {commentError}
                </div>
              )}
              <textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Write a comment..."
                rows={3}
                aria-label="Comment"
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow resize-y"
              />
              <div className="flex justify-end mt-3">
                <button
                  type="submit"
                  disabled={isSubmittingComment || !commentBody.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </form>
          )}

          {!isAuthenticated && (
            <p className="text-text-secondary mb-6">
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
                Login
              </Link>{' '}
              to leave a comment.
            </p>
          )}

          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="border border-border rounded-lg p-4 bg-surface-alt">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-text-primary">{comment.author.name}</span>
                    <span className="text-text-muted">&middot;</span>
                    <span className="text-text-muted">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {user?.id === comment.authorId && (
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-sm text-text-muted hover:text-danger transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p className="text-text-primary leading-relaxed">{comment.body}</p>
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
