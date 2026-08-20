'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api, tokenStorage, ApiError } from '@/lib/api-client';
import type { ApiItemResponse, User } from '@/types/api';

interface AuthContextValue {
  user: User | null;
  /** true iken uygulamanın (localStorage token + /auth/me) oturumu doğrulaması sürüyor. */
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Sayfa yenilendiğinde localStorage'daki token hâlâ geçerli mi diye
  // /auth/me ile bir kez doğrulanır. Geçersizse api-client zaten
  // token'ı temizler (401 handling), biz sadece user'ı null bırakırız.
  useEffect(() => {
    const token = tokenStorage.get();
    if (!token) {
      setIsLoading(false);
      return;
    }

    api
      .get<ApiItemResponse<User>>('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const res = await api.post<ApiItemResponse<{ user: User; token: string }>>(
      '/auth/login',
      { email, password, device_name: getDeviceName() },
      { auth: false },
    );
    tokenStorage.set(res.data.token);
    setUser(res.data.user);
    router.push('/books');
  }

  async function register(name: string, email: string, password: string, passwordConfirmation: string) {
    await api.post(
      '/auth/register',
      { name, email, password, password_confirmation: passwordConfirmation },
      { auth: false },
    );
    // Kayıt sonrası otomatik giriş — kullanıcıyı iki kez form doldurmaya zorlamayalım.
    await login(email, password);
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // Token zaten geçersizse sunucu tarafı zaten temiz demektir;
      // yine de yerel oturumu kapatmaya devam ederiz.
    } finally {
      tokenStorage.clear();
      setUser(null);
      router.push('/login');
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth, AuthProvider içinde kullanılmalı.');
  }
  return ctx;
}

/** Sanctum token'larını cihaza göre etiketlemek için (backend LoginData.deviceName). */
function getDeviceName(): string {
  if (typeof window === 'undefined') return 'server';
  return window.navigator.userAgent.slice(0, 100);
}

export { ApiError };
