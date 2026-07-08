import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  Users, CalendarDays, Briefcase, Heart, ArrowRight, Menu, X,
  GraduationCap, Network, Star, TrendingUp, MapPin, Clock, ChevronRight,
} from 'lucide-react';
import GradientGlow from '@/components/ui/GradientGlow';

/* ─── Fade-up variant ─────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

/* ─── Feature cards data ──────────────────────────────────────────── */
const features = [
  {
    icon: Network,
    title: 'Connect with Alumni',
    desc: 'Build meaningful professional relationships across graduating classes. Search the directory, browse profiles, and reach out.',
  },
  {
    icon: Briefcase,
    title: 'Discover Opportunities',
    desc: 'Access job postings shared by alumni and partner companies. From entry-level to senior roles — your next step starts here.',
  },
  {
    icon: CalendarDays,
    title: 'Join Meaningful Events',
    desc: 'Reunions, webinars, workshops, and networking sessions. Stay involved in a community that grows with you.',
  },
  {
    icon: Heart,
    title: 'Support the Community',
    desc: 'Give back through donations that fund scholarships, programs, and events that uplift the next generation.',
  },
];

/* ─── Stats data ──────────────────────────────────────────────────── */
const stats = [
  { value: '10K+', label: 'Alumni Connected' },
  { value: '500+', label: 'Events Hosted' },
  { value: '1,200+', label: 'Jobs Posted' },
  { value: '₹50L+', label: 'Donations Raised' },
];

/* ─── Mock data for infinite rolling marquee ─────────────────────── */
const rollingAlumni = [
  { name: 'Priya M.', role: 'Product Manager', company: 'Google', year: '2019', initials: 'PM', color: '#C8FA5F' },
  { name: 'Arjun S.', role: 'SWE Lead', company: 'Microsoft', year: '2017', initials: 'AS', color: '#A78BFA' },
  { name: 'Neha K.', role: 'Data Scientist', company: 'Amazon', year: '2021', initials: 'NK', color: '#38D9A9' },
  { name: 'Rohan V.', role: 'Entrepreneur', company: 'Stealth', year: '2015', initials: 'RV', color: '#FB923C' },
  { name: 'Aditi G.', role: 'UX Designer', company: 'Figma', year: '2020', initials: 'AG', color: '#C8FA5F' },
  { name: 'Kabir S.', role: 'ML Engineer', company: 'Meta', year: '2018', initials: 'KS', color: '#A78BFA' },
  { name: 'Meera D.', role: 'Founder', company: 'Decentral', year: '2016', initials: 'MD', color: '#38D9A9' },
  { name: 'Dev K.', role: 'AI Researcher', company: 'OpenAI', year: '2022', initials: 'DK', color: '#FB923C' }
];

const rollingEvents = [
  { title: 'Annual Reunion 2025', date: 'Jan 25 · 4:00 PM', mode: 'Live', color: '#C8FA5F' },
  { title: 'AI & Web3 Roundtable', date: 'Feb 10 · 6:00 PM', mode: 'Virtual', color: '#A78BFA' },
  { title: 'Tech Career Fair', date: 'Mar 05 · 10:00 AM', mode: 'In-Person', color: '#38D9A9' },
  { title: 'Startup Pitch Night', date: 'Mar 20 · 5:30 PM', mode: 'Hybrid', color: '#FB923C' },
  { title: 'Mock Interview Bootcamp', date: 'Apr 02 · 9:00 AM', mode: 'Virtual', color: '#C8FA5F' },
  { title: 'Women in Tech Mixer', date: 'Apr 18 · 7:00 PM', mode: 'In-Person', color: '#A78BFA' },
  { title: 'Alumni Mentorship Kickoff', date: 'May 05 · 5:00 PM', mode: 'Virtual', color: '#38D9A9' },
  { title: 'Global Networking Day', date: 'May 20 · 9:00 AM', mode: 'Live', color: '#FB923C' },
  { title: 'Product Management Panel', date: 'Jun 12 · 6:30 PM', mode: 'Virtual', color: '#C8FA5F' },
  { title: 'Summer Reunion Social', date: 'Jul 04 · 4:00 PM', mode: 'In-Person', color: '#A78BFA' }
];

