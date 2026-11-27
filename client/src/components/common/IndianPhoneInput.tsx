import React from 'react';
import { Phone } from 'lucide-react';
import { extractIndianDigits, toIndianPhoneValue } from '../../utils/phone';

interface IndianPhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  variant?: 'pill' | 'rounded' | 'compact';
  showIcon?: boolean;
  className?: string;
}

/**
 * Locked Indian (+91) mobile input where +91 is fixed and cannot be deleted.
 * Emits "+91 XXXXXXXXXX" (or "" when empty) to keep state & API payloads uniform.
 */
export const IndianPhoneInput: React.FC<IndianPhoneInputProps> = ({
  value,
  onChange,
  required = false,
  placeholder = '9876543210',
  variant = 'rounded',
  showIcon = false,
  className = '',
}) => {
  const digits = extractIndianDigits(value);

  const wrapperStyles =
    variant === 'pill'
      ? 'h-[52px] rounded-full bg-[#f8fafc] border border-[#e2e8f0] focus-within:ring-2 focus-within:ring-[#223ced] focus-within:border-transparent focus-within:bg-white'
      : variant === 'compact'
      ? 'rounded-xl bg-white border border-slate-200 focus-within:ring-2 focus-within:ring-blue-600'
      : 'rounded-lg bg-white border border-slate-300 focus-within:ring-2 focus-within:ring-blue-600';

  const padClass = variant === 'pill' ? 'pl-4 pr-4' : 'pl-2.5 pr-3 py-2';

  return (
    <div className={`flex items-center overflow-hidden transition-all ${wrapperStyles} ${padClass} ${className}`}>
      <div className="flex items-center gap-1.5 shrink-0 select-none pr-2.5 mr-2.5 border-r border-slate-200">
        {showIcon && <Phone className="w-4 h-4 text-slate-400 stroke-[2]" />}
        <span className="text-xs font-extrabold text-slate-700 tracking-tight">+91</span>
      </div>
      <input
        type="tel"
        inputMode="numeric"
        maxLength={10}
        minLength={required ? 10 : undefined}
        pattern={required ? '[0-9]{10}' : undefined}
        title="Enter 10-digit Indian mobile number"
        required={required}
        value={digits}
        onChange={(e) => {
          const nextDigits = extractIndianDigits(e.target.value);
          onChange(toIndianPhoneValue(nextDigits));
        }}
        placeholder={placeholder}
        className="w-full min-w-0 bg-transparent text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
      />
    </div>
  );
};
