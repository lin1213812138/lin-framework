import type {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Record<string, unknown>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<Record<string, unknown>> {
    const request = context.switchToHttp().getRequest<Request>();
    const requestId = (request as { requestId?: string }).requestId ?? '';

    return next.handle().pipe(
      map((data) => ({
        code: 0,
        message: '操作成功',
        data: data ?? null,
        timestamp: Date.now(),
        requestId,
      })),
    );
  }
}
