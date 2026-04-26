// Interfaces para tipado estricto
export interface PeakData {
  company: string;
  ticker: string;
  ceo: string;
  twitter_handle: string;
  peaks: Peak[];
  [key: string]: any;
}

export interface Peak {
  date: string;
  direction: string; // 'UP' o 'DOWN'
  changePct: number;
  zScore: number;
  close: number;
  prevClose: number;
}

export interface Tweet {
  id: string;
  text: string;
  display_name: string; // Nombre del autor del tweet (NOTA: No tiene por qué ser el CEO! Esto pasa con Sam Altman, que es CEO de OpenAI y autor de tweets, pero su stock asociado es el de Microsoft, cuyo CEO es Satya Nadella)
  created_at: string;
  [key: string]: any;
}

export interface StockTweetLink {
  ticker: string;
  tweet_id: string;
  history: number[]; // Aquí guardamos el historial cortado de la acción alrededor de la fecha del tweet
}