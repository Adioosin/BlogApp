import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function seed() {
  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      name: 'Alice',
      password: '$2b$10$placeholder-hashed-password-alice',
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      name: 'Bob',
      password: '$2b$10$placeholder-hashed-password-bob',
    },
  });

  const publishedPost = await prisma.post.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      title: 'Getting Started with BlogApp',
      content: '<p>Welcome to BlogApp! This is a sample published post.</p>',
      isPublished: true,
      authorId: alice.id,
    },
  });

  await prisma.post.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      title: 'My Draft Post',
      content: '<p>This is a draft that is not yet published.</p>',
      isPublished: false,
      authorId: alice.id,
    },
  });

  await prisma.comment.upsert({
    where: { id: '00000000-0000-0000-0000-000000000010' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000010',
      body: 'Great first post!',
      postId: publishedPost.id,
      authorId: bob.id,
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
