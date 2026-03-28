import type { CreatePostRequest, PostDto, UpdatePostRequest, UserDto } from '@blogapp/types';

import { prisma } from '../lib/prisma.js';
import type { AppError } from '../middleware/error-handler.js';

const authorSelect = { id: true, email: true, name: true };

function toPostDto(post: {
  id: string;
  title: string;
  content: string;
  isPublished: boolean;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  author: UserDto;
}): PostDto {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    isPublished: post.isPublished,
    authorId: post.authorId,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    author: post.author,
  };
}

async function listPublishedPosts(page: number, limit: number, sortBy: string, order: string) {
  const skip = (page - 1) * limit;

  const orderBy = sortBy === 'title'
    ? { title: order as 'asc' | 'desc' }
    : { createdAt: order as 'asc' | 'desc' };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { isPublished: true },
      include: { author: { select: authorSelect } },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.post.count({ where: { isPublished: true } }),
  ]);

  return {
    data: posts.map(toPostDto),
    meta: { page, limit, total },
  };
}

async function listMyPosts(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { authorId: userId },
      include: { author: { select: authorSelect } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.post.count({ where: { authorId: userId } }),
  ]);

  return {
    data: posts.map(toPostDto),
    meta: { page, limit, total },
  };
}

async function getPost(postId: string, requestingUserId?: string): Promise<PostDto> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { author: { select: authorSelect } },
  });

  if (!post) {
    const error = new Error('Post not found') as AppError;
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  if (!post.isPublished && post.authorId !== requestingUserId) {
    const error = new Error('Post not found') as AppError;
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  return toPostDto(post);
}

async function createPost(data: CreatePostRequest, authorId: string): Promise<PostDto> {
  const post = await prisma.post.create({
    data: {
      title: data.title,
      content: data.content,
      authorId,
    },
    include: { author: { select: authorSelect } },
  });

  return toPostDto(post);
}

async function updatePost(postId: string, data: UpdatePostRequest): Promise<PostDto> {
  const post = await prisma.post.update({
    where: { id: postId },
    data,
    include: { author: { select: authorSelect } },
  });

  return toPostDto(post);
}

async function publishPost(postId: string): Promise<PostDto> {
  const post = await prisma.post.update({
    where: { id: postId },
    data: { isPublished: true },
    include: { author: { select: authorSelect } },
  });

  return toPostDto(post);
}

async function deletePost(postId: string): Promise<void> {
  await prisma.post.delete({ where: { id: postId } });
}

async function findPostById(id: string) {
  return prisma.post.findUnique({
    where: { id },
    select: { authorId: true },
  });
}

export {
  listPublishedPosts,
  listMyPosts,
  getPost,
  createPost,
  updatePost,
  publishPost,
  deletePost,
  findPostById,
};
