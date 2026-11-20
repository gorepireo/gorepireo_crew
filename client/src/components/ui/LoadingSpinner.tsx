import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading records...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
      <span className="text-xs font-medium text-slate-600">{message}</span>
    </div>
  );
};
