import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Organization, Invoice } from '../../types';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  CreditCard,
  CalendarCheck2,
} from 'lucide-react';

export const ClientOverview: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    completedEvents: 0,
    pendingPayments: 0,
    totalContractAmount: 0,
    totalPaid: 0,
    outstandingAmount: 0,
  });
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getClientOverview();
      setSummary(res.summary);
      setOrganization(res.organization);
      setUpcomingEvents(res.upcomingEvents || []);
      setRecentInvoices(res.recentInvoices || []);
    } catch (err: any) {
      console.error('[CLIENT OVERVIEW] Fetch error:', err);
      setError(err?.message || 'Failed to load organization overview.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Verified':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Completed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Cleaning In Progress':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Crew Assigned':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Scheduled':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <LoadingSpinner message="Loading organization overview..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <h3 className="text-sm font-bold text-rose-900">Unable to load dashboard</h3>
          <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
          <button
            onClick={fetchOverview}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* FULL-BLEED HERO HEADER WITH ARCHITECTURAL GLASS BACKDROP */}
      <div className="relative bg-gradient-to-b from-[#0b1b3d] via-[#133274] to-[#1e4aa8] px-4 pt-4 pb-6 overflow-hidden">
        {/* Subtle Glass Tower Image on Right */}
        <div
          className="absolute top-0 right-0 w-56 h-full opacity-35 pointer-events-none bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80')",
            maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 15%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 15%, rgba(0,0,0,0) 100%)',
          }}
        />
        {/* Soft Bottom Fade */}
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#eef3f9] to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="space-y-2 max-w-[85%]">
            <h1 className="text-2xl font-black text-white leading-tight tracking-tight">
              {organization?.name || 'Apex Corporate Towers'} Overview
            </h1>
            <p className="text-xs text-blue-100/90 leading-relaxed border-l-2 border-blue-400 pl-2.5">
              Real-time cleaning service schedules, crew status, and contract billing summary.
            </p>
          </div>

          {/* TWO ACTION BUTTONS */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Link
              to="/client/events"
              className="bg-white hover:bg-slate-50 text-slate-900 rounded-2xl py-3 px-3.5 text-xs font-bold shadow-lg shadow-slate-900/15 flex items-center justify-center gap-2 transition active:scale-98"
            >
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>My Events</span>
            </Link>
            <Link
              to="/client/invoices"
              className="bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] hover:from-[#1d4ed8] hover:to-[#1e40af] text-white rounded-2xl py-3 px-3.5 text-xs font-bold shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 transition active:scale-98"
            >
              <CreditCard className="w-4 h-4 text-blue-100" />
              <span>Pay Invoices</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* BODY CONTENT */}
      <div className="px-3.5 space-y-4">
        {/* 4 KPI METRIC TILES WITH SOFT PASTEL CORNER WAVES */}
        <div className="grid grid-cols-2 gap-3">
          {/* 1. Total Events */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm relative overflow-hidden">
            <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-blue-50/90 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700">Total Events</span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">{summary.totalEvents}</div>
              <span className="text-3xs text-slate-500 block mt-0.5">Contract assignments</span>
            </div>
          </div>

          {/* 2. Upcoming Events */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm relative overflow-hidden">
            <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-indigo-50/90 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700">Upcoming Events</span>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-indigo-600 mt-1">
                {summary.upcomingEvents}
              </div>
              <span className="text-3xs text-slate-500 block mt-0.5">Scheduled & in progress</span>
            </div>
          </div>

          {/* 3. Completed Events */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm relative overflow-hidden">
            <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-emerald-50/90 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700">Completed Events</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {summary.completedEvents}
              </div>
              <span className="text-3xs text-slate-500 block mt-0.5">Verified work orders</span>
            </div>
          </div>

          {/* 4. Pending Payments */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm relative overflow-hidden">
            <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-orange-50/90 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700">Pending Payments</span>
                <div className="p-2 bg-orange-50 text-orange-600 rounded-xl shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-[#ea580c] mt-1">
                ₹{summary.outstandingAmount.toLocaleString('en-IN')}
              </div>
              <span className="text-3xs text-slate-500 block mt-0.5">
                {summary.pendingPayments} unpaid invoice(s)
              </span>
            </div>
          </div>
        </div>

        {/* UPCOMING & ONGOING EVENTS CARD */}
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-4 space-y-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0 mt-0.5">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-slate-900">Upcoming & Ongoing Events</h2>
                <p className="text-3xs text-slate-500 leading-snug">
                  Active cleaning sessions assigned to your contracted properties
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/client/events')}
              className="px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 text-3xs font-bold flex items-center gap-1 shrink-0 transition"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="py-8 px-4 text-center space-y-2 border border-slate-200/70 rounded-2xl bg-[#f8fafc]">
              <div className="w-11 h-11 rounded-2xl bg-blue-100/70 text-blue-600 flex items-center justify-center mx-auto">
                <CalendarCheck2 className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-800">
                No upcoming events currently scheduled
              </p>
              <p className="text-3xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Your facility supervisor or Go_Repireo administrator will schedule your next service
                session.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((evt) => (
                <div
                  key={evt.eventId}
                  onClick={() => navigate(`/client/events?id=${evt.eventId}`)}
                  className="bg-[#f8fafc] hover:bg-white rounded-2xl border border-slate-200/80 p-3.5 hover:shadow-sm hover:border-blue-300 transition-all cursor-pointer space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-4xs font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                        evt.computedStatus
                      )}`}
                    >
                      {evt.computedStatus}
                    </span>
                    <span className="text-3xs text-slate-400 font-medium">{evt.date}</span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{evt.eventName}</h3>

                  <div className="space-y-1 text-3xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{evt.locationName || 'Main Facility'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {evt.startTime} - {evt.endTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {evt.assignedTeam?.name || 'Assigned Crew'} ({evt.assignedWorkersCount || 0}{' '}
                        Workers)
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-3xs">
                    <span className="text-slate-500">
                      Leader:{' '}
                      <strong className="text-slate-800">
                        {evt.teamLeader?.name || 'Field Supervisor'}
                      </strong>
                    </span>
                    <span className="text-blue-600 font-bold flex items-center gap-0.5">
                      Details <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* INVOICES AWAITING SETTLEMENT */}
        {recentInvoices.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Invoices Awaiting Settlement</h2>
                <p className="text-3xs text-slate-500">
                  Quickly review and clear outstanding invoices
                </p>
              </div>
              <button
                onClick={() => navigate('/client/invoices')}
                className="text-3xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>Manage</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {recentInvoices.slice(0, 3).map((inv) => (
                <div key={inv.invoiceId} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900">{inv.invoiceNumber}</span>
                      <span className="text-4xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        {inv.status}
                      </span>
                    </div>
                    <p className="text-3xs text-slate-500 truncate">
                      {inv.eventName || 'Scheduled Service'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900">
                        ₹{Number(inv.amount).toLocaleString('en-IN')}
                      </div>
                      <div className="text-4xs text-slate-400">Due: {inv.dueDate}</div>
                    </div>
                    <button
                      onClick={() => navigate('/client/invoices')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-3xs font-bold rounded-xl transition"
                    >
                      Pay Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
