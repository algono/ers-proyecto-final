import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import type { PeakData, Tweet, StockTweetLink } from '../src/types/data';
import { getClosestHistory } from '../src/utils/history';

// Recreamos __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para limpiar la basura de HTML del scraper de Twitter
function decodeHTMLEntities(text: string): string {
  if (!text) return text;
  
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'"
  };
  
  // Busca cualquiera de esas claves y las reemplaza por su símbolo real
  return text.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&apos;/g, match => entities[match] || match);
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
        // 1. Limpiamos el formato de fecha corrupto del scraper (quitamos el +00:00Z y dejamos solo la Z)
        if (tweet.created_at.includes('+00:00Z')) {
          tweet.created_at = tweet.created_at.replace('+00:00Z', 'Z');
        }

        // 2. Limpiamos el texto del tweet para quitar los &gt; y demás
        tweet.text = decodeHTMLEntities(tweet.text);

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