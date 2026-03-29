import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { Layout } from './components/layout.js';
import { ProtectedRoute } from './components/protected-route.js';
import { AuthProvider } from './hooks/use-auth.js';
import { DashboardPage } from './pages/dashboard.js';
import { EditorPage } from './pages/editor.js';
import { HomePage } from './pages/home.js';
import { LoginPage } from './pages/login.js';
import { PostDetailPage } from './pages/post-detail.js';
import { RegisterPage } from './pages/register.js';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/posts/:id" element={<PostDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/editor" element={<EditorPage />} />
              <Route path="/editor/:id" element={<EditorPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
