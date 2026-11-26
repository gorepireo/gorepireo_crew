import React from 'react';

export const LoadingSpinner: React.FC<{ message?: string; fullScreen?: boolean }> = ({
  message = 'Syncing...',
  fullScreen = false,
}) => {
  return (
    <div
      className={
        fullScreen
          ? 'min-h-[100dvh] flex flex-col items-center justify-center bg-gradient-to-b from-[#f4f7ff] via-white to-[#eaf1ff] p-6 text-center'
          : 'flex flex-col items-center justify-center p-10 text-center'
      }
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-900 border-2 border-white shadow-lg shadow-blue-500/15 overflow-hidden flex items-center justify-center animate-pulse">
        <img src="/logo.png" alt="Go_Repireo Crew" className="w-full h-full object-cover" />
      </div>
      <div className="mt-3.5 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#106ee8] animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 rounded-full bg-[#106ee8] animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 rounded-full bg-[#106ee8] animate-bounce" />
      </div>
      {message && (
        <span className="mt-2.5 text-xs font-semibold text-slate-500 tracking-tight">{message}</span>
      )}
    </div>
  );
};
