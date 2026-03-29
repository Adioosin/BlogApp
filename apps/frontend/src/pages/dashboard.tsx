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
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>My Posts</h1>
        <Link to="/editor" className="btn-primary">
          New Post
        </Link>
      </div>

      {isLoading && <p>Loading your posts...</p>}
      {error && <p className="error-message" role="alert">{error}</p>}
      {actionError && <p className="error-message" role="alert">{actionError}</p>}
      {!isLoading && !error && posts.length === 0 && (
        <p>You haven&apos;t written any posts yet.</p>
      )}

      <div className="post-list">
        {posts.map((post) => (
          <article key={post.id} className="post-card">
            <div className="post-card-header">
              <h2>
                <Link to={`/posts/${post.id}`}>{post.title}</Link>
              </h2>
              <span className={`status-badge ${post.isPublished ? 'published' : 'draft'}`}>
                {post.isPublished ? 'Published' : 'Draft'}
              </span>
            </div>
            <p className="post-meta">
              {new Date(post.updatedAt).toLocaleDateString()}
            </p>
            <div className="post-actions">
              <Link to={`/editor/${post.id}`}>Edit</Link>
              {!post.isPublished && (
                <button type="button" onClick={() => handlePublish(post.id)}>
                  Publish
                </button>
              )}
              <button
                type="button"
                className="btn-danger"
                onClick={() => handleDelete(post.id)}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
