import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { alumniService } from '@/services/alumniService';
import useAuthStore from '@/store/authStore';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Pencil, Trash2, User, ChevronLeft, ChevronRight, Download, Shield, ShieldCheck, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { exportAlumni } from '@/utils/exportUtils';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';

const filterDefaults = { name: '', department: '', graduationYear: '' };
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
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 ${
        isAdmin
          ? 'bg-primary/10 text-primary border border-primary/20'
          : 'bg-white/[0.06] text-muted-foreground border border-white/10'
      }`}
    >
      {isAdmin ? <ShieldCheck className="h-2.5 w-2.5" /> : <User className="h-2.5 w-2.5" />}
      {isAdmin ? 'Admin' : 'Alumni'}
    </span>
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
  const [currentPage, setCurrentPage] = useState(1);
  const isAdmin = user?.role === 'admin';

  const totalPages = Math.ceil(alumni.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedAlumni = alumni.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
    const newRole = currentRole === 'admin' ? 'alumni' : 'admin';
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Table */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.015] overflow-hidden">
        {/* Table header row */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.02]">
          <p className="text-sm font-semibold">
            {loading ? 'Loading…' : `${alumni.length} Alumni`}
          </p>
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 m-4 px-4 py-3 rounded-xl border border-destructive/20" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl bg-white/[0.04]" />
            ))}
          </div>
        ) : alumni.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No alumni found"
            description="Try adjusting your filters or reset to see all profiles."
            ctaLabel="Reset Filters"
            onCta={handleReset}
            className="m-4 border-white/[0.06]"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60 bg-white/[0.02]">
                    Alumni
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
                {paginatedAlumni.map((item) => (
                  <tr
                    key={item._id}
                    className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <AlumniAvatar item={item} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
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
                              <TooltipContent>Change role to {item.role === 'admin' ? 'alumni' : 'admin'}</TooltipContent>
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
        )}

        {/* Pagination */}
        {!loading && alumni.length > ITEMS_PER_PAGE && (
          <nav className="flex items-center justify-between px-5 py-3.5 border-t border-white/[0.06] bg-white/[0.02]" aria-label="Alumni pagination">
            <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
              Showing {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, alumni.length)} of {alumni.length}
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
    </div>
  );
}
