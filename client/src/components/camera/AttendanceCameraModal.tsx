import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Assignment, WorkLocation } from '../../types';
import {
  Camera,
  RotateCw,
  X,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Clock,
  ShieldCheck,
  Send,
  RefreshCw,
  Upload,
  AlertCircle,
} from 'lucide-react';

interface AttendanceCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'CHECK_IN' | 'CHECK_OUT';
  assignment?: Assignment | null;
  targetLocation?: WorkLocation | null;
  attendanceId?: string; // For checkout
  onSuccess: (result: any) => void;
}

export const AttendanceCameraModal: React.FC<AttendanceCameraModalProps> = ({
  isOpen,
  onClose,
  mode,
  assignment,
  targetLocation,
  attendanceId,
  onSuccess,
}) => {
  const { worker, user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Camera stream state
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  // GPS & Location state
  const [detectingGps, setDetectingGps] = useState(true);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [detectedAddress, setDetectedAddress] = useState<string>('Detecting worksite address...');
  const [verificationResult, setVerificationResult] = useState<{
    status: 'VERIFIED' | 'OUTSIDE_GEOFENCE' | 'POOR_ACCURACY';
    isWithinGeofence: boolean;
    distanceMeters: number;
    geofenceRadiusMeters: number;
    accuracyMeters: number;
    message: string;
  } | null>(null);

  // Exception form state (if outside geofence or GPS fails)
  const [showExceptionForm, setShowExceptionForm] = useState(false);
  const [exceptionReason, setExceptionReason] = useState('');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Live timestamp
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize Camera & GPS when modal opens
  useEffect(() => {
    if (isOpen) {
      startCamera();
      detectLocation();
      setShowExceptionForm(false);
      setCapturedPhoto(null);
      setSubmitError(null);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access API is not supported in this browser.');
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn('Live camera error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Please allow camera access in your browser settings, or use the file upload fallback.'
          : 'Unable to start camera feed. Please check device permissions.'
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Detect GPS Location
  const detectLocation = () => {
    setDetectingGps(true);
    setVerificationResult(null);

    if (!navigator.geolocation) {
      fallbackSiteCoordinates('Browser Geolocation is not available.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const c = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy || 10),
        };
        setCoords(c);
        verifyWithServer(c.latitude, c.longitude, c.accuracy);
      },
      (err) => {
        console.warn('Geolocation warning, checking nearest assignment coordinates:', err);
        fallbackSiteCoordinates(err.message);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
    );
  };

  const fallbackSiteCoordinates = (reason?: string) => {
    // Never substitute site coordinates as verified worker GPS.
    // Mark location unavailable so the worker can retry GPS or submit an attendance exception.
    setCoords(null);
    setDetectingGps(false);
    setDetectedAddress(reason ? `Location unavailable: ${reason}` : 'Device GPS location unavailable');
    setVerificationResult({
      status: 'POOR_ACCURACY',
      isWithinGeofence: false,
      distanceMeters: 0,
      geofenceRadiusMeters: targetLocation?.geofenceRadiusMeters || 100,
      accuracyMeters: 0,
      message: 'Location unavailable — please enable GPS or submit an exception',
    });
  };

  const verifyWithServer = async (lat: number, lon: number, acc: number) => {
    try {
      const res = await api.verifyLocation({
        latitude: lat,
        longitude: lon,
        accuracy: acc,
        locationId: targetLocation?.locationId || assignment?.locationId,
        assignmentId: assignment?.assignmentId,
      });

      setVerificationResult(res);
      setDetectedAddress(res.detectedAddress);
    } catch (e) {
      setDetectedAddress(`Coordinates: ${lat.toFixed(5)}° N, ${lon.toFixed(5)}° E`);
    } finally {
      setDetectingGps(false);
    }
  };

  // Capture Snapshot from Video
  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontal if selfie front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedPhoto(dataUrl);
    stopCamera();
  };

  // File Upload Fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCapturedPhoto(reader.result as string);
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  // Submit Verified Check-In or Check-Out
  const handleConfirmSubmit = async () => {
    if (!coords) {
      setShowExceptionForm(true);
      setSubmitError('Genuine device GPS is unavailable. Please enable location or submit an attendance exception below.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      if (mode === 'CHECK_IN') {
        const res = await api.checkIn({
          assignmentId: assignment?.assignmentId,
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          photo: capturedPhoto || undefined,
          detectedAddress,
          deviceTimestamp: new Date().toISOString(),
        });
        onSuccess(res);
        onClose();
      } else {
        const res = await api.checkOut({
          attendanceId,
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          photo: capturedPhoto || undefined,
          detectedAddress,
          deviceTimestamp: new Date().toISOString(),
        });
        onSuccess(res);
        onClose();
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit attendance verification');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Location Exception Request
  const handleSubmitException = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exceptionReason.trim()) {
      alert('Please provide a reason for the attendance location exception.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await api.submitAttendanceException({
        assignmentId: assignment?.assignmentId,
        reason: exceptionReason,
        photo: capturedPhoto || undefined,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        accuracy: coords?.accuracy,
        detectedAddress,
      });

      onSuccess(res);
      onClose();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit exception request');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isInside = verificationResult?.isWithinGeofence ?? true;
  const isPoorAccuracy = verificationResult?.status === 'POOR_ACCURACY';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white text-slate-900 rounded-t-3xl sm:rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[94dvh]">
        {/* TOP MODAL HEADER */}
        <div className="px-4 py-3.5 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                mode === 'CHECK_IN'
                  ? 'bg-[#edf2fe] text-[#106ee8]'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                {mode === 'CHECK_IN' ? 'Attendance Check-In' : 'Attendance Check-Out'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Live selfie verification · {worker?.workerId || 'WC-2026-001'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto px-4 pb-3 space-y-3">
          {/* CAMERA PREVIEW & VIEWFINDER */}
          <div className="relative bg-slate-900 rounded-2xl aspect-[4/3.6] min-h-[250px] flex items-center justify-center overflow-hidden">
            {!capturedPhoto ? (
              <>
                {cameraError ? (
                  <div className="p-6 text-center space-y-3">
                    <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                    <p className="text-xs text-slate-200">{cameraError}</p>
                    <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#106ee8] hover:bg-[#0d5ec9] text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs">
                      <Upload className="w-4 h-4" />
                      <span>Upload Live Selfie</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="user"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${
                        facingMode === 'user' ? 'scale-x-[-1]' : ''
                      }`}
                    />

                    {/* Corner bracket face alignment overlay */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="relative w-48 h-48 flex items-center justify-center">
                        <span className="absolute top-0 left-0 w-7 h-7 border-t-[3px] border-l-[3px] border-white/90 rounded-tl-xl" />
                        <span className="absolute top-0 right-0 w-7 h-7 border-t-[3px] border-r-[3px] border-white/90 rounded-tr-xl" />
                        <span className="absolute bottom-0 left-0 w-7 h-7 border-b-[3px] border-l-[3px] border-white/90 rounded-bl-xl" />
                        <span className="absolute bottom-0 right-0 w-7 h-7 border-b-[3px] border-r-[3px] border-white/90 rounded-br-xl" />
                        <span className="text-xs text-white font-bold drop-shadow-sm">
                          Center Face Here
                        </span>
                      </div>
                    </div>

                    {/* Camera switch toggle button */}
                    <button
                      type="button"
                      onClick={toggleCamera}
                      className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-black/45 hover:bg-black/65 text-white backdrop-blur-xs flex items-center justify-center transition-colors"
                      title="Flip camera"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>

                    {/* Discreet photo upload fallback */}
                    <label
                      className="absolute bottom-11 left-3 w-8 h-8 rounded-xl bg-black/45 hover:bg-black/65 text-white backdrop-blur-xs flex items-center justify-center cursor-pointer transition-colors"
                      title="Upload selfie"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <input
                        type="file"
                        accept="image/*"
                        capture="user"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </>
                )}
              </>
            ) : (
              <div className="relative w-full h-full">
                <img
                  src={capturedPhoto}
                  alt="Captured Selfie"
                  className="w-full h-full object-cover"
                />
                {isInside && !isPoorAccuracy ? (
                  <span className="absolute top-3 left-3 bg-emerald-600/95 text-white px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-md">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>On-Site Verified</span>
                  </span>
                ) : (
                  <span className="absolute top-3 left-3 bg-rose-600/95 text-white px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-md">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Not Verified · Retake Needed</span>
                  </span>
                )}
              </div>
            )}

            {/* OVERLAY: LIVE TIME & ACCURACY PILL */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
              <span className="bg-black/55 backdrop-blur-xs px-3 py-1 rounded-full text-[11px] text-white font-semibold">
                {currentTime.toLocaleTimeString()} · {worker?.name?.split(' ')[0]}
              </span>

              <span
                className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 backdrop-blur-xs ${
                  detectingGps
                    ? 'bg-amber-500/90 text-white'
                    : !coords || isPoorAccuracy
                    ? 'bg-amber-600/90 text-white'
                    : 'bg-[#15803d] text-white'
                }`}
              >
                <Radio className="w-3 h-3" />
                {detectingGps
                  ? 'Locating...'
                  : coords
                  ? `GPS ±${coords.accuracy} m`
                  : 'No GPS'}
              </span>
            </div>
          </div>

          {/* SITE & RADIUS ROW */}
          <div className="flex items-center justify-between gap-3 pt-0.5">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#edf2fe] text-[#106ee8] flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {targetLocation?.name || assignment?.locationName || 'Worksite'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {verificationResult
                    ? `Site radius: ${verificationResult.geofenceRadiusMeters} m`
                    : detectedAddress}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={detectLocation}
              disabled={detectingGps}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors shrink-0 disabled:opacity-50"
              title="Refresh GPS"
            >
              <RefreshCw className={`w-4 h-4 ${detectingGps ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* GEOFENCE RESULT BANNER */}
          {verificationResult && (
            <div
              className={`px-3.5 py-2.5 rounded-2xl flex items-center justify-between gap-2 border ${
                verificationResult.isWithinGeofence && coords
                  ? 'bg-[#eaf7ee] border-emerald-200 text-emerald-800'
                  : 'bg-[#fff3e6] border-amber-200/80 text-[#9a3412]'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {verificationResult.isWithinGeofence && coords ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-[#b45309] shrink-0" />
                )}
                <span className="font-bold text-xs truncate">
                  {!coords
                    ? 'Location Unavailable (GPS Required)'
                    : verificationResult.status === 'POOR_ACCURACY'
                    ? 'Poor GPS Accuracy — Retry'
                    : verificationResult.isWithinGeofence
                    ? 'Inside Geofence (Verified)'
                    : `Outside Perimeter (${verificationResult.distanceMeters}m)`}
                </span>
              </div>

              {(!verificationResult.isWithinGeofence || !coords) && (
                <button
                  type="button"
                  onClick={() => setShowExceptionForm(true)}
                  className="px-3 py-1 bg-white hover:bg-amber-50 border border-amber-300 text-[#b45309] rounded-full text-[11px] font-bold transition-colors shrink-0"
                >
                  Request Exception
                </button>
              )}
            </div>
          )}

          {/* EXCEPTION REASON ACCORDION (If requested) */}
          {showExceptionForm && (
            <form
              onSubmit={handleSubmitException}
              className="p-3.5 bg-slate-50 rounded-2xl space-y-2.5 border border-slate-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  Attendance Exception Justification
                </span>
                <button
                  type="button"
                  onClick={() => setShowExceptionForm(false)}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>

              <textarea
                required
                rows={2}
                value={exceptionReason}
                onChange={(e) => setExceptionReason(e.target.value)}
                placeholder="Explain why you are off-site (e.g. client redirected to gate 4, underground basement signal loss)..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-amber-500"
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Submitting Exception...' : 'Submit Exception for Leader Review'}</span>
              </button>
            </form>
          )}

          {submitError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="px-4 pb-4 pt-1 bg-white shrink-0">
          {!capturedPhoto ? (
            <button
              type="button"
              onClick={handleCapture}
              className={`w-full min-h-[52px] text-white font-bold text-xs tracking-wide uppercase rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-98 ${
                mode === 'CHECK_IN'
                  ? 'bg-[#106ee8] hover:bg-[#0d5ec9]'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>TAKE SELFIE FOR ATTENDANCE</span>
            </button>
          ) : !isInside || isPoorAccuracy ? (
            /* ATTENDANCE NOT VERIFIED: REQUIRE RETAKE */
            <div className="space-y-2.5 w-full">
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold text-rose-700">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>ATTENDANCE NOT VERIFIED</span>
                </div>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  {verificationResult?.distanceMeters
                    ? `You are ${verificationResult.distanceMeters}m outside the designated site perimeter (${verificationResult.geofenceRadiusMeters}m radius).`
                    : 'GPS coordinates could not be verified on-site.'}
                  {' '}Please move inside the worksite and retake your selfie.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="flex-1 min-h-[48px] bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-98"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>RETAKE PHOTO</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowExceptionForm(true)}
                  className="px-3.5 min-h-[48px] bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-2xl border border-slate-200 transition-colors"
                >
                  Request Exception
                </button>
              </div>
            </div>
          ) : (
            /* ATTENDANCE VERIFIED: PROCEED */
            <div className="flex items-center gap-2.5 w-full">
              <button
                type="button"
                onClick={handleRetake}
                disabled={submitting}
                className="min-h-[50px] px-5 py-3 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 font-bold text-xs rounded-2xl transition-colors border border-slate-200"
              >
                Retake
              </button>

              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={submitting}
                className={`flex-1 min-h-[50px] text-white font-bold text-xs tracking-wide uppercase rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-98 ${
                  mode === 'CHECK_IN'
                    ? 'bg-[#106ee8] hover:bg-[#0d5ec9]'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                } disabled:opacity-50`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {submitting
                    ? 'Submitting...'
                    : mode === 'CHECK_IN'
                    ? 'CONFIRM CHECK IN'
                    : 'CONFIRM CHECK OUT'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
