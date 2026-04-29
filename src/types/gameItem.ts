// Esta es la interfaz comodín. Contiene todo lo posible.
export interface GameItem {
  id: string; // Un ID único (puede ser el ID del tweet o ticker+fecha)
  
  // --- Info de la Empresa / CEO ---
  company: string;
  ticker: string;
  ceo: string;
  
  // --- Info del Evento ---
  date: string; // Mejor usar string ISO (ej: '2025-04-09') para evitar fallos de serialización
  
  // --- Datos de Bolsa (Opcionales si es modo Who Said What) ---
  stockChangePct?: number; // Ej: 14.75
  stockDirection?: 'UP' | 'DOWN';
  history?: number[]; // Array de precios de la acción alrededor de la fecha del tweet (ej: [-0.5, 0, +1.2, +3.4, +2.1])
  
  // --- Datos de Twitter (Opcionales si es modo Stocks Only) ---
  tweetText?: string;
  tweetAuthorDisplayName?: string; // Nombre del autor del tweet (NOTA: No tiene por qué ser el CEO! Esto pasa con Sam Altman, que es CEO de OpenAI y autor de tweets, pero su stock asociado es el de Microsoft, cuyo CEO es Satya Nadella)
  
  // --- Extra para modos de adivinar ---
  options?: string[]; // Ej: ['Elon Musk', 'Sam Altman', 'Tim Cook'] para el modo Guess CEO
  // Nuevo campo para el modo Who Said What (Matching de 2 tweets)
  matchData?: GameItem[];
}