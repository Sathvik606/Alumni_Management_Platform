import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Gift, Users, CalendarDays, Briefcase, UserRound,
  LogOut, Menu, X, GraduationCap, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import useAuthStore from '@/store/authStore';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const navItems = [
  { label: 'Overview', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Alumni', icon: Users, to: '/alumni' },
  { label: 'Events', icon: CalendarDays, to: '/events' },
  { label: 'Jobs', icon: Briefcase, to: '/jobs' },
  { label: 'Donations', icon: Gift, to: '/donations' },
  { label: 'Profile', icon: UserRound, to: '/profile' },
];

function UserAvatar({ user, size = 'md' }) {
  const sizeClass = size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-9 w-9 text-xs';
  return (
    <div className={`relative ${sizeClass} shrink-0`}>
      {user?.profilePicture ? (
        <img
          src={user.profilePicture}
          alt={user.name}
          className={`${sizeClass} rounded-full object-cover border border-white/15`}
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextSibling?.style && (e.currentTarget.nextSibling.style.display = 'flex');
          }}
        />
      ) : null}
      <div
        className={`${sizeClass} rounded-full bg-primary/15 border border-primary/20 items-center justify-center font-semibold text-primary`}
        style={{ display: user?.profilePicture ? 'none' : 'flex' }}
      >
        {user?.name ? user.name.substring(0, 2).toUpperCase() : <UserRound className="h-4 w-4" />}
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout, fetchCurrent } = useAuthStore();

  useEffect(() => {
    fetchCurrent();
  }, []);

  const handleLogoutConfirm = async () => {
    setLogoutDialogOpen(false);
    setLoggingOut(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    logout();
    toast.success('Logged out successfully', { description: 'See you next time!' });
    navigate('/login');
  };

  /* ─── Desktop Sidebar ─────────────────────────────────────────── */
  const Sidebar = () => (
    <aside
      className={`${
        collapsed ? 'w-[68px]' : 'w-60'
      } sticky top-0 hidden h-screen flex-col border-r border-white/[0.06] bg-sidebar lg:flex transition-all duration-300 ease-in-out`}
    >
      {/* Brand */}
      <div className={`flex h-16 items-center border-b border-white/[0.06] px-3 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2.5 min-w-0 group">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 border border-primary/20 group-hover:bg-primary/25 transition-colors">
              <GraduationCap className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-[12px] font-bold tracking-tight text-foreground truncate leading-tight">
              Alumni Management<br />Platform
            </span>
          </Link>
        )}
        {collapsed && (
          <Link to="/" className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 border border-primary/20 hover:bg-primary/25 transition-colors">
            <GraduationCap className="h-3.5 w-3.5 text-primary" />
          </Link>
        )}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setCollapsed((v) => !v)}
                className={`${collapsed ? 'hidden' : 'flex'} h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-all shrink-0`}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Collapse sidebar</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {collapsed && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setCollapsed(false)}
                  className="absolute -right-3 top-16 flex h-6 w-6 items-center justify-center rounded-full border border-white/[0.1] bg-sidebar text-muted-foreground hover:text-foreground hover:bg-white/[0.06] shadow-lg transition-all z-10"
                  aria-label="Expand sidebar"
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Expand sidebar</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 px-2 py-4 overflow-y-auto" aria-label="Dashboard navigation">
        {!collapsed && (
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">
            Navigation
          </p>
        )}
        <TooltipProvider>
          {navItems.map(({ label, icon: Icon, to }) => (
            <Tooltip key={to} delayDuration={0}>
              <TooltipTrigger asChild>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-white/[0.07] text-foreground border border-white/[0.08]'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
                    } ${collapsed ? 'justify-center px-2' : ''}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Lime left indicator */}
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-primary" />
                      )}
                      <Icon
                        className={`h-4 w-4 shrink-0 transition-colors ${
                          isActive ? 'text-primary' : 'group-hover:text-foreground'
                        }`}
                      />
                      {!collapsed && <span>{label}</span>}
                    </>
                  )}
                </NavLink>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">{label}</TooltipContent>
              )}
            </Tooltip>
          ))}
        </TooltipProvider>
      </nav>

      {/* Bottom user section */}
      <div className="border-t border-white/[0.06] p-3">
        {!collapsed ? (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 mb-2">
            <div className="flex items-center gap-2.5">
              <UserAvatar user={user} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{user?.name || 'User'}</p>
                <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            {user?.role === 'admin' && (
              <div className="mt-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">
                  Admin
                </span>
              </div>
            )}
          </div>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-center mb-2">
                  <UserAvatar user={user} size="sm" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">{user?.name || 'Profile'}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Logout */}
        <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
          <AlertDialogTrigger asChild>
            <button
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all ${
                collapsed ? 'justify-center px-2' : ''
              }`}
              disabled={loggingOut}
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Logout</span>}
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="border-white/[0.08] bg-[#1C1D21]">
            <AlertDialogHeader>
              <AlertDialogTitle>Logging out?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                You'll need to sign in again to access your account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-white/10 bg-white/[0.04] hover:bg-white/[0.08]">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleLogoutConfirm}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                Logout
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </aside>
  );

  /* ─── Mobile topbar ───────────────────────────────────────────── */
  const MobileTopbar = () => (
    <div className="lg:hidden sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-white/[0.06] bg-sidebar/95 px-4 backdrop-blur-xl">
      <button
        onClick={() => setMobileOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-foreground hover:bg-white/[0.08] transition-colors"
        aria-expanded={mobileOpen}
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>
      <Link to="/" className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 border border-primary/20">
          <GraduationCap className="h-3 w-3 text-primary" />
        </div>
        <span className="text-sm font-bold tracking-tight">AMP</span>
      </Link>
      <div className="ml-auto flex items-center gap-2">
        <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
          <AlertDialogTrigger asChild>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
              disabled={loggingOut}
              aria-label="Logout"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="border-white/[0.08] bg-[#1C1D21]">
            <AlertDialogHeader>
              <AlertDialogTitle>Logging out?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                You'll need to sign in again to access your account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-white/10 bg-white/[0.04]">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogoutConfirm} className="bg-destructive text-white hover:bg-destructive/90">
                Logout
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );

  /* ─── Mobile drawer ───────────────────────────────────────────── */
  const MobileDrawer = () => (
    <AnimatePresence>
      {mobileOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="lg:hidden fixed inset-y-0 left-0 z-40 w-64 border-r border-white/[0.06] bg-sidebar flex flex-col"
          >
            <div className="flex h-14 items-center px-4 border-b border-white/[0.06]">
              <Link to="/" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 border border-primary/20">
                  <GraduationCap className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-[11px] font-bold tracking-tight leading-tight">
                  Alumni Management<br />Platform
                </span>
              </Link>
            </div>
            <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
              {navItems.map(({ label, icon: Icon, to }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-white/[0.07] text-foreground border border-white/[0.08]'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-primary" />
                      )}
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary' : ''}`} />
                      <span>{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
            <div className="border-t border-white/[0.06] p-3">
              <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] p-2.5">
                <UserAvatar user={user} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{user?.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <MobileTopbar />
      <MobileDrawer />

      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </div>
      </main>

      {/* Logout overlay */}
      <AnimatePresence>
        {loggingOut && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md"
          >
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/[0.08] bg-card/80 p-10 shadow-2xl">
              <Spinner className="h-10 w-10 text-primary" />
              <div className="text-center">
                <p className="text-lg font-semibold">Logging out…</p>
                <p className="text-sm text-muted-foreground">Please wait</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
