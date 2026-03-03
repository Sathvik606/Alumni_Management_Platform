import { Navigate, Outlet, useLocation } from 'react-router-dom';
import SplashScreen from '@/components/SplashScreen';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export default function ProtectedRoute() {
  const { token, user, checking } = useAuthGuard();
  const location = useLocation();

  if (checking) return <SplashScreen />;
  if (!token || !user) return <Navigate to="/login" state={{ from: location }} replace />;

  return <Outlet />;
}
