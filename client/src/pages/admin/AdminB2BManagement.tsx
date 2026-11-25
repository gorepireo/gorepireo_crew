import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Organization, Invoice, Payment, Assignment, Team, WorkLocation } from '../../types';
import {
  Building2,
  CalendarCheck2,
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Users,
  MapPin,
  Clock,
  Receipt,
  ShieldCheck,
  Loader2,
  DollarSign,
  X,
  Edit2,
  Lock,
  ArrowRight,
  Filter,
} from 'lucide-react';

export const AdminB2BManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ORGANIZATIONS' | 'EVENTS' | 'INVOICES'>('ORGANIZATIONS');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [locations, setLocations] = useState<WorkLocation[]>([]);

  // Modals
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [targetInvoiceForPayment, setTargetInvoiceForPayment] = useState<Invoice | null>(null);

  // New Organization Form
  const [orgForm, setOrgForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    serviceLocation: '',
    contractStartDate: new Date().toISOString().slice(0, 10),
    contractEndDate: '',
    contractPricing: 50000,
    paymentTerms: 'Net 15 Days after event completion',
    initialPassword: '',
  });

  // New Event Form
  const [eventForm, setEventForm] = useState({
    organizationId: '',
    title: '',
    description: '',
    cleaningRequirements: '',
    date: new Date().toISOString().slice(0, 10),
    startTime: '09:00',
    endTime: '17:00',
    locationId: '',
    teamId: '',
    requiredWorkersCount: 4,
    servicePrice: 15000,
    paymentTerms: 'Net 15 Days',
  });

  // New Invoice Form
  const [invoiceForm, setInvoiceForm] = useState({
    organizationId: '',
    eventId: '',
    amount: 15000,
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    description: 'Commercial facility deep cleaning service',
  });

  // Record Offline Payment Form
  const [offlineForm, setOfflineForm] = useState({
    amount: 0,
    paymentMethod: 'BANK_TRANSFER',
    transactionId: '',
    notes: 'Direct RTGS bank transfer confirmed',
  });

  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [orgsRes, eventsRes, invRes, teamsRes, locsRes] = await Promise.all([
        api.getAdminB2BOrganizations(),
        api.getAdminB2BEvents(),
        api.getAdminB2BInvoices(),
        api.getTeams(),
        api.getLocations(),
      ]);

      setOrganizations(orgsRes.organizations || []);
      setEvents(eventsRes.events || []);
      setInvoices(invRes.invoices || []);
      setTeams(teamsRes || []);
      setLocations(locsRes || []);
    } catch (err: any) {
      console.error('[ADMIN B2B] Load error:', err);
      setError(err?.message || 'Failed to load B2B management data.');
    } finally {
      setLoading(false);
    }
  };

  // 1. Create Organization
  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgForm.name.trim() || !orgForm.phone.trim()) {
      alert('Organization name and mobile number are required');
      return;
    }

    try {
      setSubmitting(true);
      await api.createB2BOrganization({
        name: orgForm.name.trim(),
        contactPerson: orgForm.contactPerson.trim(),
        phone: orgForm.phone.trim(),
        email: orgForm.email.trim() || undefined,
        serviceLocations: orgForm.serviceLocation.trim() ? [orgForm.serviceLocation.trim()] : [],
        contractStartDate: orgForm.contractStartDate,
        contractEndDate: orgForm.contractEndDate || undefined,
        contractPricing: Number(orgForm.contractPricing),
        paymentTerms: orgForm.paymentTerms,
        initialPassword: orgForm.initialPassword,
      });

      setShowOrgModal(false);
      setActionSuccess('B2B Organization and initial login created!');
      setTimeout(() => setActionSuccess(null), 4000);
      loadAllData();
    } catch (err: any) {
      alert(err?.message || 'Failed to create organization');
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Create B2B Event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.organizationId || !eventForm.title.trim()) {
      alert('Please select an organization and enter event title');
      return;
    }

    try {
      setSubmitting(true);
      await api.createB2BEvent({
        organizationId: eventForm.organizationId,
        title: eventForm.title.trim(),
        description: eventForm.description.trim(),
        cleaningRequirements: eventForm.cleaningRequirements.trim(),
        date: eventForm.date,
        startTime: eventForm.startTime,
        endTime: eventForm.endTime,
        locationId: eventForm.locationId || undefined,
        teamIds: eventForm.teamId ? [eventForm.teamId] : [],
        requiredWorkersCount: Number(eventForm.requiredWorkersCount),
        servicePrice: Number(eventForm.servicePrice),
        paymentTerms: eventForm.paymentTerms,
      });

      setShowEventModal(false);
      setActionSuccess('B2B Event scheduled and linked to organization!');
      setTimeout(() => setActionSuccess(null), 4000);
      loadAllData();
    } catch (err: any) {
      alert(err?.message || 'Failed to create B2B event');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Create Invoice
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.organizationId || invoiceForm.amount <= 0) {
      alert('Please select an organization and enter a valid amount');
      return;
    }

    try {
      setSubmitting(true);
      await api.createB2BInvoice({
        organizationId: invoiceForm.organizationId,
        eventId: invoiceForm.eventId || undefined,
        amount: Number(invoiceForm.amount),
        dueDate: invoiceForm.dueDate,
        description: invoiceForm.description,
      });

      setShowInvoiceModal(false);
      setActionSuccess('Invoice generated successfully!');
      setTimeout(() => setActionSuccess(null), 4000);
      loadAllData();
    } catch (err: any) {
      alert(err?.message || 'Failed to generate invoice');
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Record Offline Payment
  const handleRecordOfflinePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInvoiceForPayment || offlineForm.amount <= 0) {
      alert('Invalid payment amount');
      return;
    }

    try {
      setSubmitting(true);
      await api.recordB2BOfflinePayment(targetInvoiceForPayment.invoiceId, {
        amount: Number(offlineForm.amount),
        paymentMethod: offlineForm.paymentMethod,
        transactionId: offlineForm.transactionId.trim() || undefined,
        notes: offlineForm.notes.trim() || undefined,
      });

      setShowPaymentModal(false);
      setTargetInvoiceForPayment(null);
      setActionSuccess('Offline payment recorded and receipt created!');
      setTimeout(() => setActionSuccess(null), 4000);
      loadAllData();
    } catch (err: any) {
      alert(err?.message || 'Failed to record offline payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              B2B Management
            </h1>
            <span className="text-3xs font-extrabold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Contract Portal
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Manage contract organizations, B2B events, billing invoices, and offline settlements
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          {activeTab === 'ORGANIZATIONS' && (
            <button
              onClick={() => setShowOrgModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>New Organization</span>
            </button>
          )}
          {activeTab === 'EVENTS' && (
            <button
              onClick={() => setShowEventModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule B2B Event</span>
            </button>
          )}
          {activeTab === 'INVOICES' && (
            <button
              onClick={() => setShowInvoiceModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Generate Invoice</span>
            </button>
          )}
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('ORGANIZATIONS')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'ORGANIZATIONS'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Organizations ({organizations.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('EVENTS')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'EVENTS'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarCheck2 className="w-4 h-4" />
          <span>B2B Events ({events.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('INVOICES')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'INVOICES'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Invoices & Payments ({invoices.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-xs text-slate-500 font-semibold">Loading B2B data...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: ORGANIZATIONS */}
          {activeTab === 'ORGANIZATIONS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {organizations.map((org) => (
                <div
                  key={org.orgId}
                  className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <span className="text-4xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                        {org.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">{org.name}</h3>
                      <p className="text-3xs text-slate-400 font-mono">{org.orgId}</p>
                    </div>

                    <div className="space-y-1.5 text-3xs text-slate-600 pt-2 border-t border-slate-100">
                      <div>
                        Contact: <strong className="text-slate-800">{org.contactPerson || 'N/A'}</strong>
                      </div>
                      <div>
                        Mobile: <strong className="text-slate-800">{org.phone}</strong>
                      </div>
                      {org.email && <div>Email: {org.email}</div>}
                      <div>
                        Contract Rate: <strong>₹{Number(org.contractPricing || 0).toLocaleString('en-IN')}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-3xs">
                    <span className="text-slate-400">
                      {org.eventsCount || 0} event(s) linked
                    </span>
                    <span className="text-blue-600 font-bold">
                      Login: {org.phone}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: B2B EVENTS */}
          {activeTab === 'EVENTS' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 text-3xs font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4 sm:px-6">Event Name</th>
                      <th className="py-3.5 px-4">Client Organization</th>
                      <th className="py-3.5 px-4">Date & Schedule</th>
                      <th className="py-3.5 px-4">Assigned Team</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Service Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {events.map((evt) => (
                      <tr key={evt.eventId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-4 sm:px-6">
                          <div className="font-bold text-slate-900">{evt.eventName}</div>
                          <div className="text-3xs text-slate-400">{evt.locationName || 'Facility'}</div>
                        </td>
                        <td className="py-4 px-4 font-bold text-blue-600">
                          {evt.organizationName || 'B2B Client'}
                        </td>
                        <td className="py-4 px-4 text-3xs text-slate-600">
                          {evt.date} ({evt.startTime} - {evt.endTime})
                        </td>
                        <td className="py-4 px-4 text-3xs">
                          <div className="font-semibold text-slate-800">{evt.assignedTeam?.name || 'Cleaning Team'}</div>
                          <div className="text-slate-400">Leader: {evt.teamLeader?.name || 'On Site'}</div>
                        </td>
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          <span className="text-4xs font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            {evt.computedStatus}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right font-black text-slate-900 whitespace-nowrap">
                          ₹{Number(evt.servicePrice || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: INVOICES & PAYMENTS */}
          {activeTab === 'INVOICES' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 text-3xs font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4 sm:px-6">Invoice #</th>
                      <th className="py-3.5 px-4">Client Org</th>
                      <th className="py-3.5 px-4">Event</th>
                      <th className="py-3.5 px-4">Due Date</th>
                      <th className="py-3.5 px-4 text-right">Amount</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Record Offline Pay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {invoices.map((inv) => {
                      const remaining = Math.max(0, Number(inv.amount) - Number(inv.amountPaid || 0));
                      const isUnpaid = inv.status !== 'PAID' && remaining > 0;

                      return (
                        <tr key={inv.invoiceId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-4 sm:px-6 font-bold text-slate-900">{inv.invoiceNumber}</td>
                          <td className="py-4 px-4 font-bold text-blue-600">{inv.organizationName}</td>
                          <td className="py-4 px-4 text-3xs text-slate-600">{inv.eventName || 'Scheduled Service'}</td>
                          <td className="py-4 px-4 text-3xs text-slate-500">{inv.dueDate}</td>
                          <td className="py-4 px-4 text-right">
                            <div className="font-extrabold text-slate-900">
                              ₹{Number(inv.amount).toLocaleString('en-IN')}
                            </div>
                            {inv.amountPaid && Number(inv.amountPaid) > 0 ? (
                              <div className="text-4xs text-emerald-600 font-semibold">
                                Paid: ₹{Number(inv.amountPaid).toLocaleString('en-IN')}
                              </div>
                            ) : null}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="text-4xs font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 sm:px-6 text-right">
                            {isUnpaid ? (
                              <button
                                onClick={() => {
                                  setTargetInvoiceForPayment(inv);
                                  setOfflineForm({
                                    amount: remaining,
                                    paymentMethod: 'BANK_TRANSFER',
                                    transactionId: `TXN-OFFLINE-${Date.now().toString().slice(-6)}`,
                                    notes: 'Direct bank transfer verified by accounts admin',
                                  });
                                  setShowPaymentModal(true);
                                }}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-3xs font-bold rounded-xl transition"
                              >
                                Record Offline Pay
                              </button>
                            ) : (
                              <span className="text-3xs font-bold text-emerald-600">Settled ✓</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL 1: CREATE B2B ORGANIZATION */}
      {showOrgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900">Register New B2B Client Organization</h3>
              <button onClick={() => setShowOrgModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrg} className="space-y-3 text-xs">
              <div>
                <label className="text-3xs font-bold text-slate-700 uppercase">Organization Legal Name *</label>
                <input
                  type="text"
                  required
                  value={orgForm.name}
                  onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                  placeholder="e.g. Apex Corporate Towers Pvt Ltd"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-3xs font-bold text-slate-700 uppercase">Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={orgForm.contactPerson}
                    onChange={(e) => setOrgForm({ ...orgForm, contactPerson: e.target.value })}
                    placeholder="e.g. Rajesh Sharma"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-3xs font-bold text-slate-700 uppercase">Mobile Number (Login) *</label>
                  <input
                    type="tel"
                    required
                    value={orgForm.phone}
                    onChange={(e) => setOrgForm({ ...orgForm, phone: e.target.value })}
                    placeholder="e.g. 9800615893"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-3xs font-bold text-slate-700 uppercase">Email Address</label>
                  <input
                    type="email"
                    value={orgForm.email}
                    onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })}
                    placeholder="client@apextowers.com"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-3xs font-bold text-slate-700 uppercase">Initial Password</label>
                  <input
                    type="text"
                    value={orgForm.initialPassword}
                    onChange={(e) => setOrgForm({ ...orgForm, initialPassword: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-3xs font-bold text-slate-700 uppercase">Primary Service Location Address</label>
                <input
                  type="text"
                  value={orgForm.serviceLocation}
                  onChange={(e) => setOrgForm({ ...orgForm, serviceLocation: e.target.value })}
                  placeholder="e.g. Tower B, Sector 62, Financial District"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-3xs font-bold text-slate-700 uppercase">Contract Pricing (INR)</label>
                  <input
                    type="number"
                    value={orgForm.contractPricing}
                    onChange={(e) => setOrgForm({ ...orgForm, contractPricing: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="text-3xs font-bold text-slate-700 uppercase">Payment Terms</label>
                  <input
                    type="text"
                    value={orgForm.paymentTerms}
                    onChange={(e) => setOrgForm({ ...orgForm, paymentTerms: e.target.value })}
                    placeholder="e.g. Net 15 Days"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOrgModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
                >
                  {submitting ? 'Creating...' : 'Create B2B Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SCHEDULE B2B EVENT */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900">Schedule B2B Cleaning Event</h3>
              <button onClick={() => setShowEventModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3 text-xs">
              <div>
                <label className="text-3xs font-bold text-slate-700 uppercase">Client Organization *</label>
                <select
                  required
                  value={eventForm.organizationId}
                  onChange={(e) => setEventForm({ ...eventForm, organizationId: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value="">-- Select B2B Client --</option>
                  {organizations.map((org) => (
                    <option key={org.orgId} value={org.orgId}>
                      {org.name} ({org.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-3xs font-bold text-slate-700 uppercase">Event Title *</label>
                <input
                  type="text"
                  required
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="e.g. Tower B Full Facade & Carpet Deep Cleaning"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="text-3xs font-bold text-slate-700 uppercase">Cleaning Requirements</label>
                <textarea
                  rows={2}
                  value={eventForm.cleaningRequirements}
                  onChange={(e) => setEventForm({ ...eventForm, cleaningRequirements: e.target.value })}
                  placeholder="e.g. Sanitize all HVAC vents, scrub marble lobbies, wipe glass partitions"
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-3xs font-bold text-slate-700 uppercase">Date</label>
                  <input
                    type="date"
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    className="w-full mt-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="text-3xs font-bold text-slate-700 uppercase">Start</label>
                  <input
                    type="time"
                    value={eventForm.startTime}
                    onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                    className="w-full mt-1 px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-3xs font-bold text-slate-700 uppercase">End</label>
                  <input
                    type="time"
                    value={eventForm.endTime}
                    onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                    className="w-full mt-1 px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-3xs font-bold text-slate-700 uppercase">Assigned Cleaning Team</label>
                  <select
                    value={eventForm.teamId}
                    onChange={(e) => setEventForm({ ...eventForm, teamId: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="">-- Select Team --</option>
                    {teams.map((t) => (
                      <option key={t.teamId} value={t.teamId}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-3xs font-bold text-slate-700 uppercase">Workers Required</label>
                  <input
                    type="number"
                    min="1"
                    value={eventForm.requiredWorkersCount}
                    onChange={(e) => setEventForm({ ...eventForm, requiredWorkersCount: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-3xs font-bold text-slate-700 uppercase">Contract Service Price (INR)</label>
                  <input
                    type="number"
                    value={eventForm.servicePrice}
                    onChange={(e) => setEventForm({ ...eventForm, servicePrice: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="text-3xs font-bold text-slate-700 uppercase">Payment Terms</label>
                  <input
                    type="text"
                    value={eventForm.paymentTerms}
                    onChange={(e) => setEventForm({ ...eventForm, paymentTerms: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
                >
                  {submitting ? 'Saving...' : 'Schedule Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: GENERATE INVOICE */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900">Generate B2B Invoice</h3>
              <button onClick={() => setShowInvoiceModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3 text-xs">
              <div>
                <label className="text-3xs font-bold text-slate-700 uppercase">Client Organization *</label>
                <select
                  required
                  value={invoiceForm.organizationId}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, organizationId: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="">-- Select Client --</option>
                  {organizations.map((org) => (
                    <option key={org.orgId} value={org.orgId}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-3xs font-bold text-slate-700 uppercase">Associated Event</label>
                <select
                  value={invoiceForm.eventId}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, eventId: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">-- Generic Contract Billing --</option>
                  {events
                    .filter((e) => !invoiceForm.organizationId || e.organizationId === invoiceForm.organizationId)
                    .map((e) => (
                      <option key={e.eventId} value={e.eventId}>
                        {e.eventName} ({e.date})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-3xs font-bold text-slate-700 uppercase">Invoice Amount (INR) *</label>
                  <input
                    type="number"
                    required
                    value={invoiceForm.amount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="text-3xs font-bold text-slate-700 uppercase">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-3xs font-bold text-slate-700 uppercase">Service Description</label>
                <input
                  type="text"
                  value={invoiceForm.description}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
                >
                  {submitting ? 'Creating...' : 'Issue Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: RECORD OFFLINE PAYMENT */}
      {showPaymentModal && targetInvoiceForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Record Offline Payment</h3>
                <p className="text-3xs text-slate-500">Invoice: {targetInvoiceForPayment.invoiceNumber}</p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordOfflinePayment} className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Client Org:</span>
                  <span className="font-bold text-slate-800">{targetInvoiceForPayment.organizationName}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Total Amount:</span>
                  <span className="font-bold text-slate-800">
                    ₹{Number(targetInvoiceForPayment.amount).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Balance Due:</span>
                  <span className="font-bold text-blue-600">
                    ₹
                    {Math.max(
                      0,
                      Number(targetInvoiceForPayment.amount) - Number(targetInvoiceForPayment.amountPaid || 0)
                    ).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-3xs font-bold text-slate-700 uppercase">Received Amount (INR) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={offlineForm.amount}
                  onChange={(e) => setOfflineForm({ ...offlineForm, amount: Number(e.target.value) })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="text-3xs font-bold text-slate-700 uppercase">Payment Channel</label>
                <select
                  value={offlineForm.paymentMethod}
                  onChange={(e) => setOfflineForm({ ...offlineForm, paymentMethod: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  <option value="BANK_TRANSFER">Direct Bank Transfer / NEFT / RTGS</option>
                  <option value="CHEQUE">Corporate Cheque</option>
                  <option value="CASH">Cash Deposit</option>
                  <option value="UPI">Corporate UPI</option>
                </select>
              </div>

              <div>
                <label className="text-3xs font-bold text-slate-700 uppercase">Bank Transaction / Reference ID</label>
                <input
                  type="text"
                  value={offlineForm.transactionId}
                  onChange={(e) => setOfflineForm({ ...offlineForm, transactionId: e.target.value })}
                  placeholder="e.g. UTR1289382103"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="text-3xs font-bold text-slate-700 uppercase">Internal Verification Notes</label>
                <textarea
                  rows={2}
                  value={offlineForm.notes}
                  onChange={(e) => setOfflineForm({ ...offlineForm, notes: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
                >
                  {submitting ? 'Confirming...' : 'Mark as Paid & Generate Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
