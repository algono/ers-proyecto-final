import type { Peak } from "@projectTypes/data";

export function getClosestHistory(historyData: Peak[], targetDateStr: string, totalPoints = 5): number[] {
  // Si la acción no tiene historial guardado, devolvemos array vacío
  if (!historyData || historyData.length === 0) return [];

  const targetTime = new Date(targetDateStr).getTime();

  // 1. Encontrar el índice de la fecha más cercana al tweet
  let closestIndex = 0;
  let minDiff = Infinity;

  historyData.forEach((entry, index) => {
    // Asumo que tu historial tiene formato { date: '...', close: 150.5 }
    const entryTime = new Date(entry.date).getTime();
    const diff = Math.abs(entryTime - targetTime);
    
    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = index;
    }
  });

  // 2. Calcular dónde empezamos y dónde acabamos a cortar (ej: 2 antes, 2 después)
  const half = Math.floor(totalPoints / 2);
  let startIndex = Math.max(0, closestIndex - half);
  let endIndex = startIndex + totalPoints;

  // Ajuste de seguridad por si el tweet es del primer o último día del historial
  if (endIndex > historyData.length) {
    endIndex = historyData.length;
    startIndex = Math.max(0, endIndex - totalPoints);
  }

  // 3. Cortamos el pedazo y extraemos solo el precio de cierre
  const slice = historyData.slice(startIndex, endIndex);
  return slice.map(point => point.close);
}