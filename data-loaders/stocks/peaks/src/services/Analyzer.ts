import type { DailyBar, DailyReturn, PriceSpike, TickerAnalysis, CeoEntry } from "../types/index";

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function stdDev(values: number[], avg: number): number {
  if (values.length < 2) return 0;
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function zScore(value: number, avg: number, std: number): number {
  if (std === 0) return 0;
  return (value - avg) / std;
}

export class Analyzer {
  private readonly zScoreThreshold: number;
  private readonly absChangeThreshold: number;

  constructor(zScoreThreshold: number, absChangeThreshold: number) {
    this.zScoreThreshold = zScoreThreshold;
    this.absChangeThreshold = absChangeThreshold;
  }

  private computeReturns(bars: DailyBar[]): DailyReturn[] {
    const returns: DailyReturn[] = [];
    for (let i = 1; i < bars.length; i++) {
      const prevClose = bars[i - 1].close;
      const close     = bars[i].close;
      if (prevClose === 0) continue;
      returns.push({
        date: bars[i].date,
        close,
        prevClose,
        returnPct: ((close - prevClose) / prevClose) * 100,
      });
    }
    return returns;
  }

  analyze(entry: CeoEntry, bars: DailyBar[]): TickerAnalysis {
    const base = {
      company:            entry.company,
      ticker:             entry.ticker,
      ceo:                entry.ceo,
      twitter_handle:     entry.twitter_handle,
      zScoreThreshold:    this.zScoreThreshold,
      absChangeThreshold: this.absChangeThreshold,
    };

    if (bars.length < 30) {
      return {
        ...base,
        periodStart:     bars[0]?.date ?? "N/A",
        periodEnd:       bars[bars.length - 1]?.date ?? "N/A",
        totalTradingDays: bars.length,
        meanReturnPct:   0,
        stdDevPct:       0,
        totalSpikes:     0,
        spikesUp:        0,
        spikesDown:      0,
        peaks:           [],
        error: `Datos insuficientes: solo ${bars.length} dias (minimo 30)`,
      };
    }

    const returns = this.computeReturns(bars);
    const values  = returns.map((r) => r.returnPct);
    const avg     = mean(values);
    const std     = stdDev(values, avg);

    const peaks: PriceSpike[] = returns
      .map((r) => ({ r, z: zScore(r.returnPct, avg, std) }))
      .filter(({ r, z }) =>
        Math.abs(z) > this.zScoreThreshold ||
        Math.abs(r.returnPct) > this.absChangeThreshold
      )
      .map(({ r, z }): PriceSpike => ({
        date:      r.date,
        direction: r.returnPct >= 0 ? "UP" : "DOWN",
        changePct: parseFloat(r.returnPct.toFixed(4)),
        zScore:    parseFloat(z.toFixed(4)),
        close:     parseFloat(r.close.toFixed(4)),
        prevClose: parseFloat(r.prevClose.toFixed(4)),
      }))
      .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));

    return {
      ...base,
      periodStart:      bars[0].date,
      periodEnd:        bars[bars.length - 1].date,
      totalTradingDays: returns.length,
      meanReturnPct:    parseFloat(avg.toFixed(6)),
      stdDevPct:        parseFloat(std.toFixed(6)),
      totalSpikes:      peaks.length,
      spikesUp:         peaks.filter((p) => p.direction === "UP").length,
      spikesDown:       peaks.filter((p) => p.direction === "DOWN").length,
      peaks,
    };
  }
}