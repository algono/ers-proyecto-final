import type { Peak } from "@projectTypes/data";

export function getClosestPeakHistory(peaks: Peak[], targetDateStr: string): number[] {
  if (!peaks || peaks.length === 0) return [];

  const targetTime = new Date(targetDateStr).getTime();

  let closestPeak = peaks[0];
  let minDiff = Infinity;

  // Encontramos el ÚNICO pico más cercano a la fecha del tweet
  peaks.forEach(peak => {
    const peakTime = new Date(peak.date).getTime();
    const diff = Math.abs(peakTime - targetTime);
    
    if (diff < minDiff) {
      minDiff = diff;
      closestPeak = peak;
    }
  });

  // Devolvemos solo el precio anterior y el precio final de ese pico
  return [closestPeak.prevClose, closestPeak.close];
}