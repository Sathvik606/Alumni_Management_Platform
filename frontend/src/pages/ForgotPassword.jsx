import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, ArrowLeft, GraduationCap, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import GradientGlow from '@/components/ui/GradientGlow';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setEmailSent(true);
      toast.success('Reset link sent!', { description: 'Check your email for password reset instructions.' });
    } catch (error) {
      toast.error('Error', { description: error.response?.data?.message || 'Failed to send reset email' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12 relative overflow-hidden dot-grid">
      <GradientGlow size="lg" className="top-0 left-0 opacity-40" />
      <GradientGlow size="md" className="bottom-0 right-0 opacity-25" />

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
        <div className="rounded-3xl border border-white/[0.08] bg-[#18191C] p-8 sm:p-10 shadow-2xl shadow-black/50">
          <div className="mb-8 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 border border-primary/20">
                <Mail className="h-5 w-5 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">Forgot password?</h1>
            <p className="text-sm text-muted-foreground">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          {!emailSent ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="h-11 pl-10 bg-white/[0.04] border-white/[0.1] text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending…' : (
                  <>
                    Send Reset Link
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full h-11 rounded-xl border border-white/[0.1] bg-white/[0.03] text-sm font-medium text-muted-foreground inline-flex items-center justify-center gap-2 hover:bg-white/[0.07] hover:text-foreground transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </button>
            </form>
          ) : (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 border border-primary/20">
                <Mail className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2">Check your email</h2>
                <p className="text-sm text-muted-foreground">
                  If an account exists for <span className="text-foreground font-medium">{email}</span>, you will receive password reset instructions shortly.
                </p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full h-11 rounded-xl border border-white/[0.1] bg-white/[0.03] text-sm font-medium text-foreground inline-flex items-center justify-center gap-2 hover:bg-white/[0.07] transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </main>
  );
}
