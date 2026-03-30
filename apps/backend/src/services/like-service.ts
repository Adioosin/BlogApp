import { prisma } from '../lib/prisma.js';
import type { AppError } from '../middleware/error-handler.js';

async function likePost(postId: string, userId: string): Promise<void> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { isPublished: true },
  });

  if (!post || !post.isPublished) {
    const error = new Error('Post not found') as AppError;
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  await prisma.postLike.upsert({
    where: { postId_userId: { postId, userId } },
    create: { postId, userId },
    update: {},
  });
}

async function unlikePost(postId: string, userId: string): Promise<void> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { isPublished: true },
  });

  if (!post || !post.isPublished) {
    const error = new Error('Post not found') as AppError;
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  await prisma.postLike.deleteMany({
    where: { postId, userId },
  });
}

async function getLikeData(
  postId: string,
  userId?: string,
): Promise<{ likeCount: number; likedByMe: boolean }> {
  const [likeCount, likedByMe] = await Promise.all([
    prisma.postLike.count({ where: { postId } }),
    userId
      ? prisma.postLike
          .findUnique({ where: { postId_userId: { postId, userId } } })
          .then((r) => r !== null)
      : Promise.resolve(false),
  ]);

  return { likeCount, likedByMe };
}

export { likePost, unlikePost, getLikeData };