/* ─── Navbar ───────────────────────────────────────────────────────── */
function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const links = [
    { label: 'Home', href: '#home' },
    { label: 'Features', href: '#features' },
    { label: 'Events', href: '#platform' },
    { label: 'Jobs', href: '#platform' },
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0D0E10]/90 backdrop-blur-xl border-b border-white/[0.06] shadow-2xl shadow-black/40'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 group" aria-label="Alumni Management Platform home">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 border border-primary/20 group-hover:bg-primary/25 transition-colors">
              <GraduationCap className="h-4 w-4 text-primary" />
            </div>
            <span className="hidden sm:block text-sm font-bold tracking-tight text-foreground">
              Alumni Management Platform
            </span>
            <span className="sm:hidden text-sm font-bold tracking-tight text-foreground">
              AMP
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="px-3.5 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/[0.06] transition-all"
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5"
            >
              Join the Network
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden flex items-center justify-center h-9 w-9 rounded-xl border border-white/10 bg-white/[0.04] text-foreground hover:bg-white/[0.08] transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-b border-white/[0.06] bg-[#0D0E10]/95 backdrop-blur-xl"
          >
            <nav className="flex flex-col gap-1 p-4" aria-label="Mobile navigation">
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-xl hover:bg-white/[0.06] transition-all"
                >
                  {l.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/[0.06]">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-center text-muted-foreground hover:text-foreground rounded-xl border border-white/10 hover:bg-white/[0.06] transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
                >
                  Join the Network
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ─── Marquee Alumni Card ─────────────────────────────────────────── */
function MarqueeAlumniCard({ card }) {
  return (
    <div className="glass-dark rounded-2xl p-4 w-full shine-border border border-white/[0.05] hover:border-white/15 transition-all select-none">
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-[#0D1000]"
          style={{ backgroundColor: card.color }}
        >
          {card.initials}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{card.name}</p>
          <p className="text-[11px] text-muted-foreground truncate">{card.role}</p>
          <p className="text-[10px] text-muted-foreground/75 truncate">{card.company} · {card.year}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Marquee Event Card ───────────────────────────────────────────── */
function MarqueeEventCard({ card }) {
  return (
    <div className="glass-dark rounded-2xl p-4 w-full shine-border border border-white/[0.05] hover:border-white/15 transition-all select-none">
      <div className="flex items-center gap-3.5">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold"
          style={{ backgroundColor: `${card.color}15`, color: card.color, border: `1px solid ${card.color}30` }}
        >
          <CalendarDays className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-foreground truncate">{card.title}</p>
          <p className="text-[10px] text-muted-foreground/75 truncate mt-0.5">{card.date}</p>
        </div>
        <span className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full shrink-0">
          {card.mode}
        </span>
      </div>
    </div>
  );
}

/* ─── Hero visual panel ─────────────────────────────────────────────── */
function HeroVisual() {
  return (
    <div className="relative h-[480px] lg:h-[560px] w-full rounded-3xl overflow-hidden border border-white/[0.07] bg-white/[0.015]">
      {/* Central atmospheric glow */}
      <GradientGlow size="lg" className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30" />

      {/* Side-by-side marquee layout */}
      <div className="relative z-10 grid grid-cols-2 gap-4 h-full px-6 py-10 overflow-hidden">
        {/* Left Column: Alumni scrolling UP */}
        <div className="relative h-full overflow-hidden flex flex-col">
          <motion.div
            initial={{ y: "0%" }}
            animate={{ y: "-50%" }}
            transition={{
              ease: "linear",
              duration: 20,
              repeat: Infinity,
              repeatType: "loop"
            }}
            className="flex flex-col gap-4"
          >
            {/* Double the list for infinite looping */}
            {[...rollingAlumni, ...rollingAlumni].map((alumni, idx) => (
              <MarqueeAlumniCard key={`alumni-${idx}`} card={alumni} />
            ))}
          </motion.div>
        </div>

        {/* Right Column: Events scrolling DOWN */}
        <div className="relative h-full overflow-hidden flex flex-col">
          <motion.div
            initial={{ y: "-50%" }}
            animate={{ y: "0%" }}
            transition={{
              ease: "linear",
              duration: 22,
              repeat: Infinity,
              repeatType: "loop"
            }}
            className="flex flex-col gap-4"
          >
            {/* Double the list for infinite looping */}
            {[...rollingEvents, ...rollingEvents].map((evt, idx) => (
              <MarqueeEventCard key={`event-${idx}`} card={evt} />
            ))}
          </motion.div>
        </div>
      </div>

      {/* Top and Bottom gradient overlay masks for fade out effect */}
      <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-[#0D0E10] to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#0D0E10] to-transparent pointer-events-none z-10" />

      {/* Central statistics badge overlaying the marquee */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 glass-dark rounded-2xl px-6 py-4.5 text-center border border-primary/35 shadow-2xl shadow-primary/10 z-20"
      >
        <div className="text-3xl font-extrabold text-primary mb-0.5 tracking-tight">10K+</div>
        <div className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Alumni Connected</div>
      </motion.div>
    </div>
  );
}

/* ─── Main Landing Page ─────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <PublicNavbar />

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section
        id="home"
        className="relative min-h-screen flex items-center pt-16 dot-grid"
        aria-label="Hero section"
      >
        {/* Ambient glows */}
        <GradientGlow size="xl" className="-top-40 -left-40 opacity-60" />
        <GradientGlow size="lg" className="top-1/2 right-0 translate-x-1/2 opacity-30" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: text */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="relative z-10"
            >
              <motion.div variants={fadeUp} custom={0}>
                <span className="badge-lime inline-block mb-6">
                  Alumni Management Platform
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                custom={0.05}
                className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6"
              >
                Connect.{' '}
                <span className="gradient-text-lime">Grow.</span>{' '}
                Give&nbsp;Back.
              </motion.h1>

              <motion.p
                variants={fadeUp}
                custom={0.1}
                className="text-xl text-muted-foreground leading-relaxed mb-3 font-light"
              >
                Where every connection becomes part of a lasting legacy.
              </motion.p>

              <motion.p
                variants={fadeUp}
                custom={0.15}
                className="text-base text-muted-foreground/70 leading-relaxed mb-10 max-w-lg"
              >
                A premium community platform for alumni to reconnect, discover opportunities, attend events, and support the next generation.
              </motion.p>

              <motion.div variants={fadeUp} custom={0.2} className="flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0"
                >
                  Explore Community
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/12 bg-white/[0.04] text-sm font-semibold text-foreground hover:bg-white/[0.08] hover:border-white/20 transition-all hover:-translate-y-0.5"
                >
                  Sign In
                </Link>
              </motion.div>

              {/* Stats row */}
              <motion.div
                variants={fadeUp}
                custom={0.25}
                className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-white/[0.06]"
              >
                {stats.map((s) => (
                  <div key={s.label}>
                    <p className="text-2xl font-bold text-foreground">{s.value}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right: visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10"
            >
              <HeroVisual />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────── */}
      <section
        id="features"
        className="relative py-28 lg:py-36"
        aria-label="Platform features"
      >
        <GradientGlow size="lg" className="top-0 left-1/2 -translate-x-1/2 opacity-30" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} className="badge-lime inline-block mb-4">
              What we offer
            </motion.p>
            <motion.h2
              variants={fadeUp}
              custom={0.05}
              className="text-4xl lg:text-5xl font-bold tracking-tight mb-4"
            >
              Everything your alumni<br />community needs
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={0.1}
              className="text-muted-foreground text-lg max-w-xl mx-auto"
            >
              From reconnecting with old classmates to landing your next opportunity — the platform has it all.
            </motion.p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 card-hover overflow-hidden"
              >
                {/* Top glow on hover */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold mb-2 group-hover:text-primary transition-colors">
                  {f.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLATFORM PREVIEW ─────────────────────────────────────────── */}
      <section
        id="platform"
        className="relative py-28 lg:py-36"
        aria-label="Platform preview"
      >
        <GradientGlow size="lg" className="bottom-0 right-0 translate-x-1/4 opacity-25" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.p variants={fadeUp} className="badge-lime inline-block mb-4">
              Live platform
            </motion.p>
            <motion.h2
              variants={fadeUp}
              custom={0.05}
              className="text-4xl lg:text-5xl font-bold tracking-tight mb-4"
            >
              A workspace built for<br />your community
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={0.1}
              className="text-muted-foreground text-lg max-w-xl mx-auto"
            >
              Manage alumni, events, jobs, and donations from a single clean dashboard.
            </motion.p>
          </motion.div>

          {/* Dashboard preview panel */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-3xl border border-white/[0.08] bg-[#18191C] overflow-hidden shine-border"
          >
            {/* Mock top bar */}
            <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06] bg-[#0D0E10]/50">
              <div className="h-3 w-3 rounded-full bg-red-500/60" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
              <div className="h-3 w-3 rounded-full bg-green-500/60" />
              <div className="flex-1 mx-4 h-6 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center px-3">
                <span className="text-[10px] text-muted-foreground/40">alumni-platform.app/dashboard</span>
              </div>
            </div>

            {/* Mock dashboard content */}
            <div className="flex min-h-[460px]">
              {/* Mock sidebar */}
              <div className="hidden sm:flex w-48 flex-col gap-1 border-r border-white/[0.06] bg-[#0D0E10]/30 p-3">
                <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
                  <div className="h-5 w-5 rounded-md bg-primary/20 border border-primary/20" />
                  <div className="h-3 w-20 rounded bg-white/10" />
                </div>
                {['Overview', 'Alumni', 'Events', 'Jobs', 'Donations', 'Profile'].map((item, i) => (
                  <div
                    key={item}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs ${
                      i === 0
                        ? 'bg-primary/10 text-primary border border-primary/15'
                        : 'text-muted-foreground'
                    }`}
                  >
                    <div className={`h-3 w-3 rounded-sm ${i === 0 ? 'bg-primary/40' : 'bg-white/10'}`} />
                    {item}
                  </div>
                ))}
              </div>

              {/* Mock main content */}
              <div className="flex-1 p-5 space-y-5">
                {/* Greeting */}
                <div>
                  <div className="h-3 w-16 rounded bg-white/10 mb-2" />
                  <div className="h-6 w-56 rounded-lg bg-white/[0.07]" />
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {['Alumni', 'Events', 'Jobs', 'Donations'].map((s, i) => (
                    <div
                      key={s}
                      className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="h-2.5 w-12 rounded bg-white/10" />
                        <div
                          className="h-5 w-5 rounded-lg"
                          style={{
                            background: ['rgba(200,250,95,0.2)', 'rgba(167,139,250,0.2)', 'rgba(56,217,169,0.2)', 'rgba(251,146,60,0.2)'][i],
                          }}
                        />
                      </div>
                      <div className="h-5 w-10 rounded bg-white/[0.14] mb-1" />
                      <div className="h-2 w-16 rounded bg-white/[0.06]" />
                    </div>
                  ))}
                </div>

                {/* Content rows */}
                <div className="grid lg:grid-cols-5 gap-3">
                  <div className="lg:col-span-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="h-3 w-24 rounded bg-white/10 mb-4" />
                    {[1, 2, 3].map((r) => (
                      <div key={r} className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
                        <div className="h-7 w-7 rounded-full bg-white/[0.08]" />
                        <div className="flex-1 space-y-1">
                          <div className="h-2.5 w-28 rounded bg-white/[0.1]" />
                          <div className="h-2 w-20 rounded bg-white/[0.06]" />
                        </div>
                        <div className="h-4 w-12 rounded-full bg-primary/15 border border-primary/20" />
                      </div>
                    ))}
                  </div>
                  <div className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="h-3 w-20 rounded bg-white/10 mb-4" />
                    {[1, 2].map((r) => (
                      <div key={r} className="p-3 mb-2 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                        <div className="h-2.5 w-32 rounded bg-white/[0.1] mb-1.5" />
                        <div className="h-2 w-20 rounded bg-white/[0.06] mb-2" />
                        <div className="h-5 w-16 rounded-lg bg-primary/15 border border-primary/20" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────── */}
      <section
        className="relative py-28 lg:py-36"
        aria-label="Call to action"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#14151A] text-center px-6 py-20 lg:py-28 shine-border"
          >
            {/* Lime glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="w-[600px] h-[300px] rounded-full blur-3xl opacity-15"
                style={{ background: 'radial-gradient(ellipse, #C8FA5F 0%, transparent 70%)' }}
              />
            </div>

            <div className="relative z-10">
              <span className="badge-lime inline-block mb-6">Ready to join?</span>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 max-w-3xl mx-auto leading-tight">
                Your alumni network is{' '}
                <span className="gradient-text-lime">waiting for you.</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
                Join thousands of alumni who are already connected, growing, and giving back through the platform.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-primary-foreground text-base font-semibold hover:bg-primary/90 transition-all hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-1 active:translate-y-0"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/12 bg-white/[0.04] text-base font-semibold text-foreground hover:bg-white/[0.08] hover:border-white/20 transition-all hover:-translate-y-1"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer
        className="border-t border-white/[0.06] py-10"
        aria-label="Site footer"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 border border-primary/20">
                <GraduationCap className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground">Alumni Management Platform</span>
            </div>
            <nav className="flex items-center gap-5" aria-label="Footer navigation">
              {['Home', 'Features', 'Events', 'Jobs'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item}
                </a>
              ))}
              <Link to="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Sign In
              </Link>
            </nav>
            <p className="text-xs text-muted-foreground/60">
              © {new Date().getFullYear()} Alumni Management Platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
