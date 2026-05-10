import { z } from 'zod';

const envSchema = z.object({
  BLOG_API_BASE_URL: z.string().url().default('http://localhost:3000/api/v1'),
  BLOG_API_EMAIL: z.string().email(),
  BLOG_API_PASSWORD: z.string().min(1),
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(): Config {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(
      `Invalid MCP server configuration. Set the required environment variables in .mcp.json or your shell:\n${issues}`,
    );
  }
  return Object.freeze(result.data);
}
