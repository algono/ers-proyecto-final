export const PROJECT_NAME = 'The CEO Effect';
export const PROJECT_SUBTITLE = '';

/**
 * This is the same as {@link PROJECT_NAME} but with spaces for screen readers to read it correctly
 */
export const PROJECT_NAME_FOR_SCREEN_READERS = 'The C E O Effect';

export const COPYRIGHT_YEARS = '2026'; // Update with the actual year(s) of the project

// 1. La lista maestra en formato Array (el "as const" la hace inmutable)
export const VALID_GAME_MODES = ['classic', 'guess-ceo', 'stocks-only', 'who-said-what'] as const;

// 2. Extraemos el tipo automáticamente del Array.
// Esto genera: type GameMode = 'classic' | 'guess-ceo' | 'stocks-only' | 'who-said-what'
export type GameMode = typeof VALID_GAME_MODES[number];