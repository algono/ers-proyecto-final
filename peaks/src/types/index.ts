export interface CeoEntry {
  company: string;
  ticker: string;
  ceo: string;
  twitter_handle: string;
}

export interface DailyBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface DailyReturn {
  date: string;
  close: number;
  prevClose: number;
  returnPct: number;
}

export type Direction = "UP" | "DOWN";

export interface PriceSpike {
  date: string;
  direction: Direction;
  changePct: number;
  zScore: number;
  close: number;
  prevClose: number;
}

export interface TickerAnalysis {
  company: string;
  ticker: string;
  ceo: string;
  twitter_handle: string;
  periodStart: string;
  periodEnd: string;
  totalTradingDays: number;
  meanReturnPct: number;
  stdDevPct: number;
  zScoreThreshold: number;
  absChangeThreshold: number;
  totalSpikes: number;
  spikesUp: number;
  spikesDown: number;
  peaks: PriceSpike[];
  error?: string;
}

export interface AnalysisReport {
  generatedAt: string;
  config: {
    zScoreThreshold: number;
    absChangeThreshold: number;
  };
  results: TickerAnalysis[];
}