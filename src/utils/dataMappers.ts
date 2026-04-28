import type { GameItem } from "@projectTypes/gameItem";
import type { PeakData, Tweet, StockTweetLink } from "@projectTypes/data";
import { getClosestPeakHistory } from '@utils/history';
import { seededShuffle } from '@utils/array';

// --- HELPER 1: MATEMÁTICAS DE LA BOLSA ---
// Calcula el % y la dirección. Reutilizable para Classic y Stocks Only.
function getMetricsFromHistory(history: number[]): { changePct: number; direction: 'UP' | 'DOWN' } {
  if (!history || history.length < 2) return { changePct: 0, direction: 'UP' };
  
  const firstPrice = history[0];
  const lastPrice = history[history.length - 1];
  const rawChange = ((lastPrice - firstPrice) / firstPrice) * 100;
  
  return {
    changePct: Number(rawChange.toFixed(2)), // Ahora SIN Math.abs(), mantiene el signo (-5.4)
    direction: rawChange >= 0 ? 'UP' : 'DOWN'
  };
}

// --- HELPER 2: GENERAR OPCIONES (Guess CEO) ---
function generateOptions(correctAnswer: string, allPossibleAnswers: string[]): string[] {
  const wrongAnswers = allPossibleAnswers.filter(answer => answer !== correctAnswer);
  const shuffledWrong = wrongAnswers.sort(() => 0.5 - Math.random()).slice(0, 3);
  return [...shuffledWrong, correctAnswer].sort(() => 0.5 - Math.random());
}

// ==========================================
//                 MAPPERS
// ==========================================

// --- 1. MODO CLASSIC ---
export function formatClassic(stocks: PeakData[], tweets: Tweet[], links: StockTweetLink[]): GameItem[] {
  const result: GameItem[] = [];
  
  for (const link of links) {
    const tweet = tweets.find(t => t.id === link.tweet_id);
    const stock = stocks.find(s => s.ticker === link.ticker);
    
    if (tweet && stock) {
      const history = link.history || [];
      let changePct = 0;
      let direction: 'UP' | 'DOWN' = 'UP';

      // Usamos el Helper común
      if (history.length >= 2) {
        const metrics = getMetricsFromHistory(history);
        changePct = metrics.changePct;
        direction = metrics.direction;
      } else if (stock.peaks && stock.peaks.length > 0) {
        changePct = stock.peaks[0].changePct; // Sin Math.abs
        direction = stock.peaks[0].direction as 'UP' | 'DOWN'; // Asumimos que el formato original ya tiene la dirección correcta sin necesidad de recalcularla aquí
      }

      result.push({
        id: tweet.id,
        company: stock.company,
        ticker: stock.ticker,
        ceo: stock.ceo,
        date: tweet.created_at,
        tweetText: tweet.text,
        tweetAuthorDisplayName: tweet.display_name,
        stockChangePct: changePct, 
        stockDirection: direction,
        history: history 
      });
    }
  }
  return result;
}

// --- 2. MODO STOCKS ONLY ---
export function formatStocksOnly(stocks: PeakData[]): GameItem[] {
  const result: GameItem[] = [];

  for (const stock of stocks) {
    if (!stock.peaks) continue;

    for (const peak of stock.peaks) {
      // Usamos tu helper de history, pasándole el historial de la acción y la fecha del pico
      const historySlice = getClosestPeakHistory(stock.peaks, peak.date);
      
      let changePct = peak.changePct; // Fallback
      let direction = peak.direction;

      // Usamos el Helper matemático para ser coherentes con el Classic
      if (historySlice.length >= 2) {
        const metrics = getMetricsFromHistory(historySlice);
        changePct = metrics.changePct;
        direction = metrics.direction;
      }

      result.push({
        id: `${stock.ticker}-${peak.date}`,
        company: stock.company,
        ticker: stock.ticker,
        ceo: stock.ceo,
        date: peak.date,
        stockChangePct: changePct, // Se mantiene el signo
        stockDirection: direction as 'UP' | 'DOWN',
        history: historySlice // ¡Ya tienes la gráfica para Stocks Only!
      });
    }
  }
  return result;
}

// --- 3. MODO GUESS CEO ---
export function formatGuessCEO(stocks: PeakData[], tweets: Tweet[], links: StockTweetLink[]): GameItem[] {
  const allAuthorNames = [...new Set(tweets.map(t => t.display_name))];

  // Tomamos de base el formato Classic pero con opciones de CEO
  return formatClassic(stocks, tweets, links).map(item => ({
    ...item,
    options: generateOptions(item.tweetAuthorDisplayName!, allAuthorNames)
  }));
}

// --- 4. MODO WHO SAID WHAT (Matching 2 Tweets) ---
export function formatWhoSaidWhat(stocks: PeakData[], tweets: Tweet[], links: StockTweetLink[], gameSeed: number): GameItem[] {
  const result: GameItem[] = [];

  const classicItems: GameItem[] = formatClassic(stocks, tweets, links); // Partimos de los items del Classic para tener la info de los tweets y sus stocks (sin esto no podemos mostrar la gráfica cuando revelamos la respuesta)
  
  // 1. Clonamos y barajamos todos los tweets
  const shuffled = seededShuffle(classicItems, gameSeed);

  // 2. Vamos emparejando de 2 en 2, asegurando que sean de distinto autor
  for (let i = 0; i < shuffled.length; i++) {
    const tweet1 = shuffled[i];

    // Buscamos hacia adelante un tweet que sea de un autor distinto al primero
    const tweet2Index = shuffled.findIndex((t, idx) => {
      // Solo miramos los que están después del actual para no repetir parejas
      return idx > i && t.tweetAuthorDisplayName !== tweet1.tweetAuthorDisplayName;
    });

    if (tweet2Index !== -1) {
      const tweet2 = shuffled[tweet2Index];
      
      // Lo sacamos de la lista para no volver a usar el mismo tweet en otra pareja
      shuffled.splice(tweet2Index, 1);
      
      result.push({
        id: `match-${tweet1.id}-${tweet2.id}`,
        company: 'VS', // Relleno genérico para cumplir la interfaz principal
        ticker: 'VS',
        ceo: 'VS',
        date: new Date().toISOString(),
        
        // Pasamos la info pura para que Svelte pinte las dos cajas
        matchData: [tweet1, tweet2],
        // Pasamos los 2 nombres de los autores barajados para que el jugador los asigne
        options: seededShuffle([tweet1.tweetAuthorDisplayName!, tweet2.tweetAuthorDisplayName!], gameSeed)
      });
    }
  }

  return result;
}