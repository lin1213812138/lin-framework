import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import configuration from '@/config/configuration';
import { envValidationSchema } from '@/config/env.validation';

import { MongoDBModule } from '@/infrastructure/database/mongodb/mongodb.module';
import { RedisModule } from '@/infrastructure/database/redis/redis.module';
import { AppLoggerModule } from '@/core/logger/logger.module';
import { RequestLoggerMiddleware } from '@/core/middleware/request-logger.middleware';
import { HealthModule } from '@/modules/health/health.module';
import { AuthModule } from '@/modules/auth';
import { PermissionModule } from '@/modules/permission';
import { RoleModule } from '@/modules/role';
import { MenuModule } from '@/modules/menu';
import { UserModule } from '@/modules/user';
import { StorageModule as InfraStorageModule } from '@/infrastructure/storage';
import { CacheModule } from '@/infrastructure/cache';
import { FileModule } from '@/modules/file';

import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: true },
    }),

    AppLoggerModule,
    MongoDBModule,
    RedisModule,
    HealthModule,
    AuthModule,
    PermissionModule,
    RoleModule,
    MenuModule,
    UserModule,
    InfraStorageModule,
    CacheModule,
    FileModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
