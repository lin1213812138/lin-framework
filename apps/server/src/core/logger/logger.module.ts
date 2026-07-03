import { Module, RequestMethod } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
        },
      },
      forRoutes: [{ method: RequestMethod.ALL, path: '{*splat}' }],
    }),
  ],
  exports: [LoggerModule],
})
export class AppLoggerModule {}
