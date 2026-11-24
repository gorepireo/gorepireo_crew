import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ImageCropModal } from '../../components/common/ImageCropModal';
import {
  Building2,
  Phone,
  Mail,
  Shield,
  KeyRound,
  LogOut,
  Globe,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  Settings,
  ShieldCheck,
  Contact,
  Camera,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LeaderProfile: React.FC = () => {
  const { leader, user, logout, changePassword, updateProfilePhoto, settings } = useAuth();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);

  // Profile Picture Crop state
  const [rawCropImage, setRawCropImage] = useState<string | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [photoSuccessMsg, setPhotoSuccessMsg] = useState<string | null>(null);

  const leaderName = leader?.name || user?.displayName || 'Prithibi';
  const phone = leader?.phone || user?.phone || '—';
  const email = leader?.email || user?.email || 'leader@workcrew.internal';
  const orgName = settings?.orgName || 'WorkCrew Infrastructure Corp';
  const photoUrl = leader?.photoURL || user?.photoURL || null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setRawCropImage(event.target?.result as string);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(file);
      // Reset input value so re-selecting same file triggers change
      e.target.value = '';
    }
  };

  const handleConfirmCrop = async (croppedBase64: string) => {
    const res = await updateProfilePhoto(croppedBase64);
    setPhotoSuccessMsg(
      res.deletedPrevious
        ? 'Profile photo updated! Previous photo file was permanently deleted from server.'
        : 'Profile photo updated successfully!'
    );
    setTimeout(() => setPhotoSuccessMsg(null), 5000);
  };

  const cycleLanguage = () => {
    if (language === 'en') setLanguage('hi');
    else if (language === 'hi') setLanguage('bn');
    else setLanguage('en');
  };

  const langLabel = language === 'en' ? 'English (EN)' : language === 'hi' ? 'हिंदी (HI)' : 'বাংলা (BN)';

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
        setPasswordModalOpen(false);
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

  return (
    <div className="space-y-3.5 pb-2">
      {/* 1. TOP CURVED BLUE HERO HEADER CONTAINER */}
      <div className="-mx-3 -mt-3 bg-gradient-to-r from-[#2031c9] via-[#353de0] to-[#5a32de] text-white pt-5 pb-9 px-4 relative overflow-hidden z-10 shadow-sm">
        {/* Subtle decorative smooth background waves */}
        <div className="absolute inset-0 opacity-25 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none" fill="none">
            <path
              d="M0,20 C120,80 260,-20 400,40 L400,120 L0,120 Z"
              fill="url(#profile-wave-grad)"
            />
            <defs>
              <linearGradient id="profile-wave-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#818cf8" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white leading-tight tracking-tight">
              My Profile
            </h1>
            <p className="text-xs text-white/80 font-medium mt-0.5">
              Manage your account and details
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/leader/settings')}
            className="w-10 h-10 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/25 flex items-center justify-center text-white transition-all cursor-pointer shadow-xs active:scale-95"
            title="Leader Settings & Privacy"
          >
            <Settings className="w-5 h-5 stroke-[2]" />
          </button>
        </div>
      </div>

      {/* Photo Success / Deletion Notice */}
      {photoSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{photoSuccessMsg}</span>
        </div>
      )}

      {/* 2. FLOATING LEADER IDENTITY CARD (Negative top margin, exact match to screenshot) */}
      <div className="-mt-6 relative z-20">
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100/90 flex items-center gap-4 relative overflow-hidden">
          {/* Subtle decorative purple corner accent */}
          <div className="absolute right-0 bottom-0 w-32 h-20 bg-gradient-to-tl from-purple-100/50 to-transparent rounded-tl-[40px] pointer-events-none" />

          {/* Hidden File Input for Profile Photo */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Avatar with Photo / Initial, Pencil Edit Button & Green Active Dot */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2563eb] to-[#4338ca] text-white flex items-center justify-center text-2xl font-black ring-4 ring-blue-50/80 shadow-md overflow-hidden">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={leaderName}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src.includes(':3000/uploads/')) {
                      target.src = target.src.replace(':3000', ':5000');
                    }
                  }}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{leaderName.slice(0, 1).toUpperCase()}</span>
              )}
            </div>

            {/* Circular Pencil Button to Change/Crop Photo */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#1752d5] hover:bg-blue-700 active:scale-90 text-white flex items-center justify-center ring-2 ring-white shadow-xs cursor-pointer transition-all"
              title="Change Profile Photo"
            >
              <Pencil className="w-3 h-3 stroke-[2.5]" />
            </button>

            {/* Active Online Indicator */}
            <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white ring-1 ring-emerald-400" />
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1 relative z-10">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 truncate leading-tight">
                {leaderName}
              </h2>
              <span className="bg-[#ede9fe] text-[#6d28d9] px-2 py-0.5 rounded-full text-4xs font-black uppercase tracking-wider shrink-0 shadow-2xs">
                LEADER
              </span>
            </div>
            <p className="text-xs text-slate-600 font-bold mt-1">
              {phone}
            </p>
            <div className="flex items-center gap-1.5 text-2xs font-extrabold text-[#4338ca] mt-1">
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{orgName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. ACCOUNT INFORMATION SECTION */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100/90 relative overflow-hidden space-y-3">
        {/* Subtle decorative purple corner accent */}
        <div className="absolute top-0 right-0 w-28 h-20 bg-gradient-to-bl from-purple-100/50 to-transparent rounded-bl-[40px] pointer-events-none" />

        {/* Header */}
        <div className="flex items-center gap-2 relative z-10">
          <Contact className="w-5 h-5 text-[#4338ca] stroke-[2]" />
          <h3 className="text-base font-black text-slate-900 tracking-tight">
            Account Information
          </h3>
        </div>

        {/* Rows */}
        <div className="space-y-2.5 relative z-10">
          {/* Row 1: Role Privilege */}
          <div className="bg-[#f8faff] border border-blue-50/80 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-slate-700 font-bold text-xs">
              <Shield className="w-4.5 h-4.5 text-[#2563eb] stroke-[2]" />
              <span>Role Privilege</span>
            </div>
            <span className="bg-[#ede9fe] text-[#5b21b6] px-3 py-1 rounded-full text-xs font-black">
              Team Leader
            </span>
          </div>

          {/* Row 2: Mobile Number */}
          <div className="bg-[#f8faff] border border-blue-50/80 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-slate-700 font-bold text-xs">
              <Phone className="w-4.5 h-4.5 text-[#2563eb] stroke-[2]" />
              <span>Mobile Number</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-black text-slate-900">
              <span>{phone}</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Row 3: Email Address */}
          <div className="bg-[#f8faff] border border-blue-50/80 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-slate-700 font-bold text-xs">
              <Mail className="w-4.5 h-4.5 text-[#2563eb] stroke-[2]" />
              <span>Email Address</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-black text-slate-900">
              <span className="truncate max-w-[170px]">{email}</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. PREFERENCES & SECURITY SECTION */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100/90 relative overflow-hidden space-y-3">
        {/* Subtle decorative purple corner accent */}
        <div className="absolute top-0 right-0 w-28 h-20 bg-gradient-to-bl from-purple-100/50 to-transparent rounded-bl-[40px] pointer-events-none" />

        {/* Header */}
        <div className="flex items-center gap-2 relative z-10">
          <ShieldCheck className="w-5 h-5 text-[#4338ca] stroke-[2]" />
          <h3 className="text-base font-black text-slate-900 tracking-tight">
            Preferences & Security
          </h3>
        </div>

        {/* Rows */}
        <div className="space-y-2.5 relative z-10">
          {/* Row 1: Display Language */}
          <button
            type="button"
            onClick={cycleLanguage}
            className="w-full bg-[#f8faff] hover:bg-slate-100 border border-blue-50/80 rounded-2xl p-3 flex items-center justify-between transition-all cursor-pointer text-left"
          >
            <div className="flex items-center gap-2.5 text-slate-700 font-bold text-xs">
              <Globe className="w-4.5 h-4.5 text-[#2563eb] stroke-[2]" />
              <span>Display Language</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-black text-slate-900">
              <span>{langLabel}</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </button>

          {/* Row 2: Change Password */}
          <button
            type="button"
            onClick={() => setPasswordModalOpen(true)}
            className="w-full bg-[#f8faff] hover:bg-slate-100 border border-blue-50/80 rounded-2xl p-3 flex items-center justify-between transition-all cursor-pointer text-left"
          >
            <div className="flex items-center gap-2.5 text-slate-700 font-bold text-xs">
              <KeyRound className="w-4.5 h-4.5 text-[#2563eb] stroke-[2]" />
              <span>Change Password</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* 5. SIGN OUT BUTTON */}
      <button
        type="button"
        onClick={logout}
        className="w-full py-3.5 px-4 bg-[#fef2f2] hover:bg-rose-100 border border-rose-200/90 text-[#dc2626] rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-2xs active:scale-98 transition-all cursor-pointer"
      >
        <LogOut className="w-4.5 h-4.5 text-[#dc2626] stroke-[2.2]" />
        <span>Sign Out of Team Leader Portal</span>
      </button>

      {/* CHANGE PASSWORD MODAL */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">Change Password</h3>
              <button
                type="button"
                onClick={() => setPasswordModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Password updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="text-2xs font-bold text-slate-600 block mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-semibold"
                />
              </div>

              <div>
                <label className="text-2xs font-bold text-slate-600 block mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-semibold"
                />
              </div>

              <div>
                <label className="text-2xs font-bold text-slate-600 block mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-semibold"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPassword}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-60 cursor-pointer"
                >
                  {submittingPassword ? 'Updating...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Crop & Framing Modal */}
      <ImageCropModal
        isOpen={cropModalOpen}
        imageSrc={rawCropImage}
        onClose={() => setCropModalOpen(false)}
        onConfirm={handleConfirmCrop}
        title="Adjust Leader Profile Picture"
      />
    </div>
  );
};
