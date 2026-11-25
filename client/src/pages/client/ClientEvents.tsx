import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { SafeAvatar } from '../../components/common/SafeAvatar';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  ShieldCheck,
  Camera,
  Sparkles,
  Info,
  Loader2,
  Filter,
} from 'lucide-react';

export const ClientEvents: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialEventId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Selected event modal details
  const [selectedEventId, setSelectedEventId] = useState<string | null>(initialEventId);
  const [detailLoading, setDetailLoading] = useState(false);
  const [eventDetail, setEventDetail] = useState<any | null>(null);
  const [activePhotoTab, setActivePhotoTab] = useState<'BEFORE' | 'AFTER'>('BEFORE');

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadEventDetail(selectedEventId);
    } else {
      setEventDetail(null);
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getClientEvents();
      setEvents(res.events || []);

      // If initialEventId was provided via query parameter, open it
      if (initialEventId && !eventDetail) {
        loadEventDetail(initialEventId);
      }
    } catch (err: any) {
      console.error('[CLIENT EVENTS] Fetch error:', err);
      setError(err?.message || 'Failed to load organization events');
    } finally {
      setLoading(false);
    }
  };

  const loadEventDetail = async (id: string) => {
    try {
      setDetailLoading(true);
      const res = await api.getClientEvent(id);
      setEventDetail(res.event);
    } catch (err: any) {
      console.error('[CLIENT EVENT DETAIL] Error:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Verified':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Completed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Cleaning In Progress':
        return 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';
      case 'Crew Assigned':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Scheduled':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const filteredEvents = events.filter((e) => {
    if (statusFilter === 'ALL') return true;
    return e.computedStatus === statusFilter;
  });

  return (
    <div className="space-y-4">
      {/* FULL-BLEED HERO HEADER */}
      <div className="relative bg-gradient-to-b from-[#06122c] via-[#133274] to-[#1e4aa8] px-4 pt-16 pb-8 overflow-hidden">
        <div
          className="absolute top-0 right-0 w-52 h-full opacity-35 pointer-events-none bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80')",
            maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 15%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 15%, rgba(0,0,0,0) 100%)',
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#eef3f9] to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-2 max-w-[85%]">
          <h1 className="text-2xl font-black text-white leading-tight tracking-tight">
            My Events
          </h1>
          <p className="text-xs text-blue-100/90 leading-relaxed border-l-2 border-blue-400 pl-2.5">
            Real-time operational monitoring of all scheduled and completed cleaning tasks
          </p>
        </div>
      </div>

      {/* BODY CONTENT */}
      <div className="px-3.5 -mt-4 relative z-10 space-y-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {['ALL', 'Scheduled', 'Crew Assigned', 'Cleaning In Progress', 'Completed', 'Verified'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-full text-3xs font-bold shrink-0 transition-colors ${
                statusFilter === st
                  ? 'bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white shadow-sm'
                  : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-100 shadow-2xs'
              }`}
            >
              {st === 'ALL' ? 'All Events' : st}
            </button>
          ))}
        </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading events...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <h3 className="text-sm font-bold text-red-900">Failed to load events</h3>
          <p className="text-xs text-red-700 max-w-md mx-auto">{error}</p>
          <button
            onClick={fetchEvents}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition"
          >
            Retry
          </button>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No events found</h3>
          <p className="text-3xs text-slate-500 max-w-md mx-auto">
            {statusFilter !== 'ALL'
              ? `No events matching status "${statusFilter}". Try choosing "All Events".`
              : 'No cleaning events have been assigned to your organization yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredEvents.map((evt) => (
            <div
              key={evt.eventId}
              onClick={() => setSelectedEventId(evt.eventId)}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`text-3xs font-extrabold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                      evt.computedStatus
                    )}`}
                  >
                    {evt.computedStatus}
                  </span>
                  <span className="text-3xs text-slate-400 font-semibold">{evt.date}</span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {evt.eventName}
                  </h3>
                  {evt.cleaningRequirements && (
                    <p className="text-3xs text-slate-500 line-clamp-2 mt-1">
                      {evt.cleaningRequirements}
                    </p>
                  )}
                </div>

                <div className="space-y-2 text-3xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{evt.locationName || 'Assigned Property'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{evt.startTime} - {evt.endTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {evt.assignedTeam?.name || 'Cleaning Crew'} • {evt.assignedWorkersCount || 0} Worker(s)
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-3xs">
                <span className="text-slate-500 font-medium">
                  Supervisor: <strong className="text-slate-800">{evt.teamLeader?.name || 'On Site'}</strong>
                </span>
                <span className="inline-flex items-center gap-1 text-blue-600 font-bold">
                  <Eye className="w-3.5 h-3.5" />
                  View Progress
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* DETAILED EVENT INSPECTION MODAL */}
      {selectedEventId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900">
                    {eventDetail?.eventName || 'Event Details'}
                  </h3>
                  {eventDetail && (
                    <span
                      className={`text-4xs font-extrabold px-2 py-0.5 rounded-full border ${getStatusBadge(
                        eventDetail.computedStatus
                      )}`}
                    >
                      {eventDetail.computedStatus}
                    </span>
                  )}
                </div>
                <p className="text-3xs text-slate-500">
                  Read-only operational information synchronized from field workers
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedEventId(null);
                  searchParams.delete('id');
                  setSearchParams(searchParams);
                }}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-slate-700">
              {detailLoading || !eventDetail ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  <p className="text-xs text-slate-500 font-medium">Loading operational report...</p>
                </div>
              ) : (
                <>
                  {/* Basic Event Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
                    <div>
                      <span className="text-3xs font-bold uppercase text-slate-400">Date & Schedule</span>
                      <p className="font-bold text-slate-800 mt-0.5">
                        {eventDetail.date} ({eventDetail.startTime} - {eventDetail.endTime})
                      </p>
                    </div>
                    <div>
                      <span className="text-3xs font-bold uppercase text-slate-400">Location</span>
                      <p className="font-bold text-slate-800 mt-0.5">
                        {eventDetail.location?.name || 'Primary Facility'}
                      </p>
                      {eventDetail.location?.address && (
                        <p className="text-3xs text-slate-500 mt-0.5">{eventDetail.location.address}</p>
                      )}
                    </div>
                    {eventDetail.cleaningRequirements && (
                      <div className="sm:col-span-2 pt-2 border-t border-slate-200/60">
                        <span className="text-3xs font-bold uppercase text-slate-400">Cleaning Requirements</span>
                        <p className="text-3xs text-slate-700 mt-0.5 whitespace-pre-wrap">
                          {eventDetail.cleaningRequirements}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Cleaning Progress Status Bar */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Cleaning Execution Lifecycle
                    </h4>
                    <div className="grid grid-cols-4 gap-2 text-center text-3xs font-bold">
                      <div
                        className={`p-2.5 rounded-xl border ${
                          ['Scheduled', 'Crew Assigned', 'Cleaning In Progress', 'Completed', 'Verified'].includes(
                            eventDetail.computedStatus
                          )
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}
                      >
                        1. Scheduled
                      </div>
                      <div
                        className={`p-2.5 rounded-xl border ${
                          ['Crew Assigned', 'Cleaning In Progress', 'Completed', 'Verified'].includes(
                            eventDetail.computedStatus
                          )
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}
                      >
                        2. Crew Assigned
                      </div>
                      <div
                        className={`p-2.5 rounded-xl border ${
                          ['Cleaning In Progress', 'Completed', 'Verified'].includes(eventDetail.computedStatus)
                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}
                      >
                        3. In Progress
                      </div>
                      <div
                        className={`p-2.5 rounded-xl border ${
                          eventDetail.computedStatus === 'Verified'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : eventDetail.computedStatus === 'Completed'
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}
                      >
                        4. {eventDetail.computedStatus === 'Verified' ? 'Verified ✓' : 'Completed'}
                      </div>
                    </div>
                  </div>

                  {/* Assigned Workers & Check-In Status */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Assigned Cleaning Crew ({eventDetail.assignedWorkers?.length || 0} Workers)
                      </h4>
                      <span className="text-3xs text-slate-500 font-medium">
                        Leader: <strong>{eventDetail.teamLeader?.name || 'Assigned Supervisor'}</strong>
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden">
                      {eventDetail.assignedWorkers?.length === 0 ? (
                        <div className="p-4 text-center text-3xs text-slate-400">
                          No workers assigned to this event yet.
                        </div>
                      ) : (
                        eventDetail.assignedWorkers?.map((w: any) => (
                          <div key={w.workerId} className="p-3 flex items-center justify-between bg-white hover:bg-slate-50">
                            <div className="flex items-center gap-3">
                              <SafeAvatar
                                src={w.photoURL}
                                name={w.name}
                                className="w-8 h-8 rounded-full border border-slate-200"
                              />
                              <div>
                                <div className="text-xs font-bold text-slate-800">{w.name}</div>
                                <div className="text-3xs text-slate-400">{w.workerCode}</div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {w.checkInStatus === 'ABSENT' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-3xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  Absent
                                </span>
                              ) : w.isCheckedIn ? (
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-3xs font-bold border ${
                                    w.checkInStatus === 'LATE'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : w.gpsVerified
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  {w.checkInStatus === 'LATE'
                                    ? 'Late Check-in'
                                    : w.gpsVerified
                                    ? 'Verified'
                                    : 'Flagged'}
                                  {w.checkInTime
                                    ? ` · ${new Date(w.checkInTime).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}`
                                    : ''}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-3xs font-medium bg-slate-100 text-slate-500">
                                  Pending Check-in
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Before and After Cleaning Photo Evidence */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-blue-600" />
                        Before & After Photo Evidence
                      </h4>
                      <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-3xs font-bold">
                        <button
                          onClick={() => setActivePhotoTab('BEFORE')}
                          className={`px-3 py-1 rounded-lg transition ${
                            activePhotoTab === 'BEFORE'
                              ? 'bg-white text-blue-600 shadow-xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Before Photos ({eventDetail.beforePhotos?.length || 0})
                        </button>
                        <button
                          onClick={() => setActivePhotoTab('AFTER')}
                          className={`px-3 py-1 rounded-lg transition ${
                            activePhotoTab === 'AFTER'
                              ? 'bg-white text-blue-600 shadow-xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          After Photos ({eventDetail.afterPhotos?.length || 0})
                        </button>
                      </div>
                    </div>

                    {/* Photo Grid */}
                    {activePhotoTab === 'BEFORE' ? (
                      eventDetail.beforePhotos?.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-1">
                          <Camera className="w-6 h-6 text-slate-300 mx-auto" />
                          <p className="text-3xs text-slate-500 font-medium">
                            No "Before Work" photos uploaded yet
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {eventDetail.beforePhotos.map((photo: any) => (
                            <div
                              key={photo.evidenceId}
                              className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 group relative aspect-square"
                            >
                              <img
                                src={photo.watermarkUrl || photo.photoUrl}
                                alt="Before cleaning"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-white text-4xs">
                                <p className="font-semibold truncate">{photo.workerName || 'Crew Member'}</p>
                                <p className="text-slate-300 truncate">{photo.capturedAt?.slice(11, 16) || 'Logged'}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    ) : eventDetail.afterPhotos?.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-1">
                        <Camera className="w-6 h-6 text-slate-300 mx-auto" />
                        <p className="text-3xs text-slate-500 font-medium">
                          No "After Work" photos uploaded yet
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {eventDetail.afterPhotos.map((photo: any) => (
                          <div
                            key={photo.evidenceId}
                            className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 group relative aspect-square"
                          >
                            <img
                              src={photo.watermarkUrl || photo.photoUrl}
                              alt="After cleaning"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-white text-4xs">
                              <p className="font-semibold truncate">{photo.workerName || 'Crew Member'}</p>
                              <p className="text-slate-300 truncate">{photo.capturedAt?.slice(11, 16) || 'Logged'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Supervisor Verification & Completion Time */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-3xs font-bold uppercase tracking-wider text-slate-400">
                        Supervisor Verification & Sign-off
                      </span>
                      {eventDetail.supervisorVerification?.isVerified ? (
                        <span className="inline-flex items-center gap-1 text-3xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Verified
                        </span>
                      ) : (
                        <span className="text-3xs text-slate-400 font-medium">Pending Review</span>
                      )}
                    </div>

                    <div className="text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="text-3xs text-slate-500">Verified By:</span>
                        <span className="font-bold">
                          {eventDetail.supervisorVerification?.verifiedBy || 'Pending supervisor approval'}
                        </span>
                      </div>
                      {eventDetail.completedAt && (
                        <div className="flex items-center justify-between text-slate-700">
                          <span className="text-3xs text-slate-500">Completion Time:</span>
                          <span className="font-bold">{eventDetail.completedAt}</span>
                        </div>
                      )}
                      {eventDetail.supervisorVerification?.reviewNotes && (
                        <div className="pt-2 border-t border-slate-200 text-3xs text-slate-600 italic">
                          "{eventDetail.supervisorVerification.reviewNotes}"
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => {
                  setSelectedEventId(null);
                  searchParams.delete('id');
                  setSearchParams(searchParams);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
