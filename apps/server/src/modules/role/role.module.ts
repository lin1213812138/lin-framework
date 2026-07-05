import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Role, RoleSchema } from '@/modules/role/schemas/role.schema';
import { RoleController } from '@/modules/role/controllers/role.controller';
import { RoleService } from '@/modules/role/services/role.service';
import { RoleRepository } from '@/modules/role/repositories/role.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Role.name, schema: RoleSchema }]),
  ],
  controllers: [RoleController],
  providers: [RoleService, RoleRepository],
  exports: [RoleService, RoleRepository],
})
export class RoleModule {}
