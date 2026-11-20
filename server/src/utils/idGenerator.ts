/**
 * Worker ID Generator: Format WC-YYYY-001
 * Guarantees monotonic non-reusable sequences per year.
 */
export function generateWorkerId(existingIds: string[], year?: number): string {
  const currentYear = year || new Date().getFullYear();
  const prefix = `WC-${currentYear}-`;

  let maxSequence = 0;
  for (const id of existingIds) {
    if (id.startsWith(prefix)) {
      const parts = id.split('-');
      if (parts.length === 3) {
        const seq = parseInt(parts[2], 10);
        if (!isNaN(seq) && seq > maxSequence) {
          maxSequence = seq;
        }
      }
    }
  }

  const nextSeq = (maxSequence + 1).toString().padStart(3, '0');
  return `${prefix}${nextSeq}`;
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
