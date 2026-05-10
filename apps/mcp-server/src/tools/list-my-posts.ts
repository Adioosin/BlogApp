import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { BlogApiClient } from '../api-client.js';
import { fail, ok } from './format.js';

const inputSchema = {
  page: z.number().int().min(1).default(1).describe('1-indexed page number. Default 1.'),
  limit: z.number().int().min(1).max(100).default(10).describe('Items per page (1-100). Default 10.'),
};

export function registerListMyPosts(server: McpServer, client: BlogApiClient): void {
  server.registerTool(
    'list_my_posts',
    {
      title: 'List my blog posts',
      description:
        "List blog posts authored by the configured user, including unpublished drafts. Returns paginated JSON: { data: PostDto[], meta: { page, limit, total } }. Use meta.total to decide whether to fetch additional pages.",
      inputSchema,
    },
    async ({ page, limit }) => {
      try {
        const result = await client.listMyPosts(page, limit);
        return ok(result);
      } catch (err) {
        return fail(err);
      }
    },
  );
}
