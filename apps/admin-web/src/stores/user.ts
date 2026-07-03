import { defineStore } from 'pinia';

interface UserState {
  token: string | null;
  refreshToken: string | null;
  username: string;
  nickname: string;
  roles: string[];
  permissions: string[];
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: localStorage.getItem('accessToken') ?? 'mock-access-token',
    refreshToken: localStorage.getItem('refreshToken') ?? 'mock-refresh-token',
    username: localStorage.getItem('username') ?? 'admin',
    nickname: localStorage.getItem('nickname') ?? 'Admin',
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
    logout() {
      this.token = null;
      this.refreshToken = null;
      this.username = '';
      this.nickname = '';
      this.roles = [];
      this.permissions = [];
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('username');
      localStorage.removeItem('nickname');
    },
  },
});
