import type { CommentDto, CreateCommentRequest, UserDto } from '@blogapp/types';

import { prisma } from '../lib/prisma.js';
import type { AppError } from '../middleware/error-handler.js';

const authorSelect = { id: true, email: true, name: true };

function toCommentDto(comment: {
  id: string;
  body: string;
  postId: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  author: UserDto;
}): CommentDto {
  return {
    id: comment.id,
    body: comment.body,
    postId: comment.postId,
    authorId: comment.authorId,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    author: comment.author,
  };
}

async function createComment(postId: string, data: CreateCommentRequest, authorId: string): Promise<CommentDto> {
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

  const comment = await prisma.comment.create({
    data: {
      body: data.body,
      postId,
      authorId,
    },
    include: { author: { select: authorSelect } },
  });

  return toCommentDto(comment);
}

async function listComments(postId: string, page: number, limit: number) {
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

  const skip = (page - 1) * limit;

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: { postId },
      include: { author: { select: authorSelect } },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
    }),
    prisma.comment.count({ where: { postId } }),
  ]);

  return {
    data: comments.map(toCommentDto),
    meta: { page, limit, total },
  };
}

async function deleteComment(commentId: string): Promise<void> {
  await prisma.comment.delete({ where: { id: commentId } });
}

async function findCommentById(id: string) {
  return prisma.comment.findUnique({
    where: { id },
    select: { authorId: true },
  });
}

export {
  createComment,
  listComments,
  deleteComment,
  findCommentById,
};
