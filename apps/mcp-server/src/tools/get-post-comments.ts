import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { BlogApiClient } from '../api-client.js';
import { fail, ok } from './format.js';

const inputSchema = {
  postId: z.string().min(1).describe('Id of the post whose comments to fetch.'),
  page: z.number().int().min(1).default(1).describe('1-indexed page number. Default 1.'),
  limit: z.number().int().min(1).max(100).default(20).describe('Items per page (1-100). Default 20.'),
};

export function registerGetPostComments(server: McpServer, client: BlogApiClient): void {
  server.registerTool(
    'get_post_comments',
    {
      title: 'Get comments on a post',
      description:
        "Fetch comments on a specific blog post by id. Returns paginated JSON: { data: CommentDto[], meta: { page, limit, total } }. The backend only returns comments for published posts; requesting comments for an unpublished post yields a 404.",
      inputSchema,
    },
    async ({ postId, page, limit }) => {
      try {
        const result = await client.getPostComments(postId, page, limit);
        return ok(result);
      } catch (err) {
        return fail(err);
      }
    },
  );
}
