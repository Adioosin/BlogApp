# BlogApp

A multi-author blogging platform built as a monorepo with React + TypeScript frontend and Express + TypeScript backend.

## Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 9
- [PostgreSQL](https://www.postgresql.org/) (for later phases)

## Getting Started

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
# Edit .env with your local values

# Start both frontend and backend in development mode
pnpm dev
```

The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:3000`.

## Project Structure

```
blogapp/
├── apps/
│   ├── backend/          # Express + TypeScript API
│   │   └── src/
│   │       └── index.ts  # API entry point
│   └── frontend/         # React + TypeScript + Vite
│       └── src/
│           ├── main.tsx   # React entry point
│           ├── app.tsx    # Root component
│           ├── pages/     # Route-level components
│           ├── components/# Reusable UI components
│           ├── hooks/     # Custom React hooks
│           └── lib/       # API client, utilities
├── packages/
│   └── types/            # Shared DTOs and API contracts
│       └── src/
│           └── index.ts
├── .env.example          # Required environment variables
├── eslint.config.js      # ESLint flat config (monorepo-wide)
├── tsconfig.base.json    # Shared TypeScript options
└── pnpm-workspace.yaml   # Workspace member declaration
```

## Available Scripts

| Command             | Description                                    |
| ------------------- | ---------------------------------------------- |
| `pnpm dev`          | Start frontend and backend in development mode |
| `pnpm build`        | Build both apps for production                 |
| `pnpm lint`         | Run ESLint across the monorepo                 |
| `pnpm format`       | Format all files with Prettier                 |
| `pnpm format:check` | Check formatting without modifying files       |

## Environment Variables

See [.env.example](.env.example) for all required variables and their descriptions.
