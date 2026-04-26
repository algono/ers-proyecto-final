// Ya no se usa Alpha Vantage, pero dejamos el nombre de la clase para no tener que cambiar todo el código

import YahooFinance from "yahoo-finance2";
import type { DailyBar } from "../types/index";

const yahooFinance = new YahooFinance();

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export class AlphaVantageService {
  constructor() {
    console.log("Usando yahoo-finance2 como fuente de datos (sin API key)");
  }

  async fetchDailyBars(ticker: string): Promise<DailyBar[]> {
    const endDate   = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 6);

    console.log(`    Descargando ${ticker} desde Yahoo Finance...`);

    const result: any[] = await yahooFinance.historical(ticker, {
      period1:  startDate,
      period2:  endDate,
      interval: "1d",
    });

    if (!result || result.length === 0) {
      throw new Error(`No se encontraron datos para "${ticker}". Revisa el simbolo.`);
    }

    const bars: DailyBar[] = result
      .filter((row: any) =>
        row.open   != null &&
        row.high   != null &&
        row.low    != null &&
        row.close  != null &&
        row.volume != null
      )
      .map((row: any): DailyBar => ({
        date:   new Date(row.date).toISOString().slice(0, 10),
        open:   row.open,
        high:   row.high,
        low:    row.low,
        close:  row.adjclose ?? row.close,
        volume: row.volume,
      }))
      .sort((a: DailyBar, b: DailyBar) => a.date.localeCompare(b.date));

    return bars;
  }

  filterLastNYears(bars: DailyBar[], years: number): DailyBar[] {
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - years);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return bars.filter((bar) => bar.date >= cutoffStr);
  }
}