/**
 * 系统内置权限定义
 *
 * 每个权限标识格式：{module}:{action}
 * 模块启动时自动将这些权限注册到数据库。
 */
export const BUILTIN_PERMISSIONS = [
  // ─── User ───
  {
    name: '创建用户',
    code: 'user:create',
    module: 'user',
    description: '新增用户账号',
  },
  {
    name: '查询用户',
    code: 'user:read',
    module: 'user',
    description: '查看用户列表和详情',
  },
  {
    name: '更新用户',
    code: 'user:update',
    module: 'user',
    description: '编辑用户信息',
  },
  {
    name: '删除用户',
    code: 'user:delete',
    module: 'user',
    description: '删除用户账号',
  },
  // ─── Role ───
  {
    name: '创建角色',
    code: 'role:create',
    module: 'role',
    description: '新增角色',
  },
  {
    name: '查询角色',
    code: 'role:read',
    module: 'role',
    description: '查看角色列表和详情',
  },
  {
    name: '更新角色',
    code: 'role:update',
    module: 'role',
    description: '编辑角色信息',
  },
  {
    name: '删除角色',
    code: 'role:delete',
    module: 'role',
    description: '删除角色',
  },
  // ─── Permission ───
  {
    name: '查询权限',
    code: 'permission:read',
    module: 'permission',
    description: '查看权限列表',
  },
  {
    name: '同步权限',
    code: 'permission:sync',
    module: 'permission',
    description: '从内置常量同步权限到数据库',
  },
  // ─── Menu ───
  {
    name: '创建菜单',
    code: 'menu:create',
    module: 'menu',
    description: '新增菜单项',
  },
  {
    name: '查询菜单',
    code: 'menu:read',
    module: 'menu',
    description: '查看菜单树',
  },
  {
    name: '更新菜单',
    code: 'menu:update',
    module: 'menu',
    description: '编辑菜单项',
  },
  {
    name: '删除菜单',
    code: 'menu:delete',
    module: 'menu',
    description: '删除菜单项',
  },
] as const;
