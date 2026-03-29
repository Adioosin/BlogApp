import { useContext } from 'react';

import { AuthContext } from '../lib/auth-context.js';

export { AuthProvider } from '../components/auth-provider.js';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
