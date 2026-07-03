export const ErrorCodes = {
  SUCCESS: { code: 0, message: 'success' },
  UNKNOWN_ERROR: { code: 10000, message: 'unknown error' },
  VALIDATION_FAILED: { code: 10001, message: 'validation failed' },
  NOT_FOUND: { code: 10002, message: 'resource not found' },
  UNAUTHORIZED: { code: 11000, message: 'unauthorized' },
  TOKEN_EXPIRED: { code: 11001, message: 'token expired' },
  TOKEN_INVALID: { code: 11002, message: 'token invalid' },
  FORBIDDEN: { code: 12000, message: 'permission denied' },
  USER_NOT_FOUND: { code: 20001, message: 'user not found' },
  USER_ALREADY_EXISTS: { code: 20002, message: 'user already exists' },
  PASSWORD_INCORRECT: { code: 20003, message: 'password incorrect' },
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
