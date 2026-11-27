import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { IndianPhoneInput } from '../../components/common/IndianPhoneInput';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Worker } from '../../types';
import {
  UserPlus,
  ArrowLeft,
  CheckCircle2,
  Phone,
  User,
  Mail,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  Camera,
  Upload,
  HardDrive,
  ExternalLink,
  ShieldCheck,
  X,
} from 'lucide-react';

const GOOGLE_DRIVE_FOLDER_URL =
  'https://drive.google.com/drive/folders/1xBiZLYm1gGaMJ5KZWNvlO1mOkhI0wcZN?usp=sharing';
const GOOGLE_DRIVE_FOLDER_ID = '1xBiZLYm1gGaMJ5KZWNvlO1mOkhI0wcZN';

export const LeaderAddWorker: React.FC = () => {
  const navigate = useNavigate();
  const { user, leader } = useAuth();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [createdWorker, setCreatedWorker] = useState<Worker | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Photo file size must be less than 10MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearPhoto = () => {
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter worker full name');
      return;
    }
    if (!phone.trim() || phone.trim() === '+91') {
      setError('Please enter worker mobile phone number');
      return;
    }
    if (!temporaryPassword || temporaryPassword.length < 6) {
      setError('Initial password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Account creation with anti-mixup photo handling & Google Drive metadata
      const res = await api.createWorker({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        temporaryPassword: temporaryPassword,
        joiningDate: new Date().toISOString().slice(0, 10),
        photoURL: photoPreview || undefined,
      } as any);

      setCreatedWorker(res);
    } catch (err: any) {
      setError(err.message || 'Failed to add worker. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCreatedWorker(null);
    setName('');
    setPhone('');
    setEmail('');
    setTemporaryPassword('password123');
    setPhotoPreview(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight">Add Worker</h1>
          <p className="text-2xs text-slate-500 font-medium">Create authorized worker account</p>
        </div>
      </div>

      {/* GOOGLE DRIVE REPOSITORY NOTICE */}
      <div className="bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-3 shadow-2xs">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-blue-900">Worker Profile Photo Storage</span>
                <span className="text-4xs font-bold uppercase tracking-wider bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded-full">
                  Anti-Mixup
                </span>
              </div>
              <p className="text-3xs text-blue-700 font-medium leading-relaxed">
                Photos are stored deterministically keyed to each worker's unique ID (<code>&#123;workerId&#125;.jpg</code>) and mapped to Google Drive.
              </p>
            </div>
          </div>
          <a
            href={GOOGLE_DRIVE_FOLDER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-1 text-3xs font-bold text-blue-700 hover:text-blue-900 bg-white border border-blue-200 px-2.5 py-1.5 rounded-xl shadow-2xs hover:bg-blue-50 transition-colors"
          >
            <span>Drive Folder</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {createdWorker ? (
        /* CONFIRMATION SCREEN */
        <div className="bg-white p-6 rounded-3xl border border-emerald-200 shadow-sm text-center space-y-4">
          <div className="relative w-20 h-20 mx-auto">
            <img
              src={createdWorker.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(createdWorker.name)}`}
              alt={createdWorker.name}
              className="w-20 h-20 rounded-full object-cover border-2 border-emerald-500 shadow-sm bg-slate-100"
            />
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center border-2 border-white shadow-xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div>
            <span className="text-3xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
              Worker Account Created
            </span>
            <h2 className="text-lg font-black text-slate-900 mt-2">{createdWorker.name}</h2>
            <div className="mt-2 inline-block px-4 py-2 bg-slate-900 text-white rounded-2xl font-mono text-sm font-black tracking-widest shadow-xs">
              ID: {createdWorker.workerId}
            </div>
            <p className="text-2xs text-emerald-700 font-semibold mt-2">
              ✓ Saved to database with deterministic photo mapping.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-600 space-y-1.5 text-left border border-slate-200">
            <p className="flex justify-between">
              <span className="text-slate-400 font-medium">Mobile Number:</span>
              <strong className="text-slate-800">{createdWorker.phone}</strong>
            </p>
            <p className="flex justify-between">
              <span className="text-slate-400 font-medium">Assigned Team:</span>
              <strong className="text-slate-800">{createdWorker.primaryTeamName || 'Unassigned'}</strong>
            </p>
            <p className="flex justify-between">
              <span className="text-slate-400 font-medium">Anti-Mixup Photo:</span>
              <span className="font-mono text-2xs font-bold text-slate-800 bg-slate-200/80 px-2 py-0.5 rounded">
                {createdWorker.workerId}.jpg
              </span>
            </p>
            <p className="flex justify-between">
              <span className="text-slate-400 font-medium">Temporary Password:</span>
              <span className="font-mono font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                {temporaryPassword}
              </span>
            </p>
            <p className="text-3xs text-amber-700 font-semibold pt-1">
              * Worker will be required to change this password on their first login.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <a
              href={GOOGLE_DRIVE_FOLDER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[42px] py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-2xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <HardDrive className="w-3.5 h-3.5 text-blue-600" />
              <span>Open Worker Photos in Google Drive</span>
              <ExternalLink className="w-3 h-3 text-blue-500" />
            </a>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 min-h-[46px] py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-xs transition-colors"
              >
                + Another Worker
              </button>
              <Link
                to="/leader/teams"
                className="flex-1 min-h-[46px] py-2.5 bg-[#1752d5] hover:bg-blue-700 text-white rounded-2xl font-bold text-xs transition-colors flex items-center justify-center shadow-xs"
              >
                View My Team
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* ADD WORKER FORM */
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-2xs space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* WORKER PHOTO UPLOAD & PREVIEW */}
            <div>
              <label className="block text-2xs font-bold text-slate-700 mb-1">
                Worker Profile Photo <span className="text-slate-400 font-normal">(Auto-synced to Google Drive)</span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoSelect}
                className="hidden"
                id="worker-photo-input"
              />

              {photoPreview ? (
                <div className="relative flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-300 shadow-2xs"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Photo Ready</span>
                    </div>
                    <p className="text-3xs text-slate-500 font-mono truncate">
                      Will be saved deterministically with Worker ID
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="p-1.5 rounded-xl bg-slate-200 text-slate-600 hover:bg-rose-100 hover:text-rose-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shadow-2xs">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">Tap to Take or Upload Photo</span>
                  <span className="text-4xs text-slate-400 font-medium">
                    Stored strictly in Google Drive folder under worker ID
                  </span>
                </div>
              )}
            </div>

            {/* FULL NAME */}
            <div>
              <label className="block text-2xs font-bold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full pl-9 pr-3 py-2 text-xs font-semibold text-slate-900 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            {/* MOBILE NUMBER */}
            <div>
              <label className="block text-2xs font-bold text-slate-700 mb-1">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <IndianPhoneInput
                variant="compact"
                showIcon
                required
                value={phone}
                onChange={setPhone}
                placeholder="9876500000"
              />
            </div>

            {/* INDEPENDENT ACCOUNT NOTICE */}
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl text-2xs text-blue-700 leading-relaxed">
              <strong>Independent Account Creation:</strong> Workers are registered independently of team membership with status <code>UNASSIGNED</code>. Once created, you can assign them to any of your authorized teams from the <strong>My Team</strong> dashboard.
            </div>

            {/* TEMPORARY PASSWORD */}
            <div>
              <label className="block text-2xs font-bold text-slate-700 mb-1">
                Temporary Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={temporaryPassword}
                  onChange={(e) => setTemporaryPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-9 pr-10 py-2 text-xs font-semibold text-slate-900 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-4xs text-slate-500 mt-1">
                Worker will be prompted to set their own secret password when logging in for the first time.
              </p>
            </div>

            {/* EMAIL (OPTIONAL) */}
            <div>
              <label className="block text-2xs font-bold text-slate-700 mb-1">
                Email Address <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="worker@workcrew.com"
                  className="w-full pl-9 pr-3 py-2 text-xs font-semibold text-slate-900 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[46px] py-2.5 px-4 bg-[#1752d5] hover:bg-blue-700 active:scale-98 text-white font-black text-xs rounded-2xl transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? 'Creating Worker...' : 'Create Worker Account'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
