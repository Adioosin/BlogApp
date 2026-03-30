import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/use-auth.js';
import { likesApi } from '../lib/api-client.js';

type LikeButtonProps = {
  postId: string;
  initialLikeCount: number;
  initialLikedByMe: boolean;
};

export function LikeButton({ postId, initialLikeCount, initialLikedByMe }: LikeButtonProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [likedByMe, setLikedByMe] = useState(initialLikedByMe);
  const [isPending, setIsPending] = useState(false);

  const handleClick = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const wasLiked = likedByMe;
    setLikedByMe(!wasLiked);
    setLikeCount((c) => (wasLiked ? c - 1 : c + 1));
    setIsPending(true);

    try {
      if (wasLiked) {
        await likesApi.unlike(postId);
      } else {
        await likesApi.like(postId);
      }
    } catch {
      setLikedByMe(wasLiked);
      setLikeCount((c) => (wasLiked ? c + 1 : c - 1));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={likedByMe ? 'Unlike this post' : 'Like this post'}
      aria-pressed={likedByMe}
      className={[
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
        'border disabled:opacity-50 disabled:cursor-not-allowed',
        likedByMe
          ? 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100'
          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700',
      ].join(' ')}
    >
      <svg
        aria-hidden="true"
        className="w-4 h-4"
        fill={likedByMe ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      {likeCount}
    </button>
  );
}
