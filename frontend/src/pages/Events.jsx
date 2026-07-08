import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem, ComboboxEmpty } from '@/components/ui/combobox';
import { Calendar } from '@/components/ui/calendar';
import { eventService } from '@/services/eventService';
import { alumniService } from '@/services/alumniService';
import useAuthStore from '@/store/authStore';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, CalendarIcon, Pencil, Trash2, CheckCircle2, Clock, UserPlus, X, ChevronLeft, ChevronRight, Download, MapPin, Globe, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { exportEvents } from '@/utils/exportUtils';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';

const defaultEvent = {
  title: '', description: '', date: '', startTime: '09:00', endTime: '17:00',
  location: '', mode: 'online', maxAttendees: '', isPublic: true, guests: []
};
const ITEMS_PER_PAGE = 20;

// Helper function to convert 24-hour time to 12-hour format
const convertTo12Hour = (time24) => {
  if (!time24) return { hours: '9', minutes: '00', period: 'AM' };
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return { hours: hour12.toString(), minutes, period };
};

// Helper function to convert 12-hour time to 24-hour format
const convertTo24Hour = (hours, minutes, period) => {
  let hour = parseInt(hours, 10);
  if (period === 'AM' && hour === 12) hour = 0;
  if (period === 'PM' && hour !== 12) hour += 12;
  return `${hour.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`;
};

const formatTime12Hour = (time24) => {
  if (!time24) return '';
  const converted = convertTo12Hour(time24);
  return `${converted.hours}:${converted.minutes} ${converted.period}`;
};

