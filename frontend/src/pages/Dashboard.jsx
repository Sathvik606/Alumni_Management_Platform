import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { donationService } from '@/services/donationService';
import { alumniService } from '@/services/alumniService';
import { eventService } from '@/services/eventService';
import { jobService } from '@/services/jobService';
import { mentorshipService } from '@/services/mentorshipService';
import useAuthStore from '@/store/authStore';
import { Gift, CalendarDays, Users, Briefcase, ArrowRight, TrendingUp, Zap, ChevronRight, MessageSquare, Video, Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { referralService } from '@/services/referralService';
import { scholarshipService } from '@/services/scholarshipService';
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

function MentorMiniCard({ mentor, onBook }) {
  return (
    <div className="relative flex flex-col justify-between rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 hover:border-white/[0.14] hover:bg-white/[0.04] transition-all duration-200">
      <div className="flex items-start gap-3.5">
        <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center font-bold text-primary shrink-0">
          {mentor.name ? mentor.name.substring(0, 2).toUpperCase() : 'M'}
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-foreground truncate">{mentor.name}</h4>
          {mentor.currentJobTitle && (
            <p className="text-xs text-foreground/85 truncate">
              {mentor.currentJobTitle} at {mentor.company || '—'}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground/60 mt-0.5 truncate">{mentor.department}</p>
        </div>
      </div>
      
      {mentor.mentorshipTopic && (
        <p className="text-[11px] text-muted-foreground bg-white/[0.02] border border-white/[0.05] rounded-lg p-2 mt-3 italic line-clamp-1">
          Topic: "{mentor.mentorshipTopic}"
        </p>
      )}

      <div className="flex items-center justify-between border-t border-white/[0.06] mt-4 pt-3">
        <span className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5 whitespace-nowrap">
          Mentor
        </span>
        <button
          onClick={() => onBook(mentor)}
          className="h-7 px-3 rounded-lg bg-primary text-[#0D1000] text-[10px] font-bold hover:bg-primary/95 transition-all"
        >
          Request Session
        </button>
      </div>
    </div>
  );
}

function SuccessStoryCard({ story }) {
  return (
    <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/[0.02] p-4 flex items-start gap-3">
      <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 flex items-center justify-center font-bold text-sm shrink-0">
        ✓
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-foreground truncate">{story.studentId?.name || 'Student'}</p>
        <p className="text-[10px] text-emerald-400 font-medium">Campaign fully funded! ({new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(story.amountNeeded)})</p>
        <p className="text-[10px] text-muted-foreground truncate mt-0.5">"{story.title}"</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Alumni/Admin overview state
  const [overview, setOverview] = useState({
    totalDonations: 0,
    totalAmount: 0,
    alumniCount: 0,
    eventsCount: 0,
    jobsCount: 0,
  });

  // Student specific states
  const [studentStats, setStudentStats] = useState({
    referralsCount: 0,
    mentorshipsCount: 0,
    scholarshipProgress: null,
  });
  const [featuredMentors, setFeaturedMentors] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [successStories, setSuccessStories] = useState([]);

  // Mentorship booking request modal (for booking shortcut on student dashboard)
  const [mentorshipModal, setMentorshipModal] = useState({ open: false, mentor: null, topic: '', message: '' });

  // Mentorship states
  const [sessions, setSessions] = useState([]);
  const [meetingModal, setMeetingModal] = useState({ open: false, session: null, meetingLink: '' });

  const fetchSessions = async () => {
    try {
      const data = await mentorshipService.listSessions();
      setSessions(data);
    } catch (err) {
      console.error('Failed to load mentorship sessions', err);
    }
  };

  const handleUpdateSession = async (id, status, link = '') => {
    try {
      await mentorshipService.updateSession(id, status, link);
      toast.success('Mentorship session updated!', { description: `Session marked as ${status}.` });
      fetchSessions();
    } catch (err) {
      toast.error('Failed to update session', { description: err.response?.data?.message || 'Something went wrong' });
    }
  };

  const handleMentorshipRequest = async (e) => {
    e.preventDefault();
    if (!mentorshipModal.topic || !mentorshipModal.message) {
      toast.error('Validation error', { description: 'All fields are required.' });
      return;
    }
    try {
      await mentorshipService.requestSession({
        mentorId: mentorshipModal.mentor._id,
        topic: mentorshipModal.topic,
        message: mentorshipModal.message
      });
      toast.success('Mentorship requested!', { description: `Your request has been sent to ${mentorshipModal.mentor.name}.` });
      setMentorshipModal({ open: false, mentor: null, topic: '', message: '' });
      fetchSessions();
    } catch (err) {
      toast.error('Failed to request mentorship', { description: err.response?.data?.message || 'Something went wrong' });
    }
  };

  useEffect(() => {
    let active = true;

    const fetchStudentData = async () => {
      setError('');
      try {
        const [referralsRes, mentorshipRes, scholarshipsRes, jobsRes, eventsRes, alumniRes, allScholarshipsRes] = await Promise.all([
          referralService.listMyRequests(),
          mentorshipService.listSessions(),
          scholarshipService.listMyRequests(),
          jobService.list(),
          eventService.list(),
          alumniService.list(),
          scholarshipService.listAll(),
        ]);

        if (!active) return;

        const activeCampaign = scholarshipsRes.find(s => s.status !== 'closed') || null;

        setStudentStats({
          referralsCount: referralsRes.length,
          mentorshipsCount: mentorshipRes.filter(s => s.status === 'accepted').length,
          scholarshipProgress: activeCampaign ? {
            title: activeCampaign.title,
            amountRaised: activeCampaign.amountRaised || 0,
            amountNeeded: activeCampaign.amountNeeded || 0,
            percent: Math.min(100, Math.round(((activeCampaign.amountRaised || 0) / (activeCampaign.amountNeeded || 1)) * 100))
          } : null,
        });

        const mentors = alumniRes.filter(a => a.isMentor && a._id !== user?._id).slice(0, 3);
        setFeaturedMentors(mentors);
        setRecentJobs(jobsRes.slice(0, 3));

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcoming = eventsRes
          .filter(e => !e.date || new Date(e.date) >= today)
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 3);
        setRecentEvents(upcoming);

        const funded = allScholarshipsRes.filter(s => s.status === 'funded').slice(0, 3);
        setSuccessStories(funded);

        setSessions(mentorshipRes);
      } catch (err) {
        if (!active) return;
        console.error(err);
        setError('Unable to load student dashboard data.');
      } finally {
        if (active) setLoading(false);
      }
    };

    const fetchAlumniData = async () => {
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
        
        fetchSessions();
      } catch (err) {
        if (!active) return;
        setError('Unable to load dashboard data.');
      } finally {
        if (active) setLoading(false);
      }
    };

    if (user?.role === 'student') {
      fetchStudentData();
    } else {
      fetchAlumniData();
    }

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

  const studentStatsData = [
    {
      title: 'Referral Requests',
      value: loading ? '—' : studentStats.referralsCount.toLocaleString(),
      description: 'Your job requests',
      icon: Briefcase,
      to: '/jobs',
      accent: '#FB923C',
    },
    {
      title: 'Approved Mentorships',
      value: loading ? '—' : studentStats.mentorshipsCount.toLocaleString(),
      description: '1-on-1 bookings',
      icon: MessageSquare,
      to: '/dashboard',
      accent: '#A78BFA',
    },
    {
      title: 'Sponsorship Active',
      value: loading ? '—' : studentStats.scholarshipProgress ? `${studentStats.scholarshipProgress.percent}%` : 'No Campaign',
      description: studentStats.scholarshipProgress ? studentStats.scholarshipProgress.title : 'Request financial support',
      icon: Gift,
      to: '/donations',
      accent: '#38D9A9',
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
              {user?.role === 'student'
                ? 'Explore networking opportunities, mentorship sessions, job referrals, and aid request programs.'
                : 'Manage alumni, events, donations, and jobs from your dashboard.'}
            </p>

            {user?.role === 'admin' && (
              <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
                Admin Access
              </span>
            )}
            {user?.role === 'student' && (
              <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
                Student Access
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

      {user?.role === 'student' ? (
        /* ==================== STUDENT DASHBOARD VIEW ==================== */
        <>
          {/* Student Stats Cards */}
          <section aria-label="Student overview statistics">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-3">
              Your Overview
            </p>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="grid gap-3 sm:grid-cols-3"
            >
              {loading
                ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl bg-white/[0.04]" />)
                : studentStatsData.map((s) => (
                    <StatCard key={s.title} {...s} loading={false} />
                  ))}
            </motion.div>
          </section>

          {/* Featured Mentors */}
          <section aria-label="Featured Mentors">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                Featured Mentors & Alumni
              </p>
              <Link to="/alumni" className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold">
                Browse Directory
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl bg-white/[0.04]" />)
              ) : featuredMentors.length === 0 ? (
                <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-8 text-center text-muted-foreground text-sm">
                  No mentors available at the moment.
                </div>
              ) : (
                featuredMentors.map(m => (
                  <MentorMiniCard
                    key={m._id}
                    mentor={m}
                    onBook={(mentor) => setMentorshipModal({ open: true, mentor, topic: '', message: '' })}
                  />
                ))
              )}
            </div>
          </section>

          {/* Recent Jobs */}
          <section aria-label="Recent Jobs">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                Recent Jobs & Internships
              </p>
              <Link to="/jobs" className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold">
                View All Jobs
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl bg-white/[0.04]" />)
              ) : recentJobs.length === 0 ? (
                <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-8 text-center text-muted-foreground text-sm">
                  No job postings found.
                </div>
              ) : (
                recentJobs.map(job => (
                  <Link
                    key={job._id}
                    to="/jobs"
                    className="group relative flex flex-col justify-between rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 hover:border-primary/20 hover:bg-primary/[0.02] transition-all duration-200"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{job.title}</h4>
                      <p className="text-xs text-muted-foreground/80 mt-0.5 truncate">{job.company} • {job.location}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase bg-white/[0.05] border border-white/10 rounded px-1.5 py-0.5">
                        {job.type}
                      </span>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase bg-white/[0.05] border border-white/10 rounded px-1.5 py-0.5">
                        {job.mode}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          {/* Upcoming Events */}
          <section aria-label="Upcoming Events">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                Upcoming Networking Events
              </p>
              <Link to="/events" className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold">
                Browse Events
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl bg-white/[0.04]" />)
              ) : recentEvents.length === 0 ? (
                <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-8 text-center text-muted-foreground text-sm">
                  No upcoming events scheduled.
                </div>
              ) : (
                recentEvents.map(ev => (
                  <Link
                    key={ev._id}
                    to="/events"
                    className="group relative flex flex-col justify-between rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 hover:border-primary/20 hover:bg-primary/[0.02] transition-all duration-200"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{ev.title}</h4>
                      <p className="text-xs text-muted-foreground/80 mt-0.5 truncate">{ev.location}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-4 text-[10px] text-muted-foreground/60 font-semibold uppercase">
                      <CalendarDays className="h-3 w-3 text-primary shrink-0" />
                      {ev.date ? new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          {/* Donations and Success Stories */}
          <section aria-label="Scholarship Support & Success Stories">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-3">
              Scholarship Aid & Success Stories
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 flex flex-col justify-between">
                {studentStats.scholarshipProgress ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">My Scholarship Campaign</h4>
                      <p className="text-xs text-muted-foreground truncate">{studentStats.scholarshipProgress.title}</p>
                    </div>
                    
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-primary">{studentStats.scholarshipProgress.percent}% Raised</span>
                        <span className="text-muted-foreground">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(studentStats.scholarshipProgress.amountRaised)} of {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(studentStats.scholarshipProgress.amountNeeded)}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-500"
                          style={{ width: `${studentStats.scholarshipProgress.percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-foreground">Need Academic Funding?</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Submit a tuition or academic expense assistance request. Alumni can sponsor your campaign directly.
                    </p>
                    <Link
                      to="/donations"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      Create Funding Campaign
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                )}
                
                <div className="border-t border-white/[0.06] mt-4 pt-4">
                  <Link to="/donations" className="text-xs text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1">
                    Go to Scholarship campaigns page
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                <h4 className="text-sm font-bold text-foreground mb-3">Sponsorship Success Stories</h4>
                <div className="space-y-3">
                  {successStories.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-6">
                      No funded campaigns yet. Help us create our first success story!
                    </div>
                  ) : (
                    successStories.map(story => (
                      <SuccessStoryCard key={story._id} story={story} />
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        </>
      ) : (
        /* ==================== ALUMNI / ADMIN DASHBOARD VIEW ==================== */
        <>
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
        </>
      )}

      {/* Mentorship Sessions Log (Shared for both Roles) */}
      {sessions.length > 0 && (
        <section aria-label="Mentorship Bookings">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-3">
            Your Mentorship Sessions
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {sessions.slice(0, 4).map((sess) => {
              const isMentorForSession = user?._id === (sess.mentorId?._id || sess.mentorId);
              const contactPerson = isMentorForSession ? sess.studentId : sess.mentorId;
              return (
                <div key={sess._id} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/15">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">
                          {isMentorForSession ? 'Student:' : 'Mentor:'} {contactPerson?.name || 'Classmate'}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">Topic: {sess.topic}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      sess.status === 'accepted' ? 'bg-primary/10 text-primary border-primary/20' :
                      sess.status === 'declined' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                      'bg-white/5 text-muted-foreground border-white/10'
                    }`}>
                      {sess.status}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground italic leading-relaxed">
                    "{sess.message}"
                  </p>

                  {sess.meetingLink && sess.status === 'accepted' && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/15 border border-white/[0.04]">
                      <Video className="h-4 w-4 text-primary shrink-0" />
                      <a href={sess.meetingLink} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary hover:underline truncate">
                        Join Virtual Session
                      </a>
                    </div>
                  )}

                  {sess.status === 'pending' && isMentorForSession && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => setMeetingModal({ open: true, session: sess, meetingLink: '' })}
                        className="inline-flex items-center gap-1 h-8 px-3 rounded-xl bg-primary text-[#0D1000] text-xs font-bold hover:bg-primary/95 transition-all"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Accept Session
                      </button>
                      <button
                        onClick={() => handleUpdateSession(sess._id, 'declined')}
                        className="inline-flex items-center gap-1 h-8 px-3 rounded-xl border border-destructive/25 bg-destructive/5 text-xs text-destructive hover:bg-destructive/10 transition-all"
                      >
                        <X className="h-3.5 w-3.5" />
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Mentorship Booking Modal (Student Shortcuts) */}
      {mentorshipModal.open && mentorshipModal.mentor && (
        <Dialog open={mentorshipModal.open} onOpenChange={(open) => !open && setMentorshipModal({ open: false, mentor: null, topic: '', message: '' })}>
          <DialogContent className="border-white/[0.08] bg-[#1C1D21] max-w-md w-full rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle>Book 1-on-1 Session</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Send a session booking request to <strong>{mentorshipModal.mentor.name}</strong>.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleMentorshipRequest} className="space-y-4 mt-3">
              <div className="space-y-1.5">
                <Label htmlFor="mentorship-topic" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Topic of Discussion *
                </Label>
                <Input
                  id="mentorship-topic"
                  required
                  placeholder="e.g. Frontend Career Advice, Mock Interview"
                  value={mentorshipModal.topic}
                  onChange={(e) => setMentorshipModal((p) => ({ ...p, topic: e.target.value }))}
                  className="h-10 bg-white/[0.04] border-white/[0.1] text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mentorship-msg" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Your Message *
                </Label>
                <textarea
                  id="mentorship-msg"
                  required
                  rows={4}
                  placeholder="Introduce yourself and list some questions or slots you are available..."
                  value={mentorshipModal.message}
                  onChange={(e) => setMentorshipModal((p) => ({ ...p, message: e.target.value }))}
                  className="w-full p-3 bg-white/[0.04] border border-white/[0.1] text-foreground text-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl outline-none"
                />
              </div>
              <DialogFooter className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMentorshipModal({ open: false, mentor: null, topic: '', message: '' })}
                  className="px-4 py-2 rounded-xl border border-white/[0.1] bg-white/[0.03] text-sm text-muted-foreground hover:bg-white/[0.07] hover:text-foreground transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/10"
                >
                  Send Request
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Meeting Link input Modal */}
      {meetingModal.open && meetingModal.session && (
        <Dialog open={meetingModal.open} onOpenChange={(open) => !open && setMeetingModal({ open: false, session: null, meetingLink: '' })}>
          <DialogContent className="border-white/[0.08] bg-[#1C1D21] max-w-md w-full rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle>Accept Mentorship Request</DialogTitle>
              <DialogDescription className="text-muted-foreground font-medium">
                Add a Google Meet or Zoom link for this session.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleUpdateSession(meetingModal.session._id, 'accepted', meetingModal.meetingLink);
              setMeetingModal({ open: false, session: null, meetingLink: '' });
            }} className="space-y-4 mt-3">
              <div className="space-y-1.5">
                <Label htmlFor="meeting-link" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Virtual Meeting URL (Optional)
                </Label>
                <Input
                  id="meeting-link"
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={meetingModal.meetingLink}
                  onChange={(e) => setMeetingModal((p) => ({ ...p, meetingLink: e.target.value }))}
                  className="h-10 bg-white/[0.04] border-white/[0.1] text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl"
                />
              </div>
              <DialogFooter className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMeetingModal({ open: false, session: null, meetingLink: '' })}
                  className="px-4 py-2 rounded-xl border border-white/[0.1] bg-white/[0.03] text-sm text-muted-foreground hover:bg-white/[0.07] hover:text-foreground transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/10"
                >
                  Accept & Save
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
