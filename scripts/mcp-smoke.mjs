#!/usr/bin/env node
// Smoke test: spawn the built MCP server and exercise initialize + each tool over stdio.
// All MCP messages here are JSON-RPC 2.0 framed as raw newline-delimited JSON
// (StdioServerTransport in @modelcontextprotocol/sdk uses ndjson, not LSP-style headers).

import { spawn } from 'node:child_process';
import { setTimeout as wait } from 'node:timers/promises';

const SERVER_PATH = new URL('../apps/mcp-server/dist/index.js', import.meta.url).pathname;

const child = spawn('node', [SERVER_PATH], {
  env: {
    ...process.env,
    BLOG_API_BASE_URL: 'http://localhost:3000/api/v1',
    BLOG_API_EMAIL: 'alice@blogapp.com',
    BLOG_API_PASSWORD: 'password123',
  },
  stdio: ['pipe', 'pipe', 'pipe'],
});

child.stderr.on('data', (b) => process.stderr.write(`[server] ${b}`));

let buf = '';
const pending = new Map(); // id -> { resolve, reject }
let nextId = 1;

child.stdout.on('data', (chunk) => {
  buf += chunk.toString('utf8');
  let idx;
  while ((idx = buf.indexOf('\n')) !== -1) {
    const line = buf.slice(0, idx).trim();
    buf = buf.slice(idx + 1);
    if (!line) continue;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch (err) {
      console.error('[smoke] non-json line from server:', line);
      continue;
    }
    if (msg.id != null && pending.has(msg.id)) {
      const { resolve } = pending.get(msg.id);
      pending.delete(msg.id);
      resolve(msg);
    }
  }
});

function send(method, params) {
  const id = nextId++;
  const msg = { jsonrpc: '2.0', id, method, params };
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    child.stdin.write(JSON.stringify(msg) + '\n');
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        reject(new Error(`timeout waiting for ${method}`));
      }
    }, 15000);
  });
}

function notify(method, params) {
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n');
}

function unwrapText(result) {
  const txt = result?.content?.[0]?.text;
  return txt ? JSON.parse(txt) : null;
}

async function main() {
  await wait(200); // give the server a moment to attach the transport

  const init = await send('initialize', {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'smoke-test', version: '0.0.0' },
  });
  console.log('initialize:', JSON.stringify(init.result?.serverInfo));
  notify('notifications/initialized', {});

  const list = await send('tools/list', {});
  const toolNames = (list.result?.tools ?? []).map((t) => t.name).sort();
  console.log('tools/list:', toolNames);
  if (
    toolNames.length !== 3 ||
    !toolNames.includes('create_post') ||
    !toolNames.includes('list_my_posts') ||
    !toolNames.includes('get_post_comments')
  ) {
    throw new Error('expected 3 tools: create_post, list_my_posts, get_post_comments');
  }

  const listMyPosts = await send('tools/call', {
    name: 'list_my_posts',
    arguments: { page: 1, limit: 5 },
  });
  if (listMyPosts.result?.isError) {
    throw new Error('list_my_posts errored: ' + listMyPosts.result.content[0].text);
  }
  const myPosts = unwrapText(listMyPosts.result);
  console.log('list_my_posts: total=' + myPosts.meta.total + ', returned=' + myPosts.data.length);
  if (typeof myPosts.meta.total !== 'number') throw new Error('meta.total missing');

  const created = await send('tools/call', {
    name: 'create_post',
    arguments: { title: 'MCP smoke test ' + Date.now(), content: 'hello from mcp' },
  });
  if (created.result?.isError) {
    throw new Error('create_post errored: ' + created.result.content[0].text);
  }
  const newPost = unwrapText(created.result);
  console.log('create_post: id=' + newPost.id + ', isPublished=' + newPost.isPublished);
  if (!newPost.id) throw new Error('expected created post to have id');
  if (newPost.isPublished !== false) throw new Error('expected new post to be a draft');

  // Comments only work on published posts. Use a known seeded post id from the
  // public listing so we can prove the comments path works.
  const publishedRes = await fetch('http://localhost:3000/api/v1/posts?page=1&limit=1');
  const published = await publishedRes.json();
  const samplePostId = published.data?.[0]?.id;
  if (samplePostId) {
    const commentsCall = await send('tools/call', {
      name: 'get_post_comments',
      arguments: { postId: samplePostId, page: 1, limit: 5 },
    });
    if (commentsCall.result?.isError) {
      throw new Error('get_post_comments errored: ' + commentsCall.result.content[0].text);
    }
    const comments = unwrapText(commentsCall.result);
    console.log('get_post_comments: postId=' + samplePostId + ', total=' + comments.meta.total);
  } else {
    console.log('get_post_comments: skipped (no published posts in the seed)');
  }

  // Validation rejection: title > 255 chars must fail before hitting the network.
  const tooLong = await send('tools/call', {
    name: 'create_post',
    arguments: { title: 'x'.repeat(300), content: 'body' },
  });
  // The SDK returns either an MCP-level error or a tool-level isError. Either is acceptable.
  const rejected = tooLong.error != null || tooLong.result?.isError === true;
  console.log('create_post (300-char title) rejected:', rejected);
  if (!rejected) throw new Error('expected zod validation to reject 300-char title');

  console.log('SMOKE OK');
}

try {
  await main();
  child.kill();
  process.exit(0);
} catch (err) {
  console.error('SMOKE FAIL:', err);
  child.kill();
  process.exit(1);
}
