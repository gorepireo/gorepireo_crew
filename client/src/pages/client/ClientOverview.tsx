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
    return <LoadingSpinner message="Loading organization overview..." />;
  }

  if (error) {
    return (
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
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER & TOP QUICK ACTIONS (Matches AdminOverview) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {organization?.name ? `${organization.name} Overview` : 'Client Overview'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time cleaning service schedules, crew status, and contract billing summary
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/client/events"
            className="px-3.5 py-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
          >
            <CalendarCheck2 className="w-4 h-4 text-blue-600" />
            My Events
          </Link>
          <Link
            to="/client/invoices"
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <CreditCard className="w-4 h-4" />
            Pay Invoices
          </Link>
        </div>
      </div>

      {/* METRIC TILES GRID */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
              Total Events
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900">{summary.totalEvents}</span>
          </div>
          <span className="text-2xs text-slate-500 block mt-1">Contract assignments</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
              Upcoming Events
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-indigo-600">{summary.upcomingEvents}</span>
          </div>
          <span className="text-2xs text-slate-500 block mt-1">Scheduled & in progress</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
              Completed Events
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-emerald-600">{summary.completedEvents}</span>
          </div>
          <span className="text-2xs text-slate-500 block mt-1">Verified work orders</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
              Pending Payments
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-amber-600">
              ₹{summary.outstandingAmount.toLocaleString('en-IN')}
            </span>
          </div>
          <span className="text-2xs text-slate-500 block mt-1">
            {summary.pendingPayments} unpaid invoice(s)
          </span>
        </div>
      </div>

      {/* UPCOMING & ONGOING EVENTS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Upcoming & Ongoing Events</h2>
            <p className="text-2xs text-slate-500">
              Active cleaning sessions assigned to your contracted properties
            </p>
          </div>
          <button
            onClick={() => navigate('/client/events')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="py-10 text-center space-y-2 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">
              No upcoming events currently scheduled
            </p>
            <p className="text-2xs text-slate-400 max-w-md mx-auto">
              Your facility supervisor or Go_Repireo administrator will schedule your next service session.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {upcomingEvents.map((evt) => (
              <div
                key={evt.eventId}
                onClick={() => navigate(`/client/events?id=${evt.eventId}`)}
                className="bg-slate-50/60 hover:bg-white rounded-xl border border-slate-200/80 p-4 hover:shadow-sm hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-3xs font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                        evt.computedStatus
                      )}`}
                    >
                      {evt.computedStatus}
                    </span>
                    <span className="text-3xs text-slate-400 font-medium">{evt.date}</span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 line-clamp-1">
                    {evt.eventName}
                  </h3>

                  <div className="space-y-1 text-2xs text-slate-600">
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
                </div>

                <div className="pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-2xs">
                  <span className="text-slate-500">
                    Leader:{' '}
                    <strong className="text-slate-800">
                      {evt.teamLeader?.name || 'Field Supervisor'}
                    </strong>
                  </span>
                  <span className="text-blue-600 font-semibold flex items-center gap-0.5">
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
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Invoices Awaiting Settlement</h2>
              <p className="text-2xs text-slate-500">
                Quickly review and clear outstanding invoices
              </p>
            </div>
            <button
              onClick={() => navigate('/client/invoices')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Manage Invoices</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentInvoices.slice(0, 3).map((inv) => (
              <div key={inv.invoiceId} className="py-3 flex items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{inv.invoiceNumber}</span>
                    <span className="text-3xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      {inv.status}
                    </span>
                  </div>
                  <p className="text-2xs text-slate-500 truncate">
                    {inv.eventName || 'Scheduled Service'}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900">
                      ₹{Number(inv.amount).toLocaleString('en-IN')}
                    </div>
                    <div className="text-3xs text-slate-400">Due: {inv.dueDate}</div>
                  </div>
                  <button
                    onClick={() => navigate('/client/invoices')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-2xs font-bold rounded-lg transition"
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
