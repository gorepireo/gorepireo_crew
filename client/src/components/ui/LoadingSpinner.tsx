import React from 'react';

export const LoadingSpinner: React.FC<{ message?: string; fullScreen?: boolean }> = ({
  message = 'Syncing...',
  fullScreen = false,
}) => {
  if (fullScreen) {
    return (
      <div className="relative min-h-[100dvh] flex flex-col items-center justify-center bg-[#001b5e] text-white text-center p-6 overflow-hidden">
        {/* Top-Left Electric Blue Wave */}
        <svg
          viewBox="0 0 220 220"
          preserveAspectRatio="none"
          className="absolute top-0 left-0 w-[46vw] max-w-[220px] h-[26vh] max-h-[220px] pointer-events-none"
        >
          <path d="M0,0 L190,0 C120,45 55,115 0,195 Z" fill="#002d8c" />
          <path d="M0,0 L155,0 C95,40 42,102 0,168 Z" fill="#007bff" />
        </svg>

        {/* Bottom-Right Warm Orange Wave */}
        <svg
          viewBox="0 0 320 220"
          preserveAspectRatio="none"
          className="absolute bottom-0 right-0 w-[72vw] max-w-[340px] h-[24vh] max-h-[210px] pointer-events-none"
        >
          <path d="M320,220 L55,220 C165,175 250,110 320,15 Z" fill="#002d8c" />
          <path d="M320,220 L95,220 C190,180 265,125 320,45 Z" fill="#ff8c00" />
        </svg>

        <div className="relative z-10 flex flex-col items-center">
          <img
            src="/splash-mark.png"
            alt="GoRepireo"
            className="w-[168px] max-w-[48vw] h-auto drop-shadow-[0_14px_28px_rgba(0,0,0,0.28)]"
          />
          <div className="mt-3 font-extrabold italic text-4xl leading-none tracking-tight">
            <span className="text-white">Go</span>
            <span className="text-[#ff9200]">Repireo</span>
          </div>
          <div className="mt-6 flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff9200] animate-bounce [animation-delay:-0.3s]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#4a6aa8] animate-bounce [animation-delay:-0.15s]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#4a6aa8] animate-bounce" />
          </div>
          {message && (
            <span className="mt-3 text-xs font-medium text-blue-200/80 tracking-tight">
              {message}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-10 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#001b5e] border-2 border-white shadow-lg shadow-blue-500/15 overflow-hidden flex items-center justify-center animate-pulse">
        <img src="/logo.png" alt="GoRepireo" className="w-full h-full object-cover" />
      </div>
      <div className="mt-3.5 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#ff9200] animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 rounded-full bg-[#106ee8] animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 rounded-full bg-[#106ee8] animate-bounce" />
      </div>
      {message && (
        <span className="mt-2.5 text-xs font-semibold text-slate-500 tracking-tight">{message}</span>
      )}
    </div>
  );
};
