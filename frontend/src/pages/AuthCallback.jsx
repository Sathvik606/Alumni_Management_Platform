import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import { toast } from 'sonner';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setToken, fetchCurrent } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      toast.error('Authentication failed', {
        description: 'Unable to sign in with Google. Please try again.',
      });
      navigate('/login', { replace: true });
      return;
    }

    if (token) {
      const handleAuth = async () => {
        try {
          // Set token first
          setToken(token);
          
          // Fetch full user data from backend
          await fetchCurrent();

          toast.success('Welcome!', {
            description: 'You have successfully signed in with Google.',
          });

          navigate('/', { replace: true });
        } catch (err) {
          console.error('Token parsing error:', err);
          toast.error('Authentication failed', {
            description: 'Invalid authentication token.',
          });
          navigate('/login', { replace: true });
        }
      };
      
      handleAuth();
    } else {
      // No token and no error - shouldn't happen
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate, setToken, fetchCurrent]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/10">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="mt-4 text-sm text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
