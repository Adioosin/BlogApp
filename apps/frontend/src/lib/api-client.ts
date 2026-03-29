import axios from 'axios';

import type {
  ApiResponse,
  AuthResponse,
  AuthTokens,
  CommentDto,
  CreateCommentRequest,
  CreatePostRequest,
  LoginRequest,
  PaginatedResponse,
  PostDto,
  RegisterRequest,
  UpdatePostRequest,
  UserDto,
} from '@blogapp/types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

let accessToken: string | null = null;
let refreshToken: string | null = null;

export const setTokens = (tokens: AuthTokens | null) => {
  if (tokens) {
    accessToken = tokens.accessToken;
    refreshToken = tokens.refreshToken;
  } else {
    accessToken = null;
    refreshToken = null;
  }
};

export const getAccessToken = () => accessToken;
export const getRefreshToken = () => refreshToken;

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise: Promise<AuthTokens> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      refreshToken &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = axios
          .post<ApiResponse<AuthTokens>>(`${API_BASE}/auth/refresh`, {
            refreshToken,
          })
          .then((res) => {
            const tokens = res.data.data;
            setTokens(tokens);
            return tokens;
          })
          .catch((refreshError) => {
            setTokens(null);
            window.dispatchEvent(new CustomEvent('auth:logout'));
            return Promise.reject(refreshError);
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const tokens = await refreshPromise;
      originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
      return api(originalRequest);
    }

    return Promise.reject(error);
  },
);

// Auth API
export const authApi = {
  register: (data: RegisterRequest) =>
    api.post<ApiResponse<AuthResponse>>('/auth/register', data),

  login: (data: LoginRequest) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', data),

  logout: () => api.post('/auth/logout', { refreshToken }),

  refresh: () =>
    api.post<ApiResponse<AuthTokens>>('/auth/refresh', { refreshToken }),

  me: () => api.get<ApiResponse<UserDto>>('/auth/me'),
};

// Posts API
export const postsApi = {
  list: (params?: { page?: number; limit?: number; sortBy?: string; order?: string }) =>
    api.get<PaginatedResponse<PostDto>>('/posts', { params }),

  myPosts: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<PostDto>>('/posts/me', { params }),

  get: (id: string) =>
    api.get<ApiResponse<PostDto>>(`/posts/${encodeURIComponent(id)}`),

  create: (data: CreatePostRequest) =>
    api.post<ApiResponse<PostDto>>('/posts', data),

  update: (id: string, data: UpdatePostRequest) =>
    api.patch<ApiResponse<PostDto>>(`/posts/${encodeURIComponent(id)}`, data),

  publish: (id: string) =>
    api.patch<ApiResponse<PostDto>>(`/posts/${encodeURIComponent(id)}/publish`),

  delete: (id: string) =>
    api.delete(`/posts/${encodeURIComponent(id)}`),
};

// Comments API
export const commentsApi = {
  list: (postId: string, params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<CommentDto>>(`/posts/${encodeURIComponent(postId)}/comments`, { params }),

  create: (postId: string, data: CreateCommentRequest) =>
    api.post<ApiResponse<CommentDto>>(`/posts/${encodeURIComponent(postId)}/comments`, data),

  delete: (id: string) =>
    api.delete(`/comments/${encodeURIComponent(id)}`),
};

export { api };
