import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { donationService } from '@/services/donationService';
import { alumniService } from '@/services/alumniService';
import { eventService } from '@/services/eventService';
import { jobService } from '@/services/jobService';
import useAuthStore from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Gift, CalendarDays, Users, Briefcase } from 'lucide-react';

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
    return () => {
      active = false;
    };
  }, [user]);

  const cards = [
    {
      title: 'Donations',
      value: `${overview.totalDonations}`,
      description: user?.role === 'admin' ? 'All recorded gifts' : 'Your contributions',
      icon: <Gift className="size-5 text-primary" />,
      action: '/donations',
    },
    {
      title: 'Total Raised',
      value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(overview.totalAmount),
      description: 'Completed amount',
      icon: <Badge variant="success">Live</Badge>,
      action: '/donations',
    },
    {
      title: 'Alumni Network',
      value: overview.alumniCount,
      description: 'Verified profiles',
      icon: <Users className="size-5 text-primary" />,
      action: '/alumni',
    },
    {
      title: 'Events & Jobs',
      value: `${overview.eventsCount} events / ${overview.jobsCount} jobs`,
      description: 'Stay involved',
      icon: <CalendarDays className="size-5 text-primary" />,
      action: '/events',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Welcome</p>
          <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">Hi {user?.name?.split(' ')[0] || 'there'}, glad to see you.</h1>
          <p className="text-sm text-muted-foreground">Manage alumni, events, and donations in one clean workspace.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" asChild>
            <Link to="/events">Upcoming events</Link>
          </Button>
          <Button asChild>
            <Link to="/donations">Record a donation</Link>
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, idx) => <Skeleton key={idx} className="h-32 rounded-2xl" />)
          : cards.map((card) => (
              <motion.div key={card.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <Card className="h-full">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>{card.title}</CardTitle>
                      <CardDescription>{card.description}</CardDescription>
                    </div>
                    {card.icon}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">{card.value}</div>
                    <Button variant="ghost" size="sm" className="mt-2 px-0" asChild>
                      <Link to={card.action}>Open</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
          <CardDescription>Jump into your most common flows.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ActionButton label="Record donation" to="/donations" icon={<Gift className="size-4" />} />
            <ActionButton label="Browse events" to="/events" icon={<CalendarDays className="size-4" />} />
            <ActionButton label="Manage alumni" to="/alumni" icon={<Users className="size-4" />} />
            <ActionButton label="View jobs" to="/" icon={<Briefcase className="size-4" />} />
            <ActionButton label="Update profile" to="/profile" icon={<Users className="size-4" />} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ActionButton({ label, to, icon }) {
  return (
    <Button
      variant="outline"
      asChild
      className="group flex w-full items-center justify-between rounded-xl border-border/70 bg-background/70 px-4 py-3 text-left hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:shadow-md"
    >
      <Link to={to}>
        <span className="flex items-center gap-2 text-sm font-semibold">{icon}{label}</span>
      </Link>
    </Button>
  );
}
