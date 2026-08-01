import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, GraduationCap, ArrowRight } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import { toast } from 'sonner';
import GradientGlow from '@/components/ui/GradientGlow';

export default function RegisterPage() {
  const { register, loading } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', password: '', graduationYear: '', department: '', role: 'student' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (useAuthStore.getState().token && useAuthStore.getState().user) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || form.name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    if (!form.email || !form.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (!form.password || form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    const currentYear = new Date().getFullYear();
    if (!form.graduationYear || form.graduationYear < 1950 || form.graduationYear > currentYear + 10) {
      setError(`Graduation year must be between 1950 and ${currentYear + 10}`);
      return;
    }
    if (!form.department || form.department.trim().length < 2) {
      setError('Department is required');
      return;
    }
    try {
      await register(form);
      toast.success('Account created!', { description: 'Please check your email to verify your account.' });
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      setError(msg);
      toast.error('Registration failed', { description: msg });
    }
  };

  const inputClass = "h-11 bg-white/[0.04] border-white/[0.1] text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl";
  const labelClass = "text-xs font-semibold uppercase tracking-wide text-muted-foreground";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12 relative overflow-hidden dot-grid">
      <GradientGlow size="xl" className="-top-40 -right-40 opacity-40" />
      <GradientGlow size="lg" className="-bottom-20 -left-20 opacity-25" />

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
        className="relative z-10 w-full max-w-xl"
      >
        <div className="rounded-3xl border border-white/[0.08] bg-[#18191C] p-8 sm:p-10 shadow-2xl shadow-black/50">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 border border-primary/20">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">Create your account</h1>
            <p className="text-sm text-muted-foreground">
              Join the Alumni Management Platform community
            </p>
          </div>

          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
            {/* Account Type */}
            <div className="sm:col-span-2 space-y-2">
              <Label className={labelClass}>I am a...</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, role: 'student' }))}
                  className={`h-11 rounded-xl border text-sm font-semibold transition-all ${
                    form.role === 'student'
                      ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/5'
                      : 'border-white/[0.1] bg-white/[0.03] text-muted-foreground hover:bg-white/[0.05]'
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, role: 'alumni' }))}
                  className={`h-11 rounded-xl border text-sm font-semibold transition-all ${
                    form.role === 'alumni'
                      ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/5'
                      : 'border-white/[0.1] bg-white/[0.03] text-muted-foreground hover:bg-white/[0.05]'
                  }`}
                >
                  Alumnus
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="name" className={labelClass}>Full Name</Label>
              <Input
                id="name"
                required
                minLength={2}
                maxLength={100}
                placeholder="Alex Alumni"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className={inputClass}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className={labelClass}>Email</Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className={inputClass}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className={labelClass}>Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  className={`${inputClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Graduation Year */}
            <div className="space-y-2">
              <Label htmlFor="graduationYear" className={labelClass}>Graduation Year</Label>
              <Input
                id="graduationYear"
                type="number"
                required
                min={1950}
                max={new Date().getFullYear() + 10}
                placeholder="2024"
                value={form.graduationYear}
                onChange={(e) => setForm((p) => ({ ...p, graduationYear: e.target.value }))}
                className={inputClass}
              />
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="department" className={labelClass}>Department</Label>
              <Input
                id="department"
                required
                minLength={2}
                maxLength={100}
                placeholder="Computer Science"
                value={form.department}
                onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                className={inputClass}
              />
            </div>

            {error && (
              <p className="sm:col-span-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="sm:col-span-2 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account…' : (
                <>
                  Create account
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.08]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#18191C] px-3 text-muted-foreground/60 uppercase tracking-wider">
                Or sign up with
              </span>
            </div>
          </div>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={() => (window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/google`)}
            aria-label="Sign up with Google"
            className="w-full h-11 rounded-xl border border-white/[0.1] bg-white/[0.03] text-sm font-medium text-foreground inline-flex items-center justify-center gap-2.5 hover:bg-white/[0.07] hover:border-white/20 transition-all"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
            </svg>
            Sign up with Google
          </button>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}
