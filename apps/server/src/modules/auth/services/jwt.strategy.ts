/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';

import { RedisService } from '@/infrastructure/database/redis/redis.service';
import { BLACKLIST_PREFIX } from '@/modules/auth/constants/auth.constant';
import type {
  JwtPayload,
  AuthUser,
} from '@/modules/auth/interfaces/auth.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: JwtPayload): Promise<AuthUser> {
    const extractor = ExtractJwt.fromAuthHeaderAsBearerToken();
    const token = extractor(request);

    if (token) {
      const blacklisted = await this.redisService
        .getClient()
        .get(`${BLACKLIST_PREFIX}${token}`);
      if (blacklisted) {
        return null as unknown as AuthUser;
      }
    }

    return {
      id: payload.sub,
      username: payload.username,
      role: payload.role,
      status: 1,
    };
  }
}
