# ---------- base ----------
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

# ---------- deps ----------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
COPY packages/types/package.json packages/types/package.json
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ---------- dev ----------
FROM deps AS dev
COPY tsconfig.base.json ./
COPY packages/types/ packages/types/
COPY apps/frontend/ apps/frontend/
WORKDIR /app/apps/frontend
EXPOSE 5173
CMD ["pnpm", "dev", "--host"]

# ---------- build ----------
FROM deps AS build
ARG VITE_API_URL=http://localhost:3000/api/v1
ENV VITE_API_URL=$VITE_API_URL
COPY tsconfig.base.json ./
COPY packages/types/ packages/types/
COPY apps/frontend/ apps/frontend/
WORKDIR /app/apps/frontend
RUN pnpm run build

# ---------- prod ----------
FROM nginx:stable-alpine AS prod
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
