<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  
  // Importamos los modos de juego
  import ModeClassic from './gamemodes/ModeClassic.svelte';
  import ModeGuessCEO from './gamemodes/ModeGuessCEO.svelte';
  import ModeStocksOnly from './gamemodes/ModeStocksOnly.svelte';
  import ModeWhoSaidWhat from './gamemodes/ModeWhoSaidWhat.svelte';

  import BackgroundChart from './elements/BackgroundChart.svelte';
  
  import type { GameItem } from '@projectTypes/gameItem';
  import type { GameMode } from '@constants';
  import type { Component } from 'svelte';

  import { formatClassic, formatGuessCEO, formatStocksOnly, formatWhoSaidWhat } from '@utils/dataMappers';

  // Props de Astro:
  export let locale: string;
  export let texts: Record<string, string>;
  export let gameMode : GameMode = 'classic';

  let data: GameItem[] = [];
  let isLoading = true; // Para mostrar un spinner mientras carga el JSON

  const saveKey = `finance_game_state_${gameMode}`; // Clave única para cada modo de juego, así no se pisan entre ellos

  onMount(async () => {
    // Vite creará "chunks" (archivos separados) para cada JSON automáticamente
    switch (gameMode) {
      case 'classic':
        // Cargamos los 3 a la vez en paralelo
        const [stocksModCl, tweetsModCl, linksModCl] = await Promise.all([
          import('../../content/data/stocks.json'),
          import('../../content/data/tweets.json'),
          import('../../content/data/stock_tweets.json')
        ]);
        data = formatClassic(stocksModCl.default, tweetsModCl.default, linksModCl.default);
        break;
      case 'guess-ceo':
        // Cargamos los 3 a la vez en paralelo
        const [stocksModGc, tweetsModGc, linksModGc] = await Promise.all([
          import('../../content/data/stocks.json'),
          import('../../content/data/tweets.json'),
          import('../../content/data/stock_tweets.json')
        ]);
        data = formatGuessCEO(stocksModGc.default, tweetsModGc.default, linksModGc.default);
        break;
      case 'stocks-only':
        // Cargamos los datos de acciones
        const stocksModSo = await import('../../content/data/stocks.json');
        data = formatStocksOnly(stocksModSo.default);
        break;
      case 'who-said-what':
        // Cargamos los 3 a la vez en paralelo
        const [stocksModWs, tweetsModWs, linksModWs] = await Promise.all([
          import('../../content/data/stocks.json'),
          import('../../content/data/tweets.json'),
          import('../../content/data/stock_tweets.json')
        ]);
        data = formatWhoSaidWhat(stocksModWs.default, tweetsModWs.default, linksModWs.default);
        break;
    }

    // --- 🔥 AUTOGUARDADO 🔥 ---
    // 1. CARGAR PARTIDA AL INICIAR
    // Comprobamos window para que el Build de Astro no explote
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      const savedState = sessionStorage.getItem(saveKey);
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          // Si hay menos datos de los que el jugador llevaba, reseteamos para evitar bugs
          if (parsed.currentIndex < data.length) {
            currentIndex = parsed.currentIndex;
            score = parsed.score;
            status = parsed.status;
            lastAnswerWasCorrect = parsed.lastAnswerWasCorrect;
            gameSeed = parsed.gameSeed || gameSeed;
            
            // Si guardó en mitad de una revelación, saltamos la espera de 1.5s
            // y le mostramos los colores directamente para que pueda pulsar Siguiente
            if (status === 'revealed') {
              showDramaticColor = true;
            }
          }
        } catch (e) {
          console.error("Error leyendo la partida guardada", e);
        }
      }
    }
    
    isLoading = false;
  });

  interface GameModeProps {
    item: GameItem;
    texts: Record<string, string>;
    locale: string;
    status: string;
    showDramaticColor: boolean;
    lastAnswerWasCorrect: boolean;
    onAnswer: (result: { isCorrect: boolean }) => void;
  }

  // Diccionario para cargar el componente dinámicamente
  const componentsMap : Record<GameMode, Component<GameModeProps>> = {
    'classic': ModeClassic,
    'guess-ceo': ModeGuessCEO,
    'stocks-only': ModeStocksOnly,
    'who-said-what': ModeWhoSaidWhat
  }; // Aseguramos que el tipo es correcto
  $: ActiveModeComponent = componentsMap[gameMode];

  // --- 🎲 LÓGICA DE LA SEMILLA Y MEZCLA ---

  // Función de barajado Fisher-Yates determinista mediante una semilla
  function seededShuffle<T>(array: T[], seed: number): T[] {
    let m: number = array.length, t: T, i: number;
    let shuffled = [...array];
    // Generador de números pseudo-aleatorios basado en la semilla
    const random = (s: number) => {
      const x = Math.sin(s) * 10000;
      return x - Math.floor(x);
    };

    while (m) {
      i = Math.floor(random(seed + m) * m--);
      t = shuffled[m];
      shuffled[m] = shuffled[i];
      shuffled[i] = t;
    }
    return shuffled;
  }

  // --- 💾 GESTIÓN DE ESTADO ---

  let currentIndex = 0;
  let score = 0;
  let status = 'playing'; // 'playing', 'revealed', 'gameover'
  let showDramaticColor = false;
  let lastAnswerWasCorrect = false;
  let gameSeed = Math.floor(Math.random() * 1000000); // Semilla por defecto

  // Barajamos los datos usando la semilla (se mantendrá igual en la sesión)
  $: shuffledData = seededShuffle(data, gameSeed);
  $: currentItem = shuffledData[currentIndex];
  
  // 2. GUARDAR PARTIDA AUTOMÁTICAMENTE
  // Svelte ejecutará esto automáticamente cada vez que cualquiera de estas variables cambie
  $: {
    // Nos aseguramos de que estamos en el navegador y no en el servidor de Astro
    // (y de que no estamos en modo loading, para evitar guardar un estado vacío al cargar)
    if (!isLoading && typeof sessionStorage !== 'undefined') {
      const stateToSave = {
        currentIndex,
        score,
        status,
        lastAnswerWasCorrect,
        gameSeed
      };
      sessionStorage.setItem(saveKey, JSON.stringify(stateToSave));
    }
  }
  // ----------------------------------------

  // --- 🎮 FUNCIONES DE JUEGO ---

  function handleAnswer(result: { isCorrect: boolean }) {
    lastAnswerWasCorrect = result.isCorrect;
    status = 'revealed';

    if (result.isCorrect) {
      score++;
    }
    
    // El efecto dramático: esperamos 1.5s (lo que tarda la línea en dibujarse)
    // para cambiar el color al verde/rojo definitivo
    setTimeout(() => {
      showDramaticColor = true;
    }, 1500);
  }

  function next() {
    if (lastAnswerWasCorrect && currentIndex < data.length - 1) {
      currentIndex++;
      status = 'playing';
      showDramaticColor = false;
    } else {
      gameover(); // Falló O ganó el juego porque se acabaron las preguntas, en ambos casos terminamos la partida
    }
  }

  function gameover() {
    // Si el jugador falla o se acaban las preguntas, terminamos el juego
    status = 'gameover';
    cleanupStorage(); // Limpiamos el guardado al acabar para que la próxima partida sea fresca
  }

  function restart() {
    currentIndex = 0;
    score = 0;
    status = 'playing';
    showDramaticColor = false;
    lastAnswerWasCorrect = false;

    // Al acabar el juego, generamos una semilla nueva para que la partida sea distinta
    gameSeed = Math.floor(Math.random() * 1000000);

    // Limpiamos el guardado para que no haya conflictos con la nueva partida
    cleanupStorage();
  }

  function cleanupStorage() {
    // Limpiamos el guardado si existe (y si no, sessionStorage no hace nada)
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(saveKey);
    }
  }
