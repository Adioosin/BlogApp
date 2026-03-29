---
name: pr-comment-resolution
description: "Resolve PR review comments, fix review feedback, address PR comments, implement review suggestions. Fetches existing PR comments, prioritizes by severity, and guides interactive one-at-a-time resolution with inline replies."
argument-hint: "PR number or URL (e.g., '#12' or 'https://github.com/owner/repo/pull/12')"
---

# PR Comment Resolution

Use this skill when the user asks you to resolve PR comments, fix review feedback, or address PR suggestions. This workflow is interactive — ask before each fix.

## Constraints

- DO NOT create new review comments — only work with existing ones
- DO NOT make code changes without explicit user approval
- DO NOT resolve comments that are just questions or general observations
- DO NOT move to the next comment until the user confirms they are ready
- ONLY focus on actionable feedback that requires code changes
- ALWAYS ask clarifying questions if a comment's intent or desired fix is ambiguous

## Workflow

### Step 1: Identify and Fetch the PR

Parse the user's input to extract:
- **PR number** — from `#12`, a URL, or a plain number
- **Repository owner and name** — from URL or infer from workspace git remote

If unclear, use `#tool:mcp_io_github_git_list_pull_requests` to find recent open PRs.

### Step 2: Analyze Existing Comments

Use `#tool:mcp_io_github_git_pull_request_read` with `method: "get_review_comments"` to fetch all review comments.

Also use `#tool:mcp_io_github_git_pull_request_read` with `method: "get_comments"` for general PR comments.

### Step 3: Prioritize Comments

Categorize comments by priority:

**HIGH PRIORITY** (Critical issues):
- Security vulnerabilities
- Logic errors or bugs
- Breaking changes
- Type safety issues
- Performance problems

**MEDIUM PRIORITY** (Best practices):
- Code style violations
- Missing error handling
- Inconsistent patterns
- Missing documentation

**LOW PRIORITY** (Minor improvements):
- Naming suggestions
- Formatting preferences
- Nice-to-have optimizations

### Step 4: Present Analysis to User

Show the user:
1. **Summary**: Total comments found and breakdown by priority
2. **Top concerns**: List the 3-5 most critical actionable comments
3. **Code locations**: File paths and line numbers for each high-priority item

Format as:
```
## PR Comment Analysis

**Total Comments**: X review comments, Y general comments

### 🔴 HIGH PRIORITY (X items)
1. **[filename.ts:L123]** Security: Raw SQL injection vulnerability
2. **[component.tsx:L45]** Bug: Missing null check causes crash

### 🟡 MEDIUM PRIORITY (X items)
1. **[service.ts:L78]** Style: Inconsistent error handling pattern
...

### 🟢 LOW PRIORITY (X items)
1. **[utils.ts:L12]** Naming: Variable name could be clearer
...
```

### Step 5: Get User Approval

Ask the user which comments they want to resolve:
- "Which priority level should I focus on? (high/medium/all)"
- "Any specific comments to skip or prioritize?"
- Wait for explicit confirmation before making changes

### Step 6: Clarify Before Implementing

Before implementing a fix for each comment, check whether the comment is ambiguous or could be resolved in multiple ways. If so:

- Ask the user a targeted clarifying question (e.g., "This comment suggests better error handling — should I add try/catch with a centralized handler, or a per-route approach?")
- Wait for the user's answer before proceeding
- If the comment is straightforward and the fix is obvious, skip this step and proceed directly

### Step 7: Implement One Fix at a Time

Process comments **one at a time** in priority order. For each comment:

1. Read the relevant file to understand context
2. Load project conventions (copilot-instructions.md and relevant .instructions.md files)
3. Implement the fix following project standards
4. Show the user what change was made and which comment it addresses
5. Post an inline reply to the original review comment (see Step 8)
6. **Ask the user: "Ready to move to the next comment?"**
7. Wait for the user's confirmation before starting the next comment

Do NOT batch multiple fixes together. Complete the full cycle (implement → reply → confirm) for each comment before moving on.

### Step 8: Post Inline Replies on the PR

Immediately after implementing each fix, post an inline reply to the original review comment explaining what was done:

- Use `#tool:mcp_io_github_git_add_reply_to_pull_request_comment` with the original `commentId` from the review thread
- The reply body should start with "Resolved:" followed by a concise description of the fix
- Include which files were created or modified and what the change does

### Step 9: Resolve Comment Threads

After posting each reply, attempt to resolve that comment thread so it collapses on the PR:

- Use `#tool:mcp_io_github_git_pull_request_review_write` with `method: "resolve_thread"` if available
- If the API does not support resolving threads directly, inform the user which threads still need to be manually resolved in the GitHub UI
- Track which threads were auto-resolved vs which require manual action

### Step 10: Summary

Provide final summary:
- Which comments were resolved (with links to the reply)
- Which files were created or modified
- Which comment threads were auto-resolved vs needing manual resolution
- Suggest next steps (e.g., running tests, committing, pushing)

## Output Format

Always structure responses with clear sections:
1. **Analysis** (comment breakdown)
2. **Recommendations** (what to fix first)
3. **Action Plan** (after user approval)
4. **Implementation** (showing each fix)
5. **PR Updates** (inline replies posted, threads resolved)
6. **Summary** (what was accomplished, next steps)
