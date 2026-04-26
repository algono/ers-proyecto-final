import { getCollection } from 'astro:content';

import type { Tweet } from '@projectTypes/tweets';

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