import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Lock,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  X,
  HardHat,
  ClipboardList,
  User as UserIcon,
  Mail,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, registerWorker, changePassword, settings } = useAuth();
  const navigate = useNavigate();

  // Mode toggle: Login vs Register
  const [isRegistering, setIsRegistering] = useState(false);

  // Login state
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Registration state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  // Mandatory first-time password change state
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [changeError, setChangeError] = useState<string | null>(null);
  const [targetRedirect, setTargetRedirect] = useState('/worker/home');

  // Restore password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const handleQuickLogin = async (quickPhone: string, quickPass: string) => {
    setPhone(quickPhone);
    setPassword(quickPass);
    setError(null);
    setLoading(true);
    try {
      const res = await login(quickPhone, quickPass);
      if (res.mustChangePassword) {
        setTargetRedirect(res.redirectUrl);
        setShowChangeModal(true);
      } else {
        navigate(res.redirectUrl);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await login(phone, password);
      if (res.mustChangePassword) {
        setTargetRedirect(res.redirectUrl);
        setShowChangeModal(true);
      } else {
        navigate(res.redirectUrl);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your mobile number and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regName.trim()) {
      setRegError('Please enter your full name');
      return;
    }
    if (!regPhone.trim()) {
      setRegError('Please enter your mobile number');
      return;
    }
    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match');
      return;
    }

    setRegLoading(true);
    try {
      const res = await registerWorker({
        name: regName.trim(),
        phone: regPhone.trim(),
        password: regPassword,
        email: regEmail.trim() || undefined,
      });
      navigate(res.redirectUrl || '/worker/home');
    } catch (err: any) {
      setRegError(err.message || 'Registration failed. Please try again.');
    } finally {
      setRegLoading(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setChangeError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangeError('Passwords do not match');
      return;
    }
    setChangingPassword(true);
    setChangeError(null);
    try {
      await changePassword(newPassword, password);
      setShowChangeModal(false);
      navigate(targetRedirect);
    } catch (err: any) {
      setChangeError(err.message || 'Failed to update password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleRestorePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotNewPassword.length < 6) {
      setForgotError('New password must be at least 6 characters long.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match. Please re-enter both identical passwords.');
      return;
    }
    setForgotLoading(true);
    setForgotError(null);
    setForgotSuccess(null);
    try {
      const res = await api.selfResetPassword(forgotPhone.trim(), forgotNewPassword);
      setForgotSuccess(res.message);
      setPhone(forgotPhone.trim());
      setPassword(forgotNewPassword);
    } catch (err: any) {
      setForgotError(err.message || 'Failed to restore password. Please check your mobile number.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] bg-gradient-to-b from-[#0a237a] via-[#1342c7] to-[#1e54eb] flex flex-col justify-between relative overflow-hidden select-none">
      {/* CODE-DESIGNED MOBILE APP BACKGROUND (Layered Gradients, Dot Grid & Flowing SVG Waves) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Subtle dot matrix texture */}
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.45) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />

        {/* Soft atmospheric glow orbs */}
        <div className="absolute -top-20 -left-16 w-72 h-72 bg-sky-400/25 rounded-full blur-3xl" />
        <div className="absolute top-16 -right-20 w-80 h-80 bg-indigo-400/25 rounded-full blur-3xl" />

        {/* Flowing SVG wave ribbons */}
        <svg
          viewBox="0 0 1440 420"
          preserveAspectRatio="none"
          className="absolute top-0 inset-x-0 w-full h-80 opacity-30"
          aria-hidden="true"
        >
          <path
            d="M0,120 C240,210 480,30 760,115 C1040,200 1240,60 1440,125 L1440,0 L0,0 Z"
            fill="url(#loginWave1)"
          />
          <path
            d="M0,210 C320,130 620,275 940,185 C1180,120 1320,210 1440,175 L1440,0 L0,0 Z"
            fill="url(#loginWave2)"
          />
          <defs>
            <linearGradient id="loginWave1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="loginWave2" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.05" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* TOP HEADER SECTION WITH FLOATING BADGES & BRANDING */}
      <div className="relative z-10 pt-10 pb-8 px-6 sm:px-8 text-center max-w-md w-full mx-auto">
        {/* Floating Top-Left Glass Badge: Hard Hat */}
        <div className="absolute top-6 left-2 sm:left-2 w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center -rotate-12 shadow-lg shadow-blue-900/20 pointer-events-none">
          <HardHat className="w-5 h-5 sm:w-7 sm:h-7 text-white/80" />
        </div>

        {/* Floating Top-Right Glass Badge: Checklist */}
        <div className="absolute top-5 right-2 sm:right-2 w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center rotate-12 shadow-lg shadow-blue-900/20 pointer-events-none">
          <ClipboardList className="w-5 h-5 sm:w-7 sm:h-7 text-white/80" />
        </div>

        {/* Brand Name */}
        <h1 className="text-2xl font-black tracking-tight text-white mb-3">
          {settings?.orgName || 'Go_Repireo Crew'}
        </h1>

        {/* Squircle Logo with Crisp White Border Outline */}
        <div className="mx-auto w-24 h-24 rounded-[30px] overflow-hidden bg-slate-900 border-2 border-white flex items-center justify-center shadow-2xl shadow-blue-900/40 tracking-tight">
          <img
            src={settings?.orgLogo || '/logo.png'}
            alt={settings?.orgName || 'Go_Repireo Crew'}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* BOTTOM WHITE CARD CONTAINER */}
      <div className="relative z-10 w-full max-w-md mx-auto">
        <div className="bg-white rounded-t-[38px] sm:rounded-b-[38px] px-6 sm:px-8 pt-8 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] space-y-6">
          {/* Sparkles Icon Header */}
          <div className="space-y-1">
            <div className="relative inline-block">
              {/* Main 4-point star */}
              <svg
                className="w-6 h-6 text-[#111827] fill-current"
                viewBox="0 0 24 24"
              >
                <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
              </svg>
              {/* Secondary small 4-point star */}
              <svg
                className="w-3 h-3 text-[#111827] fill-current absolute -top-1 -right-2.5"
                viewBox="0 0 24 24"
              >
                <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
              </svg>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight">
              {isRegistering ? 'Create Account' : 'Get Started'}
            </h2>
          </div>

          {!isRegistering ? (
            /* ================= LOGIN FORM ================= */
            <>
              {/* ERROR ALERT */}
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span className="flex-1">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Mobile Number Pill Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4.5 h-4.5 stroke-[2]" />
                  </div>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Mobile Number or Username"
                    className="w-full h-[54px] pl-12 pr-4 text-sm font-semibold text-slate-800 border border-[#e2e8f0] rounded-full focus:outline-hidden focus:ring-2 focus:ring-[#223ced] focus:border-transparent bg-[#f8fafc] focus:bg-white transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Password Pill Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4.5 h-4.5 stroke-[2]" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full h-[54px] pl-12 pr-12 text-sm font-semibold text-slate-800 border border-[#e2e8f0] rounded-full focus:outline-hidden focus:ring-2 focus:ring-[#223ced] focus:border-transparent bg-[#f8fafc] focus:bg-white transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4.5 h-4.5" />
                    ) : (
                      <Eye className="w-4.5 h-4.5" />
                    )}
                  </button>
                </div>

                {/* Submit Pill Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[54px] bg-[#223ced] hover:bg-blue-700 active:scale-[0.99] text-white font-black text-base rounded-full shadow-md shadow-blue-600/25 flex items-center justify-center gap-2.5 transition-all disabled:opacity-60 cursor-pointer mt-2"
                >
                  <span>{loading ? 'Verifying Account...' : 'Log In'}</span>
                  <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                </button>
              </form>

              {/* Registration Link Footer */}
              <div className="text-center pt-2">
                <span className="text-slate-600 font-semibold text-xs sm:text-sm">
                  Don't have an account?{' '}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setIsRegistering(true);
                  }}
                  className="text-[#223ced] font-black text-xs sm:text-sm hover:underline cursor-pointer"
                >
                  Create Account
                </button>
              </div>

              {/* Restore password link */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setForgotPhone(phone || '');
                    setShowForgotModal(true);
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                >
                  Forgot or need to restore password? Click here
                </button>
              </div>
            </>
          ) : (
            /* ================= WORKER REGISTRATION FORM ================= */
            <>
              {regError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span className="flex-1">{regError}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                {/* Full Name */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4.5 h-4.5 stroke-[2]" />
                  </div>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full h-[52px] pl-12 pr-4 text-sm font-semibold text-slate-800 border border-[#e2e8f0] rounded-full focus:outline-hidden focus:ring-2 focus:ring-[#223ced] focus:border-transparent bg-[#f8fafc] focus:bg-white transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Mobile Number */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4.5 h-4.5 stroke-[2]" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="Mobile Number"
                    className="w-full h-[52px] pl-12 pr-4 text-sm font-semibold text-slate-800 border border-[#e2e8f0] rounded-full focus:outline-hidden focus:ring-2 focus:ring-[#223ced] focus:border-transparent bg-[#f8fafc] focus:bg-white transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4.5 h-4.5 stroke-[2]" />
                  </div>
                  <input
                    type={regShowPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create Password (min 6 chars)"
                    className="w-full h-[52px] pl-12 pr-12 text-sm font-semibold text-slate-800 border border-[#e2e8f0] rounded-full focus:outline-hidden focus:ring-2 focus:ring-[#223ced] focus:border-transparent bg-[#f8fafc] focus:bg-white transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setRegShowPassword(!regShowPassword)}
                    className="absolute inset-y-0 right-0 pr-4.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {regShowPassword ? (
                      <EyeOff className="w-4.5 h-4.5" />
                    ) : (
                      <Eye className="w-4.5 h-4.5" />
                    )}
                  </button>
                </div>

                {/* Confirm Password */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4.5 h-4.5 stroke-[2]" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    className="w-full h-[52px] pl-12 pr-4 text-sm font-semibold text-slate-800 border border-[#e2e8f0] rounded-full focus:outline-hidden focus:ring-2 focus:ring-[#223ced] focus:border-transparent bg-[#f8fafc] focus:bg-white transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Optional Email */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4.5 h-4.5 stroke-[2]" />
                  </div>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="Email Address (Optional)"
                    className="w-full h-[52px] pl-12 pr-4 text-sm font-semibold text-slate-800 border border-[#e2e8f0] rounded-full focus:outline-hidden focus:ring-2 focus:ring-[#223ced] focus:border-transparent bg-[#f8fafc] focus:bg-white transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Submit Register Button */}
                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full h-[54px] bg-[#223ced] hover:bg-blue-700 active:scale-[0.99] text-white font-black text-base rounded-full shadow-md shadow-blue-600/25 flex items-center justify-center gap-2.5 transition-all disabled:opacity-60 cursor-pointer mt-2"
                >
                  <span>{regLoading ? 'Creating Account...' : 'Create Account'}</span>
                  <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                </button>
              </form>

              {/* Back to Login Switcher */}
              <div className="text-center pt-2">
                <span className="text-slate-600 font-semibold text-xs sm:text-sm">
                  Already have an account?{' '}
                </span>
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="text-[#223ced] font-black text-xs sm:text-sm hover:underline cursor-pointer"
                >
                  Log In
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* MANDATORY FIRST-TIME PASSWORD CHANGE MODAL */}
      {showChangeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-base font-black text-slate-900">
                Change Temporary Password
              </h2>
              <p className="text-2xs text-slate-500 font-medium">
                For security, your administrator requires you to set a personal password before continuing.
              </p>
            </div>

            {changeError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-3xs font-bold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{changeError}</span>
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-2xs font-bold text-slate-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <button
                type="submit"
                disabled={changingPassword}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all disabled:opacity-60 cursor-pointer"
              >
                {changingPassword ? 'Updating...' : 'Set Password & Continue'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* RESTORE PASSWORD MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 relative">
            <button
              type="button"
              onClick={() => {
                setShowForgotModal(false);
                setForgotSuccess(null);
                setForgotError(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-base font-black text-slate-900">
                Restore Account Password
              </h2>
              <p className="text-2xs text-slate-500 font-medium">
                Enter your registered mobile number and set your new password directly.
              </p>
            </div>

            {forgotSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex flex-col items-center text-center space-y-3">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                <span className="leading-snug">{forgotSuccess}</span>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-sm transition"
                >
                  Log In Now
                </button>
              </div>
            ) : (
              <form onSubmit={handleRestorePasswordSubmit} className="space-y-3">
                {forgotError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-3xs font-bold rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{forgotError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-2xs font-bold text-slate-700 mb-1">
                    Your Registered Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={forgotPhone}
                    onChange={(e) => setForgotPhone(e.target.value)}
                    placeholder="Enter registered mobile number"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showForgotNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full px-3 py-2 pr-9 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showForgotNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all disabled:opacity-60 cursor-pointer"
                >
                  {forgotLoading ? 'Restoring Password...' : 'Restore & Set Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
