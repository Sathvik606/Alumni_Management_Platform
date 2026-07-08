import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Gift, CalendarDays, Users, Briefcase, ArrowRight, TrendingUp, Zap, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { donationService } from '@/services/donationService';
import { alumniService } from '@/services/alumniService';
import { eventService } from '@/services/eventService';
import { jobService } from '@/services/jobService';
import useAuthStore from '@/store/authStore';
import PageHeader from '@/components/ui/PageHeader';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

function StatCard({ title, value, description, icon: Icon, to, accent, loading }) {
  if (loading) {
    return <Skeleton className="h-36 rounded-2xl bg-white/[0.04]" />;
  }
  return (
    <motion.div variants={fadeUp}>
      <Link
        to={to}
        className="group relative flex flex-col justify-between h-36 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 overflow-hidden hover:border-white/[0.14] hover:bg-white/[0.04] hover:-translate-y-0.5 transition-all duration-200"
      >
        {/* Top shine on hover */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="flex items-start justify-between">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
          >
            <Icon className="h-4 w-4" style={{ color: accent }} />
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all" />
        </div>

        <div>
          <p className="text-2xl font-bold text-foreground mb-0.5 leading-none">{value}</p>
          <p className="text-[11px] font-semibold text-muted-foreground">{title}</p>
          <p className="text-[11px] text-muted-foreground/60 mt-0.5 truncate">{description}</p>
        </div>
      </Link>
    </motion.div>
  );
}

function QuickActionButton({ label, to, icon: Icon, description }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3.5 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 hover:border-primary/25 hover:bg-primary/[0.04] hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors border border-primary/15">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground truncate">{description}</p>}
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 ml-auto group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overview, setOverview] = useState({
    totalDonations: 0,
    totalAmount: 0,
    alumniCount: 0,
    eventsCount: 0,
    jobsCount: 0,
  });

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setError('');
      try {
        const [donationsRes, alumniRes, eventsRes, jobsRes] = await Promise.all([
          user?.role === 'admin' ? donationService.stats() : donationService.list(user?.role),
          alumniService.list(),
          eventService.list(),
          jobService.list(),
        ]);

        if (!active) return;
        const isAdmin = user?.role === 'admin';
        const donationStats = isAdmin
          ? { totalAmount: donationsRes.totalAmount || 0, totalDonations: donationsRes.totalDonations || 0 }
          : {
              totalAmount: donationsRes.reduce((sum, d) => sum + (d.amount || 0), 0),
              totalDonations: donationsRes.length,
            };

        setOverview({
          totalDonations: donationStats.totalDonations,
          totalAmount: donationStats.totalAmount,
          alumniCount: alumniRes.length,
          eventsCount: eventsRes.length,
          jobsCount: jobsRes.length,
        });
      } catch (err) {
        if (!active) return;
        setError('Unable to load dashboard data.');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();
    return () => { active = false; };
  }, [user]);

  const stats = [
    {
      title: 'Alumni Network',
      value: loading ? '—' : overview.alumniCount.toLocaleString(),
      description: 'Verified profiles',
      icon: Users,
      to: '/alumni',
      accent: '#C8FA5F',
    },
    {
      title: 'Total Raised',
      value: loading
        ? '—'
        : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(overview.totalAmount),
      description: user?.role === 'admin' ? 'All donations' : 'Your contributions',
      icon: TrendingUp,
      to: '/donations',
      accent: '#38D9A9',
    },
    {
      title: 'Events',
      value: loading ? '—' : overview.eventsCount.toLocaleString(),
      description: 'Community events',
      icon: CalendarDays,
      to: '/events',
      accent: '#A78BFA',
    },
    {
      title: 'Job Openings',
      value: loading ? '—' : overview.jobsCount.toLocaleString(),
      description: 'Active opportunities',
      icon: Briefcase,
      to: '/jobs',
      accent: '#FB923C',
    },
  ];

  const quickActions = [
    { label: 'Browse Events', to: '/events', icon: CalendarDays, description: 'See upcoming events' },
    { label: 'View Jobs', to: '/jobs', icon: Briefcase, description: 'Explore opportunities' },
    { label: 'Alumni Directory', to: '/alumni', icon: Users, description: 'Find classmates' },
    { label: 'Record Donation', to: '/donations', icon: Gift, description: 'Give back today' },
    { label: 'Update Profile', to: '/profile', icon: Zap, description: 'Keep info current' },
  ];

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 lg:p-8">
          {/* Lime glow */}
          <div
            className="absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-10 blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, #C8FA5F, transparent 70%)' }}
            aria-hidden="true"
          />
          <div className="relative z-10">
            <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground font-semibold mb-1">
              Welcome back
            </p>
            <h1 className="text-3xl font-bold tracking-tight lg:text-4xl mb-2">
              Hi {firstName},{' '}
              <span className="text-primary">glad to see you.</span>
            </h1>
            <p className="text-sm text-muted-foreground max-w-md">
              Manage alumni, events, donations, and jobs from your dashboard.
            </p>

            {user?.role === 'admin' && (
              <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
                Admin Access
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3" role="alert">
          {error}
        </p>
      )}

      {/* Stat Cards */}
      <section aria-label="Overview statistics">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-3">
          Overview
        </p>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl bg-white/[0.04]" />)
            : stats.map((s) => (
                <StatCard key={s.title} {...s} loading={false} />
              ))}
        </motion.div>
      </section>

      {/* Quick Actions */}
      <section aria-label="Quick actions">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-3">
          Quick Actions
        </p>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {quickActions.map((a) => (
            <motion.div key={a.label} variants={fadeUp}>
              <QuickActionButton {...a} />
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
