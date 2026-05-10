import type {
  ApiResponse,
  AuthResponse,
  AuthTokens,
  CommentDto,
  CreatePostRequest,
  PaginatedResponse,
  PostDto,
} from '@blogapp/types';

import type { Config } from './config.js';

export class BlogApiError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly details: unknown;

  constructor(message: string, status: number, code: string | null = null, details: unknown = null) {
    super(message);
    this.name = 'BlogApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type FetchInit = Omit<RequestInit, 'body'> & { body?: unknown };

export class BlogApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private inflightAuth: Promise<void> | null = null;
  private inflightRefresh: Promise<void> | null = null;

  constructor(private readonly config: Config) {}

  async createPost(input: CreatePostRequest): Promise<PostDto> {
    const res = await this.authedFetch('/posts', { method: 'POST', body: input });
    const json = (await this.parseJson(res)) as ApiResponse<PostDto>;
    return json.data;
  }

  async listMyPosts(page: number, limit: number): Promise<PaginatedResponse<PostDto>> {
    const res = await this.authedFetch(`/posts/me?page=${page}&limit=${limit}`, { method: 'GET' });
    return (await this.parseJson(res)) as PaginatedResponse<PostDto>;
  }

  async getPostComments(postId: string, page: number, limit: number): Promise<PaginatedResponse<CommentDto>> {
    const path = `/posts/${encodeURIComponent(postId)}/comments?page=${page}&limit=${limit}`;
    const res = await this.rawFetch(path, { method: 'GET' });
    if (!res.ok) {
      throw await this.toApiError(res);
    }
    return (await this.parseJson(res)) as PaginatedResponse<CommentDto>;
  }

  private async ensureLoggedIn(): Promise<void> {
    if (this.accessToken) return;
    if (this.inflightAuth) {
      await this.inflightAuth;
      return;
    }
    this.inflightAuth = this.login().finally(() => {
      this.inflightAuth = null;
    });
    await this.inflightAuth;
  }

  private async login(): Promise<void> {
    const res = await this.rawFetch('/auth/login', {
      method: 'POST',
      body: { email: this.config.BLOG_API_EMAIL, password: this.config.BLOG_API_PASSWORD },
    });
    if (!res.ok) {
      throw await this.toApiError(res, 'login failed');
    }
    const json = (await this.parseJson(res)) as ApiResponse<AuthResponse>;
    this.accessToken = json.data.tokens.accessToken;
    this.refreshToken = json.data.tokens.refreshToken;
  }

  private async refresh(): Promise<void> {
    if (!this.refreshToken) {
      throw new BlogApiError('no refresh token available', 0, 'NO_REFRESH_TOKEN');
    }
    if (this.inflightRefresh) {
      await this.inflightRefresh;
      return;
    }
    this.inflightRefresh = this.doRefresh().finally(() => {
      this.inflightRefresh = null;
    });
    await this.inflightRefresh;
  }

  private async doRefresh(): Promise<void> {
    const res = await this.rawFetch('/auth/refresh', {
      method: 'POST',
      body: { refreshToken: this.refreshToken },
    });
    if (!res.ok) {
      throw await this.toApiError(res, 'refresh failed');
    }
    const json = (await this.parseJson(res)) as ApiResponse<AuthTokens>;
    this.accessToken = json.data.accessToken;
    this.refreshToken = json.data.refreshToken;
  }

  private async authedFetch(path: string, init: FetchInit, retry = true): Promise<Response> {
    await this.ensureLoggedIn();
    const res = await this.rawFetch(path, init, this.accessToken);
    if (res.status !== 401) {
      if (!res.ok) throw await this.toApiError(res);
      return res;
    }
    if (!retry) {
      throw await this.toApiError(res);
    }
    try {
      await this.refresh();
    } catch {
      this.accessToken = null;
      this.refreshToken = null;
      await this.ensureLoggedIn();
    }
    return this.authedFetch(path, init, false);
  }

  private async rawFetch(path: string, init: FetchInit, bearer?: string | null): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init.headers as Record<string, string> | undefined),
    };
    if (bearer) headers.Authorization = `Bearer ${bearer}`;

    try {
      return await fetch(`${this.config.BLOG_API_BASE_URL}${path}`, {
        ...init,
        headers,
        body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new BlogApiError(`network error: ${message}`, 0, 'NETWORK_ERROR');
    }
  }

  private async parseJson(res: Response): Promise<unknown> {
    try {
      return await res.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new BlogApiError(`failed to parse response JSON: ${message}`, res.status, 'PARSE_ERROR');
    }
  }

  private async toApiError(res: Response, prefix?: string): Promise<BlogApiError> {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      // body wasn't JSON; leave as null
    }
    const errorObj =
      body && typeof body === 'object' && 'error' in body
        ? (body as { error: { message?: string; code?: string } }).error
        : null;
    const message = errorObj?.message ?? `HTTP ${res.status} ${res.statusText}`;
    return new BlogApiError(prefix ? `${prefix}: ${message}` : message, res.status, errorObj?.code ?? null, body);
  }
}
