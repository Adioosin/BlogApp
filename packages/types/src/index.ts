export type ApiResponse<T> = {
  data: T;
};

export type ApiError = {
  error: {
    message: string;
    code?: string;
  };
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

// Auth types

export type UserDto = {
  id: string;
  email: string;
  name: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthResponse = {
  user: UserDto;
  tokens: AuthTokens;
};

export type RegisterRequest = {
  email: string;
  name: string;
  password: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RefreshRequest = {
  refreshToken: string;
};

export type TokenPayload = {
  userId: string;
  email: string;
};

// Post types

export type PostDto = {
  id: string;
  title: string;
  content: string;
  isPublished: boolean;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: UserDto;
  tags?: string[];
  coverImage?: string;
};

export type CreatePostRequest = {
  title: string;
  content: string;
};

export type UpdatePostRequest = {
  title?: string;
  content?: string;
};

// Comment types

export type CommentDto = {
  id: string;
  body: string;
  postId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: UserDto;
};

export type CreateCommentRequest = {
  body: string;
};
