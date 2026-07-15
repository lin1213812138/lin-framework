import type { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { userContext } from '@/shared/database/async-context';

/**
 * 将当前请求的 user 注入 AsyncLocalStorage，供 applyBaseHooks 等基础设施使用。
 *
 * JwtAuthGuard 验证成功后 req.user 已存在，拦截器在 Guard 之后执行。
 */
@Injectable()
export class UserContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ user?: { id: string; username: string } }>();
    return userContext.run(request.user, () => next.handle());
  }
}