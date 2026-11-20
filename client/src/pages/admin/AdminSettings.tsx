import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { OrganizationSettings } from '../../types';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Settings, Save, CheckCircle2 } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<OrganizationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.getSettings().then((data) => {
      setSettings(data);
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setSuccess(false);
    try {
      await api.updateSettings(settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) return <LoadingSpinner message="Loading organization configuration..." />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Organization Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure default attendance geofence radii, late arrival thresholds, and regional timezone
        </p>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Organization settings saved and synced across all mobile devices.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-6 text-xs">
        {/* ORG IDENTITY */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Company Identity & Contact
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Organization Legal Name *</label>
              <input
                type="text"
                required
                value={settings.orgName}
                onChange={(e) => setSettings({ ...settings, orgName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">Company Logo (Image / URL)</label>
                {settings.orgLogo && (
                  <div className="w-6 h-6 rounded-md overflow-hidden bg-slate-900 border border-slate-200">
                    <img src={settings.orgLogo} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <input
                type="text"
                value={settings.orgLogo || ''}
                placeholder="https://... or data:image/..."
                onChange={(e) => setSettings({ ...settings, orgLogo: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-mono text-3xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Operations Contact Email *</label>
              <input
                type="email"
                required
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Support Phone *</label>
              <input
                type="tel"
                required
                value={settings.contactPhone}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        {/* ATTENDANCE & GEOFENCE GOVERNANCE */}
        <div className="pt-6 border-t border-slate-100 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            GPS Geofence & Shift Rules
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Default Geofence Radius (Meters) *
              </label>
              <input
                type="number"
                required
                value={settings.defaultGeofenceRadiusMeters}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    defaultGeofenceRadiusMeters: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
              <p className="text-3xs text-slate-400 mt-1">Default: 100 meters</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Late Arrival Grace Period (Minutes) *
              </label>
              <input
                type="number"
                required
                value={settings.lateArrivalGracePeriodMinutes}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    lateArrivalGracePeriodMinutes: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
              <p className="text-3xs text-slate-400 mt-1">Default: 15 minutes</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Standard Operational Timezone *</label>
              <input
                type="text"
                required
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
              <p className="text-3xs text-slate-400 mt-1">Default: Asia/Kolkata</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                GPS Accuracy Threshold (Meters)
              </label>
              <input
                type="number"
                value={settings.requireGPSAccuracyThreshold}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    requireGPSAccuracyThreshold: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        {/* ATTENDANCE CAMERA & EVIDENCE RULES */}
        <div className="pt-6 border-t border-slate-100 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Smart Camera & Evidence Governance
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800 block text-xs">Require Attendance Selfie</span>
                <span className="text-3xs text-slate-500">Enforce live camera capture on check-in and check-out</span>
              </div>
              <input
                type="checkbox"
                checked={settings.requireAttendancePhoto ?? true}
                onChange={(e) => setSettings({ ...settings, requireAttendancePhoto: e.target.checked })}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800 block text-xs">Require Work Photo Evidence</span>
                <span className="text-3xs text-slate-500">Require photographic proof before completing duties</span>
              </div>
              <input
                type="checkbox"
                checked={settings.requireWorkEvidence ?? true}
                onChange={(e) => setSettings({ ...settings, requireWorkEvidence: e.target.checked })}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Max Allowed GPS Accuracy Drift (Meters) *
              </label>
              <input
                type="number"
                required
                value={settings.maxAllowedGPSAccuracyMeters || 50}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxAllowedGPSAccuracyMeters: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
              <p className="text-3xs text-slate-400 mt-1">Default: 50 meters (signals exceeding this trigger a retry warning)</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Photo Evidence Retention (Days) *
              </label>
              <input
                type="number"
                required
                value={settings.photoRetentionDays || 90}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    photoRetentionDays: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
              <p className="text-3xs text-slate-400 mt-1">Default: 90 days audit retention</p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
