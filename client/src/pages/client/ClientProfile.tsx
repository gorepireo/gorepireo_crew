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
  Lock,
} from 'lucide-react';

export const ClientProfile: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          Organization Profile
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your enterprise organization details, service contracts, and authorized points of contact
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Organization Summary & Contract Info */}
        <div className="space-y-4">
          {/* Org Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">{organization?.name}</h2>
              <p className="text-3xs text-slate-400 font-mono mt-0.5">{organization?.orgId}</p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-3xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              Contract Status: {organization?.status || 'ACTIVE'}
            </div>
          </div>

          {/* Contract Overview (Read-Only) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Contract Terms
              </h3>
              <Lock className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-3xs font-bold uppercase text-slate-400">Duration</span>
                <p className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {organization?.contractStartDate || 'Active'} to {organization?.contractEndDate || 'Continuous'}
                </p>
              </div>

              <div>
                <span className="text-3xs font-bold uppercase text-slate-400">Contract Rate</span>
                <p className="font-extrabold text-slate-900 mt-0.5">
                  ₹{Number(organization?.contractPricing || 0).toLocaleString('en-IN')}
                </p>
              </div>

              <div>
                <span className="text-3xs font-bold uppercase text-slate-400">Payment Terms</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {organization?.paymentTerms || 'Net 15 Days after event completion'}
                </p>
              </div>
            </div>
          </div>

          {/* Service Locations */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              Service Locations
            </h3>

            {organization?.serviceLocations && organization.serviceLocations.length > 0 ? (
              <div className="space-y-2">
                {organization.serviceLocations.map((loc, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 text-3xs text-slate-700">
                    <p className="font-bold text-slate-900">{loc}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-3xs text-slate-400">Locations configured per event assignment.</p>
            )}
          </div>
        </div>

        {/* Editable Contact Information Form */}
        <div>
          <form
            onSubmit={handleSave}
            className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-5"
          >
            <div>
              <h3 className="text-base font-bold text-slate-900">Contact & Notification Settings</h3>
              <p className="text-3xs text-slate-500">
                Ensure your facility managers and accounting officers receive prompt event updates and payment receipts
              </p>
            </div>

            <div className="space-y-4 text-xs">
              {/* Organization Legal Name (Read Only) */}
              <div className="space-y-1">
                <label className="text-3xs font-bold uppercase tracking-wider text-slate-500">
                  Registered Organization Name
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
                <p className="text-4xs text-slate-400">To amend legal business name, please request an administrative update.</p>
              </div>

              {/* Authorized Contact Person */}
              <div className="space-y-1">
                <label className="text-3xs font-bold uppercase tracking-wider text-slate-700">
                  Authorized Contact Person <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Rajesh Sharma"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    required
                  />
                </div>
              </div>

              {/* Registered Phone */}
              <div className="space-y-1">
                <label className="text-3xs font-bold uppercase tracking-wider text-slate-700">
                  Primary Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9800615893"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    required
                  />
                </div>
                <p className="text-4xs text-slate-400">Used for client login and instant SMS notifications.</p>
              </div>

              {/* Registered Email */}
              <div className="space-y-1">
                <label className="text-3xs font-bold uppercase tracking-wider text-slate-700">
                  Billing & Notification Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. client@apextowers.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Client Notes / Instructions */}
              <div className="space-y-1">
                <label className="text-3xs font-bold uppercase tracking-wider text-slate-700">
                  Special Access Instructions & Preferences
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Access via South Gate security desk. Hard hats required on lower mezzanine."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Update Contact Details</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
