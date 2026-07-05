import { defineStore } from 'pinia';
import { logout as logoutApi, getProfile } from '@/api/auth';

interface UserState {
  token: string | null;
  refreshToken: string | null;
  userId: string;
  username: string;
  nickname: string;
  avatar: string;
  roles: string[];
  permissions: string[];
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: localStorage.getItem('accessToken') ?? 'mock-access-token',
    refreshToken: localStorage.getItem('refreshToken') ?? 'mock-refresh-token',
    userId: localStorage.getItem('userId') ?? '',
    username: localStorage.getItem('username') ?? 'admin',
    nickname: localStorage.getItem('nickname') ?? 'Admin',
    avatar: localStorage.getItem('avatar') ?? '',
    roles: [],
    permissions: [],
  }),
  getters: {
    isLoggedIn: (state) => !!state.token,
  },
  actions: {
    setToken(token: string, refreshToken: string) {
      this.token = token;
      this.refreshToken = refreshToken;
      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', refreshToken);
    },
    setUserInfo(username: string, nickname: string) {
      this.username = username;
      this.nickname = nickname;
      localStorage.setItem('username', username);
      localStorage.setItem('nickname', nickname);
    },
    setAvatar(avatar: string) {
      this.avatar = avatar;
      localStorage.setItem('avatar', avatar);
    },
    /** 从后端拉取当前用户信息并同步到 store */
    async fetchProfile() {
      try {
        const res = await getProfile();
        const data = res.data.data as Record<string, unknown>;
        if (data) {
          if (typeof data.username === 'string') this.username = data.username;
          if (typeof data.nickname === 'string') this.nickname = data.nickname;
          if (typeof data._id === 'string') {
            this.userId = data._id;
            localStorage.setItem('userId', data._id);
          }
          if (typeof data.avatar === 'string') {
            this.avatar = data.avatar;
            localStorage.setItem('avatar', data.avatar);
          }
        }
      } catch {
        // profile 加载失败不影响主要流程
      }
    },
    async logout() {
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          await logoutApi(refreshToken);
        }
      } catch {
        // 即使后端登出失败也清理本地状态
      }
      this.token = null;
      this.refreshToken = null;
      this.userId = '';
      this.username = '';
      this.nickname = '';
      this.avatar = '';
      this.roles = [];
      this.permissions = [];
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      localStorage.removeItem('nickname');
      localStorage.removeItem('avatar');
    },
  },
});
