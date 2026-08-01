import { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardPage from './pages/Dashboard';
import DonationsPage from './pages/Donations';
import AlumniPage from './pages/Alumni';
import EventsPage from './pages/Events';
import JobsPage from './pages/Jobs';
import ProfilePage from './pages/Profile';
import MentorshipPage from './pages/Mentorship';
import ScholarshipsPage from './pages/Scholarships';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import ForgotPasswordPage from './pages/ForgotPassword';
import ResetPasswordPage from './pages/ResetPassword';
import VerifyEmailPage from './pages/VerifyEmail';
import LandingPage from './pages/Landing';
import SplashScreen from './components/SplashScreen';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './hooks/useTheme.jsx';
import { Toaster } from './components/ui/sonner';
import './index.css';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Toaster position="top-right" richColors theme="dark" />
        <AnimatePresence mode="wait">
          <Suspense fallback={<SplashScreen />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* Protected dashboard routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="donations" element={<DonationsPage />} />
                  <Route path="alumni" element={<AlumniPage />} />
                  <Route path="events" element={<EventsPage />} />
                  <Route path="jobs" element={<JobsPage />} />
                  <Route path="mentorship" element={<MentorshipPage />} />
                  <Route path="scholarships" element={<ScholarshipsPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                </Route>
              </Route>

              {/* Catch-all → landing */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AnimatePresence>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
