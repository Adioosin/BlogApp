#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { ApiClient } from './api-client.js';

const BASE_URL = process.env.BLOGAPP_API_URL ?? 'http://localhost:3000/api/v1';

const api = new ApiClient({ baseUrl: BASE_URL });

// Credentials are read from env vars so the LLM never sees them.
// Supports two modes:
//   1. BLOGAPP_EMAIL + BLOGAPP_PASSWORD  — auto-login on first tool call
//   2. BLOGAPP_ACCESS_TOKEN (+ optional BLOGAPP_REFRESH_TOKEN) — pre-authenticated
const BLOGAPP_EMAIL = process.env.BLOGAPP_EMAIL;
const BLOGAPP_PASSWORD = process.env.BLOGAPP_PASSWORD;
const BLOGAPP_ACCESS_TOKEN = process.env.BLOGAPP_ACCESS_TOKEN;
const BLOGAPP_REFRESH_TOKEN = process.env.BLOGAPP_REFRESH_TOKEN;

async function ensureAuthenticated(): Promise<void> {
  if (api.isAuthenticated) return;

  // Mode 2: pre-supplied tokens
  if (BLOGAPP_ACCESS_TOKEN) {
    api.setTokens(BLOGAPP_ACCESS_TOKEN, BLOGAPP_REFRESH_TOKEN ?? '');
    return;
  }

  // Mode 1: email + password from env
  if (BLOGAPP_EMAIL && BLOGAPP_PASSWORD) {
    await api.login(BLOGAPP_EMAIL, BLOGAPP_PASSWORD);
    return;
  }

  throw new Error(
    'Not authenticated. Set BLOGAPP_EMAIL + BLOGAPP_PASSWORD or BLOGAPP_ACCESS_TOKEN in your MCP server env config.',
  );
}

const server = new McpServer({
  name: 'blogapp',
  version: '0.1.0',
  description: 'Manage your BlogApp posts and comments directly from chat',
});

// --- Auth tools ---

server.tool(
  'login',
  'Authenticate with BlogApp using credentials from environment variables. Call this before using other tools, or it will be called automatically.',
  {},
  async () => {
    try {
      await ensureAuthenticated();
      const user = await api.getMe();
      return {
        content: [
          {
            type: 'text' as const,
            text: `Authenticated as ${user.name} (${user.email})`,
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text' as const, text: `Login failed: ${(err as Error).message}` }],
      };
    }
  },
);

server.tool(
  'logout',
  'Log out of the current BlogApp session.',
  {},
  async () => {
    try {
      await api.logout();
      return {
        content: [{ type: 'text' as const, text: 'Logged out successfully.' }],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text' as const, text: `Logout failed: ${(err as Error).message}` }],
      };
    }
  },
);

server.tool(
  'whoami',
  'Get the currently authenticated user info.',
  {},
  async () => {
    try {
      await ensureAuthenticated();
      const user = await api.getMe();
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(user, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }],
      };
    }
  },
);

// --- Post tools ---

