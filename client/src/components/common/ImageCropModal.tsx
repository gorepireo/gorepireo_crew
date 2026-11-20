import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Check,
  Move,
  Loader2,
  Trash2,
  Sparkles,
} from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onConfirm: (croppedBase64: string) => Promise<void> | void;
  title?: string;
}

const VIEWPORT_SIZE = 280; // Size of the interactive circular canvas in px
const EXPORT_SIZE = 400;   // High-res output size for storage and avatars

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onConfirm,
  title = 'Adjust Profile Picture',
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);

  // Load image when imageSrc changes
  useEffect(() => {
    if (!isOpen || !imageSrc) {
      setImageLoaded(false);
      imageElementRef.current = null;
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageElementRef.current = img;
      setImageLoaded(true);
      // Reset position and zoom on new image
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [isOpen, imageSrc]);

  // Real-time canvas drawing function
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageElementRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear entire viewport
    ctx.clearRect(0, 0, VIEWPORT_SIZE, VIEWPORT_SIZE);

    // Fill clean white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, VIEWPORT_SIZE, VIEWPORT_SIZE);

    ctx.save();

    // Move to center of canvas + apply user drag
    ctx.translate(VIEWPORT_SIZE / 2 + pan.x, VIEWPORT_SIZE / 2 + pan.y);

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Swap dimensions when rotated 90 or 270 degrees
    const isSideways = rotation % 180 !== 0;
    const effWidth = isSideways ? img.naturalHeight : img.naturalWidth;
    const effHeight = isSideways ? img.naturalWidth : img.naturalHeight;

    // Scale so the image naturally covers the circular viewport
    const baseScale = Math.max(
      VIEWPORT_SIZE / effWidth,
      VIEWPORT_SIZE / effHeight
    );
    const finalScale = baseScale * zoom;
    ctx.scale(finalScale, finalScale);

    // Draw image centered at origin
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

    ctx.restore();
  }, [zoom, rotation, pan]);

  // Trigger render whenever zoom, rotation, pan, or image changes
  useEffect(() => {
    if (imageLoaded) {
      renderCanvas();
    }
  }, [imageLoaded, renderCanvas]);

  if (!isOpen || !imageSrc) return null;

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch drag handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  // High-res pixel-exact export matching the canvas viewport
  const handleConfirm = async () => {
    const img = imageElementRef.current;
    if (!img) return;

    try {
      setSubmitting(true);

      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = EXPORT_SIZE;
      exportCanvas.height = EXPORT_SIZE;
      const expCtx = exportCanvas.getContext('2d');
      if (!expCtx) return;

      // Solid white background
      expCtx.fillStyle = '#ffffff';
      expCtx.fillRect(0, 0, EXPORT_SIZE, EXPORT_SIZE);

      const scaleRatio = EXPORT_SIZE / VIEWPORT_SIZE;
      const isSideways = rotation % 180 !== 0;
      const effWidth = isSideways ? img.naturalHeight : img.naturalWidth;
      const effHeight = isSideways ? img.naturalWidth : img.naturalHeight;

      expCtx.save();
      // Translate to export center with scaled user pan
      expCtx.translate(
        EXPORT_SIZE / 2 + pan.x * scaleRatio,
        EXPORT_SIZE / 2 + pan.y * scaleRatio
      );

      // Rotation
      expCtx.rotate((rotation * Math.PI) / 180);

      // Scale
      const baseScale = Math.max(
        VIEWPORT_SIZE / effWidth,
        VIEWPORT_SIZE / effHeight
      );
      const finalExportScale = baseScale * zoom * scaleRatio;
      expCtx.scale(finalExportScale, finalExportScale);

      // Draw image exactly centered
      expCtx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      expCtx.restore();

      const croppedBase64 = exportCanvas.toDataURL('image/jpeg', 0.92);
      await onConfirm(croppedBase64);
      onClose();
    } catch (err) {
      console.error('Failed to export and confirm cropped image', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-sm rounded-[32px] p-5 shadow-2xl border border-slate-100 flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight leading-tight">
              {title}
            </h2>
            <p className="text-2xs text-slate-500 font-medium">
              Drag to position, zoom or rotate to frame your photo
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Interactive Circular Canvas Viewport */}
        <div className="flex flex-col items-center">
          <div className="relative w-[280px] h-[280px] rounded-full overflow-hidden border-4 border-blue-600 shadow-xl bg-slate-900 select-none touch-none cursor-grab active:cursor-grabbing flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={VIEWPORT_SIZE}
              height={VIEWPORT_SIZE}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="w-full h-full block"
            />

            {/* Subtle center guide */}
            <div className="absolute inset-0 rounded-full border border-white/20 pointer-events-none" />
            {!isDragging && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <Move className="w-8 h-8 text-white" />
              </div>
            )}
          </div>

          <span className="text-4xs text-slate-400 font-bold uppercase tracking-wider mt-2 flex items-center gap-1">
            <Move className="w-3 h-3 text-slate-400" />
            Drag on photo to center face
          </span>
        </div>

        {/* Controls: Zoom & Rotate */}
        <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
          {/* Zoom Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-2xs font-extrabold text-slate-700 flex items-center gap-1">
                <ZoomIn className="w-3.5 h-3.5 text-blue-600" />
                Zoom Level
              </span>
              <span className="text-3xs font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                {zoom.toFixed(1)}x
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(1, +(z - 0.2).toFixed(1)))}
                className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-100"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, +(z + 0.2).toFixed(1)))}
                className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-100"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Rotate & Reset Buttons */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-200/70">
            <button
              type="button"
              onClick={handleRotate}
              className="py-1.5 px-3 rounded-xl bg-white border border-slate-200 text-slate-700 text-2xs font-bold hover:bg-slate-100 flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5 text-blue-600" />
              <span>Rotate 90° ({rotation}°)</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="py-1.5 px-3 rounded-xl bg-white border border-slate-200 text-slate-500 text-2xs font-semibold hover:bg-slate-100 shadow-2xs cursor-pointer"
            >
              Reset Framing
            </button>
          </div>
        </div>

        {/* Deletion & Overwrite Notice */}
        <div className="p-2.5 bg-amber-50/80 border border-amber-200/70 rounded-xl text-3xs text-amber-900 leading-snug flex items-start gap-1.5">
          <Trash2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Previous photo deletion:</strong> Confirming will permanently delete your previous profile image file and store this cropped photo instead.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 min-h-[44px] py-2.5 px-4 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 font-bold text-xs rounded-2xl transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || !imageLoaded}
            className="flex-1 min-h-[44px] py-2.5 px-4 bg-[#1752d5] hover:bg-blue-700 active:scale-98 text-white font-black text-xs rounded-2xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Confirm & Replace</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
