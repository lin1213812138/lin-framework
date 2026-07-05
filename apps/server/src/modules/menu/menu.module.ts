import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Menu, MenuSchema } from '@/modules/menu/schemas/menu.schema';
import { MenuController } from '@/modules/menu/controllers/menu.controller';
import { MenuService } from '@/modules/menu/services/menu.service';
import { MenuRepository } from '@/modules/menu/repositories/menu.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Menu.name, schema: MenuSchema }]),
  ],
  controllers: [MenuController],
  providers: [MenuService, MenuRepository],
  exports: [MenuService, MenuRepository],
})
export class MenuModule {}
