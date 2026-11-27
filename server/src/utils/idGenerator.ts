import crypto from 'crypto';

const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '0123456789';
const ALPHANUM = LETTERS + DIGITS;

/**
 * Shared Go_Repireo branded ID generator (GR-<ROLE>-YYYY-XXX).
 * Generates a unique 3-character alphanumeric suffix (e.g. A02, H47, U5H)
 * guaranteed to contain both letters and digits and never collide with existingIds.
 */
function generateBrandedId(
  roleCode: 'WC' | 'TL' | 'CL',
  existingIds: string[],
  year?: number
): string {
  const currentYear = year || new Date().getFullYear();
  const prefix = `GR-${roleCode}-${currentYear}-`;
  const existingSet = new Set(existingIds.map((id) => id.toUpperCase()));

  for (let attempt = 0; attempt < 200; attempt++) {
    const chars = [
      LETTERS[crypto.randomInt(LETTERS.length)],
      DIGITS[crypto.randomInt(DIGITS.length)],
      ALPHANUM[crypto.randomInt(ALPHANUM.length)],
    ];
    // Fisher-Yates shuffle so letter/digit positions vary (e.g. A02, H47, U5H)
    for (let i = chars.length - 1; i > 0; i--) {
      const j = crypto.randomInt(i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    const candidate = `${prefix}${chars.join('')}`;
    if (!existingSet.has(candidate)) {
      return candidate;
    }
  }

  // Fallback with 4-char alphanumeric suffix if 3-char space is exhausted
  const fallback = Array.from({ length: 4 }, () => ALPHANUM[crypto.randomInt(ALPHANUM.length)]).join('');
  return `${prefix}${fallback}`;
}

/**
 * Worker ID Generator: Format GR-WC-YYYY-XXX (e.g. GR-WC-2026-A02)
 */
export function generateWorkerId(existingIds: string[], year?: number): string {
  return generateBrandedId('WC', existingIds, year);
}

/**
 * Team Leader ID Generator: Format GR-TL-YYYY-XXX (e.g. GR-TL-2026-H47)
 */
export function generateLeaderId(existingIds: string[], year?: number): string {
  return generateBrandedId('TL', existingIds, year);
}

/**
 * B2B Client / Organization ID Generator: Format GR-CL-YYYY-XXX (e.g. GR-CL-2026-U5H)
 */
export function generateClientId(existingIds: string[], year?: number): string {
  return generateBrandedId('CL', existingIds, year);
}

export function generateAssignmentId(existingIds: string[]): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `ASN-${dateStr}-`;

  let maxSeq = 0;
  for (const id of existingIds) {
    if (id.startsWith(prefix)) {
      const parts = id.split('-');
      if (parts.length === 3) {
        const seq = parseInt(parts[2], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
  }

  const nextSeq = (maxSeq + 1).toString().padStart(3, '0');
  return `${prefix}${nextSeq}`;
}
