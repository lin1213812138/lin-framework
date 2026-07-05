import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

import { StorageModule } from '@/infrastructure/storage';
import {
  FileEntity,
  FileEntitySchema,
} from '@/modules/file/schemas/file.schema';
import { FileController } from '@/modules/file/controllers/file.controller';
import { FileService } from '@/modules/file/services/file.service';
import { FileRepository } from '@/modules/file/repositories/file.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FileEntity.name, schema: FileEntitySchema },
    ]),
    StorageModule,
    ConfigModule,
  ],
  controllers: [FileController],
  providers: [FileService, FileRepository],
  exports: [FileService, FileRepository],
})
export class FileModule {}
