import { getCollection } from 'astro:content';

export type Tweet = {
  ceo: string;
  tweet: string;
  stockChange: number;
  history: number[];
};

// Load tweets data once (Astro optimizes this at build time)
const tweetsEntries = await getCollection('tweets');

// Fast lookup for tweets
export const tweets: Tweet[] = tweetsEntries.map(entry => ({
  ceo: entry.data.ceo,
  tweet: entry.data.tweet,
  stockChange: entry.data.stockChange,
  history: entry.data.history
}));