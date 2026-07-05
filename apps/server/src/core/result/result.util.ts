import type { ErrorCode } from '@/core/constants';
import type { ApiResponse } from '@/core/interfaces';

export function success<T>(data: T, message = 'success'): ApiResponse<T> {
  return {
    code: 0,
    message,
    data,
    timestamp: Date.now(),
    requestId: '',
  };
}

export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): ApiResponse<{
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  return {
    code: 0,
    message: 'success',
    data: {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    timestamp: Date.now(),
    requestId: '',
  };
}

export function fail(error: ErrorCode, requestId = ''): ApiResponse<null> {
  return {
    code: error.code,
    message: error.message,
    data: null,
    timestamp: Date.now(),
    requestId,
  };
}
