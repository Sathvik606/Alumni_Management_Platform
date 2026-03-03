import { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardPage from './pages/Dashboard';
import DonationsPage from './pages/Donations';
import AlumniPage from './pages/Alumni';
import EventsPage from './pages/Events';
import ProfilePage from './pages/Profile';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import SplashScreen from './components/SplashScreen';
import { ThemeProvider } from './hooks/useTheme.jsx';
import { Toaster } from './components/ui/sonner';
import './index.css';

function App() {
  return (
    <ThemeProvider>
      <Toaster position="top-right" richColors />
      <AnimatePresence mode="wait">
        <Suspense fallback={<SplashScreen />}> 
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="donations" element={<DonationsPage />} />
                <Route path="alumni" element={<AlumniPage />} />
                <Route path="events" element={<EventsPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </AnimatePresence>
    </ThemeProvider>
  );
}

export default App;
