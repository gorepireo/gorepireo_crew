import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';

export const ClientProfile: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [locationsExpanded, setLocationsExpanded] = useState(false);

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
      setSuccess('Profile contact details updated successfully!');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error('[PROFILE UPDATE] Error:', err);
      setError(err?.message || 'Failed to update contact details');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Loading organization profile...</p>
      </div>
    );
  }

  const locations =
    organization?.serviceLocations && organization.serviceLocations.length > 0
      ? organization.serviceLocations
      : organization?.serviceLocationIds || [];

  return (
    <div className="space-y-4">
      {/* FULL-BLEED HERO HEADER */}
      <div className="relative bg-gradient-to-b from-[#06122c] via-[#133274] to-[#1e4aa8] px-4 pt-16 pb-10 overflow-hidden">
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
            Organization Profile
          </h1>
          <p className="text-xs text-blue-100/90 leading-relaxed border-l-2 border-blue-400 pl-2.5">
            Manage your organization details, contract information, and service locations for better
            service coordination.
          </p>
        </div>
      </div>

      {/* BODY CONTENT */}
      <div className="px-3.5 -mt-6 relative z-10 space-y-4">
        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {/* 1. ORGANIZATION IDENTITY CARD */}
        <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm text-center space-y-3 relative overflow-hidden">
          <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-blue-50/90 pointer-events-none" />
          <div className="relative z-10 space-y-2.5">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                {organization?.name || 'Apex Corporate Towers'}
              </h2>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-3xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Contract Partner • {organization?.status || 'Active'}</span>
            </div>
          </div>
        </div>

        {/* 2. CONTRACT DETAILS CARD */}
        <div className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Contract Details</h3>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex items-start gap-3">
              <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-3xs text-slate-400 block">Contract ID</span>
                <p className="font-bold text-slate-900 mt-0.5 font-mono">
                  {organization?.organizationId || organization?.orgId || 'ORG-2026-001'}
                </p>
              </div>
            </div>

            <div className="py-2.5 flex items-start gap-3">
              <Coins className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-3xs text-slate-400 block">Contract Value</span>
                <p className="font-black text-slate-900 mt-0.5">
                  ₹{Number(organization?.contractPricing || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <div className="py-2.5 flex items-start gap-3">
              <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-3xs text-slate-400 block">Contract Tenure</span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {organization?.contractStartDate || 'Active'} –{' '}
                  {organization?.contractEndDate || 'Continuous'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. SERVICE LOCATIONS CARD */}
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setLocationsExpanded(!locationsExpanded)}
            className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-slate-50/70 transition"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900">Service Locations</h3>
                <p className="text-3xs text-slate-500 truncate">
                  Locations where cleaning services are provided
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-3xs font-bold shrink-0">
              <span>{locations.length} Locations</span>
              <ChevronRight
                className={`w-3.5 h-3.5 transition-transform ${
                  locationsExpanded ? 'rotate-90' : ''
                }`}
              />
            </div>
          </button>

          {locationsExpanded && (
            <div className="px-4 pb-4 pt-1 space-y-2 border-t border-slate-100">
              {locations.length > 0 ? (
                locations.map((loc, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-[#f8fafc] rounded-xl border border-slate-200/70 text-3xs text-slate-700 font-semibold flex items-center gap-2"
                  >
                    <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>{loc}</span>
                  </div>
                ))
              ) : (
                <p className="text-3xs text-slate-400 py-2">
                  Locations configured per event assignment.
                </p>
              )}
            </div>
          )}
        </div>

        {/* 4. ORGANIZATION INFORMATION FORM */}
        <form
          onSubmit={handleSave}
          className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-sm space-y-4"
        >
          <div className="flex items-start gap-2.5 pb-2 border-b border-slate-100">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0 mt-0.5">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Organization Information</h3>
              <p className="text-3xs text-slate-500">
                Keep your company details up to date for invoices and service management
              </p>
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Organization Name (Read Only) */}
            <div className="space-y-1">
              <label className="text-3xs font-bold text-slate-700">
                Organization / Company Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  disabled
                  value={organization?.name || ''}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 cursor-not-allowed"
                />
              </div>
              <p className="text-4xs text-slate-400">
                Registered company or organization name as per contract
              </p>
            </div>

            {/* Authorized Contact Person */}
            <div className="space-y-1">
              <label className="text-3xs font-bold text-slate-700">
                Authorized Contact Person <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="e.g. Vikram Malhotra"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  required
                />
              </div>
            </div>

            {/* Contact Phone Number */}
            <div className="space-y-1">
              <label className="text-3xs font-bold text-slate-700">
                Contact Phone Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9800615893"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  required
                />
              </div>
              <p className="text-4xs text-slate-400">
                Used for service coordination and notifications
              </p>
            </div>

            {/* Billing & Notification Email */}
            <div className="space-y-1">
              <label className="text-3xs font-bold text-slate-700">
                Billing & Notification Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. client@apextowers.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Special Instructions / Service Preferences */}
            <div className="space-y-1">
              <label className="text-3xs font-bold text-slate-700">
                Special Instructions / Service Preferences
              </label>
              <div className="relative">
                <StickyNote className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Please ensure weekend deep cleaning."
                  className="w-full pl-10 pr-3 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] hover:from-[#1d4ed8] hover:to-[#1e40af] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Update Contract Details</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
