import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';

const App = lazy(() => import('./App.tsx'));
const Login = lazy(() => import('./pages/Login.tsx'));
const Signup = lazy(() => import('./pages/Signup.tsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.tsx'));
const Pricing = lazy(() => import('./pages/Pricing.tsx'));
const Docs = lazy(() => import('./pages/Docs.tsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.tsx'));
const Privacy = lazy(() => import('./pages/Privacy.tsx'));
const Terms = lazy(() => import('./pages/Terms.tsx'));
const NotFound = lazy(() => import('./pages/NotFound.tsx'));

function RouteLoader() {
  return (
    <div className="min-h-screen bg-bg text-text-main flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
    <BrowserRouter>
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
