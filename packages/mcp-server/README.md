# @blogapp/mcp-server

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server that lets you create, edit, publish, and manage your BlogApp posts and comments **directly from any MCP-compatible LLM chat** — VS Code Copilot, Claude Desktop, Cursor, Windsurf, or any other client that supports MCP.

> **Security first:** Your credentials are configured as environment variables and sent directly to the BlogApp API. The LLM never sees your email, password, or tokens.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Client Setup Guides](#client-setup-guides)
  - [VS Code / GitHub Copilot](#vs-code--github-copilot)
  - [Claude Desktop](#claude-desktop)
  - [Cursor](#cursor)
  - [Claude Code (CLI)](#claude-code-cli)
  - [Other MCP Clients](#other-mcp-clients)
- [Authentication](#authentication)
- [Available Tools](#available-tools)
- [Example Workflows](#example-workflows)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)
- [Development](#development)

---

## Prerequisites

1. **Node.js 18+** installed on your machine.
2. **pnpm 9+** installed (`npm i -g pnpm` if needed).
3. A running **BlogApp backend** (default: `http://localhost:3000`).
4. A **BlogApp account** — you need a registered email and password.

---

## Quick Start

```bash
# 1. Clone the repo (if you haven't already)
git clone <repo-url> && cd BlogApp

# 2. Install dependencies
pnpm install

# 3. Build the MCP server
pnpm --filter @blogapp/mcp-server build
```

The built server is at `packages/mcp-server/dist/index.js`. Now configure your MCP client (see below).

---

## Client Setup Guides

### VS Code / GitHub Copilot

This workspace ships with a ready-made `.vscode/mcp.json`. When you open the project in VS Code, the MCP server is already registered.

**On first use**, VS Code will prompt you for:
- **BlogApp account email** — shown as a normal text input
- **BlogApp account password** — shown as a masked password input

These are passed as env vars to the MCP server process — Copilot Chat never sees them.

#### Manual / Hardcoded Setup

If you prefer to skip the prompt (e.g. for a local dev account), create or edit `.vscode/mcp.json` in any workspace:

```jsonc
{
  "servers": {
    "blogapp": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/BlogApp/packages/mcp-server/dist/index.js"],
      "env": {
        "BLOGAPP_API_URL": "http://localhost:3000/api/v1",
        "BLOGAPP_EMAIL": "you@example.com",
        "BLOGAPP_PASSWORD": "your-password"
      }
    }
  }
}
```

> **Tip:** After editing `mcp.json`, reload the VS Code window (`Cmd+Shift+P` → "Developer: Reload Window") for the changes to take effect.

---

### Claude Desktop

1. Open your Claude Desktop config file:
   - **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

2. Add the `blogapp` server:

```json
{
  "mcpServers": {
    "blogapp": {
      "command": "node",
      "args": ["/absolute/path/to/BlogApp/packages/mcp-server/dist/index.js"],
      "env": {
        "BLOGAPP_API_URL": "http://localhost:3000/api/v1",
        "BLOGAPP_EMAIL": "you@example.com",
        "BLOGAPP_PASSWORD": "your-password"
      }
    }
  }
}
```

3. Restart Claude Desktop. You should see a hammer icon in the chat input indicating MCP tools are available.

---

### Cursor

1. Open **Cursor Settings** → **MCP** (or create/edit `~/.cursor/mcp.json`).
2. Add a new server:

```json
{
  "mcpServers": {
    "blogapp": {
      "command": "node",
      "args": ["/absolute/path/to/BlogApp/packages/mcp-server/dist/index.js"],
      "env": {
        "BLOGAPP_API_URL": "http://localhost:3000/api/v1",
        "BLOGAPP_EMAIL": "you@example.com",
        "BLOGAPP_PASSWORD": "your-password"
      }
    }
  }
}
```

3. Restart Cursor or reload the window.

---

### Claude Code (CLI)

Claude Code reads MCP config from `~/.claude.json` (global) or `.claude.json` (project-level).

1. Run the following command from your terminal:

```bash
claude mcp add blogapp \
  -e BLOGAPP_API_URL=http://localhost:3000/api/v1 \
  -e BLOGAPP_EMAIL=you@example.com \
  -e BLOGAPP_PASSWORD=your-password \
  -- node /absolute/path/to/BlogApp/packages/mcp-server/dist/index.js
```

Or manually edit `~/.claude.json`:

```json
{
  "mcpServers": {
    "blogapp": {
      "command": "node",
      "args": ["/absolute/path/to/BlogApp/packages/mcp-server/dist/index.js"],
      "env": {
        "BLOGAPP_API_URL": "http://localhost:3000/api/v1",
        "BLOGAPP_EMAIL": "you@example.com",
        "BLOGAPP_PASSWORD": "your-password"
      }
    }
  }
}
```

2. Verify the server is registered:

```bash
claude mcp list
```

3. Start a Claude Code session — the BlogApp tools will be available immediately.

---

### Other MCP Clients

Any client that supports MCP stdio servers can use this tool. The general pattern is:

| Setting | Value |
|---------|-------|
| **Command** | `node` |
| **Arguments** | `["/absolute/path/to/packages/mcp-server/dist/index.js"]` |
| **Environment** | `BLOGAPP_API_URL`, `BLOGAPP_EMAIL`, `BLOGAPP_PASSWORD` (see table below) |
| **Transport** | stdio |

---

## Authentication

Credentials are provided via environment variables — **never** typed into the chat. Two modes are supported:

### Mode 1: Email + Password (recommended)

Set `BLOGAPP_EMAIL` and `BLOGAPP_PASSWORD` in your MCP client config. The server automatically authenticates on the first tool call and refreshes tokens as needed.

### Mode 2: Pre-authenticated Token

If you already have a JWT (e.g. from a CLI login or API call), set `BLOGAPP_ACCESS_TOKEN` and optionally `BLOGAPP_REFRESH_TOKEN`. The server will use these directly without calling the login endpoint.

---

## Available Tools

Once configured, these tools are available in your LLM chat:

### Authentication

| Tool | Description |
|------|-------------|
| `login` | Verify/trigger authentication (usually called automatically) |
| `logout` | End the current session and clear tokens |
| `whoami` | Show the currently authenticated user |

### Posts

| Tool | Description |
|------|-------------|
| `create_post` | Create a new blog post as a draft |
| `update_post` | Edit a post's title or content |
| `publish_post` | Publish a draft post (makes it public) |
| `delete_post` | Delete a post you own |
| `get_post` | Fetch a single post by ID |
| `list_published_posts` | Browse all published posts (paginated) |
| `list_my_posts` | List your own posts — both drafts and published (paginated) |

### Comments

| Tool | Description |
|------|-------------|
| `add_comment` | Add a comment to a published post |
| `list_comments` | List comments on a post (paginated) |

---

## Example Workflows

### Write and publish a post

> **You:** Write a blog post titled "Getting Started with MCP" about how MCP protocol enables LLM tool use. Then publish it.
>
> The LLM will call `create_post` with the title and generated content, then call `publish_post` with the returned post ID.

### Review your drafts

> **You:** Show me all my draft posts.
>
> The LLM will call `list_my_posts` and filter for unpublished ones.

### Comment on a post

> **You:** Find the latest published post and leave a comment saying "Great article!"
>
> The LLM will call `list_published_posts`, pick the first result, then call `add_comment`.

### Edit an existing post

> **You:** Update my post about MCP — add a section about security best practices at the end.
>
> The LLM will call `list_my_posts` to find the post, `get_post` to read its current content, then `update_post` with the appended section.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BLOGAPP_API_URL` | No | `http://localhost:3000/api/v1` | BlogApp backend API base URL |
| `BLOGAPP_EMAIL` | Yes* | — | Account email for auto-login |
| `BLOGAPP_PASSWORD` | Yes* | — | Account password for auto-login |
| `BLOGAPP_ACCESS_TOKEN` | Yes* | — | Pre-authenticated JWT access token |
| `BLOGAPP_REFRESH_TOKEN` | No | — | Refresh token (used with access token mode) |

*\*Either `BLOGAPP_EMAIL` + `BLOGAPP_PASSWORD` **or** `BLOGAPP_ACCESS_TOKEN` must be set.*

---

## Troubleshooting

### "Not authenticated" error

The server could not find credentials. Make sure you have set either:
- `BLOGAPP_EMAIL` **and** `BLOGAPP_PASSWORD`, or
- `BLOGAPP_ACCESS_TOKEN`

in your MCP client's env config.

### "Login failed" error

- Verify the BlogApp backend is running at the configured `BLOGAPP_API_URL`.
- Check that your email and password are correct.
- Make sure the account exists (register at the BlogApp frontend first).

### Tools not showing up in VS Code

- Ensure the server is built: `pnpm --filter @blogapp/mcp-server build`
- Reload the VS Code window after editing `.vscode/mcp.json`.
- Check the Output panel → "MCP" for server logs.

### Tools not showing up in Claude Desktop

- Restart Claude Desktop after editing the config.
- Ensure the path to `dist/index.js` is absolute.
- Check that Node.js is in your system PATH.

### Token expired / 401 errors

The server automatically refreshes expired access tokens. If refresh also fails (e.g. after 7 days), restart the MCP server to re-authenticate.

---

## Development

```bash
# Run the MCP server directly with tsx (no build step needed)
pnpm --filter @blogapp/mcp-server dev

# Rebuild after making changes
pnpm --filter @blogapp/mcp-server build
```

### Project structure

```
packages/mcp-server/
├── src/
│   ├── index.ts        # MCP server — tool definitions and startup
│   └── api-client.ts   # HTTP client wrapping the BlogApp REST API
├── package.json
├── tsconfig.json
└── README.md           # This file
```
