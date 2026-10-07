import { create } from 'zustand';
import { User, AuthCredentials } from '../types';
import { AuthService } from '../services/authService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  checkAuthSession: () => Promise<void>;
  login: (credentials: AuthCredentials) => Promise<User>;
  register: (credentials: AuthCredentials) => Promise<User>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  checkAuthSession: async () => {
    set({ isLoading: true });
    try {
      const activeUser = await AuthService.getActiveUser();
      if (activeUser) {
        set({ user: activeUser, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (e) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const user = await AuthService.login(credentials);
      set({ user, isAuthenticated: true, isLoading: false });
      return user;
    } catch (e: any) {
      const msg = e.message || 'Login failed. Please check your credentials.';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  register: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const user = await AuthService.register(credentials);
      set({ user, isAuthenticated: true, isLoading: false });
      return user;
    } catch (e: any) {
      const msg = e.message || 'Registration failed.';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  logout: async () => {
    set({ isLoading: true });
    await AuthService.logout();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  clearError: () => set({ error: null }),
}));