server.tool(
  'create_post',
  'Create a new blog post draft. The post starts unpublished — use publish_post to make it public.',
  {
    title: z.string().min(1).max(255).describe('Post title'),
    content: z.string().min(1).describe('Post content (supports HTML/rich text)'),
  },
  async ({ title, content }) => {
    try {
      await ensureAuthenticated();
      const post = await api.createPost(title, content);
      return {
        content: [
          {
            type: 'text' as const,
            text: `Post created (draft):\n${JSON.stringify(post, null, 2)}`,
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text' as const, text: `Failed to create post: ${(err as Error).message}` }],
      };
    }
  },
);

server.tool(
  'update_post',
  'Update an existing blog post. Only the post author can update it.',
  {
    id: z.string().describe('Post ID to update'),
    title: z.string().min(1).max(255).optional().describe('New title (optional)'),
    content: z.string().min(1).optional().describe('New content (optional)'),
  },
  async ({ id, title, content }) => {
    try {
      await ensureAuthenticated();
      const data: { title?: string; content?: string } = {};
      if (title !== undefined) data.title = title;
      if (content !== undefined) data.content = content;
      const post = await api.updatePost(id, data);
      return {
        content: [
          {
            type: 'text' as const,
            text: `Post updated:\n${JSON.stringify(post, null, 2)}`,
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text' as const, text: `Failed to update post: ${(err as Error).message}` }],
      };
    }
  },
);

server.tool(
  'publish_post',
  'Publish a draft post, making it visible to everyone.',
  {
    id: z.string().describe('Post ID to publish'),
  },
  async ({ id }) => {
    try {
      await ensureAuthenticated();
      const post = await api.publishPost(id);
      return {
        content: [
          {
            type: 'text' as const,
            text: `Post published:\n${JSON.stringify(post, null, 2)}`,
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text' as const, text: `Failed to publish post: ${(err as Error).message}` }],
      };
    }
  },
);

server.tool(
  'delete_post',
  'Delete a blog post. Only the post author can delete it.',
  {
    id: z.string().describe('Post ID to delete'),
  },
  async ({ id }) => {
    try {
      await ensureAuthenticated();
      await api.deletePost(id);
      return {
        content: [{ type: 'text' as const, text: `Post ${id} deleted.` }],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text' as const, text: `Failed to delete post: ${(err as Error).message}` }],
      };
    }
  },
);

server.tool(
  'get_post',
  'Get a single blog post by ID.',
  {
    id: z.string().describe('Post ID'),
  },
  async ({ id }) => {
    try {
      await ensureAuthenticated();
      const post = await api.getPost(id);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(post, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text' as const, text: `Failed to get post: ${(err as Error).message}` }],
      };
    }
  },
);

server.tool(
  'list_published_posts',
  'List all published blog posts with pagination.',
  {
    page: z.number().int().min(1).default(1).describe('Page number (default: 1)'),
    limit: z.number().int().min(1).max(100).default(10).describe('Items per page (default: 10)'),
  },
  async ({ page, limit }) => {
    try {
      await ensureAuthenticated();
      const result = await api.listPublishedPosts(page, limit);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text' as const, text: `Failed to list posts: ${(err as Error).message}` }],
      };
    }
  },
);

server.tool(
  'list_my_posts',
  'List your own posts (both drafts and published). Requires authentication.',
  {
    page: z.number().int().min(1).default(1).describe('Page number (default: 1)'),
    limit: z.number().int().min(1).max(100).default(10).describe('Items per page (default: 10)'),
  },
  async ({ page, limit }) => {
    try {
      await ensureAuthenticated();
      const result = await api.listMyPosts(page, limit);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text' as const, text: `Failed to list posts: ${(err as Error).message}` }],
      };
    }
  },
);

// --- Comment tools ---

server.tool(
  'add_comment',
  'Add a comment to a published blog post.',
  {
    postId: z.string().describe('Post ID to comment on'),
    body: z.string().min(1).max(5000).describe('Comment text'),
  },
  async ({ postId, body }) => {
    try {
      await ensureAuthenticated();
      const comment = await api.addComment(postId, body);
      return {
        content: [
          {
            type: 'text' as const,
            text: `Comment added:\n${JSON.stringify(comment, null, 2)}`,
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text' as const, text: `Failed to add comment: ${(err as Error).message}` }],
      };
    }
  },
);

server.tool(
  'list_comments',
  'List comments on a blog post.',
  {
    postId: z.string().describe('Post ID'),
    page: z.number().int().min(1).default(1).describe('Page number (default: 1)'),
    limit: z.number().int().min(1).max(100).default(20).describe('Items per page (default: 20)'),
  },
  async ({ postId, page, limit }) => {
    try {
      await ensureAuthenticated();
      const result = await api.listComments(postId, page, limit);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text' as const, text: `Failed to list comments: ${(err as Error).message}` }],
      };
    }
  },
);

// --- Start server ---

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('MCP server failed to start:', err);
  process.exit(1);
});
