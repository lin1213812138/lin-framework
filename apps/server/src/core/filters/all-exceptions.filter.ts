import type { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const requestId = (request as { requestId?: string }).requestId ?? '';

    let status: number;
    let body: Record<string, unknown>;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        body = res as Record<string, unknown>;
      } else {
        body = { code: status, message: res };
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      body = { code: 10000, message: 'Internal server error' };
      this.logger.error(
        'Unhandled exception',
        exception instanceof Error ? exception.stack : '',
      );
    }

    response.status(status).json({
      code: body.code ?? status,
      message: body.message ?? 'unknown error',
      data: null,
      timestamp: Date.now(),
      requestId,
      path: request.url,
    });
  }
}
