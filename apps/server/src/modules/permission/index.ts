export { PermissionModule } from '@/modules/permission/permission.module';
export { PermissionService } from '@/modules/permission/services/permission.service';
export { PermissionRepository } from '@/modules/permission/repositories/permission.repository';
export { Permission } from '@/modules/permission/schemas/permission.schema';
export type { PermissionDocument } from '@/modules/permission/schemas/permission.schema';
export type {
  PermissionTreeNode,
  IPermissionService,
} from '@/modules/permission/interfaces/permission.interface';
export { BUILT_IN_PERMISSIONS } from '@/modules/permission/permission.constant';
export type { BuiltInPermission } from '@/modules/permission/permission.constant';
