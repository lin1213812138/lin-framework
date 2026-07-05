import { reactive, ref, onMounted } from 'vue';
import type { FormInst, FormRules } from 'naive-ui';
import { useMessage, useLoadingBar } from 'naive-ui';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores';
import { fetchCaptcha, login as loginApi, register as registerApi } from '@/api/auth';

// ─── Types ────────────────────────────────────────────────────

export interface LoginFormState {
  username: string;
  password: string;
  captcha: string;
  captchaId: string;
  remember: boolean;
}

export interface RegisterFormState {
  username: string;
  password: string;
  confirmPassword: string;
  nickname: string;
}

export interface CaptchaState {
  id: string;
  svg: string;
}

// ─── Captcha ──────────────────────────────────────────────────

export function useCaptcha() {
  const captcha = reactive<CaptchaState>({ id: '', svg: '' });
  const loading = ref(false);

  async function refresh() {
    loading.value = true;
    try {
      const res = await fetchCaptcha();
      captcha.id = res.data.data.id;
      captcha.svg = res.data.data.svg;
    } catch {
      // captcha 加载失败非致命，静默处理
    } finally {
      loading.value = false;
    }
  }

  onMounted(refresh);

  return { captcha, loading, refresh };
}

// ─── Login ────────────────────────────────────────────────────

export function useLogin() {
  const router = useRouter();
  const message = useMessage();
  const loadingBar = useLoadingBar();
  const userStore = useUserStore();
  const { captcha, loading: captchaLoading, refresh: refreshCaptcha } = useCaptcha();

  /** 从 localStorage 恢复记住的用户名 */
  const rememberedUser = localStorage.getItem('rememberedUsername') || 'admin';

  const formState = reactive<LoginFormState>({
    username: rememberedUser,
    password: 'admin@123',
    captcha: '',
    captchaId: '',
    remember: !!rememberedUser,
  });

  const submitting = ref(false);
  const formError = ref('');

  /** Naive UI 表单校验规则 */
  const rules: FormRules = {
    username: [
      { required: true, message: '请输入账号', trigger: 'blur' },
      { min: 2, max: 32, message: '账号长度 2-32 个字符', trigger: 'blur' },
    ],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
    captcha: [
      { required: true, message: '请输入验证码', trigger: 'blur' },
      { max: 4, message: '验证码最长 4 位', trigger: 'blur' },
    ],
  };

  async function submit(formEl: FormInst | null) {
    if (!formEl) return;
    formError.value = '';

    try {
      await formEl.validate();
    } catch {
      return;
    }

    submitting.value = true;
    loadingBar.start();

    try {
      const res = await loginApi({
        username: formState.username,
        password: formState.password,
        captchaId: captcha.id,
        captcha: formState.captcha,
      });

      const { accessToken, refreshToken } = res.data.data;
      userStore.setToken(accessToken, refreshToken);

      // 登录后获取用户信息（含 avatar）
      await userStore.fetchProfile();

      // 记住我逻辑
      if (formState.remember) {
        localStorage.setItem('rememberedUsername', formState.username);
      } else {
        localStorage.removeItem('rememberedUsername');
      }

      loadingBar.finish();
      message.success('登录成功');
      await router.push('/');
    } catch (err: unknown) {
      loadingBar.error();
      const axiosErr = err as { response?: { data?: { message?: string | string[] } } };
      const msgData = axiosErr?.response?.data?.message;
      const msg = Array.isArray(msgData) ? msgData[0] : msgData || '登录失败';
      formError.value = msg || '登录失败';
      await refreshCaptcha();
    } finally {
      submitting.value = false;
    }
  }

  return {
    formState,
    submitting,
    formError,
    rules,
    captcha,
    captchaLoading,
    refreshCaptcha,
    submit,
  };
}

// ─── Register ─────────────────────────────────────────────────

export function useRegister() {
  const router = useRouter();
  const message = useMessage();
  const loadingBar = useLoadingBar();

  const formState = reactive<RegisterFormState>({
    username: '',
    password: '',
    confirmPassword: '',
    nickname: '',
  });

  const submitting = ref(false);
  const formError = ref('');

  /** 密码强度级别 */
  const passwordStrength = ref(0); // 0-3

  function evaluatePasswordStrength(pw: string): number {
    let score = 0;
    if (pw.length >= 6) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;
    return score;
  }

  const rules: FormRules = {
    username: [
      { required: true, message: '请输入账号', trigger: 'blur' },
      { min: 2, max: 32, message: '账号长度 2-32 个字符', trigger: 'blur' },
      { pattern: /^[a-zA-Z0-9_]+$/, message: '账号只能包含字母、数字和下划线', trigger: 'blur' },
    ],
    password: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 6, max: 32, message: '密码长度 6-32 个字符', trigger: 'blur' },
    ],
    confirmPassword: [
      { required: true, message: '请确认密码', trigger: 'blur' },
      {
        validator: (_rule: unknown, value: string) => {
          if (value !== formState.password) {
            return new Error('两次密码输入不一致');
          }
          return true;
        },
        trigger: 'blur',
      },
    ],
  };

  function onPasswordInput(value: string) {
    passwordStrength.value = evaluatePasswordStrength(value);
  }

  async function submit(formEl: FormInst | null) {
    if (!formEl) return;
    formError.value = '';

    try {
      await formEl.validate();
    } catch {
      return;
    }

    submitting.value = true;
    loadingBar.start();

    try {
      await registerApi({
        username: formState.username,
        password: formState.password,
        nickname: formState.nickname || undefined,
      });

      loadingBar.finish();
      message.success('注册成功');
      await router.push({ name: 'Login', query: { username: formState.username } });
    } catch (err: unknown) {
      loadingBar.error();
      const axiosErr = err as { response?: { data?: { message?: string | string[] } } };
      const msgData = axiosErr?.response?.data?.message;
      const msg = Array.isArray(msgData) ? msgData[0] : msgData || '注册失败';
      formError.value = msg || '注册失败';
    } finally {
      submitting.value = false;
    }
  }

  return {
    formState,
    submitting,
    formError,
    passwordStrength,
    rules,
    onPasswordInput,
    submit,
  };
}
