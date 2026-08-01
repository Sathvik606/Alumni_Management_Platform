import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem, ComboboxEmpty } from '@/components/ui/combobox';
import { donationService } from '@/services/donationService';
import { scholarshipService } from '@/services/scholarshipService';
import useAuthStore from '@/store/authStore';
import { Skeleton } from '@/components/ui/skeleton';
import { Gift, Pencil, Trash2, ChevronLeft, ChevronRight, Download, TrendingUp, Heart, GraduationCap, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { exportDonations } from '@/utils/exportUtils';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';

const defaultForm = {
  amount: '', currency: 'INR', purpose: '', message: '', paymentMethod: 'online', status: 'completed',
};
const ITEMS_PER_PAGE = 20;

const AMOUNT_PRESETS = [500, 1000, 2500, 5000];

function StatusPill({ status }) {
  const map = {
    completed: 'bg-teal-400/10 text-teal-400 border-teal-400/20',
    pledged: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
    cancelled: 'bg-red-400/10 text-red-400 border-red-400/20',
  };
  return (
    <span className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 border ${map[status] || 'bg-white/[0.05] text-muted-foreground border-white/10'}`}>
      {status}
    </span>
  );
}

export default function DonationsPage() {
  const { user } = useAuthStore();
  const [donations, setDonations] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modal, setModal] = useState({ open: false, donation: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [currentPage, setCurrentPage] = useState(1);
  const isAdmin = user?.role === 'admin';

  // Scholarship support states
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' or 'scholarships'
  const [scholarships, setScholarships] = useState([]);
  const [myScholarships, setMyScholarships] = useState([]);
  const [scholarshipModal, setScholarshipModal] = useState({ open: false, title: '', description: '', amountNeeded: '' });
  const [fundModal, setFundModal] = useState({ open: false, scholarship: null, amount: '' });

  const fetchScholarships = async () => {
    try {
      const all = await scholarshipService.listAll();
      setScholarships(all);
      if (user?.role === 'student') {
        const mine = await scholarshipService.listMyRequests();
        setMyScholarships(mine);
      }
    } catch (err) {
      console.error('Failed to load scholarships', err);
    }
  };

  const handleCreateScholarship = async (e) => {
    e.preventDefault();
    if (!scholarshipModal.title || !scholarshipModal.description || !scholarshipModal.amountNeeded) {
      toast.error('Validation error', { description: 'All fields are required.' });
      return;
    }
    try {
      await scholarshipService.createRequest({
        title: scholarshipModal.title,
        description: scholarshipModal.description,
        amountNeeded: Number(scholarshipModal.amountNeeded)
      });
      toast.success('Scholarship campaign launched!', { description: 'Your request is now open for sponsors.' });
      setScholarshipModal({ open: false, title: '', description: '', amountNeeded: '' });
      fetchScholarships();
    } catch (err) {
      toast.error('Failed to launch campaign', { description: err.response?.data?.message || 'Something went wrong' });
    }
  };

  const handleFundScholarship = async (e) => {
    e.preventDefault();
    const fundAmount = Number(fundModal.amount);
    if (isNaN(fundAmount) || fundAmount <= 0) {
      toast.error('Validation error', { description: 'Please enter a valid amount' });
      return;
    }
    try {
      await scholarshipService.fundRequest(fundModal.scholarship._id, fundAmount);
      toast.success('Campaign funded!', { description: `Successfully contributed ₹${fundAmount.toLocaleString()} to this student.` });
      setFundModal({ open: false, scholarship: null, amount: '' });
      fetchScholarships();
      // Reload donations list to show the new donation
      const data = await donationService.list();
      setDonations(data);
    } catch (err) {
      toast.error('Funding failed', { description: err.response?.data?.message || 'Something went wrong' });
    }
  };

  const totalPages = Math.ceil(donations.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedDonations = donations.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const goToPage = (page) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));

  const fetchDonations = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await donationService.list(isAdmin ? 'admin' : 'alumni');
      setDonations(data);
    } catch {
      setError('Unable to load donations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDonations(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMutating(true);
    setError('');
    setSuccess('');
    if (!form.amount || Number(form.amount) <= 0) {
      setError('Amount must be greater than 0');
      setMutating(false);
      return;
    }
    if (!form.purpose || form.purpose.trim().length < 3) {
      setError('Purpose must be at least 3 characters');
      setMutating(false);
      return;
    }
    if (form.message && form.message.length > 500) {
      setError('Message must be less than 500 characters');
      setMutating(false);
      return;
    }
    try {
      const optimistic = { ...form, _id: Math.random().toString(36), donatedBy: user, createdAt: new Date().toISOString() };
      setDonations((prev) => [optimistic, ...prev]);
      const saved = await donationService.create({ ...form, amount: Number(form.amount) });
      setDonations((prev) => [saved, ...prev.filter((d) => d._id !== optimistic._id)]);
      setForm(defaultForm);
      setSuccess('Donation recorded successfully.');
      toast.success('Donation recorded!', { description: `${form.currency} ${form.amount} for ${form.purpose}` });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to record donation';
      setError(msg);
      setDonations((prev) => prev.filter((d) => !d._id?.startsWith('0.')));
      toast.error('Failed to record donation', { description: msg });
    } finally {
      setMutating(false);
    }
  };

  const handleUpdate = async () => {
    if (!modal.donation || !isAdmin) return;
    setMutating(true);
    setError('');
    if (!modal.donation.amount || Number(modal.donation.amount) <= 0) {
      setError('Amount must be greater than 0');
      setMutating(false);
      return;
    }
    if (!modal.donation.purpose || modal.donation.purpose.trim().length < 3) {
      setError('Purpose must be at least 3 characters');
      setMutating(false);
      return;
    }
    try {
      const updated = await donationService.update(modal.donation._id, {
        amount: Number(modal.donation.amount),
        currency: modal.donation.currency,
        purpose: modal.donation.purpose,
        message: modal.donation.message,
        paymentMethod: modal.donation.paymentMethod,
        status: modal.donation.status,
      });
      setDonations((prev) => prev.map((d) => (d._id === updated._id ? updated : d)));
      setModal({ open: false, donation: null });
      toast.success('Donation updated!', { description: 'Changes have been saved.' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update donation';
      setError(msg);
      toast.error('Failed to update donation', { description: msg });
    } finally {
      setMutating(false);
    }
  };

  const handleDelete = async (id) => {
    setMutating(true);
    try {
      await donationService.remove(id);
      setDonations((prev) => prev.filter((d) => d._id !== id));
      setDeleteDialog({ open: false, id: null });
      toast.success('Donation deleted', { description: 'The donation record has been removed.' });
    } catch (err) {
      toast.error('Failed to delete donation', { description: err.response?.data?.message || 'Delete failed' });
    } finally {
      setMutating(false);
    }
  };

  const totalAmount = useMemo(() => donations.reduce((sum, d) => sum + (d.amount || 0), 0), [donations]);
  const completedCount = useMemo(() => donations.filter((d) => d.status === 'completed').length, [donations]);

  const inputClass = "h-10 bg-white/[0.04] border-white/[0.1] text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl";
  const labelClass = "text-xs font-semibold uppercase tracking-wide text-muted-foreground";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Donations"
        title="Track Contributions"
        subtitle={isAdmin ? 'All recorded donations across the alumni network.' : 'Your giving history and new contributions.'}
      >
        {activeTab === 'explore' && (
          <button
            onClick={() => { exportDonations(donations); toast.success('Export started', { description: 'Downloading donations as CSV...' }); }}
            disabled={donations.length === 0}
            className="h-9 px-3.5 rounded-xl border border-white/[0.1] bg-white/[0.03] text-xs font-medium text-muted-foreground hover:bg-white/[0.07] hover:text-foreground transition-all disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        )}
        {activeTab === 'scholarships' && user?.role === 'student' && (
          <button
            onClick={() => setScholarshipModal({ open: true, title: '', description: '', amountNeeded: '' })}
            className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all inline-flex items-center gap-1.5 shadow-lg shadow-primary/10"
          >
            <Plus className="h-3.5 w-3.5" />
            Request Support
          </button>
        )}
      </PageHeader>

      {/* Tab Selector */}
      <div className="flex gap-2 border-b border-white/[0.06] pb-px">
        <button
          onClick={() => setActiveTab('explore')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'explore'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Giving Records
        </button>
        <button
          onClick={() => { setActiveTab('scholarships'); fetchScholarships(); }}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'scholarships'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Scholarship & Aid Requests
        </button>
      </div>

      {activeTab === 'explore' && (
        <>

      {/* Stats row */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Total Raised', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalAmount), icon: TrendingUp, color: '#C8FA5F' },
          { label: 'Total Donations', value: donations.length.toLocaleString(), icon: Gift, color: '#A78BFA' },
          { label: 'Completed', value: completedCount.toLocaleString(), icon: Heart, color: '#38D9A9' },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${s.color}18`, border: `1px solid ${s.color}30` }}>
              <s.icon className="h-4 w-4" style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground leading-none mb-0.5">{loading ? '—' : s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Panel */}
        <div className="lg:col-span-1">
          {user?.role === 'student' ? (
            <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-5 space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <GraduationCap className="h-4 w-4" />
                <span>Student Assistance Hub</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                As a student, you can apply for academic financial aid and tuition sponsorships from verified alumni.
              </p>
              <button
                onClick={() => { setActiveTab('scholarships'); fetchScholarships(); }}
                className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-all shadow-md shadow-primary/10"
              >
                Request Scholarship Aid
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
              <p className="text-sm font-semibold mb-5">Record a Donation</p>
              <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Amount with presets */}
              <div className="space-y-1.5">
                <Label className={labelClass}>Amount</Label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {AMOUNT_PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, amount: String(p) }))}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                        form.amount === String(p)
                          ? 'bg-primary/15 border-primary/30 text-primary'
                          : 'border-white/[0.1] bg-white/[0.03] text-muted-foreground hover:bg-white/[0.07] hover:text-foreground'
                      }`}
                    >
                      ₹{p.toLocaleString()}
                    </button>
                  ))}
                </div>
                <Input type="number" min="0.01" step="0.01" required
                  value={form.amount}
                  onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                  placeholder="Custom amount"
                  className={inputClass} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className={labelClass}>Currency</Label>
                  <Combobox value={form.currency} onValueChange={(v) => setForm((p) => ({ ...p, currency: v }))}>
                    <ComboboxInput placeholder="Currency" className={`${inputClass} w-full`} />
                    <ComboboxContent>
                      <ComboboxList>
                        <ComboboxItem value="INR">INR</ComboboxItem>
                        <ComboboxItem value="USD">USD</ComboboxItem>
                      </ComboboxList>
                      <ComboboxEmpty>No currency found.</ComboboxEmpty>
                    </ComboboxContent>
                  </Combobox>
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClass}>Status</Label>
                  <Combobox value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                    <ComboboxInput placeholder="Status" className={`${inputClass} w-full`} />
                    <ComboboxContent>
                      <ComboboxList>
                        <ComboboxItem value="completed">Completed</ComboboxItem>
                        <ComboboxItem value="pledged">Pledged</ComboboxItem>
                        <ComboboxItem value="cancelled">Cancelled</ComboboxItem>
                      </ComboboxList>
                      <ComboboxEmpty>No status found.</ComboboxEmpty>
                    </ComboboxContent>
                  </Combobox>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="purpose" className={labelClass}>Purpose *</Label>
                <Input id="purpose" required minLength={3} maxLength={100}
                  placeholder="Scholarship fund"
                  value={form.purpose}
                  onChange={(e) => setForm((p) => ({ ...p, purpose: e.target.value }))}
                  className={inputClass} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="message" className={labelClass}>Message (optional)</Label>
                <Textarea id="message" rows={3} maxLength={500}
                  placeholder="Notes for the admin..."
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  className="bg-white/[0.04] border-white/[0.1] text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl" />
              </div>

              <div className="space-y-1.5">
                <Label className={labelClass}>Payment Method</Label>
                <Combobox value={form.paymentMethod} onValueChange={(v) => setForm((p) => ({ ...p, paymentMethod: v }))}>
                  <ComboboxInput placeholder="Select method" className={`${inputClass} w-full`} />
                  <ComboboxContent>
                    <ComboboxList>
                      <ComboboxItem value="online">Online</ComboboxItem>
                      <ComboboxItem value="bank-transfer">Bank Transfer</ComboboxItem>
                      <ComboboxItem value="cash">Cash</ComboboxItem>
                      <ComboboxItem value="other">Other</ComboboxItem>
                    </ComboboxList>
                    <ComboboxEmpty>No method found.</ComboboxEmpty>
                  </ComboboxContent>
                </Combobox>
              </div>

              {error && <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2" role="alert">{error}</p>}
              {success && <p className="text-sm text-teal-400 bg-teal-400/10 border border-teal-400/20 rounded-xl px-3 py-2">{success}</p>}

              <button type="submit" disabled={mutating}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                <Gift className="h-4 w-4" />
                {mutating ? 'Saving…' : 'Submit Donation'}
              </button>
            </form>
          </div>
          )}
        </div>

        {/* Records Table */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.015] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.02]">
              <p className="text-sm font-semibold">
                {isAdmin ? 'All Donations' : 'Your Donations'}
                {!loading && <span className="ml-2 text-muted-foreground font-normal text-xs">({donations.length})</span>}
              </p>
            </div>

            {loading ? (
              <div className="p-4 space-y-2">
                {[1,2,3,4].map((i) => <Skeleton key={i} className="h-14 rounded-xl bg-white/[0.04]" />)}
              </div>
            ) : donations.length === 0 ? (
              <EmptyState
                icon={Gift}
                title="No donations yet"
                description="Add your first contribution using the form."
                className="m-4 border-white/[0.06]"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60 bg-white/[0.02]">Purpose</th>
                      <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60 bg-white/[0.02]">Amount</th>
                      <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60 bg-white/[0.02] hidden sm:table-cell">Status</th>
                      <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60 bg-white/[0.02] hidden md:table-cell">Method</th>
                      {isAdmin && <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60 bg-white/[0.02] hidden lg:table-cell">Donor</th>}
                      <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60 bg-white/[0.02] hidden sm:table-cell">Date</th>
                      {isAdmin && <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60 bg-white/[0.02]">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedDonations.map((d) => (
                      <tr key={d._id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5 text-sm font-semibold text-foreground">{d.purpose}</td>
                        <td className="px-5 py-3.5 text-sm font-semibold text-primary">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: d.currency || 'INR', maximumFractionDigits: 0 }).format(d.amount || 0)}
                        </td>
                        <td className="px-5 py-3.5 hidden sm:table-cell"><StatusPill status={d.status} /></td>
                        <td className="px-5 py-3.5 hidden md:table-cell text-sm text-muted-foreground capitalize">{d.paymentMethod}</td>
                        {isAdmin && <td className="px-5 py-3.5 hidden lg:table-cell text-sm text-muted-foreground">{d.donatedBy?.name || '—'}</td>}
                        <td className="px-5 py-3.5 hidden sm:table-cell text-sm text-muted-foreground">{new Date(d.createdAt).toLocaleDateString()}</td>
                        {isAdmin && (
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button onClick={() => isAdmin && setModal({ open: true, donation: d })} disabled={mutating}
                                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-all disabled:opacity-40">
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit donation</TooltipContent>
                                </Tooltip>
                                <AlertDialog open={deleteDialog.open && deleteDialog.id === d._id} onOpenChange={(open) => setDeleteDialog({ open, id: open ? d._id : null })}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <AlertDialogTrigger asChild>
                                        <button disabled={mutating}
                                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all disabled:opacity-40">
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </AlertDialogTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>Delete donation</TooltipContent>
                                  </Tooltip>
                                  <AlertDialogContent className="border-white/[0.08] bg-[#1C1D21]">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete donation record?</AlertDialogTitle>
                                      <AlertDialogDescription className="text-muted-foreground">
                                        This will permanently remove <strong className="text-foreground">{d.currency} {d.amount}</strong> for <strong className="text-foreground">{d.purpose}</strong>.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="border-white/[0.1] bg-white/[0.03]">Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(d._id)} className="bg-destructive text-white hover:bg-destructive/90">Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </TooltipProvider>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!loading && donations.length > ITEMS_PER_PAGE && (
              <nav className="flex items-center justify-between px-5 py-3.5 border-t border-white/[0.06] bg-white/[0.02]">
                <p className="text-xs text-muted-foreground">
                  {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, donations.length)} of {donations.length}
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.03] text-muted-foreground hover:bg-white/[0.07] hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-xs text-muted-foreground px-2">{currentPage} / {totalPages}</span>
                  <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.03] text-muted-foreground hover:bg-white/[0.07] hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </nav>
            )}
          </div>
        </div>
      </div>
    </>)}

      {/* Edit Modal (Admin) */}
      <Dialog open={modal.open} onOpenChange={(open) => setModal((p) => ({ ...p, open }))}>
        {modal.donation && (
          <DialogContent className="border-white/[0.08] bg-[#1C1D21]">
            <DialogHeader>
              <DialogTitle>Edit Donation</DialogTitle>
              <DialogDescription className="text-muted-foreground">Updates persist to backend immediately.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className={labelClass}>Amount</Label>
                  <Input type="number" min="0.01" step="0.01" required
                    value={modal.donation.amount}
                    onChange={(e) => setModal((p) => ({ ...p, donation: { ...p.donation, amount: Number(e.target.value) } }))}
                    className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClass}>Status</Label>
                  <Combobox value={modal.donation.status} onValueChange={(v) => setModal((p) => ({ ...p, donation: { ...p.donation, status: v } }))}>
                    <ComboboxInput placeholder="Select status" className={`${inputClass} w-full`} />
                    <ComboboxContent>
                      <ComboboxList>
                        <ComboboxItem value="completed">Completed</ComboboxItem>
                        <ComboboxItem value="pledged">Pledged</ComboboxItem>
                        <ComboboxItem value="cancelled">Cancelled</ComboboxItem>
                      </ComboboxList>
                      <ComboboxEmpty>No status.</ComboboxEmpty>
                    </ComboboxContent>
                  </Combobox>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className={labelClass}>Purpose</Label>
                <Input required minLength={3} maxLength={100}
                  value={modal.donation.purpose}
                  onChange={(e) => setModal((p) => ({ ...p, donation: { ...p.donation, purpose: e.target.value } }))}
                  className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <Label className={labelClass}>Message</Label>
                <Textarea rows={3} maxLength={500}
                  value={modal.donation.message || ''}
                  onChange={(e) => setModal((p) => ({ ...p, donation: { ...p.donation, message: e.target.value } }))}
                  className="bg-white/[0.04] border-white/[0.1] text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl" />
              </div>
            </div>
            <DialogFooter>
              <button onClick={() => setModal({ open: false, donation: null })}
                className="px-4 py-2 rounded-xl border border-white/[0.1] bg-white/[0.03] text-sm text-muted-foreground hover:bg-white/[0.07] hover:text-foreground transition-all">
                Cancel
              </button>
              <button onClick={handleUpdate} disabled={mutating}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-60">
                Save Changes
              </button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Scholarship Support view */}
      {activeTab === 'scholarships' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Active Campaigns */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Student Campaigns Open for Funding</p>
            {scholarships.length === 0 ? (
              <EmptyState icon={GraduationCap} title="No campaigns open" description="Students have not submitted financial assistance requests yet." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {scholarships.map((sch) => {
                  const raisedPercent = Math.min(100, Math.round((sch.amountRaised / sch.amountNeeded) * 100));
                  return (
                    <div key={sch._id} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 flex flex-col justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h4 className="text-sm font-semibold text-foreground">{sch.title}</h4>
                            <p className="text-xs text-muted-foreground">Requested by {sch.studentId?.name} ({sch.studentId?.department})</p>
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            sch.status === 'funded' ? 'bg-primary/15 text-primary border-primary/25' :
                            'bg-yellow-400/10 text-yellow-400 border-yellow-400/20'
                          }`}>
                            {sch.status === 'funded' ? 'Funded' : 'Open'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-3 font-medium leading-relaxed">
                          "{sch.description}"
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-primary">₹{sch.amountRaised.toLocaleString()} raised</span>
                          <span className="text-muted-foreground">Goal: ₹{sch.amountNeeded.toLocaleString()}</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-1.5 w-full rounded-full bg-white/[0.05] overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${raisedPercent}%` }} />
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{raisedPercent}% Completed</span>
                          {sch.status !== 'funded' && sch.studentId?._id !== user?._id && (
                            <button
                              onClick={() => setFundModal({ open: true, scholarship: sch, amount: String(sch.amountNeeded - sch.amountRaised) })}
                              className="h-8 px-4 rounded-xl bg-primary text-[#0D1000] text-xs font-bold hover:bg-primary/95 hover:shadow-lg hover:shadow-primary/10 transition-all"
                            >
                              Sponsor Student
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Student's own campaigns */}
          {user?.role === 'student' && (
            <div className="space-y-3 pt-6 border-t border-white/[0.05]">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Your Funding Requests</p>
              {myScholarships.length === 0 ? (
                <EmptyState icon={Heart} title="No campaigns created" description="You can launch a fundraising request if you need support." />
              ) : (
                <div className="space-y-3">
                  {myScholarships.map((sch) => {
                    const raisedPercent = Math.min(100, Math.round((sch.amountRaised / sch.amountNeeded) * 100));
                    return (
                      <div key={sch._id} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-foreground">{sch.title}</h4>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            sch.status === 'funded' ? 'bg-primary/15 text-primary border-primary/25' :
                            'bg-yellow-400/10 text-yellow-400 border-yellow-400/20'
                          }`}>
                            {sch.status === 'funded' ? 'Funded' : 'Pending'}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-primary">₹{sch.amountRaised.toLocaleString()} raised</span>
                            <span className="text-muted-foreground">Goal: ₹{sch.amountNeeded.toLocaleString()}</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-white/[0.05] overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${raisedPercent}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Scholarship Request Modal */}
      {scholarshipModal.open && (
        <Dialog open={scholarshipModal.open} onOpenChange={(open) => !open && setScholarshipModal({ open: false, title: '', description: '', amountNeeded: '' })}>
          <DialogContent className="border-white/[0.08] bg-[#1C1D21] max-w-md w-full rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle>Request Financial Aid</DialogTitle>
              <DialogDescription className="text-muted-foreground font-medium">
                Submit an academic assistance campaign. Alumni will see and fund this request.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateScholarship} className="space-y-4 mt-3">
              <div className="space-y-1.5">
                <Label htmlFor="scholarship-title" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Campaign Title *
                </Label>
                <Input
                  id="scholarship-title"
                  required
                  placeholder="e.g. Tuition Fees support for Final Semester"
                  value={scholarshipModal.title}
                  onChange={(e) => setScholarshipModal((p) => ({ ...p, title: e.target.value }))}
                  className="h-10 bg-white/[0.04] border-white/[0.1] text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="scholarship-amount" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Amount Needed (INR) *
                </Label>
                <Input
                  id="scholarship-amount"
                  required
                  type="number"
                  min={100}
                  placeholder="e.g. 15000"
                  value={scholarshipModal.amountNeeded}
                  onChange={(e) => setScholarshipModal((p) => ({ ...p, amountNeeded: e.target.value }))}
                  className="h-10 bg-white/[0.04] border-white/[0.1] text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="scholarship-desc" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Describe Your Need *
                </Label>
                <textarea
                  id="scholarship-desc"
                  required
                  rows={4}
                  placeholder="Provide background context on your academic standing, tuition needs, and how these funds will be used..."
                  value={scholarshipModal.description}
                  onChange={(e) => setScholarshipModal((p) => ({ ...p, description: e.target.value }))}
                  className="w-full p-3 bg-white/[0.04] border border-white/[0.1] text-foreground text-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl outline-none"
                />
              </div>
              <DialogFooter className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setScholarshipModal({ open: false, title: '', description: '', amountNeeded: '' })}
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
      )}

      {/* Fund Scholarship campaign modal */}
      {fundModal.open && fundModal.scholarship && (
        <Dialog open={fundModal.open} onOpenChange={(open) => !open && setFundModal({ open: false, scholarship: null, amount: '' })}>
          <DialogContent className="border-white/[0.08] bg-[#1C1D21] max-w-md w-full rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle>Sponsor Student Campaign</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Enter your contribution amount to fund <strong>{fundModal.scholarship.studentId?.name}</strong>'s campaign: "{fundModal.scholarship.title}".
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleFundScholarship} className="space-y-4 mt-3">
              <div className="space-y-1.5">
                <Label htmlFor="fund-amount" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Sponsorship Amount (INR) *
                </Label>
                <Input
                  id="fund-amount"
                  required
                  type="number"
                  min={10}
                  max={fundModal.scholarship.amountNeeded - fundModal.scholarship.amountRaised}
                  placeholder="e.g. 5000"
                  value={fundModal.amount}
                  onChange={(e) => setFundModal((p) => ({ ...p, amount: e.target.value }))}
                  className="h-10 bg-white/[0.04] border-white/[0.1] text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">Remaining needed to fully fund: ₹{(fundModal.scholarship.amountNeeded - fundModal.scholarship.amountRaised).toLocaleString()}</p>
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
                  Confirm Contribution
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
