export interface WatermarkMetadata {
  workerName: string;
  workerId: string;
  assignmentTitle?: string;
  assignmentId?: string;
  locationAddress: string;
  dateStr: string;
  timeStr: string;
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  position?: 'BOTTOM' | 'TOP';
}

/**
 * Takes an image base64 data URL and metadata, renders a professional visual watermark overlay
 * via an HTML Canvas, and returns the watermarked base64 data URL.
 */
export async function generateWatermarkedPhoto(
  originalDataUrl: string,
  meta: WatermarkMetadata
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(originalDataUrl);
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original unmodified photo
      ctx.drawImage(img, 0, 0);

      const isMobileSize = canvas.width < 800;
      const baseFontSize = isMobileSize ? Math.max(14, Math.round(canvas.width / 32)) : 22;
      const padding = isMobileSize ? 16 : 24;
      const lineHeight = Math.round(baseFontSize * 1.45);

      const lines = [
        `Worker: ${meta.workerName} (${meta.workerId})`,
        meta.assignmentTitle ? `Duty: ${meta.assignmentTitle} [${meta.assignmentId || 'N/A'}]` : `Assignment: ${meta.assignmentId || 'General Duty'}`,
        `Location: ${meta.locationAddress || 'Field Site'}`,
        `Date & Time: ${meta.dateStr} at ${meta.timeStr} (IST)`,
        `GPS: ${meta.latitude.toFixed(5)}° N, ${meta.longitude.toFixed(5)}° E (±${meta.accuracyMeters || 10}m)`,
      ];

      const bannerHeight = padding * 2 + (lines.length + 1) * lineHeight;
      const position = meta.position || 'BOTTOM';
      const startY = position === 'BOTTOM' ? canvas.height - bannerHeight : 0;

      // Draw dark semi-transparent gradient banner
      const gradient = ctx.createLinearGradient(0, startY, 0, startY + bannerHeight);
      gradient.addColorStop(0, 'rgba(15, 23, 42, 0.88)');
      gradient.addColorStop(1, 'rgba(15, 23, 42, 0.95)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, startY, canvas.width, bannerHeight);

      // Accent border
      ctx.fillStyle = '#2563eb'; // WorkCrew blue
      if (position === 'BOTTOM') {
        ctx.fillRect(0, startY, canvas.width, 4);
      } else {
        ctx.fillRect(0, startY + bannerHeight - 4, canvas.width, 4);
      }

      // Draw Brand Header
      ctx.font = `bold ${Math.round(baseFontSize * 1.15)}px Inter, sans-serif`;
      ctx.fillStyle = '#60a5fa'; // Light blue
      const brandY = startY + padding + baseFontSize;
      ctx.fillText('WORKCREW  ·  EVIDENCE WATERMARK', padding, brandY);

      // Draw Metadata Lines
      ctx.font = `${baseFontSize}px Inter, sans-serif`;
      ctx.fillStyle = '#f8fafc'; // Crisp white

      lines.forEach((line, index) => {
        const lineY = brandY + (index + 1) * lineHeight;
        ctx.fillText(line, padding, lineY);
      });

      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };

    img.onerror = () => {
      resolve(originalDataUrl);
    };

    img.src = originalDataUrl;
  });
}
