/**
 * Indian (+91) Mobile Number Utilities
 * Ensures all mobile numbers consistently use +91 prefix across inputs and displays.
 */

export function extractIndianDigits(raw?: string | null): string {
  if (!raw) return '';
  let digits = raw.replace(/\D/g, '');
  if (digits.length > 10 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }
  if (digits.length > 10 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 10);
}

export function toIndianPhoneValue(digits: string): string {
  const clean = extractIndianDigits(digits);
  return clean ? `+91 ${clean}` : '';
}

export function formatIndianPhone(raw?: string | null, fallback = '—'): string {
  if (!raw || !raw.trim()) return fallback;
  const digits = extractIndianDigits(raw);
  if (!digits) return raw;
  return `+91 ${digits}`;
}
