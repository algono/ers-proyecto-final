import * as fs   from "fs";
import * as path from "path";
import { AlphaVantageService, sleep } from "./services/AlphaVantageService";
import { Analyzer } from "./services/Analyzer";
import type { CeoEntry, AnalysisReport, TickerAnalysis } from "./types/index";

const Z_SCORE_THRESHOLD    = 2.5;
const ABS_CHANGE_THRESHOLD = 4;
const DELAY_MS             = 1000;
const YEARS_OF_HISTORY     = 5;
const INPUT_FILE           = path.resolve(process.cwd(), "ceos.json");
const OUTPUT_FILE          = path.resolve(process.cwd(), "peaks_found.json");

function loadCeos(): CeoEntry[] {
  if (!fs.existsSync(INPUT_FILE)) {
    throw new Error(`No se encontro el archivo: ${INPUT_FILE}`);
  }
  const raw    = fs.readFileSync(INPUT_FILE, "utf-8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("ceos.json debe ser un array no vacio");
  }
  return parsed as CeoEntry[];
}

function saveReport(report: AnalysisReport): void {
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2), "utf-8");
}

function printSummary(results: TickerAnalysis[]): void {
  console.log("\n" + "=".repeat(62));
  console.log("  RESUMEN - CEO Stock Spike Analyzer");
  console.log("=".repeat(62));

  for (const r of results) {
    if (r.error) {
      console.log(`\nERROR  ${r.company} (${r.ticker}): ${r.error}`);
      continue;
    }
    const biggest = r.peaks[0];
    console.log(`\nOK  ${r.company} (${r.ticker}) - ${r.ceo}`);
    console.log(`    Periodo    : ${r.periodStart} -> ${r.periodEnd} (${r.totalTradingDays} dias)`);
    console.log(`    Estadistica: media=${r.meanReturnPct.toFixed(3)}%  desv=${r.stdDevPct.toFixed(3)}%`);
    console.log(`    Picos      : ${r.totalSpikes} total (subidas ${r.spikesUp} / bajadas ${r.spikesDown})`);
    if (biggest) {
      const sign = biggest.changePct > 0 ? "+" : "";
      console.log(`    Mayor pico : ${biggest.date}  ${biggest.direction}  ${sign}${biggest.changePct}%  (z=${biggest.zScore})`);
    }
  }

  console.log("\n" + "=".repeat(62));
  console.log(`\nInforme guardado en: ${OUTPUT_FILE}\n`);
}

async function main(): Promise<void> {
  console.log("CEO Stock Spike Analyzer - Yahoo Finance");
  console.log(`Z-Score: >${Z_SCORE_THRESHOLD}  |  Cambio minimo: >${ABS_CHANGE_THRESHOLD}%\n`);

  const ceos      = loadCeos();
  console.log(`${ceos.length} empresa(s) a procesar\n`);

  const service  = new AlphaVantageService();
  const analyzer = new Analyzer(Z_SCORE_THRESHOLD, ABS_CHANGE_THRESHOLD);
  const results: TickerAnalysis[] = [];

  for (let i = 0; i < ceos.length; i++) {
    const entry = ceos[i];
    console.log(`[${i + 1}/${ceos.length}] Analizando ${entry.company} (${entry.ticker})...`);

    try {
      const allBars = await service.fetchDailyBars(entry.ticker);
      const bars    = service.filterLastNYears(allBars, YEARS_OF_HISTORY);
      console.log(`    ${bars.length} dias de trading encontrados`);

      const analysis = analyzer.analyze(entry, bars);

      // Top 10 subidas: filtrar UP, ya vienen ordenados por |changePct| desc,
      // así que los primeros UP son los más grandes
      const top5Up = analysis.peaks
        .filter((p) => p.direction === "UP")
        .slice(0, 10);

      // Top 10 bajadas: filtrar DOWN y ordenar por changePct asc (más negativo primero)
      const top5Down = analysis.peaks
        .filter((p) => p.direction === "DOWN")
        .sort((a, b) => a.changePct - b.changePct)
        .slice(0, 10);

      // Unir y reordenar por fecha para que el JSON sea legible cronológicamente
      analysis.peaks      = [...top5Up, ...top5Down].sort((a, b) => a.date.localeCompare(b.date));
      analysis.totalSpikes = analysis.peaks.length;
      analysis.spikesUp   = top5Up.length;
      analysis.spikesDown = top5Down.length;

      results.push(analysis);
      console.log(`    ${analysis.spikesUp} picos al alza y ${analysis.spikesDown} picos a la baja seleccionados`);

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`    Error: ${message}`);
      results.push({
        company:            entry.company,
        ticker:             entry.ticker,
        ceo:                entry.ceo,
        twitter_handle:     entry.twitter_handle,
        periodStart:        "N/A",
        periodEnd:          "N/A",
        totalTradingDays:   0,
        meanReturnPct:      0,
        stdDevPct:          0,
        zScoreThreshold:    Z_SCORE_THRESHOLD,
        absChangeThreshold: ABS_CHANGE_THRESHOLD,
        totalSpikes:        0,
        spikesUp:           0,
        spikesDown:         0,
        peaks:              [],
        error:              message,
      });
    }

    if (i < ceos.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  const report: AnalysisReport = {
    generatedAt: new Date().toISOString(),
    config: {
      zScoreThreshold:    Z_SCORE_THRESHOLD,
      absChangeThreshold: ABS_CHANGE_THRESHOLD,
    },
    results,
  };

  saveReport(report);
  printSummary(results);
}

main().catch((err) => {
  console.error("Error fatal:", err instanceof Error ? err.message : err);
  process.exit(1);
});