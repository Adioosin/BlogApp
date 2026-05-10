import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { BlogApiClient } from '../api-client.js';
import { fail, ok } from './format.js';

const inputSchema = {
  title: z.string().min(1).max(255).describe('Post title (1-255 characters).'),
  content: z.string().min(1).describe('Post body. Markdown supported.'),
};

export function registerCreatePost(server: McpServer, client: BlogApiClient): void {
  server.registerTool(
    'create_post',
    {
      title: 'Create blog post',
      description:
        'Create a new blog post authored by the configured user. Posts are created as drafts (isPublished=false). Returns the created PostDto as JSON.',
      inputSchema,
    },
    async ({ title, content }) => {
      try {
        const post = await client.createPost({ title, content });
        return ok(post);
      } catch (err) {
        return fail(err);
      }
    },
  );
}