export default function EventsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(defaultEvent);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ open: false, record: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [modalCalendarOpen, setModalCalendarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [eventFilter, setEventFilter] = useState('upcoming'); // 'all', 'upcoming', 'past'
  const calendarRef = useRef(null);
  const modalCalendarRef = useRef(null);

  // 12-hour time format state for create form
  const [startTime12, setStartTime12] = useState(convertTo12Hour('09:00'));
  const [endTime12, setEndTime12] = useState(convertTo12Hour('17:00'));

  // 12-hour time format state for edit modal
  const [modalStartTime12, setModalStartTime12] = useState(convertTo12Hour('09:00'));
  const [modalEndTime12, setModalEndTime12] = useState(convertTo12Hour('17:00'));

  // Filter events based on selected filter
  const filteredEvents = events.filter((event) => {
    if (!event.date) return eventFilter === 'all';
    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (eventFilter === 'upcoming') {
      return eventDate >= today;
    } else if (eventFilter === 'past') {
      return eventDate < today;
    }
    return true; // 'all'
  });

  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEvents = filteredEvents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const goToPage = (page) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));

  useEffect(() => {
    const time24 = convertTo24Hour(startTime12.hours, startTime12.minutes, startTime12.period);
    setForm(p => ({ ...p, startTime: time24 }));
  }, [startTime12]);

  useEffect(() => {
    const time24 = convertTo24Hour(endTime12.hours, endTime12.minutes, endTime12.period);
    setForm(p => ({ ...p, endTime: time24 }));
  }, [endTime12]);

  useEffect(() => {
    if (modal.record) {
      const time24 = convertTo24Hour(modalStartTime12.hours, modalStartTime12.minutes, modalStartTime12.period);
      setModal(p => ({ ...p, record: { ...p.record, startTime: time24 } }));
    }
  }, [modalStartTime12]);

  useEffect(() => {
    if (modal.record) {
      const time24 = convertTo24Hour(modalEndTime12.hours, modalEndTime12.minutes, modalEndTime12.period);
      setModal(p => ({ ...p, record: { ...p.record, endTime: time24 } }));
    }
  }, [modalEndTime12]);

  useEffect(() => {
    if (modal.open && modal.record) {
      setModalStartTime12(convertTo12Hour(modal.record.startTime));
      setModalEndTime12(convertTo12Hour(modal.record.endTime));
    }
  }, [modal.open]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setCalendarOpen(false);
      }
      if (modalCalendarRef.current && !modalCalendarRef.current.contains(event.target)) {
        setModalCalendarOpen(false);
      }
    };
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setCalendarOpen(false);
        setModalCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await eventService.list();
      setEvents(data);
    } catch {
      setError('Unable to load events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    
    if (!form.title || form.title.trim().length < 3) {
      toast.error('Validation error', { description: 'Title must be at least 3 characters' });
      return;
    }
    if (form.title.length > 100) {
      toast.error('Validation error', { description: 'Title must be less than 100 characters' });
      return;
    }
    if (!form.date) {
      toast.error('Validation error', { description: 'Date is required' });
      return;
    }
    if (form.startTime >= form.endTime) {
      toast.error('Validation error', { description: 'End time must be after start time' });
      return;
    }

    setCreating(true);
    setError('');
    try {
      const dateTime = new Date(form.date);
      const created = await eventService.create({ 
        ...form, 
        date: dateTime.toISOString().split('T')[0],
        startTime: form.startTime,
        endTime: form.endTime
      });
      setEvents((prev) => [created, ...prev]);
      setForm(defaultEvent);
      setStartTime12(convertTo12Hour('09:00'));
      setEndTime12(convertTo12Hour('17:00'));
      toast.success('Event created!', { description: `${form.title} has been added.` });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create event';
      setError(msg);
      toast.error('Failed to create event', { description: msg });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async () => {
    if (!modal.record) return;
    if (!modal.record.title || modal.record.title.trim().length < 3) {
      toast.error('Validation error', { description: 'Title must be at least 3 characters' });
      return;
    }
    try {
      const dateTime = new Date(modal.record.date);
      const updated = await eventService.update(modal.record._id, { 
        ...modal.record, 
        date: dateTime.toISOString().split('T')[0],
        startTime: modal.record.startTime,
        endTime: modal.record.endTime
      });
      setEvents((prev) => prev.map((e) => (e._id === updated._id ? updated : e)));
      setModal({ open: false, record: null });
      toast.success('Event updated!', { description: 'Event details have been saved.' });
    } catch (err) {
      toast.error('Failed to update event', { description: err.response?.data?.message || 'Update failed' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await eventService.remove(id);
      setEvents((prev) => prev.filter((e) => e._id !== id));
      setDeleteDialog({ open: false, id: null });
      toast.success('Event deleted', { description: 'The event has been removed.' });
    } catch (err) {
      toast.error('Failed to delete event', { description: err.response?.data?.message || 'Delete failed' });
    }
  };

  const handleRsvp = async (eventId, joined) => {
    try {
      if (joined) {
        await eventService.unrsvp(eventId);
        toast.success('RSVP cancelled', { description: 'You have been removed from the attendee list.' });
      } else {
        await eventService.rsvp(eventId);
        toast.success('RSVP confirmed!', { description: 'You have been added to the attendee list.' });
      }
      fetchEvents();
    } catch (err) {
      toast.error('RSVP failed', { description: err.response?.data?.message || 'Unable to update RSVP' });
    }
  };

  const inputClass = "h-10 bg-white/[0.04] border-white/[0.1] text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl";
  const labelClass = "text-xs font-semibold uppercase tracking-wide text-muted-foreground";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Events"
        title="Community Events"
        subtitle="Browse reunions, conferences, and technical workshops."
      >
        <button
          onClick={() => { exportEvents(events); toast.success('Export started', { description: 'Downloading events as CSV...' }); }}
          disabled={events.length === 0}
          className="h-9 px-3.5 rounded-xl border border-white/[0.1] bg-white/[0.03] text-xs font-medium text-muted-foreground hover:bg-white/[0.07] hover:text-foreground transition-all disabled:opacity-40 inline-flex items-center gap-1.5"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
      </PageHeader>

      {/* Filter pills */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div className="flex gap-1.5">
          {['upcoming', 'past', 'all'].map((filter) => (
            <button
              key={filter}
              onClick={() => { setEventFilter(filter); setCurrentPage(1); }}
              className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all capitalize border ${
                eventFilter === filter
                  ? 'bg-primary/10 border-primary/20 text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
              }`}
            >
              {filter} Events
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Create Form (Admins only) */}
        {isAdmin && (
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
              <p className="text-sm font-semibold mb-5">Create New Event</p>
              <form className="space-y-4" onSubmit={handleCreate}>
                <div className="space-y-1.5">
                  <Label htmlFor="evt-title" className={labelClass}>Title *</Label>
                  <Input id="evt-title" required minLength={3} maxLength={100} value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Annual Reunion 2025" className={inputClass} />
                </div>

                <div className="space-y-1.5">
                  <Label className={labelClass}>Date *</Label>
                  <div className="relative" ref={calendarRef}>
                    <button
                      type="button"
                      onClick={() => setCalendarOpen(!calendarOpen)}
                      className="w-full h-10 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3.5 text-left text-sm text-foreground flex items-center justify-between hover:bg-white/[0.06] transition-all"
                    >
                      <span className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        {form.date ? format(new Date(form.date), 'MMM dd, yyyy') : <span className="text-muted-foreground/60">Select date</span>}
                      </span>
                    </button>
                    {calendarOpen && (
                      <div className="absolute left-0 mt-1.5 z-20 rounded-2xl border border-white/[0.08] bg-[#1C1D21] p-3 shadow-2xl">
                        <Calendar
                          mode="single"
                          selected={form.date ? new Date(form.date) : undefined}
                          onSelect={(date) => {
                            setForm((p) => ({ ...p, date: date ? date.toISOString() : '' }));
                            setCalendarOpen(false);
                          }}
                          disabled={{ before: new Date() }}
                          initialFocus
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className={labelClass}>Start Time</Label>
                    <div className="flex gap-1">
                      <Input type="number" min="1" max="12" required value={startTime12.hours}
                        onChange={(e) => setStartTime12(p => ({ ...p, hours: e.target.value }))}
                        placeholder="HH" className="h-10 px-1 text-center bg-white/[0.04] border-white/[0.1]" />
                      <Input type="number" min="0" max="59" required value={startTime12.minutes}
                        onChange={(e) => setStartTime12(p => ({ ...p, minutes: e.target.value.padStart(2, '0') }))}
                        placeholder="MM" className="h-10 px-1 text-center bg-white/[0.04] border-white/[0.1]" />
                      <select value={startTime12.period} onChange={(e) => setStartTime12(p => ({ ...p, period: e.target.value }))}
                        className="h-10 px-2 bg-[#17181C] border border-white/[0.1] text-foreground text-xs rounded-xl focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none w-16 cursor-pointer text-center">
                        <option value="AM" className="bg-[#1C1D21] text-foreground">AM</option>
                        <option value="PM" className="bg-[#1C1D21] text-foreground">PM</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className={labelClass}>End Time</Label>
                    <div className="flex gap-1">
                      <Input type="number" min="1" max="12" required value={endTime12.hours}
                        onChange={(e) => setEndTime12(p => ({ ...p, hours: e.target.value }))}
                        placeholder="HH" className="h-10 px-1 text-center bg-white/[0.04] border-white/[0.1]" />
                      <Input type="number" min="0" max="59" required value={endTime12.minutes}
                        onChange={(e) => setEndTime12(p => ({ ...p, minutes: e.target.value.padStart(2, '0') }))}
                        placeholder="MM" className="h-10 px-1 text-center bg-white/[0.04] border-white/[0.1]" />
                      <select value={endTime12.period} onChange={(e) => setEndTime12(p => ({ ...p, period: e.target.value }))}
                        className="h-10 px-2 bg-[#17181C] border border-white/[0.1] text-foreground text-xs rounded-xl focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none w-16 cursor-pointer text-center">
                        <option value="AM" className="bg-[#1C1D21] text-foreground">AM</option>
                        <option value="PM" className="bg-[#1C1D21] text-foreground">PM</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className={labelClass}>Event Mode</Label>
                    <Combobox value={form.mode} onValueChange={(val) => val && setForm(p => ({ ...p, mode: val }))}>
                      <ComboboxInput placeholder="Select mode" className={`${inputClass} w-full`} />
                      <ComboboxContent>
                        <ComboboxList>
                          <ComboboxItem value="online">Online</ComboboxItem>
                          <ComboboxItem value="offline">Onsite</ComboboxItem>
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="evt-capacity" className={labelClass}>Capacity</Label>
                    <Input id="evt-capacity" type="number" min="1" value={form.maxAttendees}
                      onChange={(e) => setForm(p => ({ ...p, maxAttendees: e.target.value }))}
                      placeholder="Max (optional)" className={inputClass} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="evt-loc" className={labelClass}>Location / Link *</Label>
                  <Input id="evt-loc" required value={form.location}
                    onChange={(e) => setForm(p => ({ ...p, location: e.target.value }))}
                    placeholder="e.g. Zoom link or Conference Hall A" className={inputClass} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="evt-desc" className={labelClass}>Description *</Label>
                  <Textarea id="evt-desc" required rows={4} maxLength={500}
                    value={form.description}
                    onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Give details about the schedule, guests, topics..."
                    className="bg-white/[0.04] border-white/[0.1] text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl" />
                </div>

                {error && <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2" role="alert">{error}</p>}

                <button type="submit" disabled={creating}
                  className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-60">
                  <CalendarDays className="h-4 w-4" />
                  {creating ? 'Creating…' : 'Schedule Event'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Events Grid list */}
        <div className={isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'}>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-44 rounded-2xl bg-white/[0.04]" />)}
            </div>
          ) : filteredEvents.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No events found" description="There are no events registered in this section." />
          ) : (
            <div className="space-y-3">
              {paginatedEvents.map((evt) => {
                const joined = evt.attendees?.some((att) => (att._id || att) === user?._id);
                const isPast = new Date(evt.date) < new Date().setHours(0,0,0,0);
                
                return (
                  <motion.div
                    key={evt._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 hover:border-white/[0.14] hover:bg-white/[0.04] card-hover transition-all"
                  >
                    <div className="flex flex-col sm:flex-row items-start gap-4 justify-between">
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">
                            {format(new Date(evt.date), 'MMM dd, yyyy')}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-white/[0.05] border border-white/10 rounded-full px-2 py-0.5 capitalize">
                            {evt.mode === 'offline' ? 'onsite' : evt.mode}
                          </span>
                          {isPast && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 bg-white/[0.02] border border-white/[0.05] rounded-full px-2 py-0.5">
                              Past Event
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">{evt.title}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {formatTime12Hour(evt.startTime)} – {formatTime12Hour(evt.endTime)}
                        </p>

                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          {evt.mode === 'online' ? <Globe className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                          <span className="truncate">{evt.location}</span>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2 pt-1">{evt.description}</p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground/80 pt-2">
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {evt.attendees?.length || 0} Attending {evt.maxAttendees ? `/ ${evt.maxAttendees}` : ''}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                          <button
                            onClick={() => handleRsvp(evt._id, joined)}
                            disabled={isPast}
                            className={`inline-flex items-center gap-1.5 h-8 px-4 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 ${
                              joined
                                ? 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15'
                                : 'bg-primary text-[#0D1000] hover:bg-primary/90'
                            }`}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {joined ? 'Going' : 'RSVP'}
                          </button>

                          {isAdmin && (
                            <>
                              <button
                                onClick={() => setModal({ open: true, record: evt })}
                                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-white/[0.1] bg-white/[0.03] text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.07] transition-all"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                              </button>
                              <button
                                onClick={() => setDeleteDialog({ open: true, id: evt._id })}
                                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-destructive/20 bg-destructive/5 text-xs text-destructive hover:bg-destructive/10 transition-all"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Pagination */}
              {filteredEvents.length > ITEMS_PER_PAGE && (
                <nav className="flex items-center justify-between pt-2">
                  <p className="text-xs text-muted-foreground">
                    Showing {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, filteredEvents.length)} of {filteredEvents.length}
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
          )}
        </div>
      </div>

      {/* Edit Modal (Admin) */}
      {modal.open && modal.record && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#1C1D21] shadow-2xl"
          >
            <div className="p-6">
              <DialogHeader>
                <DialogTitle>Edit Event</DialogTitle>
                <DialogDescription className="text-muted-foreground">Modify event details and save changes.</DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label className={labelClass}>Event Title</Label>
                  <Input value={modal.record.title}
                    onChange={(e) => setModal((p) => ({ ...p, record: { ...p.record, title: e.target.value } }))}
                    className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClass}>Description</Label>
                  <Textarea rows={4} value={modal.record.description}
                    onChange={(e) => setModal((p) => ({ ...p, record: { ...p.record, description: e.target.value } }))}
                    className="bg-white/[0.04] border-white/[0.1] text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClass}>Location / Link</Label>
                  <Input value={modal.record.location}
                    onChange={(e) => setModal((p) => ({ ...p, record: { ...p.record, location: e.target.value } }))}
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

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, id: null })}>
        <AlertDialogContent className="border-white/[0.08] bg-[#1C1D21]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this event?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium">
              Are you sure? This event will be permanently deleted and all RSVPs will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/[0.1] bg-white/[0.03]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(deleteDialog.id)} className="bg-destructive text-white hover:bg-destructive/90">
              Delete Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
