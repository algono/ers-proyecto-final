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
      let changePct = 0;
      let direction: 'UP' | 'DOWN' = 'UP';
      const history = link.history || [];

      // Si tenemos al menos 2 puntos en el historial, calculamos el cambio real
      if (history.length >= 2) {
        const firstPrice = history[0];
        const lastPrice = history[history.length - 1];
        
        // Fórmula del porcentaje de cambio: ((Final - Inicial) / Inicial) * 100
        const rawChange = ((lastPrice - firstPrice) / firstPrice) * 100;
        
        // Lo guardamos en absoluto porque ya tenemos la dirección
        changePct = Math.abs(rawChange); 
        direction = rawChange >= 0 ? 'UP' : 'DOWN';
      } 
      // Fallback de seguridad por si justo ese día no hay historial
      else if (stock.peaks && stock.peaks.length > 0) {
        changePct = Math.abs(stock.peaks[0].changePct);
        direction = stock.peaks[0].direction as 'UP' | 'DOWN';
      }

      // 3. Montas el objeto GameItem universal
      result.push({
        id: tweet.id,
        company: stock.company,
        ticker: stock.ticker,
        ceo: stock.ceo,
        date: tweet.created_at,
        tweetText: tweet.text,
        tweetAuthorDisplayName: tweet.display_name,
        // Redondeamos a 2 decimales para que quede bonito en la UI
        stockChangePct: Number(changePct.toFixed(2)), 
        stockDirection: direction,
        history: history // Lo pasamos al frontend para dibujar la gráfica
      });
    }
  }
  
  return result;
}