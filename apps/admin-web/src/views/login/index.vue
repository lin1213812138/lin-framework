<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import type { FormInst } from 'naive-ui';
import { useLogin } from '@/composables';

const router = useRouter();
const route = useRoute();
const formRef = ref<FormInst | null>(null);

const { formState, submitting, formError, rules, captcha, captchaLoading, refreshCaptcha, submit } =
  useLogin();

if (route.query.username) {
  formState.username = route.query.username as string;
}

const showPassword = ref(false);

function handleSubmit() {
  submit(formRef.value);
}
</script>

<template>
  <div class="login-page">
    <!-- 左侧品牌区 -->
    <div class="brand-section">
      <div class="brand-content">
        <h1 class="brand-title">LIN Framework</h1>
        <p class="brand-subtitle">现代企业级全栈开发框架</p>
      </div>
    </div>

    <!-- 右侧登录区 -->
    <div class="form-section">
      <div class="form-container">
        <div class="form-header">
          <h2 class="form-title">登录</h2>
          <p class="form-subtitle">欢迎回来，请登录您的账号</p>
        </div>

        <n-alert v-if="formError" type="error" :bordered="false" closable @close="formError = ''">
          {{ formError }}
        </n-alert>

        <n-form ref="formRef" :model="formState" :rules="rules" label-placement="top" size="medium">
          <n-form-item path="username">
            <n-input
              v-model:value="formState.username"
              placeholder="账号"
              :input-props="{ autocomplete: 'username' }"
              @keyup.enter="handleSubmit"
            >
              <template #prefix>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
                </svg>
              </template>
            </n-input>
          </n-form-item>

          <n-form-item path="password">
            <n-input
              v-model:value="formState.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="密码"
              :input-props="{ autocomplete: 'current-password' }"
              @keyup.enter="handleSubmit"
            >
              <template #prefix>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </template>
              <template #suffix>
                <n-button text :focusable="false" @click="showPassword = !showPassword">
                  <template #icon>
                    <svg
                      v-if="showPassword"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <svg
                      v-else
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                      />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  </template>
                </n-button>
              </template>
            </n-input>
          </n-form-item>

          <n-form-item path="captcha">
            <div class="captcha-wrapper">
              <n-input
                v-model:value="formState.captcha"
                placeholder="验证码"
                maxlength="4"
                :input-props="{ autocomplete: 'off', autocapitalize: 'off' }"
                @keyup.enter="handleSubmit"
              />
              <div
                class="captcha-image"
                :class="{ 'is-loading': captchaLoading }"
                @click="refreshCaptcha"
                v-html="captcha.svg"
              />
            </div>
          </n-form-item>

          <div class="form-options">
            <n-checkbox v-model:checked="formState.remember">记住我</n-checkbox>
          </div>

          <n-button
            type="primary"
            block
            size="large"
            :loading="submitting"
            :disabled="submitting"
            @click="handleSubmit"
          >
            登录
          </n-button>
        </n-form>

        <div class="form-footer">
          <span>还没有账号？</span>
          <n-button text type="primary" @click="router.push('/register')">立即注册</n-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  min-height: 100vh;
}

/* ─── 左侧品牌区 ─── */
.brand-section {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a73e8 0%, #1557b0 100%);
}

.brand-content {
  text-align: center;
  padding: 48px;
}

.brand-title {
  margin: 0 0 12px;
  font-size: 36px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.5px;
}

.brand-subtitle {
  margin: 0;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.75);
}

/* ─── 右侧登录区 ─── */
.form-section {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 820px;
  min-width: 820px;
  background: #fff;
}

.form-container {
  width: 100%;
  max-width: 460px;
  padding: 32px 0;
}

.form-header {
  margin-bottom: 20px;
}

.form-title {
  margin: 0 0 4px;
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
}

.form-subtitle {
  margin: 0;
  font-size: 14px;
  color: #999;
}

:deep(.n-form-item-label) {
  display: none;
}

.captcha-wrapper {
  display: flex;
  gap: 12px;
  width: 100%;
  align-items: center;
}

.captcha-wrapper .n-input {
  flex: 1;
}

.captcha-image {
  width: 130px;
  height: 44px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e0e0e0;
}

.captcha-image.is-loading {
  opacity: 0.5;
  pointer-events: none;
}

.captcha-image :deep(svg) {
  width: 100%;
  height: 100%;
}

.form-options {
  margin-bottom: 16px;
}

.form-footer {
  text-align: center;
  margin-top: 16px;
  font-size: 13px;
  color: #999;
}
</style>
