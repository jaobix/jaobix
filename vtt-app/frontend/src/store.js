import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  login: (user, token) => {
    localStorage.setItem('vtt_token', token);
    localStorage.setItem('vtt_user', JSON.stringify(user));
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('vtt_token');
    localStorage.removeItem('vtt_user');
    set({ user: null, token: null });
  },
  initAuth: () => {
    const token = localStorage.getItem('vtt_token');
    const user = JSON.parse(localStorage.getItem('vtt_user'));
    if (token && user) {
      set({ token, user });
    }
  }
}));
