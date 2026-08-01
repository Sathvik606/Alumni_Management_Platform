import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { mentorshipService } from '@/services/mentorshipService';
import { alumniService } from '@/services/alumniService';
import useAuthStore from '@/store/authStore';
import {
  Users, MessageSquare, Video, Check, X, ChevronLeft, ChevronRight,
  Search, Star, CheckCircle, XCircle, Hourglass, Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';

const ITEMS_PER_PAGE = 12;

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
  }),
};

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };

function StatusBadge({ status }) {
  const map = {
    pending:  { cls: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20', icon: Hourglass },
    accepted: { cls: 'bg-primary/10 text-primary border-primary/20', icon: CheckCircle },
    declined: { cls: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle },
  };
  const { cls, icon: Icon } = map[status] || { cls: 'bg-white/5 text-muted-foreground border-white/10', icon: Clock };
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${cls}`}>
      <Icon className="h-2.5 w-2.5" />
      {status}
    </span>
  );
}

function MentorCard({ mentor, onBook }) {
  return (
    <motion.div variants={fadeUp} className="relative flex flex-col justify-between rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 overflow-hidden hover:border-white/[0.14] hover:bg-white/[0.04] transition-all duration-200 group">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start gap-3.5">
        <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center font-bold text-primary text-sm shrink-0 overflow-hidden">
          {mentor.profilePicture ? (
            <img src={mentor.profilePicture} alt={mentor.name} className="h-12 w-12 rounded-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            mentor.name?.substring(0, 2).toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center flex-wrap gap-1.5">
            <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{mentor.name}</h3>
            <span className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5 whitespace-nowrap">Mentor</span>
          </div>
          {mentor.currentJobTitle && (
            <p className="text-xs text-foreground/80 mt-0.5 font-medium truncate">
              {mentor.currentJobTitle}{mentor.company ? ` at ${mentor.company}` : ''}
            </p>
          )}
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {mentor.department || '—'} {mentor.graduationYear ? `· Class of '${String(mentor.graduationYear).slice(-2)}` : ''}
          </p>
        </div>
      </div>

      {mentor.mentorshipTopic && (
        <div className="mt-3 bg-white/[0.025] border border-white/[0.05] rounded-xl px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-0.5">Expertise</p>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{mentor.mentorshipTopic}</p>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-white/[0.06] mt-4 pt-3">
        <div className="flex items-center gap-1.5">
          <Star className="h-3 w-3 text-primary fill-primary" />
          <span className="text-[10px] font-semibold text-muted-foreground">Available</span>
        </div>
        <button
          onClick={() => onBook(mentor)}
          className="h-8 px-3.5 rounded-xl bg-primary text-[#0D1000] text-[11px] font-bold hover:bg-primary/95 transition-all flex items-center gap-1.5"
        >
          <MessageSquare className="h-3 w-3" />
          Request Session
        </button>
      </div>
    </motion.div>
  );
}

function SessionCard({ session, user, onAccept, onDecline }) {
  const isMentorForSession = user?._id === (session.mentorId?._id || session.mentorId);
  const contactPerson = isMentorForSession ? session.studentId : session.mentorId;

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/15">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {isMentorForSession ? 'Student:' : 'Mentor:'} {contactPerson?.name || '—'}
            </p>
            <p className="text-xs text-muted-foreground">Topic: {session.topic}</p>
          </div>
        </div>
        <StatusBadge status={session.status} />
      </div>

      <p className="text-xs text-muted-foreground/85 italic leading-relaxed bg-white/[0.02] border border-white/[0.04] rounded-xl px-3 py-2">
        "{session.message}"
      </p>

      {session.meetingLink && session.status === 'accepted' && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/15 border border-white/[0.04]">
          <Video className="h-4 w-4 text-primary shrink-0" />
          <a href={session.meetingLink} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary hover:underline truncate">
            Join Virtual Session
          </a>
        </div>
      )}

      {session.status === 'pending' && isMentorForSession && (
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onAccept(session)}
            className="inline-flex items-center gap-1 h-8 px-3 rounded-xl bg-primary text-[#0D1000] text-xs font-bold hover:bg-primary/95 transition-all"
          >
            <Check className="h-3.5 w-3.5" />
            Accept Session
          </button>
          <button
            onClick={() => onDecline(session._id)}
            className="inline-flex items-center gap-1 h-8 px-3 rounded-xl border border-destructive/25 bg-destructive/5 text-xs text-destructive hover:bg-destructive/10 transition-all"
          >
            <X className="h-3.5 w-3.5" />
            Decline
          </button>
        </div>
      )}
    </div>
  );
}

