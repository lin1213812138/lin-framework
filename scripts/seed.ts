/**
 * 数据库种子脚本
 *
 * 初始化系统所需的基础数据：超级管理员角色、权限定义、菜单树。
 *
 * @usage pnpm seed
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../apps/server/src/app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    console.log('🌱 开始播种种子数据...');

    // TODO: 注入 Repository 并插入初始数据
    // const roleRepo = app.get(RoleRepository);
    // const permissionRepo = app.get(PermissionRepository);
    // const menuRepo = app.get(MenuRepository);

    // 1. 创建基础权限
    // 2. 创建角色（super_admin, admin, user）
    // 3. 创建初始菜单树
    // 4. 创建默认管理员用户

    console.log('✅ 种子数据播种完成');
  } catch (error) {
    console.error('❌ 种子数据播种失败:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
