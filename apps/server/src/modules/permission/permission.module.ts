import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Permission,
  PermissionSchema,
} from '@/modules/permission/schemas/permission.schema';
import { PermissionController } from '@/modules/permission/controllers/permission.controller';
import { PermissionService } from '@/modules/permission/services/permission.service';
import { PermissionRepository } from '@/modules/permission/repositories/permission.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Permission.name, schema: PermissionSchema },
    ]),
  ],
  controllers: [PermissionController],
  providers: [PermissionService, PermissionRepository],
  exports: [PermissionService, PermissionRepository],
})
export class PermissionModule {}
