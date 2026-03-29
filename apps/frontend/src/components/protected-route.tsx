import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '../hooks/use-auth.js';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
