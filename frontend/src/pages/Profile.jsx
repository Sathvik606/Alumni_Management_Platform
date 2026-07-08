import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { alumniService } from '@/services/alumniService';
import useAuthStore from '@/store/authStore';
import { Skeleton } from '@/components/ui/skeleton';
import { Camera, Trash2, TriangleAlert, Upload, User, Save, Globe, Linkedin, Phone, MapPin, Building2, Briefcase, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/ui/PageHeader';

export default function ProfilePage() {
  const { user, setUser, logout } = useAuthStore();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await alumniService.me();
      setForm(data);
    } catch (err) {
      setError('Unable to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file type', { description: 'Please select an image file (JPG, PNG, GIF, etc.)' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large', { description: 'Please select an image smaller than 5MB' });
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setForm((p) => ({ ...p, profilePicture: base64String }));
        setShowPhotoDialog(false);
        toast.success('Image uploaded!', { description: 'Remember to save your changes.' });
        setUploading(false);
      };
      reader.onerror = () => {
        toast.error('Upload failed', { description: 'Could not read the image file.' });
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.error('Upload failed', { description: 'An error occurred while uploading the image.' });
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setForm((p) => ({ ...p, profilePicture: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setShowPhotoDialog(false);
    toast.info('Profile picture removed', { description: 'Remember to save your changes.' });
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      await alumniService.deleteAccount();
      logout();
      toast.success('Account deleted', { description: 'Your account has been permanently removed.' });
      navigate('/login');
    } catch (err) {
      toast.error('Failed to delete account', { description: err.response?.data?.message || 'Please try again.' });
      setDeletingAccount(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form) return;

    if (!form.name || form.name.trim().length < 2) {
      toast.error('Validation error', { description: 'Name must be at least 2 characters' });
      return;
    }
    if (form.graduationYear && (form.graduationYear < 1950 || form.graduationYear > new Date().getFullYear() + 10)) {
      toast.error('Validation error', { description: `Graduation year must be between 1950 and ${new Date().getFullYear() + 10}` });
      return;
    }
    if (form.phone && form.phone.length > 0 && (form.phone.length < 10 || !/^[0-9+\-\s()]+$/.test(form.phone))) {
      toast.error('Validation error', { description: 'Please enter a valid phone number' });
      return;
    }
    if (form.linkedin && form.linkedin.length > 0 && !form.linkedin.includes('linkedin.com')) {
      toast.error('Validation error', { description: 'Please enter a valid LinkedIn URL' });
      return;
    }
    if (form.bio && form.bio.length > 500) {
      toast.error('Validation error', { description: 'Bio must be less than 500 characters' });
      return;
    }

    try {
      const updated = await alumniService.update(form._id, form);
      setForm(updated);
      setUser({ ...user, ...updated });
      toast.success('Profile saved!', { description: 'Your changes have been updated successfully.' });
      setError('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Update failed';
      setError(msg);
      toast.error('Failed to update profile', { description: msg });
    }
  };

  if (loading || !form) {
    return <Skeleton className="h-96 rounded-2xl bg-white/[0.04]" />;
  }

  const inputClass = "h-10 bg-white/[0.04] border-white/[0.1] text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl";
  const labelClass = "text-xs font-semibold uppercase tracking-wide text-muted-foreground";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Your Profile"
        subtitle="Manage your personal details, career info, and account preferences."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card left */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 text-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-primary/40" />

            <div className="relative group mx-auto mb-4 w-32 h-32">
              {form.profilePicture ? (
                <img
                  src={form.profilePicture}
                  alt={form.name}
                  className="w-32 h-32 rounded-full object-cover border-2 border-white/10"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className="w-32 h-32 rounded-full bg-primary/10 border-2 border-primary/20 items-center justify-center font-bold text-primary text-3xl"
                style={{ display: form.profilePicture ? 'none' : 'flex' }}
              >
                {form.name ? form.name.substring(0, 2).toUpperCase() : <User className="h-10 w-10" />}
              </div>
              <button
                type="button"
                onClick={() => setShowPhotoDialog(true)}
                className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-[#0D1000] hover:scale-105 hover:bg-primary/95 transition-all shadow-xl"
                aria-label="Upload photo"
              >
                <Camera className="h-4.5 w-4.5" />
              </button>
            </div>

            <h2 className="text-lg font-bold text-foreground">{form.name}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{form.email}</p>
            {form.role === 'admin' && (
              <span className="mt-2.5 inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 rounded-full px-2.5 py-0.5">
                Admin
              </span>
            )}

            <div className="border-t border-white/[0.06] mt-5 pt-4 text-left space-y-2.5 text-xs text-muted-foreground">
              {form.department && (
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary shrink-0" />
                  <span>{form.department} {form.graduationYear ? `'${String(form.graduationYear).slice(-2)}` : ''}</span>
                </div>
              )}
              {form.company && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{form.currentJobTitle || 'Employee'} at {form.company}</span>
                </div>
              )}
              {form.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{form.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Info Form Right */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
            <p className="text-sm font-semibold mb-5">Edit Profile Details</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="profile-name" className={labelClass}>Full Name *</Label>
                  <Input id="profile-name" required minLength={2} maxLength={100} value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="profile-email" className={labelClass}>Email Address</Label>
                  <Input id="profile-email" value={form.email} disabled className={`${inputClass} opacity-60 cursor-not-allowed`} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="profile-dept" className={labelClass}>Department</Label>
                  <Input id="profile-dept" minLength={2} maxLength={100} value={form.department || ''}
                    onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="profile-year" className={labelClass}>Graduation Year</Label>
                  <Input id="profile-year" type="number" min={1950} max={new Date().getFullYear() + 10}
                    value={form.graduationYear || ''}
                    onChange={(e) => setForm((p) => ({ ...p, graduationYear: e.target.value }))} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="profile-company" className={labelClass}>Company</Label>
                  <Input id="profile-company" maxLength={100} value={form.company || ''}
                    onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="profile-title" className={labelClass}>Job Title</Label>
                  <Input id="profile-title" maxLength={100} value={form.currentJobTitle || ''}
                    onChange={(e) => setForm((p) => ({ ...p, currentJobTitle: e.target.value }))} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="profile-loc" className={labelClass}>Location</Label>
                  <Input id="profile-loc" maxLength={100} value={form.location || ''}
                    onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="profile-linkedin" className={labelClass}>LinkedIn URL</Label>
                  <Input id="profile-linkedin" type="url" maxLength={200} placeholder="https://linkedin.com/in/..."
                    value={form.linkedin || ''}
                    onChange={(e) => setForm((p) => ({ ...p, linkedin: e.target.value }))} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="profile-phone" className={labelClass}>Phone Number</Label>
                  <Input id="profile-phone" type="tel" maxLength={20} placeholder="e.g. +91 98765 43210"
                    value={form.phone || ''}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className={inputClass} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="profile-bio" className={labelClass}>Short Bio</Label>
                <Textarea id="profile-bio" rows={3} maxLength={500} placeholder="Tell classmates a bit about yourself..."
                  value={form.bio || ''}
                  onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                  className="bg-white/[0.04] border-white/[0.1] text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl" />
              </div>

              {error && <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2" role="alert">{error}</p>}

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all inline-flex items-center gap-1.5 hover:shadow-lg hover:shadow-primary/15"
                >
                  <Save className="h-4 w-4" />
                  Save Settings
                </button>
              </div>
            </form>
          </div>

          {/* Danger Zone */}
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
            <div className="flex items-start gap-3 mb-4 text-destructive">
              <TriangleAlert className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Danger Zone</p>
                <p className="text-xs text-muted-foreground mt-0.5">Permanent account deletions cannot be recovered.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-destructive/20 bg-black/10">
              <div>
                <p className="text-xs font-semibold text-foreground">Delete Account</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">All your profile logs and jobs posted will be permanently erased.</p>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button disabled={deletingAccount}
                    className="h-9 px-4 rounded-xl bg-destructive text-white hover:bg-destructive/95 transition-all text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm">
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Account
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="border-white/[0.08] bg-[#1C1D21]">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Permanently delete your account?</AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground">
                      This will immediately and permanently delete your profile, all your data, and revoke your access. <strong>This action cannot be undone.</strong>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-white/[0.1] bg-white/[0.03]">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-white hover:bg-destructive/90">
                      Yes, delete permanently
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>

      {/* Change Photo Dialog */}
      <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
        <div className="p-6 bg-[#1C1D21]">
          <DialogHeader>
            <DialogTitle>Change Profile Photo</DialogTitle>
            <DialogDescription className="text-muted-foreground">Upload a new square avatar image.</DialogDescription>
          </DialogHeader>

          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />

          <div className="mt-4 space-y-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full h-11 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 transition-all text-sm font-semibold inline-flex items-center justify-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {uploading ? 'Uploading…' : 'Upload Photo'}
            </button>

            {form.profilePicture && (
              <button
                onClick={handleRemoveImage}
                className="w-full h-11 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10 transition-all text-sm font-semibold inline-flex items-center justify-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Remove Current Photo
              </button>
            )}

            <button
              onClick={() => setShowPhotoDialog(false)}
              className="w-full h-11 rounded-xl border border-white/[0.1] bg-white/[0.03] text-sm text-muted-foreground hover:bg-white/[0.07] hover:text-foreground transition-all"
            >
              Cancel
            </button>
          </div>

          <div className="mt-4 rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 text-[11px] text-muted-foreground/60 space-y-1">
            <p>• Allowed formats: JPG, PNG, GIF, WebP</p>
            <p>• Maximum size: 5MB</p>
            <p>• Ideal aspect ratio: 1:1 square ratio</p>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
