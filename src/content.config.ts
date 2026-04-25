import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { file } from 'astro/loaders';
import { parse as parseCsv } from 'csv-parse/sync';

// 1. Import the supported languages and their types
// from a single source of truth
import { locales } from './languages';
import type { Locale } from './languages';

// 2. Dynamically create the shape for the translations
// We want: { en: z.string(), es: z.string(), ... }
const langFields = locales.reduce((acc, locale) => {
  acc[locale] = z.string();
  return acc;
}, {} as Record<Locale, z.ZodString>);

const i18n = defineCollection({
  // Load the CSV and parse it into rows
  loader: file("src/content/translations.csv", {
    parser: (text) => parseCsv(text, { 
      columns: true, // Use the header row for keys
      skip_empty_lines: true,
      trim: true,
    }),
  }),
  schema: z.object({
    id: z.string(),
    ...langFields, // Spread the dynamic language fields into the schema
  }).strict(), // Ensure no extra fields are present
});

// 3. Define the tweets collection
const tweets = defineCollection({
  loader: file("src/content/tweets.json"),
  schema: z.object({
    id: z.number(),
    ceo: z.string(),
    tweet: z.string(),
    date: z.coerce.date(), // ISO date string, converted to Date object by Zod
    company: z.string().optional(),
    stockCompany: z.string(),
    stockChange: z.number(),
    history: z.array(z.number()),
  }).strict(),
});

export const collections = { i18n, tweets };