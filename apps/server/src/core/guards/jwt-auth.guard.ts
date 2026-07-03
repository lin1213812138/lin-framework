import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.get<boolean>(
      'isPublic',
      context.getHandler(),
    );
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedException('unauthorized');
    }

    try {
      const payload = verifyToken(token);
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('token invalid');
    }
  }
}

function verifyToken(token: string): Record<string, unknown> {
  const payload = JSON.parse(
    Buffer.from(token.split('.')[1] || '', 'base64').toString(),
  ) as Record<string, unknown>;
  return payload;
}
