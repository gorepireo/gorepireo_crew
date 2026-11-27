/**
 * Shared Go_Repireo branded ID generator (GR-<ROLE>-YYYY-001).
 * Scans both new branded IDs and legacy IDs so sequences never collide.
 */
function generateBrandedId(
  roleCode: 'WC' | 'TL' | 'CL',
  existingIds: string[],
  legacyRegex: RegExp,
  year?: number
): string {
  const currentYear = year || new Date().getFullYear();
  const prefix = `GR-${roleCode}-${currentYear}-`;
  const brandedRegex = new RegExp(`^GR-${roleCode}-${currentYear}-(\\d+)$`);

  let maxSequence = 0;
  for (const id of existingIds) {
    const match = id.match(brandedRegex) || id.match(legacyRegex);
    if (match) {
      const seq = parseInt(match[1], 10);
      if (!isNaN(seq) && seq > maxSequence) {
        maxSequence = seq;
      }
    }
  }

  const nextSeq = (maxSequence + 1).toString().padStart(3, '0');
  return `${prefix}${nextSeq}`;
}

/**
 * Worker ID Generator: Format GR-WC-YYYY-001
 */
export function generateWorkerId(existingIds: string[], year?: number): string {
  const currentYear = year || new Date().getFullYear();
  return generateBrandedId('WC', existingIds, new RegExp(`^WC-${currentYear}-(\\d+)$`), currentYear);
}

/**
 * Team Leader ID Generator: Format GR-TL-YYYY-001
 */
export function generateLeaderId(existingIds: string[], year?: number): string {
  return generateBrandedId('TL', existingIds, /^TL-(\d+)$/, year);
}

/**
 * B2B Client / Organization ID Generator: Format GR-CL-YYYY-001
 */
export function generateClientId(existingIds: string[], year?: number): string {
  const currentYear = year || new Date().getFullYear();
  return generateBrandedId('CL', existingIds, new RegExp(`^ORG-${currentYear}-(\\d+)$`), currentYear);
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
