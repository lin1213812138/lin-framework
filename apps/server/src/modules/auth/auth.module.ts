import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

import { RedisModule } from '@/infrastructure/database/redis/redis.module';

import { User, UserSchema } from '@/modules/auth/schemas/user.schema';
import { UserRepository } from '@/modules/auth/repositories/user.repository';
import { JwtStrategy } from '@/modules/auth/services/jwt.strategy';
import { AuthService } from '@/modules/auth/services/auth.service';
import { CaptchaService } from '@/modules/auth/services/captcha.service';
import { AuthController } from '@/modules/auth/controllers/auth.controller';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: 900,
        },
      }),
    }),
    RedisModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, UserRepository, JwtStrategy, CaptchaService],
  exports: [JwtStrategy, PassportModule, UserRepository],
})
export class AuthModule {}
