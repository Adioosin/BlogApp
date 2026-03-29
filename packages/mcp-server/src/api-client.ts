const DEFAULT_BASE_URL = 'http://localhost:3000/api/v1';

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

type ApiOptions = {
  baseUrl: string;
};

class ApiClient {
  private baseUrl: string;
  private tokens: AuthTokens | null = null;

  constructor(options?: Partial<ApiOptions>) {
    this.baseUrl = options?.baseUrl ?? DEFAULT_BASE_URL;
  }

  get isAuthenticated(): boolean {
    return this.tokens !== null;
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this.tokens = { accessToken, refreshToken };
  }

  async login(email: string, password: string): Promise<{ user: { id: string; email: string; name: string } }> {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    });

    const { data } = res as { data: { user: { id: string; email: string; name: string }; tokens: AuthTokens } };
    this.tokens = data.tokens;
    return { user: data.user };
  }

  async logout(): Promise<void> {
    if (!this.tokens) return;
    try {
      await this.request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: this.tokens.refreshToken }),
      });
    } finally {
      this.tokens = null;
    }
  }

  async getMe(): Promise<{ id: string; email: string; name: string }> {
    const res = await this.request('/auth/me');
    return (res as { data: { id: string; email: string; name: string } }).data;
  }

  async createPost(title: string, content: string): Promise<Record<string, unknown>> {
    const res = await this.request('/posts', {
      method: 'POST',
      body: JSON.stringify({ title, content }),
    });
    return (res as { data: Record<string, unknown> }).data;
  }

  async updatePost(id: string, data: { title?: string; content?: string }): Promise<Record<string, unknown>> {
    const res = await this.request(`/posts/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return (res as { data: Record<string, unknown> }).data;
  }

  async publishPost(id: string): Promise<Record<string, unknown>> {
    const res = await this.request(`/posts/${encodeURIComponent(id)}/publish`, {
      method: 'PATCH',
    });
    return (res as { data: Record<string, unknown> }).data;
  }

  async deletePost(id: string): Promise<void> {
    await this.request(`/posts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  async getPost(id: string): Promise<Record<string, unknown>> {
    const res = await this.request(`/posts/${encodeURIComponent(id)}`);
    return (res as { data: Record<string, unknown> }).data;
  }

  async listPublishedPosts(page = 1, limit = 10): Promise<Record<string, unknown>> {
    return await this.request(`/posts?page=${page}&limit=${limit}`) as Record<string, unknown>;
  }

  async listMyPosts(page = 1, limit = 10): Promise<Record<string, unknown>> {
    return await this.request(`/posts/me?page=${page}&limit=${limit}`) as Record<string, unknown>;
  }

  async addComment(postId: string, body: string): Promise<Record<string, unknown>> {
    const res = await this.request(`/posts/${encodeURIComponent(postId)}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    });
    return (res as { data: Record<string, unknown> }).data;
  }

  async listComments(postId: string, page = 1, limit = 20): Promise<Record<string, unknown>> {
    return await this.request(
      `/posts/${encodeURIComponent(postId)}/comments?page=${page}&limit=${limit}`,
    ) as Record<string, unknown>;
  }

  private async request(
    path: string,
    options: { method?: string; body?: string; skipAuth?: boolean } = {},
  ): Promise<unknown> {
    const { method = 'GET', body, skipAuth = false } = options;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (!skipAuth) {
      if (!this.tokens) {
        throw new Error('Not authenticated. Please login first using the login tool.');
      }
      headers['Authorization'] = `Bearer ${this.tokens.accessToken}`;
    }

    let res = await fetch(`${this.baseUrl}${path}`, { method, headers, body });

    // Auto-refresh on 401
    if (res.status === 401 && !skipAuth && this.tokens) {
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.tokens.accessToken}`;
        res = await fetch(`${this.baseUrl}${path}`, { method, headers, body });
      }
    }

    if (res.status === 204) {
      return null;
    }

    const json = await res.json();

    if (!res.ok) {
      const msg = (json as { error?: { message?: string } }).error?.message ?? `HTTP ${res.status}`;
      throw new Error(msg);
    }

    return json;
  }

  private async tryRefresh(): Promise<boolean> {
    if (!this.tokens) return false;

    try {
      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.tokens.refreshToken }),
      });

      if (!res.ok) {
        this.tokens = null;
        return false;
      }

      const { data } = (await res.json()) as { data: AuthTokens };
      this.tokens = data;
      return true;
    } catch {
      this.tokens = null;
      return false;
    }
  }
}

export { ApiClient };
