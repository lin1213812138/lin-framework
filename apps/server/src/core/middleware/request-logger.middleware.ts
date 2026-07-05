import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

/**
 * 请求日志中间件
 *
 * 记录每个 HTTP 请求的进入、请求体和完成耗时。
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  /**
   * 拦截请求并记录日志
   *
   * @param req  - Express 请求对象
   * @param res  - Express 响应对象
   * @param next - 下一个中间件
   */
  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    const { method, originalUrl } = req;

    this.logger.log(`enter ${method} ${originalUrl}`);

    if (['POST', 'PUT', 'PATCH'].includes(method) && req.body) {
      this.logger.log(`request body ${JSON.stringify(req.body)}`);
    }

    res.on('finish', () => {
      const duration = Date.now() - start;
      this.logger.log(
        `request done ${method} ${originalUrl} total time(ms) ${duration}`,
      );
    });

    next();
  }
}
