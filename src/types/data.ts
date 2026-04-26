// Interfaces para tipado estricto
export interface PeakData {
  company: string;
  ticker: string;
  ceo: string;
  twitter_handle: string;
  peaks: any[];
  [key: string]: any;
}

export interface Tweet {
  id: string;
  text: string;
  created_at: string;
  [key: string]: any;
}

export interface StockTweetLink {
  ticker: string;
  tweet_id: string;
}