</script>

<BackgroundChart {currentIndex} />

<div class="game-layout">
  <div class="game-container">
    {#if isLoading}
      <div class="loader-container" in:fade>
        <div class="spinner"></div>
      </div>
    {:else}
      <header>
        {#if status !== 'gameover'}
          <button class="main-btn restart-btn" on:click={restart} aria-label={texts.restart_button}>↺</button>
        {/if}
        <h2>{texts.score}: <span>{score}</span></h2>
      </header>

      {#if status === 'gameover'}
        <div in:fade class="game-over">
          <h2>{texts.over_title}</h2>
          <p>{texts.final_score}: {score}</p>
          <button class="main-btn" on:click={restart}>{texts.play_again}</button>
        </div>
      {:else if currentItem}
        <div class="card">
          <div class="card-content">
            <svelte:component
              this={ActiveModeComponent}
              item={currentItem}
              {texts} {locale} {status} {showDramaticColor} {lastAnswerWasCorrect}
              onAnswer={handleAnswer}
            />

            {#if showDramaticColor}
              <button class="main-btn next-action" in:fly={{ y: 10 }} on:click={next}>
                {lastAnswerWasCorrect ? texts.next_button : texts.results_button}
              </button>
            {/if}
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  /* 1. Layout principal: Volvemos a Flex, pero centrando su contenido */
  .game-layout {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 80vh; /* Para que quede centradito en la pantalla */
    padding: 1rem;
    position: relative;
    z-index: 1; /* Para asegurarnos de que está por encima del fondo fijo */
  }

  .game-container {
    width: 100%;
    max-width: 800px; /* Ancho máximo de la tarjeta para que quede elegante */
    display: flex;
    flex-direction: column;
  }

  .game-over {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  /* 4. La Tarjeta */
  .card {
    /* 1. Fondo oscuro pero translúcido (70% opaco para que se lea el texto) */
    background: rgba(15, 15, 18, 0.7); 
    
    /* 2. El desenfoque: Alto para romper las líneas duras del fondo */
    backdrop-filter: blur(16px) saturate(120%); 
    
    /* 3. Borde de cristal (Ligeramente iluminado arriba y a la izquierda) */
    border-top: 1px solid rgba(255, 255, 255, 0.15);
    border-left: 1px solid rgba(255, 255, 255, 0.08);
    border-right: 1px solid rgba(255, 255, 255, 0.03);
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    
    /* 4. Sombra para despegarla del fondo animado */
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);

    color: var(--color-text);
    padding: 2rem;
    border-radius: 1.5rem;

    display: flex;
    flex-direction: column;
    transition: min-height 0.3s ease, height 0.3s ease;
  }

  .card-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 1rem;

    /* Obliga al texto largo (como una URL o un ticker extraño) a saltar de línea 
   en lugar de salirse de la caja y romper el móvil */
    overflow-wrap: anywhere; 
    word-break: break-word; 

    /* Si usas flexbox dentro de la tarjeta, asegúrate de que tiene esto 
      para que los elementos puedan encogerse por debajo de su contenido interno */
    min-width: 0;

    /* Crea una sombra negra durísima y pegada a las letras */
    text-shadow: 0px 2px 4px rgba(0,0,0, 0.8), 0px 0px 10px rgba(0,0,0, 0.5);
  }

  /* 5. Botones usando tus variables globales */
  button.main-btn {
    background: var(--color-logo-primary); /* Verde Neón */
    color: var(--color-secondary); /* Texto negro para contraste */
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    transition: all 0.2s;

    /* MAGIA 1: Padding fluido (Arriba/Abajo | Izquierda/Derecha) */
    padding: clamp(0.85rem, 3vw, 1.2rem) clamp(1.2rem, 4vw, 2rem);
    
    /* MAGIA 2: Letra fluida (Mínimo 16px | Ideal | Máximo ~18px) */
    font-size: clamp(1rem, 3vw, 1.15rem);

    /* MAGIA 3: Sobrescribir el "hacha" para que solo rompa por palabras enteras */
    word-break: normal;
    overflow-wrap: break-word;
  }

  button.main-btn:hover {
    filter: brightness(1.1);
    transform: translateY(-2px);
    box-shadow: 0 0 15px rgba(222, 255, 154, 0.3);
  }

  button.restart-btn {
    background: rgba(255, 255, 255, 0.1);
    color: var(--color-text);
    width: 40px;
    height: 40px;
    padding: 0;
    border-radius: 50%;
    font-size: 1.2rem;
  }

  header {
    display: grid;
    grid-template-columns: 1fr auto 1fr; /* El botón a la izquierda, el título centrado, y un espacio vacío a la derecha para centrar el título */
    margin-bottom: 1rem;
    min-height: 40px; /* Evita que el header cambie de altura cuando el botón desaparece en gameover */
    text-shadow: 0px 2px 4px rgba(0,0,0, 0.8), 0px 0px 10px rgba(0,0,0, 0.5); /* Sombra negra durísima para que el texto se lea bien sobre cualquier fondo */
  }

  header .restart-btn {
    grid-column: 1; /* Obligamos al botón a ir a la primera columna */
    justify-self: end; /* Pegado a la puntuación: */
    margin-right: 1rem; /* Un poco de aire entre el botón y el texto */
  }

  header h2 {
    grid-column: 2; /* Obligamos al texto a ir al centro absoluto */
    justify-self: center;

    color: var(--color-semi-transparent-white);
    margin-top: 0;
    margin-bottom: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5ch; /* Un pequeño espacio entre el texto y el número */
  }

  header span {
    color: var(--color-logo-primary);
    font-size: 2.5rem;
    font-weight: 900;
    margin-top: -0.3rem;
  }

  /* --- Spinner de Carga --- */
  .loader-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px; /* Misma altura que tu tarjeta glass */
    color: var(--color-semi-transparent-white);
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 2px;
  }

  .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(222, 255, 154, 0.1); /* Anillo de fondo suave */
    border-top-color: var(--color-logo-primary); /* Anillo que gira brillante */
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1.5rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>