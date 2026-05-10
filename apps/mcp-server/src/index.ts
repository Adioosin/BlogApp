import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { loadConfig } from './config.js';
import { buildServer } from './server.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const { server } = buildServer(config);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Stdout is the JSON-RPC channel; status logs must go to stderr.
  console.error(`[blogapp-mcp] connected. base url: ${config.BLOG_API_BASE_URL}, user: ${config.BLOG_API_EMAIL}`);
}

main().catch((err) => {
  console.error('[blogapp-mcp] fatal:', err);
  process.exit(1);
});
