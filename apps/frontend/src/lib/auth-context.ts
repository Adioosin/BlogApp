import { createContext } from 'react';

import type { LoginRequest, RegisterRequest, UserDto } from '@blogapp/types';

export type AuthState = {
  user: UserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthState | null>(null);
