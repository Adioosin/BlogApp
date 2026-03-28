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
