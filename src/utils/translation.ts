import { getCollection } from 'astro:content';

import { locales, type Locale } from '@languages';

export function getStaticPathsFromLocales() {
		return locales.map(locale => ({ params: { locale } }));
}

// Load data once (Astro optimizes this at build time)
const i18nEntries = await getCollection('i18n');

// Fast i18n Lookup Map
// { en: { hero_title: "Welcome..." }, es: { ... } }
const i18nMap = i18nEntries.reduce((acc, entry) => {
  locales.forEach(locale => {
    if (!acc[locale]) acc[locale] = {};
    acc[locale][entry.data.id] = entry.data[locale];
  });
  return acc;
}, {} as Record<Locale, Record<string, string>>);

export function getTranslationHelperFn(locale: Locale) {
  return (key: string, ...args: Parameters<typeof formatString>[1][]) => tForLocale(locale, key, ...args);
}
export type TranslationHelper = ReturnType<typeof getTranslationHelperFn>;

export function tForLocale(locale: Locale, key: string, ...args: Parameters<typeof formatString>[1][]) : string {
  const translations = i18nMap[locale];
  if (!translations) {
    console.warn(`Missing translations for locale: ${locale}`);
    return key;
  }

  const text = translations[key];
  if (!text) {
    console.warn(`Missing translation for key: ${key}`);
    return key;
  }

  const formattedText = args.length > 0 ? formatString(text, ...args) : text;

  return formattedText;
}

export function translationsForLocaleWithPrefix(locale: Locale, prefix: string): Record<string, string> {
  const translations = i18nMap[locale];
  if (!translations) {
    console.warn(`Missing translations for locale: ${locale}`);
    return {};
  }

  const filteredEntries = Object.entries(translations)
    .filter(([key]) => key.startsWith(prefix))
    .map(([key, value]) => [key.slice(prefix.length), value] as [string, string]);
  return Object.fromEntries(filteredEntries);
}

/**
 * Simulates C# string.Format for positional arguments.
 * Usage: formatString("Hello {0}!", "World") => "Hello World!"
 */
export function formatString(template: string, ...args: (string | number)[]): string {
  return template.replace(/{(\d+)}/g, (match, number) => {
    return typeof args[+number] !== 'undefined' ? String(args[+number]) : match;
  });
}