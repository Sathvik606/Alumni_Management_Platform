import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { jobService } from '@/services/jobService';
import { referralService } from '@/services/referralService';
import useAuthStore from '@/store/authStore';
import { Briefcase, ExternalLink, MapPin, Pencil, Trash2, Building2, ChevronLeft, ChevronRight, Download, Plus, X, Send, CheckCircle, XCircle, FileText } from 'lucide-react';
import { Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem } from '@/components/ui/combobox';
import { toast } from 'sonner';
import { exportJobs } from '@/utils/exportUtils';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';

const defaultJob = {
  title: '', company: '', location: '', type: 'full-time',
  mode: 'onsite', description: '', requirements: '', salaryRange: '', applyLink: '',
};
const ITEMS_PER_PAGE = 20;

function TypePill({ type }) {
  const map = {
    'full-time': { label: 'Full-time', class: 'bg-primary/10 text-primary border-primary/20' },
    'part-time': { label: 'Part-time', class: 'bg-purple-400/10 text-purple-400 border-purple-400/20' },
    'internship': { label: 'Internship', class: 'bg-teal-400/10 text-teal-400 border-teal-400/20' },
    'contract': { label: 'Contract', class: 'bg-orange-400/10 text-orange-400 border-orange-400/20' },
  };
  const { label, class: cls } = map[type] || { label: type, class: 'bg-white/[0.06] text-muted-foreground border-white/10' };
  return (
    <span className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 border ${cls}`}>
      {label}
    </span>
  );
}

function ModePill({ mode }) {
  return (
    <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 border bg-white/[0.05] text-muted-foreground border-white/10">
      {mode}
    </span>
  );
}

export default function JobsPage() {
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState(defaultJob);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ open: false, record: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, title: '' });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Referral states
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' or 'referrals'
  const [referralsReceived, setReferralsReceived] = useState([]);
  const [referralsSent, setReferralsSent] = useState([]);
  const [referralModal, setReferralModal] = useState({ open: false, job: null, resumeLink: '', message: '' });
  const [referralNotesModal, setReferralNotesModal] = useState({ open: false, referral: null, status: 'approved', notes: '' });

  const fetchReferrals = async () => {
    try {
      const [sent, received] = await Promise.all([
        referralService.listMyRequests(),
        referralService.listForMe()
      ]);
      setReferralsSent(sent);
      setReferralsReceived(received);
    } catch (err) {
      console.error('Failed to load referrals', err);
    }
  };

  const handleReferralRequest = async (e) => {
    e.preventDefault();
    if (!referralModal.resumeLink || !referralModal.message) {
      toast.error('Validation error', { description: 'All fields are required' });
      return;
    }
    try {
      await referralService.submit({
        jobId: referralModal.job._id,
        resumeLink: referralModal.resumeLink,
        message: referralModal.message
      });
      toast.success('Referral request sent!', { description: `Your request has been submitted to the job poster.` });
      setReferralModal({ open: false, job: null, resumeLink: '', message: '' });
    } catch (err) {
      toast.error('Failed to submit request', { description: err.response?.data?.message || 'Something went wrong' });
    }
  };

  const handleUpdateReferralStatus = async (e) => {
    e.preventDefault();
    try {
      await referralService.updateStatus(
        referralNotesModal.referral._id,
        referralNotesModal.status,
        referralNotesModal.notes
      );
      toast.success('Referral updated!', { description: `Referral status marked as ${referralNotesModal.status}.` });
      setReferralNotesModal({ open: false, referral: null, status: 'approved', notes: '' });
      fetchReferrals();
    } catch (err) {
      toast.error('Failed to update referral', { description: err.response?.data?.message || 'Something went wrong' });
    }
  };

  const totalPages = Math.ceil(jobs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedJobs = jobs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const goToPage = (page) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));

  const fetchJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await jobService.list();
      setJobs(data);
    } catch {
      setError('Unable to load jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title || form.title.trim().length < 3) {
      toast.error('Validation error', { description: 'Job title must be at least 3 characters' });
      return;
    }
    if (!form.company || form.company.trim().length < 2) {
      toast.error('Validation error', { description: 'Company name must be at least 2 characters' });
      return;
    }
    if (!form.description || form.description.trim().length < 20) {
      toast.error('Validation error', { description: 'Description must be at least 20 characters' });
      return;
    }
    if (!form.applyLink || !form.applyLink.startsWith('http')) {
      toast.error('Validation error', { description: 'Please provide a valid application URL' });
      return;
    }
    setCreating(true);
    setError('');
    try {
      const created = await jobService.create(form);
      setJobs((prev) => [created, ...prev]);
      setForm(defaultJob);
      setShowCreateForm(false);
      toast.success('Job posted!', { description: `${form.title} at ${form.company} has been added.` });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create job';
      setError(msg);
      toast.error('Failed to post job', { description: msg });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async () => {
    if (!modal.record) return;
    if (!modal.record.title || modal.record.title.trim().length < 3) {
      toast.error('Validation error', { description: 'Job title must be at least 3 characters' });
      return;
    }
    if (!modal.record.description || modal.record.description.trim().length < 20) {
      toast.error('Validation error', { description: 'Description must be at least 20 characters' });
      return;
    }
    try {
      const updated = await jobService.update(modal.record._id, modal.record);
      setJobs((prev) => prev.map((j) => (j._id === updated._id ? updated : j)));
      setModal({ open: false, record: null });
      toast.success('Job updated successfully!');
    } catch (err) {
      toast.error('Failed to update job', { description: err.response?.data?.message || 'Update failed' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await jobService.remove(id);
      setJobs((prev) => prev.filter((j) => j._id !== id));
      setDeleteDialog({ open: false, id: null, title: '' });
      toast.success('Job deleted successfully');
    } catch (err) {
      toast.error('Failed to delete job', { description: err.response?.data?.message || 'Delete failed' });
    }
  };

  const inputClass = "h-10 bg-white/[0.04] border-white/[0.1] text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl";
  const labelClass = "text-xs font-semibold uppercase tracking-wide text-muted-foreground";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Jobs"
        title="Career Opportunities"
        subtitle="Post and discover job openings shared by alumni."
      >
        {activeTab === 'explore' && (
          <>
            <button
              onClick={() => { exportJobs(jobs); toast.success('Export started', { description: 'Downloading jobs as CSV...' }); }}
              disabled={jobs.length === 0}
              className="h-9 px-3.5 rounded-xl border border-white/[0.1] bg-white/[0.03] text-xs font-medium text-muted-foreground hover:bg-white/[0.07] hover:text-foreground transition-all disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
            {user?.role !== 'student' && (
              <button
                onClick={() => setShowCreateForm((v) => !v)}
                className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all inline-flex items-center gap-1.5"
              >
                {showCreateForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                {showCreateForm ? 'Cancel' : 'Post a Job'}
              </button>
            )}
          </>
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
          Explore Jobs
        </button>
        <button
          onClick={() => { setActiveTab('referrals'); fetchReferrals(); }}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'referrals'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Referrals Center
        </button>
      </div>

      {activeTab === 'explore' && (
        <>

      {/* Create Form */}
      {showCreateForm && user?.role !== 'student' && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6"
        >
          <p className="text-sm font-semibold mb-5">Post a New Job</p>
          <form className="space-y-4" onSubmit={handleCreate}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="job-title" className={labelClass}>Job Title *</Label>
                <Input id="job-title" required value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Senior Software Engineer" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="job-company" className={labelClass}>Company *</Label>
                <Input id="job-company" required value={form.company}
                  onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
                  placeholder="e.g. Tech Corp" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="job-location" className={labelClass}>Location *</Label>
                <Input id="job-location" required value={form.location}
                  onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                  placeholder="e.g. Bengaluru, IN" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="job-salary" className={labelClass}>Salary Range</Label>
                <Input id="job-salary" value={form.salaryRange}
                  onChange={(e) => setForm((p) => ({ ...p, salaryRange: e.target.value }))}
                  placeholder="e.g. ₹15L - ₹25L" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <Label className={labelClass}>Job Type</Label>
                <Combobox value={form.type} onValueChange={(val) => val && setForm((p) => ({ ...p, type: val }))}>
                  <ComboboxInput readOnly placeholder="Select type" className={`${inputClass} w-full`} />
                  <ComboboxContent>
                    <ComboboxList>
                      <ComboboxItem value="full-time" label="Full-time">Full-time</ComboboxItem>
                      <ComboboxItem value="part-time" label="Part-time">Part-time</ComboboxItem>
                      <ComboboxItem value="internship" label="Internship">Internship</ComboboxItem>
                      <ComboboxItem value="contract" label="Contract">Contract</ComboboxItem>
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>
              <div className="space-y-1.5">
                <Label className={labelClass}>Work Mode</Label>
                <Combobox value={form.mode} onValueChange={(val) => val && setForm((p) => ({ ...p, mode: val }))}>
                  <ComboboxInput readOnly placeholder="Select mode" className={`${inputClass} w-full`} />
                  <ComboboxContent>
                    <ComboboxList>
                      <ComboboxItem value="onsite" label="Onsite">Onsite</ComboboxItem>
                      <ComboboxItem value="remote" label="Remote">Remote</ComboboxItem>
                      <ComboboxItem value="hybrid" label="Hybrid">Hybrid</ComboboxItem>
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="job-desc" className={labelClass}>Description *</Label>
              <Textarea id="job-desc" required rows={4} value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Describe the role, responsibilities, and requirements..."
                className="bg-white/[0.04] border-white/[0.1] text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="job-req" className={labelClass}>Requirements</Label>
              <Textarea id="job-req" rows={3} value={form.requirements}
                onChange={(e) => setForm((p) => ({ ...p, requirements: e.target.value }))}
                placeholder="List key qualifications and skills..."
                className="bg-white/[0.04] border-white/[0.1] text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="job-apply" className={labelClass}>Application Link *</Label>
              <Input id="job-apply" required type="url" value={form.applyLink}
                onChange={(e) => setForm((p) => ({ ...p, applyLink: e.target.value }))}
                placeholder="https://careers.company.com/apply" className={inputClass} />
            </div>
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2" role="alert">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 rounded-xl border border-white/[0.1] bg-white/[0.03] text-sm text-muted-foreground hover:bg-white/[0.07] transition-all">
                Cancel
              </button>
              <button type="submit" disabled={creating}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                {creating ? 'Posting…' : 'Post Job'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Jobs List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-2xl bg-white/[0.04]" />)}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState icon={Briefcase} title="No jobs posted yet" description="Be the first to share a career opportunity with the alumni community." ctaLabel="Post a Job" onCta={() => setShowCreateForm(true)} />
      ) : (
        <div className="space-y-3">
          {paginatedJobs.map((job) => {
            const canEdit = user?._id === job.postedBy?._id || user?._id === job.postedBy || user?.role === 'admin';
            return (
              <motion.div
                key={job._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="group rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 hover:border-white/[0.14] hover:bg-white/[0.04] card-hover transition-all"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.08]">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">{job.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{job.company}</p>

                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <TypePill type={job.type} />
                        <ModePill mode={job.mode} />
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {job.location}
                        </span>
                        {job.salaryRange && (
                          <span className="text-[11px] font-semibold text-primary">{job.salaryRange}</span>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{job.description}</p>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => window.open(job.applyLink, '_blank')}
                          className="inline-flex items-center gap-1.5 h-8 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Apply Now
                        </button>
                        {user?._id !== (job.postedBy?._id || job.postedBy) && (
                          <button
                            onClick={() => setReferralModal({ open: true, job, resumeLink: '', message: '' })}
                            className="inline-flex items-center gap-1.5 h-8 px-4 rounded-xl border border-primary/20 bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-all"
                          >
                            <Send className="h-3 w-3" />
                            Request Referral
                          </button>
                        )}
                        {canEdit && (
                          <>
                            <button
                              onClick={() => setModal({ open: true, record: job })}
                              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-white/[0.1] bg-white/[0.03] text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.07] transition-all"
                            >
                              <Pencil className="h-3 w-3" />
                              Edit
                            </button>
                            <button
                              onClick={() => setDeleteDialog({ open: true, id: job._id, title: job.title })}
                              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-destructive/20 bg-destructive/5 text-xs text-destructive hover:bg-destructive/10 transition-all"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Pagination */}
          {jobs.length > ITEMS_PER_PAGE && (
            <nav className="flex items-center justify-between pt-2" aria-label="Jobs pagination">
              <p className="text-xs text-muted-foreground">
                {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, jobs.length)} of {jobs.length}
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.03] text-muted-foreground hover:bg-white/[0.07] hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all" aria-label="Previous">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="text-xs text-muted-foreground px-2">{currentPage} / {totalPages}</span>
                <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.03] text-muted-foreground hover:bg-white/[0.07] hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all" aria-label="Next">
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </nav>
          )}
        </div>
      )}
    </>)}

      {/* Edit Modal */}
      {modal.open && modal.record && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#1C1D21] shadow-2xl"
          >
            <div className="p-6">
              <DialogHeader>
                <DialogTitle>Edit Job Posting</DialogTitle>
                <DialogDescription className="text-muted-foreground">Update job details and save changes.</DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className={labelClass}>Job Title</Label>
                    <Input value={modal.record.title}
                      onChange={(e) => setModal((p) => ({ ...p, record: { ...p.record, title: e.target.value } }))}
                      className={inputClass} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelClass}>Company</Label>
                    <Input value={modal.record.company}
                      onChange={(e) => setModal((p) => ({ ...p, record: { ...p.record, company: e.target.value } }))}
                      className={inputClass} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClass}>Description</Label>
                  <Textarea rows={4} value={modal.record.description}
                    onChange={(e) => setModal((p) => ({ ...p, record: { ...p.record, description: e.target.value } }))}
                    className="bg-white/[0.04] border-white/[0.1] text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClass}>Application Link</Label>
                  <Input type="url" value={modal.record.applyLink}
                    onChange={(e) => setModal((p) => ({ ...p, record: { ...p.record, applyLink: e.target.value } }))}
                    className={inputClass} />
                </div>
              </div>
              <DialogFooter className="mt-5 flex gap-3 justify-end">
                <button onClick={() => setModal({ open: false, record: null })}
                  className="px-4 py-2 rounded-xl border border-white/[0.1] bg-white/[0.03] text-sm text-muted-foreground hover:bg-white/[0.07] hover:text-foreground transition-all">
                  Cancel
                </button>
                <button onClick={handleUpdate}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all">
                  Save Changes
                </button>
              </DialogFooter>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, id: null, title: '' })}>
        <AlertDialogContent className="border-white/[0.08] bg-[#1C1D21]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete job posting?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete "<strong className="text-foreground">{deleteDialog.title}</strong>"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/[0.1] bg-white/[0.03]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(deleteDialog.id)} className="bg-destructive text-white hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Referrals Center view */}
      {activeTab === 'referrals' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Incoming requests for Alumni */}
          {user?.role !== 'student' && (
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Referral Requests Received</p>
              {referralsReceived.length === 0 ? (
                <EmptyState icon={FileText} title="No referral requests received" description="Referral requests for jobs you post will appear here." />
              ) : (
                <div className="space-y-3">
                  {referralsReceived.map((ref) => (
                    <div key={ref._id} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-semibold text-foreground">{ref.studentId?.name || 'Student'}</h4>
                          <p className="text-xs text-muted-foreground">{ref.studentId?.department} · Class of {ref.studentId?.graduationYear}</p>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          ref.status === 'approved' ? 'bg-primary/15 text-primary border-primary/25' :
                          ref.status === 'rejected' ? 'bg-destructive/15 text-destructive border-destructive/25' :
                          'bg-white/5 text-muted-foreground border-white/10'
                        }`}>
                          {ref.status}
                        </span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-black/10 border border-white/[0.04] text-xs text-muted-foreground leading-relaxed">
                        <strong className="text-foreground block mb-1">Applied for: {ref.jobId?.title} at {ref.jobId?.company}</strong>
                        "{ref.message}"
                      </div>
                      {ref.notes && (
                        <p className="text-xs text-muted-foreground"><strong className="text-foreground">Your Notes:</strong> {ref.notes}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          onClick={() => window.open(ref.resumeLink, '_blank')}
                          className="inline-flex items-center gap-1 h-8 px-3 rounded-xl border border-white/[0.1] bg-white/[0.03] text-xs text-muted-foreground hover:bg-white/[0.07] transition-all"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View Resume
                        </button>
                        {ref.status === 'pending' && (
                          <button
                            onClick={() => setReferralNotesModal({ open: true, referral: ref, status: 'approved', notes: '' })}
                            className="inline-flex items-center gap-1.5 h-8 px-4 rounded-xl bg-primary text-[#0D1000] text-xs font-semibold hover:bg-primary/95 transition-all"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Approve Referral
                          </button>
                        )}
                        {ref.status === 'pending' && (
                          <button
                            onClick={() => setReferralNotesModal({ open: true, referral: ref, status: 'rejected', notes: '' })}
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-destructive/25 bg-destructive/5 text-xs text-destructive hover:bg-destructive/10 transition-all"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Decline
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sent requests (Students/Alumni) */}
          <div className="space-y-3 pt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Your Sent Referral Requests</p>
            {referralsSent.length === 0 ? (
              <EmptyState icon={Send} title="No referral requests sent" description="Explore jobs and request referrals to find opportunities." />
            ) : (
              <div className="space-y-3">
                {referralsSent.map((ref) => (
                  <div key={ref._id} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">{ref.jobId?.title || 'Job Opening'}</h4>
                        <p className="text-xs text-muted-foreground">{ref.jobId?.company} · {ref.jobId?.location}</p>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        ref.status === 'approved' ? 'bg-primary/15 text-primary border-primary/25' :
                        ref.status === 'rejected' ? 'bg-destructive/15 text-destructive border-destructive/25' :
                        'bg-white/5 text-muted-foreground border-white/10'
                      }`}>
                        {ref.status}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p><strong className="text-foreground">Referrer:</strong> {ref.alumniId?.name || 'Alumnus'} ({ref.alumniId?.email})</p>
                      <p><strong className="text-foreground">Your Message:</strong> "{ref.message}"</p>
                      {ref.notes && (
                        <p className="p-3.5 mt-2 rounded-xl bg-black/10 border border-white/[0.04] text-xs text-muted-foreground">
                          <strong className="text-foreground block mb-0.5">Referrer Feedback:</strong>
                          "{ref.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Request Referral Modal */}
      {referralModal.open && referralModal.job && (
        <Dialog open={referralModal.open} onOpenChange={(open) => !open && setReferralModal({ open: false, job: null, resumeLink: '', message: '' })}>
          <DialogContent className="border-white/[0.08] bg-[#1C1D21] max-w-md w-full rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle>Request Referral</DialogTitle>
              <DialogDescription className="text-muted-foreground font-medium">
                Request a referral for <strong>{referralModal.job.title}</strong> at <strong>{referralModal.job.company}</strong>.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleReferralRequest} className="space-y-4 mt-3">
              <div className="space-y-1.5">
                <Label htmlFor="resume-link" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Resume / Portfolio Link *
                </Label>
                <Input
                  id="resume-link"
                  required
                  type="url"
                  placeholder="https://drive.google.com/file/d/..."
                  value={referralModal.resumeLink}
                  onChange={(e) => setReferralModal((p) => ({ ...p, resumeLink: e.target.value }))}
                  className="h-10 bg-white/[0.04] border-white/[0.1] text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="referral-msg" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Short Pitch / Note *
                </Label>
                <textarea
                  id="referral-msg"
                  required
                  rows={4}
                  placeholder="Explain why you are a good fit for this role and why they should refer you..."
                  value={referralModal.message}
                  onChange={(e) => setReferralModal((p) => ({ ...p, message: e.target.value }))}
                  className="w-full p-3 bg-white/[0.04] border border-white/[0.1] text-foreground text-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl outline-none"
                />
              </div>
              <DialogFooter className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReferralModal({ open: false, job: null, resumeLink: '', message: '' })}
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

      {/* Referral Notes / Feedback update Modal */}
      {referralNotesModal.open && referralNotesModal.referral && (
        <Dialog open={referralNotesModal.open} onOpenChange={(open) => !open && setReferralNotesModal({ open: false, referral: null, status: 'approved', notes: '' })}>
          <DialogContent className="border-white/[0.08] bg-[#1C1D21] max-w-md w-full rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle>Referral Decision</DialogTitle>
              <DialogDescription className="text-muted-foreground font-medium">
                Decision: <strong className="capitalize text-foreground">{referralNotesModal.status}</strong> for {referralNotesModal.referral.studentId?.name}.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateReferralStatus} className="space-y-4 mt-3">
              <div className="space-y-1.5">
                <Label htmlFor="referral-notes" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Feedback Notes / Tips (Optional)
                </Label>
                <textarea
                  id="referral-notes"
                  rows={4}
                  placeholder="Provide tips, next steps, or reasons for your decision..."
                  value={referralNotesModal.notes}
                  onChange={(e) => setReferralNotesModal((p) => ({ ...p, notes: e.target.value }))}
                  className="w-full p-3 bg-white/[0.04] border border-white/[0.1] text-foreground text-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl outline-none"
                />
              </div>
              <DialogFooter className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReferralNotesModal({ open: false, referral: null, status: 'approved', notes: '' })}
                  className="px-4 py-2 rounded-xl border border-white/[0.1] bg-white/[0.03] text-sm text-muted-foreground hover:bg-white/[0.07] hover:text-foreground transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/10"
                >
                  Confirm Decision
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
