import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  ArrowLeft,
  Shield,
  ShieldCheck,
  Lock,
  Bell,
  MapPin,
  Camera,
  FileText,
  Trash2,
  Phone,
  CheckCircle2,
  ChevronRight,
  Info,
  Server,
  KeyRound,
  AlertCircle,
  HelpCircle,
  Clock,
  EyeOff,
  UserCheck,
  Sparkles,
} from 'lucide-react';

export const LeaderSettings: React.FC = () => {
  const navigate = useNavigate();
  const { user, leader, changePassword } = useAuth();
  const { language } = useLanguage();

  // Notification toggles with persistent localStorage
  const [notifyCheckIn, setNotifyCheckIn] = useState(() => {
    return localStorage.getItem('wc_leader_notify_checkin') !== 'false';
  });
  const [notifyLate, setNotifyLate] = useState(() => {
    return localStorage.getItem('wc_leader_notify_late') !== 'false';
  });
  const [notifyWorkProofs, setNotifyWorkProofs] = useState(() => {
    return localStorage.getItem('wc_leader_notify_proofs') !== 'false';
  });
  const [notifyGeofence, setNotifyGeofence] = useState(() => {
    return localStorage.getItem('wc_leader_notify_geofence') !== 'false';
  });

  // Dedicated Policy Full-Page View (NO POPUP - PROPER PAGE)
  const [activePolicy, setActivePolicy] = useState<
    'PRIVACY' | 'TERMS' | 'GPS' | 'EVIDENCE' | 'SECURITY' | null
  >(null);

  // In-page password form state (NO POPUP)
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);

  // Cache clear feedback
  const [cacheCleared, setCacheCleared] = useState(false);

  const handleToggle = (key: string, currentVal: boolean, setter: (val: boolean) => void) => {
    const nextVal = !currentVal;
    setter(nextVal);
    localStorage.setItem(key, String(nextVal));
  };

  const handleClearCache = () => {
    try {
      localStorage.removeItem('workcrew_mobile_sim');
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    setSubmittingPassword(true);
    setPasswordError(null);
    try {
      await changePassword(newPassword, currentPassword);
      setPasswordSuccess(true);
      setTimeout(() => {
        setShowPasswordForm(false);
        setPasswordSuccess(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }, 1500);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password');
    } finally {
      setSubmittingPassword(false);
    }
  };

  // =========================================================================
  // 1. DEDICATED FULL-PAGE VIEW FOR POLICIES (NO POPUP - PROPER PAGE)
  // =========================================================================
  if (activePolicy) {
    const policyTitles = {
      PRIVACY: 'Team Leader Privacy Charter',
      GPS: 'GPS & Geofencing Governance',
      EVIDENCE: 'Photo Evidence & Retention Policy',
      TERMS: 'Terms of Service & Code of Conduct',
      SECURITY: 'Enterprise Security & Access Charter',
    };

    const policySubtitles = {
      PRIVACY: 'Data protection standards & confidentiality for supervisors',
      GPS: 'Shift-only geolocation boundaries & privacy safeguards',
      EVIDENCE: 'Selfie authentication & encrypted cloud image storage',
      TERMS: 'Field crew operational standards & supervisory integrity',
      SECURITY: 'Cloud authentication, lockout protection & audit records',
    };

    return (
      <div className="space-y-3.5 pb-4 animate-in fade-in duration-150">
        {/* Full-Page Hero Header */}
        <div className="-mx-3 -mt-3 bg-gradient-to-r from-[#2031c9] via-[#353de0] to-[#5a32de] text-white pt-5 pb-7 px-4 relative overflow-hidden z-10 shadow-sm">
          <div className="relative z-10 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActivePolicy(null)}
              className="w-10 h-10 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/25 flex items-center justify-center text-white transition-all cursor-pointer shadow-xs active:scale-95"
              title="Back to Settings"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
            <div className="min-w-0">
              <span className="text-4xs uppercase tracking-wider font-extrabold bg-white/20 px-2 py-0.5 rounded-full inline-block mb-1">
                Official Leader Policy
              </span>
              <h1 className="text-lg font-black text-white leading-tight tracking-tight truncate">
                {policyTitles[activePolicy]}
              </h1>
              <p className="text-2xs text-white/80 font-medium truncate mt-0.5">
                {policySubtitles[activePolicy]}
              </p>
            </div>
          </div>
        </div>

        {/* Policy Document Content Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100/90 space-y-4">
          {activePolicy === 'PRIVACY' && (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed font-normal">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Shield className="w-5 h-5 text-emerald-600 stroke-[2.2]" />
                <h2 className="text-sm font-black text-slate-900">
                  Supervisor Data Privacy & Worker Protection
                </h2>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl text-2xs text-emerald-900 font-semibold flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Complies strictly with India DPDP Act 2023 & International GDPR field worker protections.
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  1. Confidentiality of Worker Records
                </h3>
                <p className="text-slate-600 text-2xs">
                  As an authorized Team Leader in WorkCrew, you are granted privileged view access to your field crew’s phone numbers, attendance logs, and site evidence. You are legally bound to use this information strictly for field task dispatch and emergency contact. Exporting, sharing, or disseminating worker personal data is strictly prohibited.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                  <EyeOff className="w-4 h-4 text-purple-600" />
                  2. Dignity & Right to Disconnect
                </h3>
                <p className="text-slate-600 text-2xs">
                  Field workers have an inviolable right to personal privacy outside scheduled shift hours. The WorkCrew platform terminates all location polling upon shift completion. Leaders are prohibited from demanding location proofs outside designated working hours.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-indigo-600" />
                  3. Cloud Storage & Encryption
                </h3>
                <p className="text-slate-600 text-2xs">
                  Worker and Team Leader account profiles, attendance audits, and time-stamps are stored directly in Turso Cloud Database (AWS AP-South-1) and Google Drive cloud folders with AES-256 encryption at rest and TLS 1.3 in transit.
                </p>
              </div>
            </div>
          )}

          {activePolicy === 'GPS' && (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed font-normal">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <MapPin className="w-5 h-5 text-blue-600 stroke-[2.2]" />
                <h2 className="text-sm font-black text-slate-900">
                  GPS & Geofencing Governance
                </h2>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl text-2xs text-blue-900 font-semibold flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Zero continuous 24/7 GPS tracking. Location is only pinged at explicit event trigger points.
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="font-extrabold text-slate-900 text-xs">
                  1. Event-Triggered Location Sampling
                </h3>
                <p className="text-slate-600 text-2xs">
                  Location coordinates are captured solely during: (1) Shift Clock-In, (2) Shift Clock-Out, and (3) Task Proof submission. The device GPS sensor is actively released within 5 seconds of location fix to conserve device battery and safeguard battery health.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-extrabold text-slate-900 text-xs">
                  2. Authorized Geofence Radius
                </h3>
                <p className="text-slate-600 text-2xs">
                  Every worksite has a defined geographic boundary (typically 150m to 500m). When workers check in inside this zone, their status is recorded as VERIFIED. Check-ins occurring outside this radius trigger an automatic supervisor notification and are flagged for Team Leader review.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-extrabold text-slate-900 text-xs">
                  3. Fair Supervisor Discretion
                </h3>
                <p className="text-slate-600 text-2xs">
                  Team Leaders have the authority to manually approve check-ins flagged by poor GPS accuracy (e.g. inside concrete structures or basement facilities). All overrides are permanently timestamped and logged for organizational compliance.
                </p>
              </div>
            </div>
          )}

          {activePolicy === 'EVIDENCE' && (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed font-normal">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Camera className="w-5 h-5 text-purple-600 stroke-[2.2]" />
                <h2 className="text-sm font-black text-slate-900">
                  Photo Evidence & Image Retention Policy
                </h2>
              </div>

              <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-2xl text-2xs text-purple-900 font-semibold flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <span>
                  All profile pictures and work photos are stored 100% online in cloud repositories.
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="font-extrabold text-slate-900 text-xs">
                  1. Zero Local Disk Footprint
                </h3>
                <p className="text-slate-600 text-2xs">
                  Profile photos and worker documentation photos are never kept as unmanaged local hard-drive files. They are synced directly to our designated Google Drive repository (Folder ID: 1xBiZLYm1gGaMJ5KZWNvlO1mOkhI0wcZN) and persisted in the Turso Cloud Database.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-extrabold text-slate-900 text-xs">
                  2. Photo Overwrite & Previous Deletion Guarantee
                </h3>
                <p className="text-slate-600 text-2xs">
                  When a Team Leader or Worker updates or crops their profile photo, the platform automatically deletes and purges the previous image, ensuring that only the single, active photo exists. No ghost files or orphaned images are retained.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-extrabold text-slate-900 text-xs">
                  3. 90-Day Evidence Pruning
                </h3>
                <p className="text-slate-600 text-2xs">
                  Work evidence and routine check-in selfies are automatically archived and purged after 90 days, complying with corporate storage optimization and data minimization standards.
                </p>
              </div>
            </div>
          )}

          {activePolicy === 'TERMS' && (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed font-normal">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <FileText className="w-5 h-5 text-amber-600 stroke-[2.2]" />
                <h2 className="text-sm font-black text-slate-900">
                  Team Leader Code of Conduct & Operational Terms
                </h2>
              </div>

              <div className="space-y-2">
                <h3 className="font-extrabold text-slate-900 text-xs">
                  1. Supervisory Integrity
                </h3>
                <p className="text-slate-600 text-2xs">
                  Team Leaders represent corporate management on site. Falsifying worker hours, manipulating attendance records for non-present personnel, or demanding unauthorized kickbacks constitutes immediate grounds for account revocation and administrative action.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-extrabold text-slate-900 text-xs">
                  2. Timely Assignment Dispatch
                </h3>
                <p className="text-slate-600 text-2xs">
                  Job orders and task assignments must be clearly described with target deliverables, designated site locations, and safety protocols prior to shift commencement.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-extrabold text-slate-900 text-xs">
                  3. Health, Safety & Incident Reporting
                </h3>
                <p className="text-slate-600 text-2xs">
                  Supervisors must immediately report on-site accidents or hazardous conditions to the Corporate Administration through the platform support helpline (+91 98765 11111).
                </p>
              </div>
            </div>
          )}

          {/* Return Button */}
          <div className="pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActivePolicy(null)}
              className="w-full min-h-[46px] py-2.5 bg-[#2031c9] hover:bg-blue-700 active:scale-98 text-white rounded-2xl text-xs font-black shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Settings & Preferences</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. MAIN SETTINGS PAGE VIEW (PROPER DEDICATED PAGE FOR TEAM LEADER)
  // =========================================================================
  return (
    <div className="space-y-3.5 pb-4">
      {/* 1. TOP CURVED BLUE HERO HEADER CONTAINER */}
      <div className="-mx-3 -mt-3 bg-gradient-to-r from-[#2031c9] via-[#353de0] to-[#5a32de] text-white pt-5 pb-7 px-4 relative overflow-hidden z-10 shadow-sm">
        <div className="absolute inset-0 opacity-25 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none" fill="none">
            <path
              d="M0,20 C120,80 260,-20 400,40 L400,120 L0,120 Z"
              fill="url(#settings-wave-grad)"
            />
            <defs>
              <linearGradient id="settings-wave-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#818cf8" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/leader/profile')}
            className="w-10 h-10 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/25 flex items-center justify-center text-white transition-all cursor-pointer shadow-xs active:scale-95"
            title="Back to Profile"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div>
            <h1 className="text-xl font-black text-white leading-tight tracking-tight">
              Settings & Privacy
            </h1>
            <p className="text-xs text-white/80 font-medium mt-0.5">
              Leader governance, privacy policies & preferences
            </p>
          </div>
        </div>
      </div>

      {/* 2. LEADER PRIVACY POLICIES (CLICK OPENS DEDICATED FULL PAGE - NO POPUP) */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100/90 relative overflow-hidden space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#2552ea] stroke-[2.2]" />
          <h2 className="text-base font-black text-slate-900 tracking-tight">
            Policies & Worker Privacy
          </h2>
        </div>

        <p className="text-2xs text-slate-500 font-medium leading-relaxed">
          As a Team Leader, you are entrusted with sensitive field crew information. Tap any policy below to read full governance rules.
        </p>

        <div className="space-y-2">
          {/* Corporate Privacy Policy */}
          <div
            onClick={() => setActivePolicy('PRIVACY')}
            className="p-3 bg-[#f8faff] hover:bg-blue-50/70 border border-blue-100/70 rounded-2xl flex items-center justify-between cursor-pointer transition-all group active:scale-99"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Team Leader Privacy Charter
                </h3>
                <p className="text-3xs text-slate-500 font-medium truncate">
                  DPDP Act & GDPR compliance standards for supervisors
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>

          {/* GPS Tracking Policy */}
          <div
            onClick={() => setActivePolicy('GPS')}
            className="p-3 bg-[#f8faff] hover:bg-blue-50/70 border border-blue-100/70 rounded-2xl flex items-center justify-between cursor-pointer transition-all group active:scale-99"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                  GPS & Geofencing Governance
                </h3>
                <p className="text-3xs text-slate-500 font-medium truncate">
                  Shift-only geofence logging; zero 24/7 background tracking
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>

          {/* Biometric & Photo Evidence Policy */}
          <div
            onClick={() => setActivePolicy('EVIDENCE')}
            className="p-3 bg-[#f8faff] hover:bg-blue-50/70 border border-blue-100/70 rounded-2xl flex items-center justify-between cursor-pointer transition-all group active:scale-99"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                <Camera className="w-4 h-4 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-black text-slate-900 group-hover:text-purple-600 transition-colors">
                  Photo Evidence & Cloud Storage
                </h3>
                <p className="text-3xs text-slate-500 font-medium truncate">
                  100% online cloud storage; automatic previous photo deletion
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>

          {/* Terms of Service */}
          <div
            onClick={() => setActivePolicy('TERMS')}
            className="p-3 bg-[#f8faff] hover:bg-blue-50/70 border border-blue-100/70 rounded-2xl flex items-center justify-between cursor-pointer transition-all group active:scale-99"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-black text-slate-900 group-hover:text-amber-700 transition-colors">
                  Terms of Service & Code of Conduct
                </h3>
                <p className="text-3xs text-slate-500 font-medium truncate">
                  Supervisory responsibilities and shift integrity rules
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-700 group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>
        </div>
      </div>

      {/* 3. NOTIFICATION PREFERENCES */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100/90 relative overflow-hidden space-y-3">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#7042e6] stroke-[2.2]" />
          <h2 className="text-base font-black text-slate-900 tracking-tight">
            Notification Preferences
          </h2>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-2xl">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Crew Check-In Alerts</span>
              <span className="text-3xs text-slate-500 font-medium">Real-time alert when worker checks in</span>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('wc_leader_notify_checkin', notifyCheckIn, setNotifyCheckIn)}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                notifyCheckIn ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <div className="w-4 h-4 bg-white rounded-full shadow-xs" />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-2xl">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Late & Absence Warnings</span>
              <span className="text-3xs text-slate-500 font-medium">Alert if worker not clocked in 15m post shift</span>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('wc_leader_notify_late', notifyLate, setNotifyLate)}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                notifyLate ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <div className="w-4 h-4 bg-white rounded-full shadow-xs" />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-2xl">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Work Proof Submissions</span>
              <span className="text-3xs text-slate-500 font-medium">Notify when site photos are uploaded</span>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('wc_leader_notify_proofs', notifyWorkProofs, setNotifyWorkProofs)}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                notifyWorkProofs ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <div className="w-4 h-4 bg-white rounded-full shadow-xs" />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-2xl">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Geofence Boundary Alerts</span>
              <span className="text-3xs text-slate-500 font-medium">Alert if check-in is outside authorized radius</span>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('wc_leader_notify_geofence', notifyGeofence, setNotifyGeofence)}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                notifyGeofence ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <div className="w-4 h-4 bg-white rounded-full shadow-xs" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. SECURITY & IN-PAGE PASSWORD UPDATE (NO POPUP) */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100/90 relative overflow-hidden space-y-3">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-[#2552ea] stroke-[2.2]" />
          <h2 className="text-base font-black text-slate-900 tracking-tight">
            Security & Authentication
          </h2>
        </div>

        <div className="space-y-2">
          {/* Toggle Password Form */}
          {!showPasswordForm ? (
            <button
              type="button"
              onClick={() => setShowPasswordForm(true)}
              className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-4.5 h-4.5 text-blue-600 stroke-[2]" />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Update Password</span>
                  <span className="text-3xs text-slate-500 font-medium">Protect your Team Leader credentials</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          ) : (
            <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-blue-600" />
                  Change Password
                </span>
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(false)}
                  className="text-3xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>

              {passwordError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-3xs font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-3xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Password updated successfully!</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-2.5 text-xs">
                <div>
                  <label className="text-3xs font-bold text-slate-700 block mb-0.5">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-medium"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label className="text-3xs font-bold text-slate-700 block mb-0.5">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-medium"
                    placeholder="Minimum 6 characters"
                  />
                </div>

                <div>
                  <label className="text-3xs font-bold text-slate-700 block mb-0.5">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-medium"
                    placeholder="Re-enter new password"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPasswordForm(false)}
                    className="flex-1 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPassword}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {submittingPassword ? 'Saving...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Lockout Protection Status */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 stroke-[2]" />
              <div>
                <span className="text-xs font-bold text-emerald-900 block">Rate-Limit & Lockout Protection</span>
                <span className="text-3xs text-emerald-700 font-medium">Active (Locks for 15m after 5 failed attempts)</span>
              </div>
            </div>
            <span className="text-4xs font-black uppercase tracking-wider bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
              SECURED
            </span>
          </div>
        </div>
      </div>

      {/* 5. SYSTEM INFO & CLOUD REPOSITORY */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100/90 relative overflow-hidden space-y-3">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-slate-600 stroke-[2.2]" />
          <h2 className="text-base font-black text-slate-900 tracking-tight">
            System & Cloud Repositories
          </h2>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-2xl">
            <span className="font-semibold text-slate-600">Application Edition</span>
            <span className="font-bold text-slate-900 font-mono">WorkCrew Leader Suite v2.4.2</span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-2xl">
            <span className="font-semibold text-slate-600">Cloud Relational Database</span>
            <span className="font-bold text-emerald-600 flex items-center gap-1 font-mono text-3xs">
              <Server className="w-3.5 h-3.5" />
              <span>Turso (AWS-AP-South-1)</span>
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-2xl">
            <span className="font-semibold text-slate-600">Cloud Storage Repository</span>
            <span className="font-bold text-blue-600 flex items-center gap-1 font-mono text-3xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Google Drive (1xBiZLYm...)</span>
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-2xl">
            <span className="font-semibold text-slate-600">Corporate Administrator</span>
            <a
              href="tel:+919876511111"
              className="font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>+91 98765 11111</span>
            </a>
          </div>

          <button
            type="button"
            onClick={handleClearCache}
            className="w-full mt-2 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-500" />
            <span>{cacheCleared ? 'Cache Cleared Successfully!' : 'Clear Offline Local Cache'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
