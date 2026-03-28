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
