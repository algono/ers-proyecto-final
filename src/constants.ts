export const PROJECT_NAME = 'The CEO Effect';

// --- SEO CONFIGURATION ---
export const SEO_TITLE = `${PROJECT_NAME} - Play the Market Game`;
export const SEO_DESCRIPTION = "Guess the stock market reaction to CEO tweets in this interactive game.";
/**
 * Relative path to the social preview image for social media sharing (place it in the public/ folder)
 */
export const SEO_IMAGE = 'social-preview.png';

/**
 * Theme color, set as the primary color for the website, used in the "theme-color" meta tag for the address bar color on mobile devices
 */
export const THEME_COLOR = "#DEFF9A";

/**
 * This is the same as {@link PROJECT_NAME} but with spaces for screen readers to read it correctly
 */
export const PROJECT_NAME_FOR_SCREEN_READERS = 'The C E O Effect';

export const COPYRIGHT_YEARS = '2026'; // Update with the actual year(s) of the project

export const AUTHORS = [
  { name: 'Alejandro Gómez', githubUser: 'algono' },
  { name: 'Jesús García', githubUser: 'JesusGSoriano' },
  { name: 'Adrián Lucas', githubUser: 'LordLucas15' },
]
export const GetGitHubUrl = (githubUsername: string) => `https://github.com/${githubUsername}`;
export const AUTHORS_WITH_GITHUB_URLS = AUTHORS.map(author => ({
  ...author,
  githubUrl: GetGitHubUrl(author.githubUser),
}));

// 1. La lista maestra en formato Array (el "as const" la hace inmutable)
export const VALID_GAME_MODES = ['classic', 'guess-ceo', 'stocks-only', 'who-said-what'] as const;

// 2. Extraemos el tipo automáticamente del Array.
// Esto genera: type GameMode = 'classic' | 'guess-ceo' | 'stocks-only' | 'who-said-what'
export type GameMode = typeof VALID_GAME_MODES[number];