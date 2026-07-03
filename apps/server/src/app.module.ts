import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import configuration from './config/configuration';
import { envValidationSchema } from './config/env.validation';

import { MongoDBModule } from './infrastructure/database/mongodb/mongodb.module';
import { RedisModule } from './infrastructure/database/redis/redis.module';
import { AppLoggerModule } from './core/logger/logger.module';
import { HealthModule } from './modules/health/health.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
