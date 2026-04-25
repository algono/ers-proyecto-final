import { getCollection } from 'astro:content';

export type Tweet = {
  ceo: string;
  tweet: string;
  date: Date; // ISO date string
  company?: string; // Optional: If not provided we just use the stock company name (e.g. "TWTR" for "Twitter")
  stockCompany: string;
  stockChange: number;
  history: number[];
};

// Load tweets data once (Astro optimizes this at build time)
const tweetsEntries = await getCollection('tweets');

// Fast lookup for tweets
export const tweets: Tweet[] = tweetsEntries.map(entry => ({
  ceo: entry.data.ceo,
  tweet: entry.data.tweet,
  date: entry.data.date,
  company: entry.data.company,
  stockCompany: entry.data.stockCompany,
  stockChange: entry.data.stockChange,
  history: entry.data.history
}));