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

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p className="error-message" role="alert">{error}</p>;
  if (!post) return <p>Post not found.</p>;

  return (
    <div className="post-detail-page">
      <article>
        <h1>{post.title}</h1>
        <p className="post-meta">
          By {post.author.name} &middot;{' '}
          {new Date(post.createdAt).toLocaleDateString()}
          {!post.isPublished && <span className="draft-badge"> (Draft)</span>}
        </p>
        <div
          className="post-content"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
        />
      </article>

      {post.isPublished && (
        <section className="comments-section">
          <h2>Comments ({comments.length})</h2>

          {isAuthenticated && (
            <form onSubmit={handleAddComment} className="comment-form">
              {commentError && <p className="error-message" role="alert">{commentError}</p>}
              <textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Write a comment..."
                rows={3}
                aria-label="Comment"
              />
              <button type="submit" disabled={isSubmittingComment || !commentBody.trim()}>
                {isSubmittingComment ? 'Posting...' : 'Post Comment'}
              </button>
            </form>
          )}

          {!isAuthenticated && (
            <p>
              <Link to="/login">Login</Link> to leave a comment.
            </p>
          )}

          <div className="comments-list">
            {comments.map((comment) => (
              <div key={comment.id} className="comment">
                <p className="comment-meta">
                  <strong>{comment.author.name}</strong> &middot;{' '}
                  {new Date(comment.createdAt).toLocaleDateString()}
                </p>
                <p>{comment.body}</p>
                {user?.id === comment.authorId && (
                  <button
                    type="button"
                    className="delete-comment"
                    onClick={() => handleDeleteComment(comment.id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
            {comments.length === 0 && <p>No comments yet.</p>}
          </div>
        </section>
      )}
    </div>
  );
}
