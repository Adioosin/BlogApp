---
description: "Raise a pull request from the current branch targeting main, then immediately invoke the PR Reviewer agent to review it."
agent: 'pr-reviewer'
argument-hint: "PR title and optional description (e.g., 'Add user authentication with JWT refresh tokens')"
---

Create a pull request from the current Git branch targeting the `main` branch, then review it.

## Step 1: Determine branch and repo

Run `git rev-parse --abbrev-ref HEAD` to get the current branch name.
Run `git remote get-url origin` to extract the owner and repo name.

If the current branch is `main`, stop and tell the user to switch to a feature branch first.

## Step 2: Create the pull request

Use `#tool:mcp_io_github_git_create_pull_request` to create the PR with:
- **title**: Use the user's input as the title. If no title is provided, generate one from the branch name (convert `feature/add-auth` → `Add auth`).
- **head**: The current branch name.
- **base**: `main`
- **body**: If the user provided a description, use it. Otherwise, generate a brief summary from the recent commits on this branch.

## Step 3: Hand off to PR Reviewer

After the PR is created, immediately review it. You are now operating as the PR Reviewer agent. Follow the full review workflow:

1. Fetch the PR metadata and diff using the PR number from Step 2
2. Load the project's instruction files based on changed files
3. Analyze all changes against the project checklist
4. Post a structured review with inline comments on GitHub

## Constraints

- DO NOT create a PR if the current branch is `main`
- DO NOT force-push or modify the branch
- Target `main` unless the user explicitly specifies a different base branch
- After creating the PR, always proceed to review it — never skip the review step
