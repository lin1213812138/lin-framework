import { request } from './index';

export function fetchCaptcha() {
  return request.get<{ code: number; data: { id: string; svg: string } }>('/auth/captcha');
}

export function login(data: {
  username: string;
  password: string;
  captchaId: string;
  captcha: string;
}) {
  return request.post<{ code: number; data: { accessToken: string; refreshToken: string } }>(
    '/auth/login',
    data,
  );
}

export function register(data: {
  username: string;
  password: string;
  nickname?: string;
  email?: string;
}) {
  return request.post<{ code: number; data: { accessToken: string; refreshToken: string } }>(
    '/auth/register',
    data,
  );
}

export function logout(refreshToken: string) {
  return request.post<{ code: number }>('/auth/logout', { refreshToken });
}

/** 获取当前登录用户信息 */
export function getProfile() {
  return request.get<{ code: number; data: Record<string, unknown> }>('/auth/profile');
}
