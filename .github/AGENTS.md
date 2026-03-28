# Available Agents

This repository includes specialized agents for specific GitHub and PR workflows. These agents can be invoked manually from the agent selector or automatically as subagents based on the task requirements.

## Agents

<agent>
<name>pr-reviewer</name>
<description>Use when asked to review a PR, review pull request, code review, check PR, or audit a pull request. Fetches PR details from GitHub, analyzes code changes against project conventions, and posts a structured review with inline comments.</description>
<argumentHint>PR number or URL (e.g., '#12' or 'https://github.com/owner/repo/pull/12')</argumentHint>
</agent>

<agent>
<name>pr-comment-resolver</name>
<description>Use when asked to resolve PR comments, fix review feedback, address PR comments, implement review suggestions, or handle PR comment resolution. Analyzes existing PR comments, prioritizes most important ones, and implements fixes with user approval.</description>
<argumentHint>PR number or URL (e.g., '#12' or 'https://github.com/owner/repo/pull/12')</argumentHint>
</agent>

## Workflow

The typical PR workflow using these agents:

1. **Review Phase**: Use `pr-reviewer` to conduct initial code review and post feedback
2. **Resolution Phase**: Use `pr-comment-resolver` to address the review comments and implement fixes

Both agents work with GitHub's PR API and understand the project's conventions defined in copilot-instructions.md and area-specific instruction files.