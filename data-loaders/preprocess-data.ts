import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import type { Peak, PeakData, Tweet, StockTweetLink } from '../src/types/data';

// Recreamos __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Añade esta función de ayuda arriba en tu preprocess.ts
function getClosestHistory(historyData: Peak[], targetDateStr: string, totalPoints = 5): number[] {
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

async function processData() {
  // Rutas
  const dataLoadersDir = __dirname;
  const peaksDir = path.join(dataLoadersDir, 'stocks/peaks');
  const tweetsDir = path.join(dataLoadersDir, 'tweets/database');
  // Sube un nivel desde data-loaders y entra a src/content/data
  const outputDir = path.join(__dirname, '../src/content/data');

  // Asegurarnos de que la carpeta de salida existe
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('⏳ Iniciando preprocesado de datos...');

  // 1. Leer los datos de las acciones (Peaks)
  const peaksRaw = fs.readFileSync(path.join(peaksDir, 'peaks_found.json'), 'utf-8');
  const peaksParsed = JSON.parse(peaksRaw);
  const stocks: PeakData[] = peaksParsed.results;

  const allTweets: Tweet[] = [];
  const stockTweetsLink: StockTweetLink[] = [];

  // 2. Procesar cada empresa y buscar los tweets de su CEO
  for (const stock of stocks) {
    // Quitamos el '@' y pasamos a minúsculas para buscar el archivo (ej: '@elonmusk' -> 'elonmusk.json')
    const handle = stock.twitter_handle.replace('@', '').toLowerCase();
    const tweetFilePath = path.join(tweetsDir, `${handle}.json`);

    if (fs.existsSync(tweetFilePath)) {
      const tweetRaw = fs.readFileSync(tweetFilePath, 'utf-8');
      const tweetData = JSON.parse(tweetRaw);

      for (const tweet of tweetData.tweets as Tweet[]) {
        // Limpiamos el formato corrupto del scraper (quitamos el +00:00Z y dejamos solo la Z)
        if (tweet.created_at.includes('+00:00Z')) {
          tweet.created_at = tweet.created_at.replace('+00:00Z', 'Z');
        }

        // Añadir a la tabla general de tweets
        allTweets.push(tweet);
        
        // Añadir a la tabla enlazadora N-N + EL HISTORIAL CORTADO
        stockTweetsLink.push({
          ticker: stock.ticker,
          tweet_id: tweet.id,
          // Pasamos el historial de la empresa, la fecha del tweet, y pedimos 5 puntos
          history: getClosestHistory(stock.peaks, tweet.created_at, 5) 
        });
      }
      console.log(`✅ Añadidos ${tweetData.tweets.length} tweets de ${stock.ceo} (${stock.ticker})`);
    } else {
      console.warn(`⚠️ Aviso: No se encontró el archivo ${handle}.json para ${stock.ceo}`);
    }
  }

  // 3. Limpiar el array de stocks (opcional: podrías quitar campos que no uses)
  // ...

  // 4. Guardar los 3 archivos
  fs.writeFileSync(path.join(outputDir, 'stocks.json'), JSON.stringify(stocks, null, 2));
  fs.writeFileSync(path.join(outputDir, 'tweets.json'), JSON.stringify(allTweets, null, 2));
  fs.writeFileSync(path.join(outputDir, 'stock_tweets.json'), JSON.stringify(stockTweetsLink, null, 2));

  console.log('🚀 ¡Preprocesado completado con éxito!');
  console.log(`📊 Resumen: ${stocks.length} Empresas | ${allTweets.length} Tweets | ${stockTweetsLink.length} Enlaces`);
}

processData().catch(console.error);