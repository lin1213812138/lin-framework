import { Module, RequestMethod } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
            singleLine: true,
            colorize: false,
          },
        },
        autoLogging: false,
      },
      forRoutes: [{ method: RequestMethod.ALL, path: '{*splat}' }],
    }),
  ],
  exports: [LoggerModule],
})
export class AppLoggerModule {}
