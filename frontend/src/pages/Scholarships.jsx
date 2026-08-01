import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { scholarshipService } from '@/services/scholarshipService';
import useAuthStore from '@/store/authStore';
import {
  GraduationCap, Plus, Heart, CheckCircle2, Search,
  ChevronLeft, ChevronRight, TrendingUp, Sparkles, User, Gift
} from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';

const ITEMS_PER_PAGE = 9;

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
  }),
};

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };

function ScholarshipCard({ item, user, onFund }) {
  const percent = Math.min(100, Math.round(((item.amountRaised || 0) / (item.amountNeeded || 1)) * 100));
  const isFullyFunded = item.status === 'funded' || percent >= 100;

  return (
    <motion.div
      variants={fadeUp}
      className="relative flex flex-col justify-between rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 overflow-hidden hover:border-white/[0.14] hover:bg-white/[0.04] transition-all duration-200 group"
    >
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center font-bold text-primary text-xs shrink-0 overflow-hidden">
              {item.studentId?.profilePicture ? (
                <img src={item.studentId.profilePicture} alt={item.studentId.name} className="h-10 w-10 rounded-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                item.studentId?.name?.substring(0, 2).toUpperCase() || <User className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{item.title}</h3>
              <p className="text-xs text-muted-foreground truncate">
                by {item.studentId?.name || 'Student'} • {item.studentId?.department || 'General'}
              </p>
            </div>
          </div>
          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${
            isFullyFunded ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-primary/10 text-primary border-primary/20'
          }`}>
            {isFullyFunded ? 'Funded' : 'Active'}
          </span>
        </div>

        <p className="text-xs text-muted-foreground/85 line-clamp-3 leading-relaxed bg-white/[0.015] border border-white/[0.03] rounded-xl p-3 mb-4">
          "{item.description}"
        </p>
      </div>

      <div className="space-y-3 border-t border-white/[0.06] pt-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-primary font-bold">{percent}% Raised</span>
            <span className="text-muted-foreground">
              ₹{(item.amountRaised || 0).toLocaleString()} of ₹{(item.amountNeeded || 0).toLocaleString()}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isFullyFunded ? 'bg-emerald-400' : 'bg-gradient-to-r from-primary to-emerald-400'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <p className="text-[11px] text-muted-foreground/60">
            Needed: <strong className="text-foreground">₹{(item.amountNeeded - item.amountRaised > 0 ? item.amountNeeded - item.amountRaised : 0).toLocaleString()}</strong>
          </p>
          {!isFullyFunded && user?.role !== 'student' && (
            <button
              onClick={() => onFund(item)}
              className="h-8 px-3.5 rounded-xl bg-primary text-[#0D1000] text-[11px] font-bold hover:bg-primary/95 transition-all inline-flex items-center gap-1 shadow-sm"
            >
              <Heart className="h-3 w-3 fill-[#0D1000]" />
              Sponsor Now
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function ScholarshipsPage() {
  const { user } = useAuthStore();
  const [scholarships, setScholarships] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [createModal, setCreateModal] = useState({ open: false, title: '', description: '', amountNeeded: '' });
  const [fundModal, setFundModal] = useState({ open: false, scholarship: null, amount: '' });

  const fetchScholarships = async () => {
    setLoading(true);
    try {
      const all = await scholarshipService.listAll();
      setScholarships(all);
      if (user?.role === 'student') {
        const mine = await scholarshipService.listMyRequests();
        setMyRequests(mine);
      }
    } catch {
      toast.error('Failed to load scholarships');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchScholarships(); }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const amount = Number(createModal.amountNeeded);
    if (!createModal.title.trim() || !createModal.description.trim() || isNaN(amount) || amount <= 0) {
      toast.error('Validation error', { description: 'Please fill in all fields with a valid target amount.' });
      return;
    }
    try {
      await scholarshipService.createRequest({
        title: createModal.title,
        description: createModal.description,
        amountNeeded: amount,
      });
      toast.success('Scholarship campaign created!', { description: 'Your request is now open for sponsors.' });
      setCreateModal({ open: false, title: '', description: '', amountNeeded: '' });
      fetchScholarships();
    } catch (err) {
      toast.error('Failed to create campaign', { description: err.response?.data?.message || 'Something went wrong' });
    }
  };

  const handleFund = async (e) => {
    e.preventDefault();
    const amount = Number(fundModal.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Validation error', { description: 'Please enter a valid contribution amount.' });
      return;
    }
    try {
      await scholarshipService.fundRequest(fundModal.scholarship._id, amount);
      toast.success('Contribution successful!', { description: `Funded ₹${amount.toLocaleString()} for "${fundModal.scholarship.title}".` });
      setFundModal({ open: false, scholarship: null, amount: '' });
      fetchScholarships();
    } catch (err) {
      toast.error('Funding failed', { description: err.response?.data?.message || 'Something went wrong' });
    }
  };

  const displayList = activeTab === 'mine' ? myRequests : scholarships;
  const filtered = displayList.filter(s => {
    const q = searchQuery.toLowerCase();
    return !q || s.title?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q) || s.studentId?.name?.toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const totalRaisedAll = scholarships.reduce((sum, s) => sum + (s.amountRaised || 0), 0);
  const totalFundedCount = scholarships.filter(s => s.status === 'funded' || (s.amountRaised >= s.amountNeeded)).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Financial Aid"
        title="Scholarship Campaigns"
        subtitle="Empower students by sponsoring tuition fees, books, and educational supplies."
      >
        <div className="flex items-center gap-2">
          {user?.role === 'student' && (
            <button
              onClick={() => setCreateModal({ open: true, title: '', description: '', amountNeeded: '' })}
              className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all inline-flex items-center gap-1.5 shadow-lg shadow-primary/10"
            >
              <Plus className="h-3.5 w-3.5" />
              Request Scholarship
            </button>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
            <Input
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search campaigns..."
              className="h-9 pl-9 w-56 bg-white/[0.04] border-white/[0.1] text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl text-sm"
            />
          </div>
        </div>
      </PageHeader>

      {/* Stats row */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Total Aid Raised', value: `₹${totalRaisedAll.toLocaleString()}`, icon: TrendingUp, color: '#C8FA5F' },
          { label: 'Active Campaigns', value: scholarships.length, icon: GraduationCap, color: '#A78BFA' },
          { label: 'Fully Funded', value: totalFundedCount, icon: CheckCircle2, color: '#38D9A9' },
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
        <button
          onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'all'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          All Campaigns ({scholarships.length})
        </button>
        {user?.role === 'student' && (
          <button
            onClick={() => { setActiveTab('mine'); setCurrentPage(1); }}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'mine'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            My Campaigns ({myRequests.length})
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl bg-white/[0.04]" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title={searchQuery ? 'No campaigns match your search' : 'No scholarship campaigns found'}
          description={user?.role === 'student' ? 'Request academic aid by launching your first campaign.' : 'Check back later for student aid requests.'}
          ctaLabel={user?.role === 'student' ? 'Request Aid' : undefined}
          onCta={user?.role === 'student' ? () => setCreateModal({ open: true, title: '', description: '', amountNeeded: '' }) : undefined}
        />
      ) : (
        <>
          <motion.div initial="hidden" animate="visible" variants={stagger} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginated.map((item) => (
              <ScholarshipCard key={item._id} item={item} user={user} onFund={(s) => setFundModal({ open: true, scholarship: s, amount: '' })} />
            ))}
          </motion.div>

          {totalPages > 1 && (
            <nav className="flex items-center justify-between px-5 py-3.5 border border-white/[0.07] bg-white/[0.015] rounded-xl">
              <p className="text-xs text-muted-foreground">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
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

      {/* Create Campaign Modal */}
      <Dialog open={createModal.open} onOpenChange={(open) => !open && setCreateModal({ open: false, title: '', description: '', amountNeeded: '' })}>
        <DialogContent className="border-white/[0.08] bg-[#1C1D21] max-w-md w-full rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle>Request Scholarship Aid</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Submit details about your educational costs for alumni sponsorship.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-3">
            <div className="space-y-1.5">
              <Label htmlFor="sch-title" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Campaign Title *
              </Label>
              <Input
                id="sch-title"
                required
                placeholder="e.g. Final Semester Tuition Support"
                value={createModal.title}
                onChange={(e) => setCreateModal(p => ({ ...p, title: e.target.value }))}
                className="h-10 bg-white/[0.04] border-white/[0.1] text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sch-amount" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Target Amount Needed (₹) *
              </Label>
              <Input
                id="sch-amount"
                type="number"
                min="1"
                required
                placeholder="e.g. 25000"
                value={createModal.amountNeeded}
                onChange={(e) => setCreateModal(p => ({ ...p, amountNeeded: e.target.value }))}
                className="h-10 bg-white/[0.04] border-white/[0.1] text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sch-desc" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Description / Purpose *
              </Label>
              <textarea
                id="sch-desc"
                required
                rows={4}
                placeholder="Explain why you are requesting aid and how it will support your studies..."
                value={createModal.description}
                onChange={(e) => setCreateModal(p => ({ ...p, description: e.target.value }))}
                className="w-full p-3 bg-white/[0.04] border border-white/[0.1] text-foreground text-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl outline-none resize-none"
              />
            </div>
            <DialogFooter className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateModal({ open: false, title: '', description: '', amountNeeded: '' })}
                className="px-4 py-2 rounded-xl border border-white/[0.1] bg-white/[0.03] text-sm text-muted-foreground hover:bg-white/[0.07] hover:text-foreground transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/10"
              >
                Launch Campaign
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Fund Modal */}
      <Dialog open={fundModal.open} onOpenChange={(open) => !open && setFundModal({ open: false, scholarship: null, amount: '' })}>
        <DialogContent className="border-white/[0.08] bg-[#1C1D21] max-w-md w-full rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle>Sponsor Campaign</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Contribute to <strong>{fundModal.scholarship?.title}</strong>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFund} className="space-y-4 mt-3">
            <div className="space-y-1.5">
              <Label htmlFor="fund-amount" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Contribution Amount (₹) *
              </Label>
              <Input
                id="fund-amount"
                type="number"
                min="1"
                required
                placeholder="e.g. 5000"
                value={fundModal.amount}
                onChange={(e) => setFundModal(p => ({ ...p, amount: e.target.value }))}
                className="h-10 bg-white/[0.04] border-white/[0.1] text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl"
              />
            </div>
            <DialogFooter className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFundModal({ open: false, scholarship: null, amount: '' })}
                className="px-4 py-2 rounded-xl border border-white/[0.1] bg-white/[0.03] text-sm text-muted-foreground hover:bg-white/[0.07] hover:text-foreground transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/10"
              >
                Confirm Sponsor
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
