// Esta es la interfaz comodín. Contiene todo lo posible.
export interface GameItem {
  id: string; // Un ID único (puede ser el ID del tweet o ticker+fecha)
  
  // --- Info de la Empresa / CEO ---
  company: string;
  ticker: string;
  ceo: string;
  ceoImage?: string; // Opcional, por si no hay foto
  
  // --- Info del Evento ---
  date: string; // Mejor usar string ISO (ej: '2025-04-09') para evitar fallos de serialización
  
  // --- Datos de Bolsa (Opcionales si es modo Who Said What) ---
  stockChangePct?: number; // Ej: 14.75
  stockDirection?: 'UP' | 'DOWN'; 
  
  // --- Datos de Twitter (Opcionales si es modo Stocks Only) ---
  tweetText?: string;
  
  // --- Extra para modos de adivinar ---
  options?: string[]; // Ej: ['Elon Musk', 'Sam Altman', 'Tim Cook'] para el modo Guess CEO
}