export default function MentorshipPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('browse');
  const [mentors, setMentors] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [bookModal, setBookModal] = useState({ open: false, mentor: null, topic: '', message: '' });
  const [meetModal, setMeetModal] = useState({ open: false, session: null, meetingLink: '' });

  const fetchMentors = async () => {
    setLoading(true);
    try {
      const data = await alumniService.list({ isMentor: 'true' });
      setMentors(data.filter(a => a._id !== user?._id));
    } catch {
      toast.error('Failed to load mentors');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const data = await mentorshipService.listSessions();
      setSessions(data);
    } catch {
      toast.error('Failed to load sessions');
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => { fetchMentors(); fetchSessions(); }, []);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!bookModal.topic.trim() || !bookModal.message.trim()) {
      toast.error('Validation error', { description: 'Topic and message are required.' });
      return;
    }
    try {
      await mentorshipService.requestSession({
        mentorId: bookModal.mentor._id,
        topic: bookModal.topic,
        message: bookModal.message,
      });
      toast.success('Session requested!', { description: `Your request has been sent to ${bookModal.mentor.name}.` });
      setBookModal({ open: false, mentor: null, topic: '', message: '' });
      fetchSessions();
    } catch (err) {
      toast.error('Failed to request session', { description: err.response?.data?.message || 'Something went wrong' });
    }
  };

  const handleAcceptSession = (session) => {
    setMeetModal({ open: true, session, meetingLink: '' });
  };

  const handleDeclineSession = async (id) => {
    try {
      await mentorshipService.updateSession(id, 'declined');
      toast.success('Session declined');
      fetchSessions();
    } catch (err) {
      toast.error('Failed to decline', { description: err.response?.data?.message || 'Something went wrong' });
    }
  };

  const handleConfirmAccept = async (e) => {
    e.preventDefault();
    try {
      await mentorshipService.updateSession(meetModal.session._id, 'accepted', meetModal.meetingLink);
      toast.success('Session accepted!', { description: meetModal.meetingLink ? 'Meeting link shared with student.' : 'Student notified.' });
      setMeetModal({ open: false, session: null, meetingLink: '' });
      fetchSessions();
    } catch (err) {
      toast.error('Failed to accept session', { description: err.response?.data?.message || 'Something went wrong' });
    }
  };

  const filteredMentors = mentors.filter(m => {
    const q = searchQuery.toLowerCase();
    return !q || m.name?.toLowerCase().includes(q) || m.department?.toLowerCase().includes(q) || m.company?.toLowerCase().includes(q) || m.mentorshipTopic?.toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filteredMentors.length / ITEMS_PER_PAGE);
  const paginatedMentors = filteredMentors.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const pendingSessions = sessions.filter(s => s.status === 'pending');
  const acceptedSessions = sessions.filter(s => s.status === 'accepted');
  const declinedSessions = sessions.filter(s => s.status === 'declined');

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Mentorship"
        title="1-on-1 Sessions"
        subtitle="Connect with alumni mentors for career guidance, mock interviews, and professional development."
      >
        {activeTab === 'browse' && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
            <Input
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search mentors..."
              className="h-9 pl-9 w-64 bg-white/[0.04] border-white/[0.1] text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl text-sm"
            />
          </div>
        )}
      </PageHeader>

      {/* Stats row */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Available Mentors', value: mentors.length, icon: Users, color: '#C8FA5F' },
          { label: 'Active Sessions', value: acceptedSessions.length, icon: CheckCircle, color: '#38D9A9' },
          { label: 'Pending Requests', value: pendingSessions.length, icon: Hourglass, color: '#A78BFA' },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${s.color}18`, border: `1px solid ${s.color}30` }}>
              <s.icon className="h-4 w-4" style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground leading-none mb-0.5">{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/[0.06] pb-px">
        {[
          { id: 'browse', label: 'Browse Mentors' },
          { id: 'sessions', label: `My Sessions${sessions.length > 0 ? ` (${sessions.length})` : ''}` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Browse Mentors Tab */}
      {activeTab === 'browse' && (
        <>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-52 rounded-2xl bg-white/[0.04]" />
              ))}
            </div>
          ) : filteredMentors.length === 0 ? (
            <EmptyState
              icon={Users}
              title={searchQuery ? 'No mentors match your search' : 'No mentors available yet'}
              description={searchQuery ? 'Try a different search term.' : 'Alumni can enable mentorship from their profile settings.'}
              ctaLabel={searchQuery ? 'Clear search' : undefined}
              onCta={searchQuery ? () => setSearchQuery('') : undefined}
            />
          ) : (
            <>
              <motion.div initial="hidden" animate="visible" variants={stagger} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedMentors.map((m) => (
                  <MentorCard
                    key={m._id}
                    mentor={m}
                    onBook={(mentor) => setBookModal({ open: true, mentor, topic: '', message: '' })}
                  />
                ))}
              </motion.div>

              {totalPages > 1 && (
                <nav className="flex items-center justify-between px-5 py-3.5 border border-white/[0.07] bg-white/[0.015] rounded-xl">
                  <p className="text-xs text-muted-foreground">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredMentors.length)} of {filteredMentors.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.03] text-muted-foreground hover:bg-white/[0.07] hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-xs text-muted-foreground px-2">{currentPage} / {totalPages}</span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.03] text-muted-foreground hover:bg-white/[0.07] hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </nav>
              )}
            </>
          )}
        </>
      )}

      {/* My Sessions Tab */}
      {activeTab === 'sessions' && (
        <>
          {sessionsLoading ? (
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl bg-white/[0.04]" />)}
            </div>
          ) : sessions.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No sessions yet"
              description="Browse mentors and book a 1-on-1 session to get started."
              ctaLabel="Browse Mentors"
              onCta={() => setActiveTab('browse')}
            />
          ) : (
            <div className="space-y-6">
              {pendingSessions.length > 0 && (
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-yellow-400 font-semibold mb-3">Pending Requests ({pendingSessions.length})</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {pendingSessions.map(s => (
                      <SessionCard key={s._id} session={s} user={user} onAccept={handleAcceptSession} onDecline={handleDeclineSession} />
                    ))}
                  </div>
                </div>
              )}
              {acceptedSessions.length > 0 && (
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-primary font-semibold mb-3">Active Sessions ({acceptedSessions.length})</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {acceptedSessions.map(s => (
                      <SessionCard key={s._id} session={s} user={user} onAccept={handleAcceptSession} onDecline={handleDeclineSession} />
                    ))}
                  </div>
                </div>
              )}
              {declinedSessions.length > 0 && (
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-3">Declined ({declinedSessions.length})</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {declinedSessions.map(s => (
                      <SessionCard key={s._id} session={s} user={user} onAccept={handleAcceptSession} onDecline={handleDeclineSession} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Book Session Modal */}
      <Dialog open={bookModal.open} onOpenChange={(open) => !open && setBookModal({ open: false, mentor: null, topic: '', message: '' })}>
        <DialogContent className="border-white/[0.08] bg-[#1C1D21] max-w-md w-full rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle>Request Mentorship Session</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Send a booking request to <strong>{bookModal.mentor?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBook} className="space-y-4 mt-3">
            <div className="space-y-1.5">
              <Label htmlFor="book-topic" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Topic of Discussion *
              </Label>
              <Input
                id="book-topic"
                required
                placeholder="e.g. Career switch to ML, Resume review"
                value={bookModal.topic}
                onChange={(e) => setBookModal(p => ({ ...p, topic: e.target.value }))}
                className="h-10 bg-white/[0.04] border-white/[0.1] text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="book-msg" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Your Message *
              </Label>
              <textarea
                id="book-msg"
                required
                rows={4}
                placeholder="Introduce yourself and describe what you'd like to discuss..."
                value={bookModal.message}
                onChange={(e) => setBookModal(p => ({ ...p, message: e.target.value }))}
                className="w-full p-3 bg-white/[0.04] border border-white/[0.1] text-foreground text-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl outline-none resize-none"
              />
            </div>
            <DialogFooter className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setBookModal({ open: false, mentor: null, topic: '', message: '' })}
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

      {/* Accept + Meeting Link Modal */}
      <Dialog open={meetModal.open} onOpenChange={(open) => !open && setMeetModal({ open: false, session: null, meetingLink: '' })}>
        <DialogContent className="border-white/[0.08] bg-[#1C1D21] max-w-md w-full rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle>Accept Mentorship Request</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Optionally add a Google Meet / Zoom link for this session.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConfirmAccept} className="space-y-4 mt-3">
            <div className="space-y-1.5">
              <Label htmlFor="meet-link" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Virtual Meeting URL (Optional)
              </Label>
              <Input
                id="meet-link"
                type="url"
                placeholder="https://meet.google.com/..."
                value={meetModal.meetingLink}
                onChange={(e) => setMeetModal(p => ({ ...p, meetingLink: e.target.value }))}
                className="h-10 bg-white/[0.04] border-white/[0.1] text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl"
              />
            </div>
            <DialogFooter className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMeetModal({ open: false, session: null, meetingLink: '' })}
                className="px-4 py-2 rounded-xl border border-white/[0.1] bg-white/[0.03] text-sm text-muted-foreground hover:bg-white/[0.07] hover:text-foreground transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/10"
              >
                Accept &amp; Save
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
