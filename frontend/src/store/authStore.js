import { create } from 'zustand';
import { authService } from '@/services/authService';

const tokenFromStorage = typeof window !== 'undefined' ? localStorage.getItem('amp-token') : null;
const userFromStorage = typeof window !== 'undefined' ? localStorage.getItem('amp-user') : null;

const useAuthStore = create((set, get) => ({
  user: userFromStorage ? JSON.parse(userFromStorage) : null,
  token: tokenFromStorage || null,
  loading: false,
  error: null,

  setToken(token) {
    if (token) localStorage.setItem('amp-token', token);
    else localStorage.removeItem('amp-token');
    set({ token });
  },

  setUser(user) {
    if (user) localStorage.setItem('amp-user', JSON.stringify(user));
    else localStorage.removeItem('amp-user');
    set({ user });
  },

  async login(credentials) {
    set({ loading: true, error: null });
    try {
      const res = await authService.login(credentials);
      set({ user: res.user, token: res.token, loading: false });
      localStorage.setItem('amp-token', res.token);
      localStorage.setItem('amp-user', JSON.stringify(res.user));
      return res;
    } catch (error) {
      set({ loading: false, error: error.response?.data?.message || 'Login failed' });
      throw error;
    }
  },

  async register(payload) {
    set({ loading: true, error: null });
    try {
      const res = await authService.register(payload);
      set({ user: res.user, token: res.token, loading: false });
      localStorage.setItem('amp-token', res.token);
      localStorage.setItem('amp-user', JSON.stringify(res.user));
      return res;
    } catch (error) {
      set({ loading: false, error: error.response?.data?.message || 'Registration failed' });
      throw error;
    }
  },

  async fetchCurrent() {
    const { token } = get();
    if (!token) return null;
    try {
      const res = await authService.me();
      set({ user: res.user });
      localStorage.setItem('amp-user', JSON.stringify(res.user));
      return res.user;
    } catch (error) {
      set({ user: null, token: null });
      localStorage.removeItem('amp-token');
      localStorage.removeItem('amp-user');
      return null;
    }
  },

  logout() {
    localStorage.removeItem('amp-token');
    localStorage.removeItem('amp-user');
    set({ user: null, token: null, loading: false });
  },
}));

export default useAuthStore;
