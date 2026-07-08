import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import GradientGlow from '@/components/ui/GradientGlow';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
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
        setTimeout(() => navigate('/login'), 3000);
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Email verification failed');
      }
    };
    verifyEmail();
  }, [token, navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12 relative overflow-hidden dot-grid">
      <GradientGlow size="lg" className="top-0 left-0 opacity-30" />

      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <GraduationCap className="h-3.5 w-3.5 text-primary" />
        Alumni Management Platform
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="rounded-3xl border border-white/[0.08] bg-[#18191C] p-10 shadow-2xl shadow-black/50 text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-6">
            Alumni Management Platform
          </p>

          {status === 'verifying' && (
            <div className="flex flex-col items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <div>
                <h1 className="text-xl font-bold mb-1">Verifying your email</h1>
                <p className="text-sm text-muted-foreground">Please wait a moment…</p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold mb-1">Email Verified!</h1>
                <p className="text-sm text-muted-foreground">{message}</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Redirecting to login…</p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center justify-center hover:bg-primary/90 transition-all"
              >
                Go to Login
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 border border-destructive/20">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h1 className="text-xl font-bold mb-1">Verification Failed</h1>
                <p className="text-sm text-muted-foreground">{message}</p>
              </div>
              <div className="flex w-full gap-3">
                <button
                  onClick={() => navigate('/login')}
                  className="flex-1 h-11 rounded-xl border border-white/[0.1] bg-white/[0.03] text-sm font-medium text-foreground inline-flex items-center justify-center hover:bg-white/[0.07] transition-all"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center justify-center hover:bg-primary/90 transition-all"
                >
                  Register Again
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </main>
  );
}
