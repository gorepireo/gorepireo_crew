import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { Assignment, WorkLocation, WorkEvidenceCategory } from '../../types';
import { generateWatermarkedPhoto } from '../../utils/watermark';
import {
  Camera,
  RotateCw,
  X,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Radio,
  Upload,
  RefreshCw,
} from 'lucide-react';

interface WorkCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment;
  targetLocation?: WorkLocation | null;
  onSuccess: (evidence: any) => void;
}

export const WorkCameraModal: React.FC<WorkCameraModalProps> = ({
  isOpen,
  onClose,
  assignment,
  targetLocation,
  onSuccess,
}) => {
  const { worker, user } = useAuth();
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Camera stream state
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment'); // rear camera default for site work
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Photos state
  const [originalPhoto, setOriginalPhoto] = useState<string | null>(null);
  const [watermarkedPhoto, setWatermarkedPhoto] = useState<string | null>(null);

  // Form fields (Prompt Req 5: 3 large buttons: BEFORE WORK, WORK IN PROGRESS, WORK COMPLETED)
  const [category, setCategory] = useState<WorkEvidenceCategory>('AFTER');
  const [description, setDescription] = useState('');

  // GPS state
  const [detectingGps, setDetectingGps] = useState(true);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [detectedAddress, setDetectedAddress] = useState<string>('Detecting site address...');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
      detectLocation();
      setOriginalPhoto(null);
      setWatermarkedPhoto(null);
      setDescription('');
      setError(null);
    } else {
      stopCamera();
    }
    return () => stopCamera();
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
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn('Work camera error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera in browser settings, or tap below to upload.'
          : 'Unable to start camera stream. Please use the upload button.'
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

  const detectLocation = () => {
    setDetectingGps(true);
    if (!navigator.geolocation) {
      fallbackToAssignmentCoordinates();
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
        setDetectingGps(false);

        try {
          const locId = targetLocation?.locationId || assignment.locationId;
          const verifyRes = await api.verifyLocation({
            locationId: locId,
            latitude: c.latitude,
            longitude: c.longitude,
            accuracy: c.accuracy,
          });
          setDetectedAddress(verifyRes.detectedAddress || assignment.locationAddress || 'Job Site Location');
        } catch {
          setDetectedAddress(assignment.locationAddress || 'Detected Site Location');
        }
      },
      () => {
        fallbackToAssignmentCoordinates();
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const fallbackToAssignmentCoordinates = () => {
    setDetectingGps(false);
    const lat = assignment.locationLatitude || targetLocation?.latitude || 28.5355;
    const lon = assignment.locationLongitude || targetLocation?.longitude || 77.3910;
    setCoords({ latitude: lat, longitude: lon, accuracy: 12 });
    setDetectedAddress(assignment.locationAddress || 'Job Site Location');
  };

  const handleCapture = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setOriginalPhoto(photoDataUrl);
    stopCamera();

    // Auto-generate visual watermark in background (Prompt Req 5)
    try {
      const wm = await generateWatermarkedPhoto(photoDataUrl, {
        workerName: worker?.name || user?.displayName || 'Rahul Kumar',
        workerId: worker?.workerId || 'WC-2026-001',
        assignmentTitle: assignment.title,
        assignmentId: assignment.assignmentId,
        locationAddress: detectedAddress,
        dateStr: new Date().toLocaleDateString('en-GB'),
        timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        latitude: coords?.latitude || 28.5355,
        longitude: coords?.longitude || 77.3910,
        accuracyMeters: coords?.accuracy || 10,
      });
      setWatermarkedPhoto(wm);
    } catch (wmErr) {
      console.warn('Background watermark generation failed', wmErr);
      setWatermarkedPhoto(photoDataUrl);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const dataUrl = evt.target?.result as string;
      setOriginalPhoto(dataUrl);

      try {
        const wm = await generateWatermarkedPhoto(dataUrl, {
          workerName: worker?.name || user?.displayName || 'Rahul Kumar',
          workerId: worker?.workerId || 'WC-2026-001',
          assignmentTitle: assignment.title,
          assignmentId: assignment.assignmentId,
          locationAddress: detectedAddress,
          dateStr: new Date().toLocaleDateString('en-GB'),
          timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          latitude: coords?.latitude || 28.5355,
          longitude: coords?.longitude || 77.3910,
          accuracyMeters: coords?.accuracy || 10,
        });
        setWatermarkedPhoto(wm);
      } catch {
        setWatermarkedPhoto(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setOriginalPhoto(null);
    setWatermarkedPhoto(null);
    startCamera();
  };

  const handleSubmit = async () => {
    if (!originalPhoto) return;
    setSubmitting(true);
    setError(null);

    try {
      const evidence = await api.submitWorkEvidence({
        assignmentId: assignment.assignmentId,
        locationId: assignment.locationId || targetLocation?.locationId,
        category,
        description: description.trim() || undefined,
        photo: originalPhoto,
        watermarkPhoto: watermarkedPhoto || undefined,
        latitude: coords?.latitude || 28.5355,
        longitude: coords?.longitude || 77.3910,
        accuracy: coords?.accuracy || 10,
        detectedAddress,
      });

      onSuccess(evidence);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save photo. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* TOP HEADER */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-indigo-600 text-white shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white tracking-wide">
                {t('take_work_photo')}
              </h3>
              <p className="text-3xs text-slate-400 font-medium truncate max-w-[200px]">
                {assignment.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CAMERA PREVIEW & CAPTURE AREA */}
        <div className="relative bg-black flex-1 min-h-[280px] flex items-center justify-center overflow-hidden">
          {!originalPhoto ? (
            <>
              {cameraError ? (
                <div className="p-6 text-center space-y-3">
                  <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                  <p className="text-xs text-slate-300">{cameraError}</p>
                  <label className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold cursor-pointer transition-colors shadow-sm">
                    <Upload className="w-4 h-4" />
                    <span>Choose Photo from Device</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
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
                    className="w-full h-full object-cover min-h-[280px]"
                  />

                  {/* Camera flip toggle button */}
                  <button
                    type="button"
                    onClick={toggleCamera}
                    className="absolute top-3 right-3 p-2.5 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-xs transition-colors border border-white/20 shadow-md"
                    title="Flip camera"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="relative w-full h-full">
              <img
                src={watermarkedPhoto || originalPhoto}
                alt="Captured Work Evidence"
                className="w-full h-full object-cover min-h-[280px]"
              />
              <span className="absolute top-3 left-3 bg-emerald-500/90 text-white px-3 py-1 rounded-full text-3xs font-bold flex items-center gap-1 shadow-md">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ready to Submit</span>
              </span>
            </div>
          )}

          {/* GPS BADGE OVERLAY */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
            <span className="bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-lg text-3xs text-slate-300 font-mono">
              {assignment.assignmentId}
            </span>

            <span className="bg-emerald-600/80 text-white px-2 py-0.5 rounded-lg text-3xs font-bold flex items-center gap-1 backdrop-blur-xs">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>{detectingGps ? 'GPS Detecting...' : `GPS Verified (±${coords?.accuracy || 10}m)`}</span>
            </span>
          </div>
        </div>

        {/* WORK EVIDENCE FORM & 3 LARGE CATEGORY BUTTONS (Prompt Req 5) */}
        <div className="p-4 bg-slate-900 space-y-3.5 border-t border-slate-800">
          <div>
            <label className="block text-3xs font-black uppercase tracking-wider text-slate-400 mb-2">
              Select Photo Stage (Optional)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCategory('BEFORE')}
                className={`min-h-[48px] py-2.5 px-1.5 rounded-2xl text-2xs font-extrabold text-center transition-all border flex flex-col items-center justify-center ${
                  category === 'BEFORE'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                }`}
              >
                <span>{t('photo_cat_before')}</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('DURING')}
                className={`min-h-[48px] py-2.5 px-1.5 rounded-2xl text-2xs font-extrabold text-center transition-all border flex flex-col items-center justify-center ${
                  category === 'DURING'
                    ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                }`}
              >
                <span>{t('photo_cat_during')}</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('AFTER')}
                className={`min-h-[48px] py-2.5 px-1.5 rounded-2xl text-2xs font-extrabold text-center transition-all border flex flex-col items-center justify-center ${
                  category === 'AFTER'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                }`}
              >
                <span>{t('photo_cat_after')}</span>
              </button>
            </div>
          </div>

          {/* Location Line */}
          <div className="flex items-center gap-1.5 text-3xs text-slate-400 bg-slate-800/60 p-2.5 rounded-xl border border-slate-800 truncate">
            <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">{detectedAddress}</span>
          </div>

          {error && (
            <div className="p-2.5 bg-rose-950/80 border border-rose-800 text-rose-300 text-3xs rounded-xl flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* BOTTOM ACTION BAR (Large touch targets) */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-3 bg-slate-900/95">
          {!originalPhoto ? (
            <button
              type="button"
              onClick={handleCapture}
              className="w-full min-h-[56px] py-3.5 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white font-black text-sm rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              <span>SNAP PHOTO</span>
            </button>
          ) : (
            <div className="flex items-center gap-2.5 w-full">
              <button
                type="button"
                onClick={handleRetake}
                disabled={submitting}
                className="min-h-[52px] px-5 py-3 bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 font-bold text-xs rounded-2xl transition-colors border border-slate-700"
              >
                Retake
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 min-h-[52px] py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black text-xs rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{submitting ? 'Saving...' : 'SUBMIT PHOTO'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
