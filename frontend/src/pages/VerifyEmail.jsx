import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/services/api';
import logo from '@/assets/logo2.png';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      try {
        const response = await api.post('/auth/verify-email', { token });
        setStatus('success');
        setMessage(response.data.message || 'Email verified successfully!');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Email verification failed');
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-background via-background to-muted p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <motion.img
              src={logo}
              alt="Alumni Link"
              className="h-20"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, type: 'spring' }}
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">ALUMNI LINK</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Email Verification</CardTitle>
            <CardDescription>
              {status === 'verifying' && 'Verifying your email address...'}
              {status === 'success' && 'Your email has been verified'}
              {status === 'error' && 'Verification failed'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4 py-4 text-center">
              {status === 'verifying' && (
                <>
                  <Loader2 className="h-16 w-16 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Please wait while we verify your email...
                  </p>
                </>
              )}

              {status === 'success' && (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                    <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">{message}</h3>
                    <p className="text-sm text-muted-foreground">
                      You will be redirected to login shortly...
                    </p>
                  </div>
                  <Button onClick={() => navigate('/login')} className="w-full">
                    Go to Login
                  </Button>
                </>
              )}

              {status === 'error' && (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                    <XCircle className="h-10 w-10 text-destructive" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">Verification Failed</h3>
                    <p className="text-sm text-muted-foreground">{message}</p>
                  </div>
                  <div className="flex w-full gap-2">
                    <Button
                      variant="outline"
                      onClick={() => navigate('/login')}
                      className="flex-1"
                    >
                      Go to Login
                    </Button>
                    <Button
                      onClick={() => navigate('/register')}
                      className="flex-1"
                    >
                      Register Again
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
