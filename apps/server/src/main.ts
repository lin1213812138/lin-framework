import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from '@/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { ValidationError } from 'class-validator';
import { ConfigService } from '@nestjs/config';

import { AllExceptionsFilter } from '@/core/filters';
import {
  TransformInterceptor,
  UserContextInterceptor,
} from '@/core/interceptors';
import { JwtAuthGuard } from '@/core/guards';

const validationMessages: Record<string, string> = {
  'should not exist': '不是合法字段',
  'should not be empty': '不能为空',
  'must be a string': '必须是字符串',
  'must be a number': '必须是数字',
  'must be an integer number': '必须是整数',
  'must be a boolean': '必须是布尔值',
  'must be an email': '邮箱格式不正确',
  'must be a Date instance': '必须是日期格式',
  'must be a positive number': '必须是正数',
  'must be longer than or equal to': '长度不能小于',
  'must be shorter than or equal to': '长度不能大于',
  'must match': '格式不匹配',
  'must be one of the following values': '必须是以下值之一',
  'must be a valid enum value': '无效的枚举值',
};

function translateValidationErrors(errors: ValidationError[]): string[] {
  const messages: string[] = [];

  function extract(errs: ValidationError[], parentProperty = ''): void {
    for (const err of errs) {
      const property = parentProperty
        ? `${parentProperty}.${err.property}`
        : err.property;

      if (err.constraints) {
        for (const [, message] of Object.entries(err.constraints)) {
          let translated = message;
          for (const [key, zh] of Object.entries(validationMessages)) {
            if (translated.includes(key)) {
              translated = `${property} ${zh}`;
              break;
            }
          }
          messages.push(translated);
        }
      }

      if (err.children?.length) {
        extract(err.children, property);
      }
    }
  }

  extract(errors);
  return messages;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const messages = translateValidationErrors(errors);
        return new BadRequestException(messages[0] ?? '请求参数错误');
      },
    }),
  );

  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new UserContextInterceptor(),
  );

  app.useBodyParser('json', { limit: '1mb' });

  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('LIN Framework API')
    .setDescription('LIN Framework Backend API')
    .setVersion('0.1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port')!;
  await app.listen(port);
  Logger.log(`Application is running on http://localhost:${port}`, 'Bootstrap');
}

void bootstrap();
