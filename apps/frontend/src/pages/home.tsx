import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import type { PostDto } from '@blogapp/types';

import { postsApi } from '../lib/api-client.js';

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
    <div className="home-page">
      <h1>Recent Posts</h1>
      {isLoading && <p>Loading posts...</p>}
      {error && <p className="error-message" role="alert">{error}</p>}
      {!isLoading && !error && posts.length === 0 && (
        <p>No posts published yet.</p>
      )}
      <div className="post-list">
        {posts.map((post) => (
          <article key={post.id} className="post-card">
            <h2>
              <Link to={`/posts/${post.id}`}>{post.title}</Link>
            </h2>
            <p className="post-meta">
              By {post.author.name} &middot;{' '}
              {new Date(post.createdAt).toLocaleDateString()}
            </p>
            <p className="post-excerpt">
              {post.content.length > 200
                ? `${post.content.slice(0, 200)}...`
                : post.content}
            </p>
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
