import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Avatar } from '@/components/ui/avatar';
import { alumniService } from '@/services/alumniService';
import useAuthStore from '@/store/authStore';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Pencil, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';

const filterDefaults = { name: '', department: '', graduationYear: '' };

export default function AlumniPage() {
  const { user } = useAuthStore();
  const [filters, setFilters] = useState(filterDefaults);
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ open: false, record: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const isAdmin = user?.role === 'admin';

  const fetchAlumni = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await alumniService.list(filters);
      setAlumni(data);
    } catch (err) {
      setError('Unable to load alumni.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlumni();
  }, []);

  const onFilterChange = (key, value) => setFilters((p) => ({ ...p, [key]: value }));

  const handleUpdate = async () => {
    if (!modal.record) return;
    
    // Validation
    if (!modal.record.name || modal.record.name.trim().length < 2) {
      const errorMsg = 'Name must be at least 2 characters';
      setError(errorMsg);
      toast.error('Validation error', { description: errorMsg });
      return;
    }
    if (modal.record.graduationYear && (modal.record.graduationYear < 1950 || modal.record.graduationYear > new Date().getFullYear() + 10)) {
      const errorMsg = `Graduation year must be between 1950 and ${new Date().getFullYear() + 10}`;
      setError(errorMsg);
      toast.error('Validation error', { description: errorMsg });
      return;
    }
    if (modal.record.bio && modal.record.bio.length > 500) {
      const errorMsg = 'Bio must be less than 500 characters';
      setError(errorMsg);
      toast.error('Validation error', { description: errorMsg });
      return;
    }
    
    try {
      const updated = await alumniService.update(modal.record._id, modal.record);
      setAlumni((prev) => prev.map((a) => (a._id === updated._id ? updated : a)));
      setModal({ open: false, record: null });
      toast.success('Profile updated!', {
        description: 'Alumni information has been saved successfully.',
      });
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Update failed';
      setError(errorMsg);
      toast.error('Failed to update profile', {
        description: errorMsg,
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      await alumniService.remove(id);
      setAlumni((prev) => prev.filter((a) => a._id !== id));
      setDeleteDialog({ open: false, id: null });
      toast.success('Alumni profile deleted', {
        description: 'The profile has been removed from the directory.',
      });
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Delete failed';
      setError(errorMsg);
      toast.error('Failed to delete profile', {
        description: errorMsg,
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Alumni</p>
          <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">Community directory</h1>
          <p className="text-sm text-muted-foreground">Search, update your profile, or manage the network.</p>
        </div>
        <Users className="size-6 text-primary" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search by name, department, or year.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={filters.name} onChange={(e) => onFilterChange('name', e.target.value)} placeholder="Name" />
          </div>
          <div className="space-y-2">
            <Label>Department</Label>
            <Input value={filters.department} onChange={(e) => onFilterChange('department', e.target.value)} placeholder="Dept" />
          </div>
          <div className="space-y-2">
            <Label>Graduation year</Label>
            <Input
              value={filters.graduationYear}
              onChange={(e) => onFilterChange('graduationYear', e.target.value)}
              placeholder="2021"
            />
          </div>
          <div className="flex items-end gap-3">
            <Button onClick={fetchAlumni} className="flex-1">Apply</Button>
            <Button variant="ghost" onClick={() => { setFilters(filterDefaults); fetchAlumni(); }}>Reset</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Directory</CardTitle>
          <CardDescription>Update allowed for your profile{isAdmin ? ' and admin overrides' : ''}.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : alumni.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 p-8 text-center text-sm text-muted-foreground">
              No profiles found with current filters.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Photo</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alumni.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell>
                        <Avatar className="size-9">
                          {item.profilePicture ? (
                            <img src={item.profilePicture} alt={item.name} className="object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-primary/10 text-sm font-medium text-foreground">
                              {item.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-semibold">{item.name}</TableCell>
                      <TableCell>{item.department}</TableCell>
                      <TableCell>{item.graduationYear}</TableCell>
                      <TableCell>{item.company || '—'}</TableCell>
                      <TableCell>{item.location || '—'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setModal({ open: true, record: item })}
                            disabled={!isAdmin && item._id !== user?._id}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          {isAdmin && (
                            <AlertDialog open={deleteDialog.open && deleteDialog.id === item._id} onOpenChange={(open) => setDeleteDialog({ open, id: open ? item._id : null })}>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon-sm">
                                  <Trash2 className="size-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete alumni profile?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently remove <strong>{item.name}</strong>'s profile from the directory. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(item._id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={modal.open} onOpenChange={(open) => setModal((p) => ({ ...p, open }))}>
        {modal.record && (
          <div>
            <DialogHeader>
              <DialogTitle>Edit profile</DialogTitle>
              <DialogDescription>Only your own profile can be edited unless you are an admin.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-1">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    required
                    minLength={2}
                    maxLength={100}
                    value={modal.record.name}
                    onChange={(e) => setModal((p) => ({ ...p, record: { ...p.record, name: e.target.value } }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input
                    minLength={2}
                    maxLength={100}
                    value={modal.record.department}
                    onChange={(e) => setModal((p) => ({ ...p, record: { ...p.record, department: e.target.value } }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Graduation Year</Label>
                  <Input
                    type="number"
                    min={1950}
                    max={new Date().getFullYear() + 10}
                    value={modal.record.graduationYear}
                    onChange={(e) => setModal((p) => ({ ...p, record: { ...p.record, graduationYear: e.target.value } }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input
                    maxLength={100}
                    value={modal.record.company || ''}
                    onChange={(e) => setModal((p) => ({ ...p, record: { ...p.record, company: e.target.value } }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    maxLength={100}
                    value={modal.record.location || ''}
                    onChange={(e) => setModal((p) => ({ ...p, record: { ...p.record, location: e.target.value } }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <Input
                  maxLength={500}
                  placeholder="Tell us about this person..."
                  value={modal.record.bio || ''}
                  onChange={(e) => setModal((p) => ({ ...p, record: { ...p.record, bio: e.target.value } }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setModal({ open: false, record: null })}>Cancel</Button>
              <Button onClick={handleUpdate}>Save</Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>
    </div>
  );
}
