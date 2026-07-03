export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
  requestId: string;
}

export interface ApiError {
  code: number;
  message: string;
  timestamp: number;
  requestId: string;
  path: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
