import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Organization, Invoice } from '../../types';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Building2,
  Sparkles,
  Loader2,
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
        return 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';
      case 'Crew Assigned':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Scheduled':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Loading client overview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
        <h3 className="text-sm font-bold text-red-900">Unable to load dashboard</h3>
        <p className="text-xs text-red-700 max-w-md mx-auto">{error}</p>
        <button
          onClick={fetchOverview}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-3xs font-semibold uppercase tracking-wider text-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            Contract Portal
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            {organization?.name || 'Client Dashboard'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Welcome to your dedicated cleaning management workspace. Track upcoming services, review before & after photo evidence, and manage invoices with real-time auditability.
          </p>
        </div>
      </div>

      {/* 4 Main Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xs sm:text-2xs font-bold uppercase tracking-wider text-slate-500">
              Total Events
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {summary.totalEvents}
            </div>
            <p className="text-3xs text-slate-400 mt-1">Contract assignments</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xs sm:text-2xs font-bold uppercase tracking-wider text-slate-500">
              Upcoming Events
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-indigo-600">
              {summary.upcomingEvents}
            </div>
            <p className="text-3xs text-slate-400 mt-1">Scheduled & in progress</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xs sm:text-2xs font-bold uppercase tracking-wider text-slate-500">
              Completed Events
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">
              {summary.completedEvents}
            </div>
            <p className="text-3xs text-slate-400 mt-1">Verified work orders</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xs sm:text-2xs font-bold uppercase tracking-wider text-slate-500">
              Pending Payments
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-amber-600">
              ₹{summary.outstandingAmount.toLocaleString('en-IN')}
            </div>
            <p className="text-3xs text-slate-400 mt-1">{summary.pendingPayments} unpaid invoice(s)</p>
          </div>
        </div>
      </div>

      {/* Upcoming & Ongoing Events Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Upcoming & Ongoing Events
            </h2>
            <p className="text-3xs sm:text-2xs text-slate-500">
              Active cleaning sessions assigned to your contracted properties
            </p>
          </div>
          <button
            onClick={() => navigate('/client/events')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-2">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No upcoming events currently scheduled</p>
            <p className="text-3xs text-slate-400">
              Your facility supervisor or Go_Repireo administrator will schedule your next maintenance session.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingEvents.map((evt) => (
              <div
                key={evt.eventId}
                onClick={() => navigate(`/client/events?id=${evt.eventId}`)}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-3xs font-extrabold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                        evt.computedStatus
                      )}`}
                    >
                      {evt.computedStatus}
                    </span>
                    <span className="text-3xs text-slate-400 font-medium">
                      {evt.date}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                    {evt.eventName}
                  </h3>

                  <div className="space-y-1.5 text-3xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{evt.locationName || 'Main Facility'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{evt.startTime} - {evt.endTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        Crew: {evt.assignedTeam?.name || 'Assigned Crew'} ({evt.assignedWorkersCount || 0} Workers)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-3xs">
                  <span className="text-slate-500 font-medium">
                    Leader: <strong className="text-slate-800">{evt.teamLeader?.name || 'Field Supervisor'}</strong>
                  </span>
                  <span className="text-blue-600 font-bold flex items-center gap-1">
                    Details <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoices & Quick Pay Preview */}
      {recentInvoices.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Invoices Awaiting Settlement</h2>
              <p className="text-3xs text-slate-500">Quickly review and clear outstanding invoices</p>
            </div>
            <button
              onClick={() => navigate('/client/invoices')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Manage Invoices</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentInvoices.slice(0, 3).map((inv) => (
              <div key={inv.invoiceId} className="py-3 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{inv.invoiceNumber}</span>
                    <span className="text-3xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      {inv.status}
                    </span>
                  </div>
                  <p className="text-3xs text-slate-500">{inv.eventName || 'Scheduled Service'}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900">
                      ₹{Number(inv.amount).toLocaleString('en-IN')}
                    </div>
                    <div className="text-3xs text-slate-400">Due: {inv.dueDate}</div>
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
  );
};
