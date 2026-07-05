import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/index.vue'),
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '仪表盘' },
      },
      {
        path: 'users',
        name: 'User',
        component: () => import('@/views/user/index.vue'),
        meta: { title: '用户管理', permission: 'user:read' },
      },
      {
        path: 'roles',
        name: 'Role',
        component: () => import('@/views/role/index.vue'),
        meta: { title: '角色管理', permission: 'role:read' },
      },
      {
        path: 'menus',
        name: 'Menu',
        component: () => import('@/views/menu/index.vue'),
        meta: { title: '菜单管理', permission: 'menu:read' },
      },
      {
        path: 'permissions',
        name: 'Permission',
        component: () => import('@/views/permission/index.vue'),
        meta: { title: '权限管理', permission: 'permission:read' },
      },
      {
        path: 'files',
        name: 'File',
        component: () => import('@/views/file/index.vue'),
        meta: { title: '文件管理', permission: 'file:read' },
      },
    ],
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录' },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/login/register.vue'),
    meta: { title: '注册' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '404' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title as string} - LIN Framework`;
  const token = localStorage.getItem('accessToken');
  if (to.name !== 'Login' && to.name !== 'Register' && !token) {
    next({ name: 'Login' });
  } else {
    next();
  }
});

export default router;
