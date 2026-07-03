<script setup lang="ts">
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores';

const router = useRouter();
const userStore = useUserStore();

const formState = reactive({
  username: '',
  password: '',
});

function handleLogin() {
  userStore.setToken('mock-access-token', 'mock-refresh-token');
  userStore.setUserInfo(formState.username, formState.username);
  router.push('/');
}
</script>

<template>
  <div class="flex-center min-h-screen bg-#f5f5f5">
    <n-card style="width: 400px" title="登录" :bordered="false">
      <n-form label-placement="top">
        <n-form-item label="用户名" path="username">
          <n-input v-model:value="formState.username" placeholder="请输入用户名" />
        </n-form-item>
        <n-form-item label="密码" path="password">
          <n-input v-model:value="formState.password" type="password" placeholder="请输入密码" />
        </n-form-item>
        <n-button type="primary" block @click="handleLogin">登 录</n-button>
      </n-form>
    </n-card>
  </div>
</template>
