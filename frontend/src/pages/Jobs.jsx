import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { jobService } from '@/services/jobService';
import useAuthStore from '@/store/authStore';
import { Briefcase, ExternalLink, MapPin, Pencil, Trash2, Building2, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem } from '@/components/ui/combobox';
import { toast } from 'sonner';
import { exportJobs } from '@/utils/exportUtils';

const defaultJob = { 
  title: '', 
  company: '', 
  location: '', 
  type: 'full-time', 
  mode: 'onsite', 
  description: '', 
  requirements: '', 
  salaryRange: '', 
  applyLink: '' 
};
const ITEMS_PER_PAGE = 20;

export default function JobsPage() {
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState(defaultJob);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ open: false, record: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, title: '' });
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate pagination
  const totalPages = Math.ceil(jobs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedJobs = jobs.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const fetchJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await jobService.list();
      setJobs(data);
    } catch (err) {
      setError('Unable to load jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!form.title || form.title.trim().length < 3) {
      const errorMsg = 'Job title must be at least 3 characters';
      setError(errorMsg);
      toast.error('Validation error', { description: errorMsg });
      return;
    }
    if (!form.company || form.company.trim().length < 2) {
      const errorMsg = 'Company name must be at least 2 characters';
      setError(errorMsg);
      toast.error('Validation error', { description: errorMsg });
      return;
    }
    if (!form.description || form.description.trim().length < 20) {
      const errorMsg = 'Description must be at least 20 characters';
      setError(errorMsg);
      toast.error('Validation error', { description: errorMsg });
      return;
    }
    if (!form.applyLink || !form.applyLink.startsWith('http')) {
      const errorMsg = 'Please provide a valid application URL';
      setError(errorMsg);
      toast.error('Validation error', { description: errorMsg });
      return;
    }
    
    setCreating(true);
    try {
      const created = await jobService.create(form);
      setJobs((prev) => [created, ...prev]);
      setForm(defaultJob);
      toast.success('Job posted successfully!', {
        description: `${form.title} at ${form.company} has been added.`,
      });
      setError('');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to create job';
      setError(errorMsg);
      toast.error('Failed to post job', { description: errorMsg });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async () => {
    if (!modal.record) return;
    
    // Validation
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
      const errorMsg = err.response?.data?.message || 'Update failed';
      toast.error('Failed to update job', { description: errorMsg });
    }
  };

  const handleDelete = async (id) => {
    try {
      await jobService.remove(id);
      setJobs((prev) => prev.filter((j) => j._id !== id));
      setDeleteDialog({ open: false, id: null, title: '' });
      toast.success('Job deleted successfully');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Delete failed';
      toast.error('Failed to delete job', { description: errorMsg });
    }
  };

  const getTypeBadgeVariant = (type) => {
    switch (type) {
      case 'full-time': return 'default';
      case 'part-time': return 'secondary';
      case 'internship': return 'success';
      case 'contract': return 'warning';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Jobs</p>
          <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">Career opportunities</h1>
          <p className="text-sm text-muted-foreground">Post and discover job openings shared by alumni.</p>
        </div>
        <Briefcase className="size-6 text-primary" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Post a job</CardTitle>
          <CardDescription>Share career opportunities with the alumni network.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleCreate}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Job Title *</Label>
                <Input 
                  required 
                  value={form.title} 
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} 
                  placeholder="e.g. Senior Software Engineer"
                />
              </div>
              <div className="space-y-2">
                <Label>Company *</Label>
                <Input 
                  required 
                  value={form.company} 
                  onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))} 
                  placeholder="e.g. Tech Corp"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Location *</Label>
                <Input 
                  required 
                  value={form.location} 
                  onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} 
                  placeholder="e.g. San Francisco, CA"
                />
              </div>
              <div className="space-y-2">
                <Label>Salary Range</Label>
                <Input 
                  value={form.salaryRange} 
                  onChange={(e) => setForm((p) => ({ ...p, salaryRange: e.target.value }))} 
                  placeholder="e.g. $100k - $150k"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Job Type</Label>
                <Combobox
                  value={form.type}
                  onValueChange={(val) => val && setForm((p) => ({ ...p, type: val }))}
                >
                  <ComboboxInput readOnly placeholder="Select job type" className="w-full" />
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
              <div className="space-y-2">
                <Label>Work Mode</Label>
                <Combobox
                  value={form.mode}
                  onValueChange={(val) => val && setForm((p) => ({ ...p, mode: val }))}
                >
                  <ComboboxInput readOnly placeholder="Select work mode" className="w-full" />
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

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                required
                rows={4}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Describe the role, responsibilities, and requirements..."
              />
            </div>

            <div className="space-y-2">
              <Label>Requirements</Label>
              <Textarea
                rows={3}
                value={form.requirements}
                onChange={(e) => setForm((p) => ({ ...p, requirements: e.target.value }))}
                placeholder="List key qualifications and skills..."
              />
            </div>

            <div className="space-y-2">
              <Label>Application Link *</Label>
              <Input 
                required 
                type="url"
                value={form.applyLink} 
                onChange={(e) => setForm((p) => ({ ...p, applyLink: e.target.value }))} 
                placeholder="https://careers.company.com/apply"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={creating}>
              {creating ? 'Posting job...' : 'Post job'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Available positions</CardTitle>
              <CardDescription>Browse jobs posted by the alumni community.</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                exportJobs(jobs);
                toast.success('Export started', { description: 'Downloading jobs data as CSV...' });
              }}
              disabled={jobs.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 p-8 text-center text-sm text-muted-foreground">
              No jobs posted yet.
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => {
                const canEdit = user?._id === job.postedBy?._id || user?._id === job.postedBy || user?.role === 'admin';
                
                return (
                  <div key={job._id} className="rounded-xl border border-border/70 p-5 hover:border-primary/30 transition-colors">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start gap-3">
                          <Building2 className="size-5 text-primary mt-1 shrink-0" />
                          <div className="space-y-1">
                            <h3 className="text-lg font-semibold">{job.title}</h3>
                            <p className="text-sm text-muted-foreground">{job.company}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge variant={getTypeBadgeVariant(job.type)}>
                            {job.type?.replace('-', ' ')}
                          </Badge>
                          <Badge variant="secondary">{job.mode}</Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-3" />
                            <span>{job.location}</span>
                          </div>
                        </div>

                        {job.salaryRange && (
                          <p className="text-sm font-medium text-primary">{job.salaryRange}</p>
                        )}

                        <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>

                        <div className="flex flex-wrap gap-2">
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => window.open(job.applyLink, '_blank')}
                          >
                            <ExternalLink className="size-3 mr-1" />
                            Apply now
                          </Button>

                          {canEdit && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setModal({ open: true, record: job })}
                              >
                                <Pencil className="size-3 mr-1" />
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setDeleteDialog({ open: true, id: job._id, title: job.title })}
                              >
                                <Trash2 className="size-3 mr-1" />
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Pagination Controls */}
          {!loading && jobs.length > ITEMS_PER_PAGE && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(endIndex, jobs.length)} of {jobs.length} jobs
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="size-4 mr-1" />
                  Previous
                </Button>
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="size-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={modal.open} onOpenChange={(open) => !open && setModal({ open: false, record: null })}>
        {modal.record && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border/70 bg-card shadow-2xl">
              <DialogHeader className="p-6 pb-4">
                <DialogTitle>Edit job posting</DialogTitle>
                <DialogDescription>Update job details and save changes.</DialogDescription>
              </DialogHeader>
              <div className="px-6 pb-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Job Title</Label>
                    <Input
                      value={modal.record.title}
                      onChange={(e) => setModal((p) => ({ ...p, record: { ...p.record, title: e.target.value } }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Company</Label>
                    <Input
                      value={modal.record.company}
                      onChange={(e) => setModal((p) => ({ ...p, record: { ...p.record, company: e.target.value } }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    rows={4}
                    value={modal.record.description}
                    onChange={(e) => setModal((p) => ({ ...p, record: { ...p.record, description: e.target.value } }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Application Link</Label>
                  <Input
                    type="url"
                    value={modal.record.applyLink}
                    onChange={(e) => setModal((p) => ({ ...p, record: { ...p.record, applyLink: e.target.value } }))}
                  />
                </div>
              </div>
              <DialogFooter className="p-6 pt-0">
                <Button variant="ghost" onClick={() => setModal({ open: false, record: null })}>Cancel</Button>
                <Button onClick={handleUpdate}>Save changes</Button>
              </DialogFooter>
            </div>
          </div>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, id: null, title: '' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete job posting?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(deleteDialog.id)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
