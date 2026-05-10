import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { BlogApiClient } from './api-client.js';
import type { Config } from './config.js';
import { registerCreatePost } from './tools/create-post.js';
import { registerGetPostComments } from './tools/get-post-comments.js';
import { registerListMyPosts } from './tools/list-my-posts.js';

export function buildServer(config: Config): { server: McpServer; client: BlogApiClient } {
  const client = new BlogApiClient(config);
  const server = new McpServer({
    name: 'blogapp-mcp',
    version: '0.0.0',
  });

  registerCreatePost(server, client);
  registerListMyPosts(server, client);
  registerGetPostComments(server, client);

  return { server, client };
}
