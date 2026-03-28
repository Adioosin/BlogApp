import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function seed() {
  const alice = await prisma.user.upsert({
    where: { email: 'alice@blogapp.com' },
    update: {},
    create: {
      email: 'alice@blogapp.com',
      name: 'Alice Johnson',
      password: '$2b$10$placeholder-hashed-password-alice',
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@blogapp.com' },
    update: {},
    create: {
      email: 'bob@blogapp.com',
      name: 'Bob Williams',
      password: '$2b$10$placeholder-hashed-password-bob',
    },
  });

  // Published post with longer content
  const publishedPost = await prisma.post.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      title: 'Getting Started with BlogApp',
      content:
        '<h2>Welcome to BlogApp</h2><p>This platform lets you write, draft, and publish blog posts with a rich text editor. Start by creating a draft and publishing when you are ready.</p><p>Happy writing!</p>',
      isPublished: true,
      authorId: alice.id,
    },
  });

  // Second published post by a different author
  const secondPost = await prisma.post.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      title: 'Tips for Writing Great Blog Posts',
      content:
        '<p>Writing a great blog post starts with a clear outline. Keep paragraphs short, use headings for structure, and always proofread before publishing.</p>',
      isPublished: true,
      authorId: bob.id,
    },
  });

  // Draft post (unpublished)
  await prisma.post.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      title: 'My Draft Post',
      content: '<p>This is a work-in-progress draft that is not yet published.</p>',
      isPublished: false,
      authorId: alice.id,
    },
  });

  // Multiple comments on first post for pagination testing
  await prisma.comment.upsert({
    where: { id: '00000000-0000-0000-0000-000000000010' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000010',
      body: 'Great introduction! Looking forward to more posts.',
      postId: publishedPost.id,
      authorId: bob.id,
    },
  });

  await prisma.comment.upsert({
    where: { id: '00000000-0000-0000-0000-000000000011' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000011',
      body: 'Thanks for the welcome guide, very helpful.',
      postId: publishedPost.id,
      authorId: alice.id,
    },
  });

  await prisma.comment.upsert({
    where: { id: '00000000-0000-0000-0000-000000000012' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000012',
      body: 'Solid advice on structuring posts!',
      postId: secondPost.id,
      authorId: alice.id,
    },
  });

  console.log('Seed complete:', { alice: alice.id, bob: bob.id });
}

seed()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
