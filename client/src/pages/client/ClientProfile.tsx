import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Organization } from '../../types';
import {
  Building2,
  Mail,
  Phone,
  User,
  Calendar,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  FileText,
  ChevronRight,
  Coins,
  StickyNote,
  Pencil,
  LogOut,
  X,
  Clock,
} from 'lucide-react';

export const ClientProfile: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modals / Bottom Sheets
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showLocationsSheet, setShowLocationsSheet] = useState(false);

  // Editable fields
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getClientProfile();
      const org = res.organization;
      setOrganization(org);
      if (org) {
        setContactPerson(org.contactPerson || '');
        setPhone(org.phone || '');
        setEmail(org.email || '');
        setNotes(org.notes || '');
      }
    } catch (err: any) {
      console.error('[CLIENT PROFILE] Error:', err);
      setError(err?.message || 'Failed to load organization profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactPerson.trim() || !phone.trim()) {
      setError('Contact person and phone number are required');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const res = await api.updateClientProfile({
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setOrganization(res.organization);
      setShowEditSheet(false);
      setSuccess('Contact details updated!');
      setTimeout(() => setSuccess(null), 3500);
    } catch (err: any) {
      console.error('[PROFILE UPDATE] Error:', err);
      setError(err?.message || 'Failed to update contact details');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Loading profile...</p>
      </div>
    );
  }

  const locations =
    organization?.serviceLocations && organization.serviceLocations.length > 0
      ? organization.serviceLocations
      : organization?.serviceLocationIds || [];

  return (
    <div className="space-y-4 pb-2">
      {/* NATIVE MOBILE PROFILE HEADER */}
      <div className="relative bg-gradient-to-b from-[#06122c] via-[#133274] to-[#1e4aa8] px-4 pt-16 pb-7 overflow-hidden">
        <div
          className="absolute top-0 right-0 w-52 h-full opacity-25 pointer-events-none bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80')",
            maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 15%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 15%, rgba(0,0,0,0) 100%)',
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[#eef3f9] to-transparent pointer-events-none" />

        {/* Centered App Avatar + Org Identity */}
        <div className="relative z-10 flex flex-col items-center text-center space-y-2.5 pt-2">
          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-lg">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight">
              {organization?.name || '—'}
            </h1>
            <p className="text-xs text-blue-100/85 font-medium">
              {organization?.contactPerson || 'Authorized Representative'}
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-4xs font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 backdrop-blur-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>Contract Partner • {organization?.status || 'ACTIVE'}</span>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="px-3.5 -mt-3 relative z-10 space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {/* 1. CONTACT & ACCOUNT GROUP */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-3xs font-bold uppercase tracking-wider text-slate-400">
              Account & Contact
            </span>
            <button
              onClick={() => setShowEditSheet(true)}
              className="text-3xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Pencil className="w-3 h-3" />
              <span>Edit</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm divide-y divide-slate-100 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowEditSheet(true)}
              className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-4xs text-slate-400 block">Contact Person</span>
                  <span className="text-xs font-bold text-slate-900 truncate block">
                    {organization?.contactPerson || 'Not set'}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => setShowEditSheet(true)}
              className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-4xs text-slate-400 block">Mobile Number</span>
                  <span className="text-xs font-bold text-slate-900 truncate block">
                    {organization?.phone || 'Not set'}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => setShowEditSheet(true)}
              className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-4xs text-slate-400 block">Billing Email</span>
                  <span className="text-xs font-bold text-slate-900 truncate block">
                    {organization?.email || 'Not set'}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => setShowEditSheet(true)}
              className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <StickyNote className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-4xs text-slate-400 block">Service Notes</span>
                  <span className="text-xs font-semibold text-slate-700 truncate block">
                    {organization?.notes || 'Add special instructions'}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </button>
          </div>
        </div>

        {/* 2. CONTRACT & LOCATIONS GROUP */}
        <div className="space-y-1.5">
          <span className="text-3xs font-bold uppercase tracking-wider text-slate-400 px-1 block">
            Contract & Locations
          </span>

          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm divide-y divide-slate-100 overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-4xs text-slate-400 block">Contract ID</span>
                  <span className="text-xs font-bold text-slate-900 font-mono">
                    {organization?.organizationId || organization?.orgId || '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-4xs text-slate-400 block">Contract Value</span>
                  <span className="text-xs font-black text-slate-900">
                    ₹{Number(organization?.contractPricing || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
              <span className="text-4xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {organization?.paymentTerms || 'Net 15 Days'}
              </span>
            </div>

            <div className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-4xs text-slate-400 block">Contract Tenure</span>
                  <span className="text-xs font-bold text-slate-900">
                    {organization?.contractStartDate || 'Active'} –{' '}
                    {organization?.contractEndDate || 'Continuous'}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowLocationsSheet(true)}
              className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-4xs text-slate-400 block">Service Locations</span>
                  <span className="text-xs font-bold text-slate-900">
                    {locations.length} Contracted Site{locations.length === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-blue-600 text-3xs font-bold shrink-0">
                <span>View</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        </div>

        {/* 3. SIGN OUT ACTION */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-3.5 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200/80 rounded-2xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition active:scale-99"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* EDIT CONTACT BOTTOM SHEET / MODAL */}
      {showEditSheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border-t sm:border border-slate-200 space-y-4 animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Edit Contact Details</h3>
                <p className="text-3xs text-slate-500">{organization?.name}</p>
              </div>
              <button
                onClick={() => setShowEditSheet(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-3xs font-bold text-slate-700">
                  Authorized Contact Person *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-3xs font-bold text-slate-700">Mobile Number *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-3xs font-bold text-slate-700">Billing Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-3xs font-bold text-slate-700">Service Preferences</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special access or cleaning notes..."
                  className="w-full p-3 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SERVICE LOCATIONS SHEET */}
      {showLocationsSheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border-t sm:border border-slate-200 space-y-4 animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Service Locations</h3>
                <p className="text-3xs text-slate-500">Contracted cleaning properties</p>
              </div>
              <button
                onClick={() => setShowLocationsSheet(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {locations.length > 0 ? (
                locations.map((loc, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#f8fafc] rounded-xl border border-slate-200/70 text-xs font-semibold text-slate-800 flex items-center gap-2.5"
                  >
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span>{loc}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">
                  Locations configured per event assignment.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
