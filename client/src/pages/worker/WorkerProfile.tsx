import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { ImageCropModal } from '../../components/common/ImageCropModal';
import {
  User,
  Users,
  Briefcase,
  Calendar,
  Phone,
  Mail,
  MapPin,
  LogOut,
  Pencil,
  Settings,
  ChevronRight,
  Contact,
  ShieldCheck,
  Key,
  AlertCircle,
  Globe,
  Bell,
  X,
  HardDrive,
  ExternalLink,
  CheckCircle2,
  Loader2,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const WorkerProfile: React.FC = () => {
  const { worker, user, logout, changePassword, updateProfilePhoto } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [leader, setLeader] = useState<{ name: string; phone?: string } | null>(null);

  // Settings modal
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Password change state
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Reset help state
  const [resetHelpModalOpen, setResetHelpModalOpen] = useState(false);
  const [resetHelpReason, setResetHelpReason] = useState('I need help resetting my password');
  const [submittingResetHelp, setSubmittingResetHelp] = useState(false);

  // Photo upload, crop & Google Drive sync
  const [customPhoto, setCustomPhoto] = useState<string | null>(() => {
    return localStorage.getItem('workcrew_worker_custom_avatar') || null;
  });
  const [rawCropImage, setRawCropImage] = useState<string | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoSyncSuccess, setPhotoSyncSuccess] = useState(false);
  const [photoSyncError, setPhotoSyncError] = useState<string | null>(null);

  const GOOGLE_DRIVE_FOLDER_URL =
    'https://drive.google.com/drive/folders/1xBiZLYm1gGaMJ5KZWNvlO1mOkhI0wcZN?usp=sharing';
  const GOOGLE_DRIVE_FOLDER_ID = '1xBiZLYm1gGaMJ5KZWNvlO1mOkhI0wcZN';

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
      alert('Password updated successfully!');
      setPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password');
    } finally {
      setSubmittingPassword(false);
    }
  };

  const handleRequestResetHelp = async () => {
    if (!worker?.phone && !user?.phone) {
      alert('No mobile phone registered on this profile');
      return;
    }
    setSubmittingResetHelp(true);
    try {
      const phone = worker?.phone || user?.phone || '';
      await api.forgotPasswordRequest(phone, resetHelpReason);
      alert('Password reset request submitted to your Team Leader!');
      setResetHelpModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to submit reset request');
    } finally {
      setSubmittingResetHelp(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setPhotoSyncError('Photo size must be less than 10MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setRawCropImage(event.target?.result as string);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const handleConfirmCrop = async (croppedBase64: string) => {
    try {
      setUploadingPhoto(true);
      setPhotoSyncError(null);
      // Upload cropped photo: deletes previous file from disk and saves new file
      const res = await updateProfilePhoto(croppedBase64);
      setCustomPhoto(res.photoURL);
      localStorage.setItem('workcrew_worker_custom_avatar', res.photoURL);
      setPhotoSyncSuccess(true);
      setTimeout(() => setPhotoSyncSuccess(false), 6000);
    } catch (err: any) {
      console.warn('Backend photo upload warning:', err);
      setPhotoSyncError(err.message || 'Failed to sync photo to server repository');
    } finally {
      setUploadingPhoto(false);
    }
  };

  useEffect(() => {
    if (worker?.primaryTeamId) {
      Promise.all([api.getTeams(), api.getLeaders()])
        .then(([teams, leaders]) => {
          const myTeam = teams.find((t) => t.teamId === worker.primaryTeamId);
          if (myTeam && myTeam.leaderIds && myTeam.leaderIds.length > 0) {
            const l = leaders.find((ld) => ld.leaderId === myTeam.leaderIds[0]);
            if (l) setLeader({ name: l.name, phone: l.phone });
          }
        })
        .catch((e) => console.warn(e));
    }
  }, [worker]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const workerCode = worker?.workerId || 'WC-2026-016';
  const teamName = worker?.primaryTeamName || (worker?.primaryTeamId ? 'Assigned' : 'Unassigned');
  const avatarUrl = customPhoto || worker?.photoURL || user?.photoURL || '/worker-illustration.png';

  const joinedDateFormatted = worker?.joiningDate
    ? new Date(worker.joiningDate).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : worker?.createdAt
    ? new Date(worker.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '18 Nov 2026';

  return (
    <div className="space-y-3.5 pb-4">
      {/* 1. TOP HERO HEADER (Full-Bleed Matching Design) */}
      <div className="-mx-3 -mt-4 bg-[#3148df] text-white pt-5 pb-6 px-4 rounded-b-[28px] shadow-sm relative overflow-hidden flex items-center justify-between">
        {/* Real Wavy Ribbon Background Banner */}
        <img
          src="/header-bg-wave.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
        />

        {/* Left: Avatar with Edit Pencil & Title */}
        <div className="flex items-center gap-3 relative z-10 min-w-0">
          <div className="relative shrink-0">
            {/* Main Avatar Circle with proper crisp white outline ring */}
            <div className="w-14 h-14 rounded-full ring-[2.5px] ring-white shadow-md overflow-hidden bg-slate-800 flex items-center justify-center">
              <img
                src={avatarUrl}
                alt="Profile"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src.includes(':3000/uploads/')) {
                    target.src = target.src.replace(':3000', ':5000');
                  }
                }}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Blue circular edit pencil badge with white outline */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#3548e6] text-white flex items-center justify-center ring-2 ring-white shadow-xs cursor-pointer hover:bg-blue-700 active:scale-90 transition-all"
              title="Change photo"
            >
              <Pencil className="w-3 h-3 stroke-[2.5]" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handlePhotoSelect}
              className="hidden"
            />
          </div>

          <div className="space-y-0.5 min-w-0">
            <h1 className="text-xl font-black text-white tracking-tight leading-tight">
              My Profile
            </h1>
            <p className="text-xs text-blue-100/90 font-medium truncate">
              Manage your account and details
            </p>
          </div>
        </div>

        {/* Right: Settings Gear Icon */}
        <button
          type="button"
          onClick={() => setSettingsModalOpen(true)}
          className="relative z-10 w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white/25 active:scale-95 transition-all cursor-pointer shrink-0"
          title="Settings"
        >
          <Settings className="w-5 h-5 stroke-[2]" />
        </button>
      </div>

      {/* 2. DIGITAL ID BADGE / BARCODE CARD */}
      <div className="bg-gradient-to-r from-[#1738c6] via-[#244de0] to-[#3965ea] rounded-[22px] p-3.5 px-4 text-white shadow-md shadow-blue-900/15 relative overflow-hidden flex items-center justify-between">
        {/* Subtle wavy highlight in card */}
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />

        {/* Barcode & ID */}
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-0.5 h-6">
            {[3, 1, 2, 4, 1, 3, 2, 5, 1, 2, 4, 1, 3, 2, 1, 4, 2, 5, 1, 3, 2, 4, 1, 3].map((w, i) => (
              <span
                key={i}
                className="bg-white h-full inline-block rounded-xs"
                style={{ width: `${w}px` }}
              />
            ))}
          </div>
          <span className="font-mono text-xs font-black tracking-wider text-white block">
            {workerCode}
          </span>
        </div>

        {/* Divider */}
        <div className="h-9 w-px bg-white/20 mx-2 relative z-10" />

        {/* Valid Till */}
        <div className="flex items-center gap-2.5 relative z-10">
          <Calendar className="w-6 h-6 text-white stroke-[2]" />
          <div>
            <span className="text-3xs text-blue-100/80 font-medium block">
              Valid Till
            </span>
            <strong className="text-xs font-black text-white block leading-tight">
              Dec 2028
            </strong>
          </div>
        </div>
      </div>

      {/* 3. SECTION 1: OPERATIONAL ASSIGNMENT */}
      <div className="bg-white rounded-[26px] p-4.5 border border-slate-100 shadow-xs space-y-3.5 relative overflow-hidden">
        {/* Decorative subtle corner wave */}
        <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-indigo-100/40 via-purple-50/20 to-transparent rounded-bl-full pointer-events-none" />

        {/* Header */}
        <div className="flex items-center gap-2.5 relative z-10">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#4352f5] flex items-center justify-center shrink-0">
            <Briefcase className="w-4.5 h-4.5 stroke-[2.2]" />
          </div>
          <h3 className="text-sm font-black text-slate-800">Operational Assignment</h3>
        </div>

        {/* Rows */}
        <div className="space-y-2.5 relative z-10">
          {/* Primary Unit */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2.5 text-slate-600">
              <Users className="w-4.5 h-4.5 text-[#4352f5] shrink-0" />
              <span className="text-xs font-semibold text-slate-600">Primary Unit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="bg-[#fff7ed] text-[#ea580c] border border-orange-200/60 px-3 py-1 rounded-full text-xs font-bold">
                {teamName}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Designated Leader */}
          <div className="flex items-center justify-between py-1 border-t border-slate-50">
            <div className="flex items-center gap-2.5 text-slate-600">
              <User className="w-4.5 h-4.5 text-[#4352f5] shrink-0" />
              <span className="text-xs font-semibold text-slate-600">Designated Leader</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="bg-[#fff7ed] text-[#ea580c] border border-orange-200/60 px-3 py-1 rounded-full text-xs font-bold">
                {leader?.name || 'Unassigned Leader'}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Joined Date */}
          <div className="flex items-center justify-between py-1 border-t border-slate-50">
            <div className="flex items-center gap-2.5 text-slate-600">
              <Calendar className="w-4.5 h-4.5 text-[#4352f5] shrink-0" />
              <span className="text-xs font-semibold text-slate-600">Joined Date</span>
            </div>
            <span className="text-xs font-black text-slate-900 pr-1">
              {joinedDateFormatted}
            </span>
          </div>
        </div>
      </div>

      {/* 4. SECTION 2: PERSONAL INFORMATION */}
      <div className="bg-white rounded-[26px] p-4.5 border border-slate-100 shadow-xs space-y-3.5 relative overflow-hidden">
        {/* Decorative subtle corner wave */}
        <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-indigo-100/40 via-purple-50/20 to-transparent rounded-bl-full pointer-events-none" />

        {/* Header */}
        <div className="flex items-center gap-2.5 relative z-10">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#4352f5] flex items-center justify-center shrink-0">
            <Contact className="w-4.5 h-4.5 stroke-[2.2]" />
          </div>
          <h3 className="text-sm font-black text-slate-800">Personal Information</h3>
        </div>

        {/* Rows */}
        <div className="space-y-2.5 relative z-10">
          {/* Phone Number */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2.5 text-slate-600">
              <Phone className="w-4.5 h-4.5 text-[#4352f5] shrink-0" />
              <span className="text-xs font-semibold text-slate-600">Phone Number</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-slate-900">
                {worker?.phone || user?.phone || '123456789'}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Email Account */}
          <div className="flex items-center justify-between py-1 border-t border-slate-50">
            <div className="flex items-center gap-2.5 text-slate-600">
              <Mail className="w-4.5 h-4.5 text-[#4352f5] shrink-0" />
              <span className="text-xs font-semibold text-slate-600">Email Account</span>
            </div>
            <div className="flex items-center gap-1.5">
              {worker?.email || user?.email ? (
                <span className="text-xs font-bold text-slate-800 truncate max-w-[150px]">
                  {worker?.email || user?.email}
                </span>
              ) : (
                <span className="bg-[#fef2f2] text-[#ef4444] border border-rose-200/60 px-3 py-0.5 rounded-full text-xs font-bold">
                  Not registered
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Registered Address */}
          <div className="flex items-center justify-between py-1 border-t border-slate-50">
            <div className="flex items-center gap-2.5 text-slate-600 shrink-0">
              <MapPin className="w-4.5 h-4.5 text-[#4352f5] shrink-0" />
              <span className="text-xs font-semibold text-slate-600">Registered Address</span>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-medium text-slate-500 truncate max-w-[170px]">
                {worker?.address || 'Address not registered on file'}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </div>
          </div>
        </div>
      </div>

      {/* 5. SECTION 3: SECURITY & ACCOUNT PASSWORD */}
      <div className="bg-white rounded-[26px] p-4.5 border border-slate-100 shadow-xs space-y-3.5 relative overflow-hidden">
        {/* Decorative subtle corner wave */}
        <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-indigo-100/40 via-purple-50/20 to-transparent rounded-bl-full pointer-events-none" />

        {/* Header */}
        <div className="flex items-center gap-2.5 relative z-10">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#4352f5] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4.5 h-4.5 stroke-[2.2]" />
          </div>
          <h3 className="text-sm font-black text-slate-800">Security & Account Password</h3>
        </div>

        {/* Dual Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-0.5 relative z-10">
          <button
            type="button"
            onClick={() => setPasswordModalOpen(true)}
            className="py-3 px-3.5 bg-gradient-to-r from-[#2f55d4] to-[#4352f5] hover:opacity-95 active:scale-95 text-white font-bold text-xs rounded-2xl shadow-sm shadow-blue-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Key className="w-4 h-4 stroke-[2.5]" />
            <span>Change Password</span>
          </button>

          <button
            type="button"
            onClick={() => setResetHelpModalOpen(true)}
            className="py-3 px-3.5 bg-[#edf2fe] hover:bg-[#e4ebfc] active:scale-95 text-[#3548e6] font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <AlertCircle className="w-4 h-4 stroke-[2.5]" />
            <span>Reset Help</span>
          </button>
        </div>
      </div>

      {/* 6. GOOGLE DRIVE WORKER PHOTO REPOSITORY (ANTI-MIXUP GUARANTEE) */}
      <div className="bg-white rounded-[26px] p-4.5 border border-slate-100 shadow-xs space-y-3.5 relative overflow-hidden">
        {/* Decorative subtle corner wave */}
        <div className="absolute top-0 right-0 w-28 h-28 bg-linear-to-bl from-blue-100/40 via-indigo-50/20 to-transparent rounded-bl-full pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <HardDrive className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800">Profile Photo Storage</h3>
              <p className="text-3xs text-slate-500 font-medium">Mapped to Google Drive Folder</p>
            </div>
          </div>
          <span className="text-4xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
            Anti-Mixup
          </span>
        </div>

        {uploadingPhoto && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-2 text-xs font-bold text-blue-700">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
            <span>Syncing photo with unique ID mapping...</span>
          </div>
        )}

        {photoSyncSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Profile photo synced cleanly as {workerCode}.jpg!</span>
          </div>
        )}

        {photoSyncError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs font-bold text-rose-700">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{photoSyncError}</span>
          </div>
        )}

        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs text-slate-600 relative z-10">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium">Canonical Filename:</span>
            <span className="font-mono text-2xs font-extrabold bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-800">
              {workerCode}.jpg
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium">Anti-Mixup Key:</span>
            <span className="font-mono text-2xs font-bold text-blue-700">
              {workerCode} (1-to-1 Bound)
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium">Drive Folder ID:</span>
            <span className="font-mono text-3xs font-medium text-slate-500 truncate max-w-[150px]">
              {GOOGLE_DRIVE_FOLDER_ID}
            </span>
          </div>
        </div>

        <a
          href={GOOGLE_DRIVE_FOLDER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2.5 px-3.5 bg-blue-50 hover:bg-blue-100 active:scale-98 text-blue-700 font-bold text-xs rounded-2xl border border-blue-200 flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer relative z-10"
        >
          <HardDrive className="w-4 h-4 text-blue-600" />
          <span>Open Photos Folder in Google Drive</span>
          <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
        </a>
      </div>

      {/* 7. SIGN OUT BUTTON */}
      <button
        type="button"
        onClick={handleLogout}
        className="w-full py-3.5 px-4 bg-[#fff1f2] hover:bg-rose-100/70 active:scale-[0.98] text-[#ef4444] font-black text-xs rounded-2xl border border-rose-200/80 flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer"
      >
        <LogOut className="w-4 h-4 stroke-[2.5]" />
        <span>Sign Out from WorkCrew</span>
      </button>

      {/* SETTINGS MODAL */}
      {settingsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm font-black text-slate-900">Application Settings</h2>
              </div>
              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Language Selector */}
            <div className="space-y-2">
              <label className="block text-2xs font-bold text-slate-700 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span>Preferred Language</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { code: 'en', label: 'English' },
                  { code: 'hi', label: 'हिंदी' },
                  { code: 'bn', label: 'বাংলা' },
                ].map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setLanguage(item.code as any)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                      language === item.code
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* App Info */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-2xs text-slate-600">
              <div className="flex justify-between font-bold">
                <span>Version</span>
                <span className="text-slate-900 font-mono">v2.4.0</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Enterprise Build</span>
                <span className="text-emerald-600">Protected</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSettingsModalOpen(false)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-4">
            <div className="text-center space-y-1">
              <h2 className="text-sm font-black text-slate-900">Change Your Password</h2>
              <p className="text-3xs text-slate-500">Enter your current password and choose a new one.</p>
            </div>

            {passwordError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-3xs font-bold rounded-xl">
                {passwordError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-3xs font-bold text-slate-700 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-3xs font-bold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-3xs font-bold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPassword}
                  className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl disabled:opacity-50 cursor-pointer"
                >
                  {submittingPassword ? 'Saving...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REQUEST RESET HELP MODAL */}
      {resetHelpModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-4">
            <div className="text-center space-y-1">
              <h2 className="text-sm font-black text-slate-900">Request Leader Assistance</h2>
              <p className="text-3xs text-slate-500">
                Notify your Team Leader ({leader?.name || 'Assigned Leader'}) to reset your password.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-3xs font-bold text-slate-700 mb-1">Reason / Note</label>
                <textarea
                  rows={2}
                  value={resetHelpReason}
                  onChange={(e) => setResetHelpReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setResetHelpModalOpen(false)}
                  className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRequestResetHelp}
                  disabled={submittingResetHelp}
                  className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl disabled:opacity-50 cursor-pointer"
                >
                  {submittingResetHelp ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Picture Crop & Adjustment Modal */}
      <ImageCropModal
        isOpen={cropModalOpen}
        imageSrc={rawCropImage}
        onClose={() => setCropModalOpen(false)}
        onConfirm={handleConfirmCrop}
        title="Adjust Worker Profile Picture"
      />
    </div>
  );
};
