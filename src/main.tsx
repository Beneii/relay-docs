import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

const Login = lazy(() => import('./pages/Login.tsx'));
const Signup = lazy(() => import('./pages/Signup.tsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.tsx'));
const Pricing = lazy(() => import('./pages/Pricing.tsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.tsx'));
const Privacy = lazy(() => import('./pages/Privacy.tsx'));
const Terms = lazy(() => import('./pages/Terms.tsx'));

function NotFound() {
  return (
    <div className="min-h-screen bg-bg text-text-main font-sans flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-sm font-medium text-accent mb-3">404</p>
        <h1 className="text-3xl font-bold tracking-tight mb-3">Page not found</h1>
        <p className="text-text-muted mb-6">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
        <Link
          to="/"
          className="inline-flex h-10 px-4 rounded-lg bg-accent text-white text-sm font-medium items-center hover:bg-emerald-600 transition-all"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}

function RouteLoader() {
  return (
    <div className="min-h-screen bg-bg text-text-main flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
);
