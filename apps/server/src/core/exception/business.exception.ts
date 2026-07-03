import { HttpException } from '@nestjs/common';
import type { ErrorCode } from '../constants';

export class BusinessException extends HttpException {
  constructor(error: ErrorCode) {
    super(
      {
        code: error.code,
        message: error.message,
      },
      error.code >= 20000
        ? 422
        : error.code >= 12000
          ? 403
          : error.code >= 11000
            ? 401
            : 400,
    );
  }
}

export class AuthenticationException extends HttpException {
  constructor(error: ErrorCode) {
    super({ code: error.code, message: error.message }, 401);
  }
}

export class AuthorizationException extends HttpException {
  constructor(error: ErrorCode) {
    super({ code: error.code, message: error.message }, 403);
  }
}

export class NotFoundException extends HttpException {
  constructor(error: ErrorCode) {
    super({ code: error.code, message: error.message }, 404);
  }
}

export class ValidationException extends HttpException {
  constructor(errors: string[]) {
    super({ code: 10001, message: 'validation failed', errors }, 400);
  }
}

export class ConflictException extends HttpException {
  constructor(error: ErrorCode) {
    super({ code: error.code, message: error.message }, 409);
  }
}
