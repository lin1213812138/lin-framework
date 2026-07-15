<script setup lang="ts">
import { ref } from 'vue';

/* ---------- 用户信息 ---------- */
const userInfo = {
  name: 'LINFLY',
  role: '超级管理员',
  email: 'admin@lin-framework.com',
  avatar: '',
  lastLogin: '2026-07-09 10:30',
  stats: [
    { label: '待处理', value: 3 },
    { label: '进行中', value: 2 },
    { label: '已完成', value: 28 },
  ],
};

/* ---------- 待办事项 ---------- */
const todos = ref([
  { label: '审核新用户注册申请', done: false, tag: '3 条待审' },
  { label: '处理退款申请', done: false, tag: '1 条待处理' },
  { label: '今日值班日志填写', done: true, tag: '已完成' },
  { label: '更新系统配置参数', done: false, tag: '待处理' },
  { label: '备份数据库', done: true, tag: '已完成' },
]);

/* ---------- 快捷入口 ---------- */
const quickActions = [
  { label: '用户管理', path: '/system/user', icon: '👥', color: '#2080f0' },
  { label: '角色管理', path: '/system/role', icon: '🔐', color: '#18a058' },
  { label: '文件管理', path: '/files', icon: '📁', color: '#f0a020' },
  { label: '菜单管理', path: '/system/menu', icon: '📋', color: '#d03050' },
  { label: '权限管理', path: '/permissions', icon: '🔑', color: '#7c3aed' },
];

import { useRouter } from 'vue-router';
const router = useRouter();

function goTo(path: string) {
  router.push(path);
}

/* ---------- 最近动态 ---------- */
const activities = [
  { user: '系统', action: '数据库自动备份完成', time: '10:30', type: 'success' as const },
  { user: '张三', action: '注册了新账号并完成邮箱验证', time: '10:15', type: 'info' as const },
  { user: '李四', action: '上传了项目文档到文件中心', time: '09:50', type: 'warning' as const },
  { user: '系统', action: '订单 #20240708 已完成支付', time: '09:30', type: 'default' as const },
  { user: '王五', action: '修改了用户管理模块的权限', time: '08:45', type: 'info' as const },
];
</script>

<template>
  <div>
    <h2 class="text-24px font-bold mb-20px">工作台</h2>

    <n-grid :cols="3" :x-gap="16">
      <!-- 左侧：用户信息卡片 -->
      <n-grid-item :span="1">
        <n-card :bordered="true" size="small">
          <div class="flex flex-col items-center py-8px">
            <!-- 头像 -->
            <n-avatar :size="80" :color="'#2080f0'" class="text-28px font-bold mb-12px">
              {{ userInfo.name.charAt(0) }}
            </n-avatar>
            <div class="text-18px font-bold">{{ userInfo.name }}</div>
            <n-tag type="info" size="small" class="mt-4px">{{ userInfo.role }}</n-tag>
            <div class="text-12px text-#999 mt-8px">{{ userInfo.email }}</div>
            <div class="text-12px text-#999">上次登录：{{ userInfo.lastLogin }}</div>

            <!-- 统计 -->
            <div class="flex justify-around w-full mt-16px pt-16px border-t-1px border-#eee">
              <div v-for="s in userInfo.stats" :key="s.label" class="flex flex-col items-center">
                <span class="text-20px font-bold text-#2080f0">{{ s.value }}</span>
                <span class="text-12px text-#999 mt-2px">{{ s.label }}</span>
              </div>
            </div>
          </div>
        </n-card>
      </n-grid-item>

      <!-- 中间：待办事项 -->
      <n-grid-item :span="1">
        <n-card title="待办事项" :bordered="true" size="small">
          <n-checkbox-group>
            <div
              v-for="todo in todos"
              :key="todo.label"
              class="flex items-center justify-between py-6px"
            >
              <n-checkbox :checked="todo.done" :disabled="todo.done">
                <span :class="todo.done ? 'line-through text-#ccc' : ''">
                  {{ todo.label }}
                </span>
              </n-checkbox>
              <n-tag :type="todo.done ? 'success' : 'warning'" size="tiny">
                {{ todo.tag }}
              </n-tag>
            </div>
          </n-checkbox-group>
        </n-card>

        <!-- 快捷入口 -->
        <n-card title="快捷入口" :bordered="true" size="small" class="mt-16px">
          <n-grid :cols="3" :x-gap="8" :y-gap="12">
            <n-grid-item v-for="action in quickActions" :key="action.label">
              <n-button
                quaternary
                class="w-full !h-64px flex-col items-center gap-4px !p-4px"
                @click="goTo(action.path)"
              >
                <span class="text-24px">{{ action.icon }}</span>
                <span class="text-12px">{{ action.label }}</span>
              </n-button>
            </n-grid-item>
          </n-grid>
        </n-card>
      </n-grid-item>

      <!-- 右侧：最近动态 -->
      <n-grid-item :span="1">
        <n-card title="最近动态" :bordered="true" size="small">
          <n-timeline>
            <n-timeline-item
              v-for="act in activities"
              :key="act.time"
              :type="act.type"
              :time="act.time"
            >
              <span class="font-medium">{{ act.user }}</span>
              {{ act.action }}
            </n-timeline-item>
          </n-timeline>
        </n-card>
      </n-grid-item>
    </n-grid>
  </div>
</template>
