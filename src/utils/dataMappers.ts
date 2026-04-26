import type { GameItem } from "@projectTypes/gameItem";
import type { PeakData, Tweet, StockTweetLink } from '@projectTypes/data';

export function formatClassic(stocks: PeakData[], tweets: Tweet[], links: StockTweetLink[]): GameItem[] {
  const result: GameItem[] = [];
  
  // 1. Recorres los enlaces
  for (const link of links) {
    // 2. Buscas el tweet y la acción
    const tweet = tweets.find(t => t.id === link.tweet_id);
    const stock = stocks.find(s => s.ticker === link.ticker);
    
    if (tweet && stock) {
      // 3. Montas el objeto GameItem universal
      result.push({
        id: tweet.id,
        company: stock.company,
        ticker: stock.ticker,
        ceo: stock.ceo,
        date: tweet.created_at, // O la fecha de la acción
        tweetText: tweet.text,
        stockChangePct: stock.peaks[0].changePct, // Lógica para encontrar el pico correcto
        stockDirection: stock.peaks[0].direction
      });
    }
  }
  
  return result;
}