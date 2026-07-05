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
        body = { ...(res as Record<string, unknown>) };
        if (Array.isArray(body.message)) {
          body.message = (body.message as string[])[0] ?? '请求参数错误';
        }
      } else {
        body = { code: status, message: res };
      }

      const message = typeof body.message === 'string' ? body.message : '';
      const logMessage = `${request.method} ${request.url} ${status} - ${message}`;
      this.logger.error(logMessage, exception.stack ?? '');
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      body = { code: 10000, message: '服务器内部错误' };
      this.logger.error(
        '未捕获的异常',
        exception instanceof Error ? exception.stack : '',
      );
    }

    response.status(status).json({
      code: body.code ?? status,
      message: body.message ?? '未知错误',
      data: null,
      timestamp: Date.now(),
      requestId,
      path: request.url,
    });
  }
}
