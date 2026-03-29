import { Link, Outlet } from 'react-router-dom';

import { useAuth } from '../hooks/use-auth.js';

export function Layout() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="app-layout">
      <header className="app-header">
        <nav>
          <Link to="/" className="nav-brand">
            BlogApp
          </Link>
          <div className="nav-links">
            <Link to="/">Home</Link>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/editor">New Post</Link>
                <span className="nav-user">{user?.name}</span>
                <button type="button" onClick={() => logout()}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </>
            )}
          </div>
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} BlogApp</p>
      </footer>
    </div>
  );
}
