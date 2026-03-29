import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import type { LoginRequest, RegisterRequest, UserDto } from '@blogapp/types';

import { authApi, setTokens } from '../lib/api-client.js';
import { AuthContext } from '../lib/auth-context.js';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuth = useCallback(() => {
    setTokens(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const handleForceLogout = () => clearAuth();
    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, [clearAuth]);

  useEffect(() => {
    authApi
      .me()
      .then((res) => setUser(res.data.data))
      .catch(() => clearAuth())
      .finally(() => setIsLoading(false));
  }, [clearAuth]);

  const login = useCallback(async (data: LoginRequest) => {
    const res = await authApi.login(data);
    const { user: userData, tokens } = res.data.data;
    setTokens(tokens);
    setUser(userData);
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    const res = await authApi.register(data);
    const { user: userData, tokens } = res.data.data;
    setTokens(tokens);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
