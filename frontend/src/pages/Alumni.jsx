import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { alumniService } from '@/services/alumniService';
import { mentorshipService } from '@/services/mentorshipService';
import useAuthStore from '@/store/authStore';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Pencil, Trash2, User, ChevronLeft, ChevronRight, Download, Shield, ShieldCheck, Search, X, MessageSquare, MapPin, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { exportAlumni } from '@/utils/exportUtils';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';

const filterDefaults = { name: '', department: '', graduationYear: '', isMentor: '' };
const ITEMS_PER_PAGE = 20;

function AlumniAvatar({ item, size = 'md' }) {
  const sizeClass = size === 'sm' ? 'h-8 w-8 text-[10px]' : 'h-10 w-10 text-xs';
  return (
    <div className={`relative ${sizeClass} shrink-0`}>
      {item.profilePicture ? (
        <img
          src={item.profilePicture}
          alt={item.name}
          className={`${sizeClass} rounded-full object-cover border border-white/15`}
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      <div
        className={`${sizeClass} rounded-full bg-primary/10 border border-primary/15 items-center justify-center font-semibold text-primary`}
        style={{ display: item.profilePicture ? 'none' : 'flex' }}
      >
        {item.name ? item.name.substring(0, 2).toUpperCase() : <User className="h-4 w-4" />}
      </div>
    </div>
  );
}

function RoleBadge({ role }) {
  const isAdmin = role === 'admin';
  const isStudent = role === 'student';
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 ${
        isAdmin
          ? 'bg-primary/10 text-primary border border-primary/20'
          : isStudent
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          : 'bg-white/[0.06] text-muted-foreground border border-white/10'
      }`}
    >
      {isAdmin ? <ShieldCheck className="h-2.5 w-2.5" /> : <User className="h-2.5 w-2.5" />}
      {isAdmin ? 'Admin' : isStudent ? 'Student' : 'Alumni'}
    </span>
  );
}

function AlumniCard({ item, user, onBook, onEdit, onDelete, onRoleChange, isAdmin }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative flex flex-col justify-between rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 overflow-hidden hover:border-white/[0.14] hover:bg-white/[0.04] transition-all duration-200"
    >
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div>
        <div className="flex items-start gap-4">
          <AlumniAvatar item={item} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{item.name}</h3>
              {item.isMentor && (
                <span className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5 whitespace-nowrap">
                  Mentor
                </span>
              )}
            </div>
            {item.currentJobTitle && (
              <p className="text-xs text-foreground/80 mt-0.5 font-medium truncate">
                {item.currentJobTitle} {item.company ? `at ${item.company}` : ''}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {item.department || 'General'} • Class of {item.graduationYear || '—'}
            </p>
          </div>
        </div>

        {item.bio && (
          <p className="text-xs text-muted-foreground/85 line-clamp-2 mt-4 leading-relaxed italic bg-white/[0.015] border border-white/[0.03] rounded-lg p-2">
            "{item.bio}"
          </p>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-white/[0.06] mt-4 pt-4">
        {item.location ? (
          <p className="text-[11px] text-muted-foreground/60 flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3" />
            {item.location}
          </p>
        ) : <div />}

        <div className="flex items-center gap-2">
          {item.linkedin && (
            <a
              href={item.linkedin.startsWith('http') ? item.linkedin : `https://${item.linkedin}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-all"
              aria-label="LinkedIn profile"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          {item.isMentor && item._id !== user?._id && (
            <button
              onClick={() => onBook(item)}
              className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold hover:bg-primary/90 transition-all flex items-center gap-1"
            >
              <MessageSquare className="h-3 w-3" />
              Book Session
            </button>
          )}
          {(isAdmin || item._id === user?._id) && (
            <button
              onClick={() => onEdit(item)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-all"
              aria-label="Edit Profile"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function AlumniPage() {
  const { user } = useAuthStore();
  const [filters, setFilters] = useState(filterDefaults);
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ open: false, record: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [mentorshipModal, setMentorshipModal] = useState({ open: false, mentor: null, topic: '', message: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('alumni');
  const isAdmin = user?.role === 'admin';

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
    } catch (err) {
      toast.error('Failed to request mentorship', { description: err.response?.data?.message || 'Something went wrong' });
    }
  };

  const displayList = alumni.filter((item) => {
    if (activeTab === 'students') {
      return item.role === 'student';
    }
    return item.role !== 'student';
  });

  const totalPages = Math.ceil(displayList.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedDisplay = displayList.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToPage = (page) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));

  const fetchAlumni = async () => {
    setLoading(true);
    setError('');
    try {
      const cleanFilters = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      const data = await alumniService.list(cleanFilters);
      setAlumni(Array.isArray(data) ? data : []);
    } catch {
      setError('Unable to load alumni.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlumni(); }, []);

  const onFilterChange = (key, value) => {
    setFilters((p) => ({ ...p, [key]: value }));
    setCurrentPage(1);
  };

  const handleReset = async () => {
    setFilters(filterDefaults);
    setCurrentPage(1);
    setLoading(true);
    try {
      const data = await alumniService.list({});
      setAlumni(data);
    } catch {
      setError('Unable to load alumni.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!modal.record) return;
    if (!modal.record.name || modal.record.name.trim().length < 2) {
      toast.error('Validation error', { description: 'Name must be at least 2 characters' });
      return;
    }
    if (modal.record.graduationYear && (modal.record.graduationYear < 1950 || modal.record.graduationYear > new Date().getFullYear() + 10)) {
      toast.error('Validation error', { description: `Graduation year must be between 1950 and ${new Date().getFullYear() + 10}` });
      return;
    }
    if (modal.record.bio && modal.record.bio.length > 500) {
      toast.error('Validation error', { description: 'Bio must be less than 500 characters' });
      return;
    }
    try {
      const updated = await alumniService.update(modal.record._id, modal.record);
      setAlumni((prev) => prev.map((a) => (a._id === updated._id ? updated : a)));
      setModal({ open: false, record: null });
      toast.success('Profile updated!', { description: 'Alumni information has been saved successfully.' });
    } catch (err) {
      toast.error('Failed to update profile', { description: err.response?.data?.message || 'Update failed' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await alumniService.remove(id);
      setAlumni((prev) => prev.filter((a) => a._id !== id));
      setDeleteDialog({ open: false, id: null });
      toast.success('Alumni profile deleted', { description: 'The profile has been removed from the directory.' });
    } catch (err) {
      toast.error('Failed to delete profile', { description: err.response?.data?.message || 'Delete failed' });
    }
  };

  const handleRoleChange = async (id, currentRole) => {
    // Cycle: alumni → admin → alumni; student stays unless changed
    const newRole = currentRole === 'admin' ? 'alumni' : currentRole === 'student' ? 'alumni' : 'admin';
    try {
      const updated = await alumniService.updateRole(id, newRole);
      setAlumni((prev) => prev.map((a) => (a._id === updated._id ? updated : a)));
      toast.success('Role updated', { description: `User role changed to ${newRole}` });
    } catch (err) {
      toast.error('Failed to update role', { description: err.response?.data?.message || 'Role update failed' });
    }
  };

  const inputClass = "h-10 bg-white/[0.04] border-white/[0.1] text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Alumni"
        title="Community Directory"
        subtitle="Search, update your profile, or manage the network."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => { exportAlumni(alumni); toast.success('Export started', { description: 'Downloading alumni data as CSV...' }); }}
          disabled={alumni.length === 0}
          className="border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.07] text-sm"
        >
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Export CSV
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-3">
          Filter Directory
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1.5">
            <Label htmlFor="filter-name" className="text-xs text-muted-foreground">Name</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
              <Input
                id="filter-name"
                value={filters.name}
                onChange={(e) => onFilterChange('name', e.target.value)}
                placeholder="Search name"
                className={`${inputClass} pl-9`}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-dept" className="text-xs text-muted-foreground">Department</Label>
            <Input
              id="filter-dept"
              value={filters.department}
              onChange={(e) => onFilterChange('department', e.target.value)}
              placeholder="e.g. Computer Science"
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-year" className="text-xs text-muted-foreground">Graduation Year</Label>
            <Input
              id="filter-year"
              value={filters.graduationYear}
              onChange={(e) => onFilterChange('graduationYear', e.target.value)}
              placeholder="e.g. 2021"
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5 flex items-center h-full pt-6">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-muted-foreground hover:text-foreground transition-all">
              <input
                type="checkbox"
                checked={filters.isMentor === 'true'}
                onChange={(e) => onFilterChange('isMentor', e.target.checked ? 'true' : '')}
                className="h-4 w-4 rounded border-white/[0.1] bg-white/[0.04] text-primary focus:ring-primary/20 accent-primary cursor-pointer"
              />
              Mentors Only
            </label>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={fetchAlumni}
              className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all"
            >
              Apply
            </button>
            <button
              onClick={handleReset}
              className="h-10 px-4 rounded-xl border border-white/[0.1] bg-white/[0.03] text-sm text-muted-foreground hover:bg-white/[0.07] hover:text-foreground transition-all"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/[0.08] pb-px">
        <button
          onClick={() => { setActiveTab('alumni'); setCurrentPage(1); }}
          className={`pb-3 text-sm font-semibold border-b-2 px-1 transition-all ${
            activeTab === 'alumni'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Alumni Directory
        </button>
        <button
          onClick={() => { setActiveTab('students'); setCurrentPage(1); }}
          className={`pb-3 text-sm font-semibold border-b-2 px-1 transition-all ${
            activeTab === 'students'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Student Directory
        </button>
      </div>

      {/* Content Container */}
      <div>
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 my-4 px-4 py-3 rounded-xl border border-destructive/20" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 py-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-2xl bg-white/[0.04]" />
            ))}
          </div>
        ) : displayList.length === 0 ? (
          <EmptyState
            icon={Users}
            title={activeTab === 'students' ? "No students found" : "No alumni found"}
            description="Try adjusting your filters or reset to see all profiles."
            ctaLabel="Reset Filters"
            onCta={handleReset}
            className="my-4 border-white/[0.06]"
          />
        ) : user?.role === 'student' ? (
          /* Card Grid View (Premium layout for Student users) */
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 py-4">
            {paginatedDisplay.map((item) => (
              <AlumniCard
                key={item._id}
                item={item}
                user={user}
                onBook={(mentor) => setMentorshipModal({ open: true, mentor, topic: '', message: '' })}
                onEdit={(record) => setModal({ open: true, record })}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        ) : (
          /* Table View (Administrative layout for Alumni/Admins) */
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.015] overflow-hidden mt-4">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.02]">
              <p className="text-sm font-semibold">
                {activeTab === 'students' ? `${displayList.length} Students` : `${displayList.length} Alumni`}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60 bg-white/[0.02]">
                      Name
                    </th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60 bg-white/[0.02] hidden sm:table-cell">
                      Department
                    </th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60 bg-white/[0.02] hidden md:table-cell">
                      Year
                    </th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60 bg-white/[0.02] hidden lg:table-cell">
                      Company
                    </th>
                    {isAdmin && (
                      <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60 bg-white/[0.02] hidden xl:table-cell">
                        Role
                      </th>
                    )}
                    <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60 bg-white/[0.02]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDisplay.map((item) => (
                    <tr
                      key={item._id}
                      className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <AlumniAvatar item={item} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                              {item.isMentor && (
                                <span className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5 whitespace-nowrap">
                                  Mentor
                                </span>
                              )}
                            </div>
                            {item.location && (
                              <p className="text-[11px] text-muted-foreground truncate">{item.location}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className="text-sm text-muted-foreground">{item.department || '—'}</span>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-sm text-muted-foreground">{item.graduationYear || '—'}</span>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <span className="text-sm text-muted-foreground">{item.company || '—'}</span>
                      </td>
                      {isAdmin && (
                        <td className="px-5 py-3.5 hidden xl:table-cell">
                          <RoleBadge role={item.role} />
                        </td>
                      )}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <TooltipProvider>
                            {isAdmin && item._id !== user?._id && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => handleRoleChange(item._id, item.role)}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                                    aria-label={`Change ${item.name}'s role`}
                                  >
                                    <Shield className="h-3.5 w-3.5" />
                                  </button>
                                </TooltipTrigger>
                              <TooltipContent>Change role to {item.role === 'admin' ? 'alumni' : item.role === 'student' ? 'alumni' : 'admin'}</TooltipContent>
                              </Tooltip>
                            )}
                            {item.isMentor && item._id !== user?._id && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => setMentorshipModal({ open: true, mentor: item, topic: '', message: '' })}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all animate-pulse"
                                    aria-label={`Book 1-on-1 session with ${item.name}`}
                                  >
                                    <MessageSquare className="h-3.5 w-3.5" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>Book 1-on-1 Session</TooltipContent>
                              </Tooltip>
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => setModal({ open: true, record: item })}
                                  disabled={!isAdmin && item._id !== user?._id}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                  aria-label={`Edit ${item.name}'s profile`}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Edit profile</TooltipContent>
                            </Tooltip>
                            {isAdmin && (
                              <AlertDialog
                                open={deleteDialog.open && deleteDialog.id === item._id}
                                onOpenChange={(open) => setDeleteDialog({ open, id: open ? item._id : null })}
                              >
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertDialogTrigger asChild>
                                      <button
                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                                        aria-label={`Delete ${item.name}'s profile`}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </AlertDialogTrigger>
                                  </TooltipTrigger>
                                  <TooltipContent>Delete profile</TooltipContent>
                                </Tooltip>
                                <AlertDialogContent className="border-white/[0.08] bg-[#1C1D21]">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete alumni profile?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-muted-foreground">
                                      This will permanently remove <strong className="text-foreground">{item.name}</strong>'s profile. This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="border-white/[0.1] bg-white/[0.03]">Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(item._id)}
                                      className="bg-destructive text-white hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </TooltipProvider>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && displayList.length > ITEMS_PER_PAGE && (
          <nav className="flex items-center justify-between px-5 py-3.5 border border-white/[0.07] bg-white/[0.015] rounded-xl mt-4" aria-label="Alumni pagination">
            <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
              Showing {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, displayList.length)} of {displayList.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.03] text-muted-foreground hover:bg-white/[0.07] hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="text-xs text-muted-foreground px-2" aria-current="page">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.03] text-muted-foreground hover:bg-white/[0.07] hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                aria-label="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </nav>
        )}
      </div>

      {/* Edit Modal */}
      <Dialog open={modal.open} onOpenChange={(open) => setModal((p) => ({ ...p, open }))}>
        {modal.record && (
          <DialogContent className="max-w-2xl border-white/[0.08] bg-[#1C1D21]">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Only your own profile can be edited unless you are an admin.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2 sm:grid-cols-2">
              {[
                { label: 'Name', key: 'name', required: true, minLength: 2, maxLength: 100 },
                { label: 'Department', key: 'department', minLength: 2, maxLength: 100 },
                { label: 'Graduation Year', key: 'graduationYear', type: 'number', min: 1950, max: new Date().getFullYear() + 10 },
                { label: 'Company', key: 'company', maxLength: 100 },
                { label: 'Location', key: 'location', maxLength: 100 },
              ].map(({ label, key, ...rest }) => (
                <div key={key} className="space-y-1.5">
                  <Label htmlFor={`modal-${key}`} className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {label}
                  </Label>
                  <Input
                    id={`modal-${key}`}
                    {...rest}
                    value={modal.record[key] || ''}
                    onChange={(e) => setModal((p) => ({ ...p, record: { ...p.record, [key]: e.target.value } }))}
                    className="h-10 bg-white/[0.04] border-white/[0.1] text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl"
                  />
                </div>
              ))}
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="modal-bio" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bio</Label>
                <Input
                  id="modal-bio"
                  maxLength={500}
                  placeholder="Tell us about this person..."
                  value={modal.record.bio || ''}
                  onChange={(e) => setModal((p) => ({ ...p, record: { ...p.record, bio: e.target.value } }))}
                  className="h-10 bg-white/[0.04] border-white/[0.1] text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl"
                />
              </div>
              {modal.record.role !== 'student' && (
                <div className="sm:col-span-2 pt-2 border-t border-white/[0.06] space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">Mentorship</p>
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={modal.record.isMentor || false}
                      onChange={(e) => setModal((p) => ({ ...p, record: { ...p.record, isMentor: e.target.checked } }))}
                      className="h-4 w-4 rounded border-white/[0.1] bg-white/[0.04] accent-primary cursor-pointer"
                    />
                    <span className="text-sm text-foreground font-medium">Available as Mentor (Open for student bookings)</span>
                  </label>
                  {modal.record.isMentor && (
                    <Input
                      placeholder="Mentorship topics / expertise areas"
                      maxLength={200}
                      value={modal.record.mentorshipTopic || ''}
                      onChange={(e) => setModal((p) => ({ ...p, record: { ...p.record, mentorshipTopic: e.target.value } }))}
                      className="h-10 bg-white/[0.04] border-white/[0.1] text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl"
                    />
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <button
                onClick={() => setModal({ open: false, record: null })}
                className="px-4 py-2 rounded-xl border border-white/[0.1] bg-white/[0.03] text-sm text-muted-foreground hover:bg-white/[0.07] hover:text-foreground transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all"
              >
                Save Changes
              </button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Mentorship Booking Modal */}
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
    </div>
  );
}
