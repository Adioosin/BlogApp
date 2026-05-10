import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { BlogApiError } from '../api-client.js';

export function ok(data: unknown): CallToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

export function fail(err: unknown): CallToolResult {
  const payload =
    err instanceof BlogApiError
      ? { error: err.message, status: err.status, code: err.code, details: err.details }
      : { error: err instanceof Error ? err.message : String(err), status: null, code: null, details: null };

  return {
    isError: true,
    content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
  };
}
