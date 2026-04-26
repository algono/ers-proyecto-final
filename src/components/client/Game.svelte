<script>
  import { fade, fly } from 'svelte/transition';
  
  // Importamos los modos de juego
  import ModeClassic from './gamemodes/ModeClassic.svelte';
  import ModeGuessCEO from './gamemodes/ModeGuessCEO.svelte';
  import ModeStocksOnly from './gamemodes/ModeStocksOnly.svelte';
  import ModeWhoSaidWhat from './gamemodes/ModeWhoSaidWhat.svelte';

  // Props de Astro:
  export let locale;
  export let texts;
  export let data;
  export let stocksImagePlaceholder;
  export let gameMode = 'classic';

  // Diccionario para cargar el componente dinámicamente
  const componentsMap = {
    'classic': ModeClassic,
    'guess-ceo': ModeGuessCEO,
    'stocks-only': ModeStocksOnly,
    'who-said-what': ModeWhoSaidWhat
  };
  $: ActiveModeComponent = componentsMap[gameMode];

  // --- 🎲 LÓGICA DE LA SEMILLA Y MEZCLA ---

  // Función de barajado Fisher-Yates determinista mediante una semilla
  function seededShuffle(array, seed) {
    let m = array.length, t, i;
    let shuffled = [...array];
    // Generador de números pseudo-aleatorios basado en la semilla
    const random = (s) => {
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

  // --- 🔥 AUTOGUARDADO 🔥 ---
  // 1. CARGAR PARTIDA AL INICIAR
  // Comprobamos window para que el Build de Astro no explote
  if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
    const savedState = sessionStorage.getItem('finance_game_state');
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

  // Barajamos los datos usando la semilla (se mantendrá igual en la sesión)
  $: shuffledData = seededShuffle(data, gameSeed);
  $: currentItem = shuffledData[currentIndex];
  
  // 2. GUARDAR PARTIDA AUTOMÁTICAMENTE
  // Svelte ejecutará esto automáticamente cada vez que cualquiera de estas variables cambie
  $: {
    // Nos aseguramos de que estamos en el navegador y no en el servidor de Astro
    if (typeof sessionStorage !== 'undefined') {
      const stateToSave = {
        currentIndex,
        score,
        status,
        lastAnswerWasCorrect
      };
      sessionStorage.setItem('finance_game_state', JSON.stringify(stateToSave));
    }
  }
  // ----------------------------------------

  // --- 🎮 FUNCIONES DE JUEGO ---

  function handleAnswer(result) {
    lastAnswerWasCorrect = result.isCorrect;
    status = 'revealed';
    
    // El efecto dramático: esperamos 1.5s (lo que tarda la línea en dibujarse)
    // para cambiar el color al verde/rojo definitivo
    setTimeout(() => {
      showDramaticColor = true;
    }, 1500);
  }

  function next() {
    if (lastAnswerWasCorrect) {
      score++;
      if (currentIndex < data.length - 1) {
        currentIndex++;
        status = 'playing';
        showDramaticColor = false;
      } else {
        gameover(); // ¡Ganó el juego! (Se acabaron los datos)
      }
    } else {
      gameover(); // Falló
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
      sessionStorage.removeItem('finance_game_state');
    }
  }
</script>

<div class="game-layout">
  <div class="image-section">
    <img 
      src={currentItem?.ceoImage || stocksImagePlaceholder} 
      alt={currentItem?.ceo || 'Stock Market'} 
      class="side-image"
    />
    <div class="image-overlay"></div>
  </div>

  <div class="game-container">
    <header>
      <h2>{texts.score}: <span>{score}</span></h2>
    </header>

    {#if status === 'gameover'}
      <div in:fade class="game-over">
        <h2>{texts.over_title}</h2>
        <p>{texts.final_score}: {score}</p>
        <button class="main-btn" on:click={restart}>{texts.play_again}</button>
      </div>
    {:else if currentItem}
      <div class="card glass">
        <button class="main-btn restart-btn" on:click={restart}>↺</button>
        <div class="card-content">
          <svelte:component 
            this={ActiveModeComponent} 
            item={currentItem} 
            data={shuffledData} 
            {texts} {locale} {status} {showDramaticColor}
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
  </div>
</div>

<style>
  /* 1. Layout principal: Dos columnas en PC, una en móvil */
  .game-layout {
    display: flex;
    max-width: 1000px; /* Más ancho para que luzcan las dos columnas */
    margin: 2rem auto;
    background: var(--color-secondary);
    border-radius: 1.5rem;
    overflow: hidden;
    border: 1px solid var(--color-tertiary);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }

  /* 2. Sección de la imagen */
  .image-section {
    flex: 1;
    position: relative;
    display: none; /* Se oculta en móviles pequeños */
    background: #000;
  }

  @media (min-width: 768px) {
    .image-section { display: block; }
  }

  .side-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.6; /* Para que no distraiga demasiado del texto */
    filter: grayscale(20%);
  }

  .image-overlay {
    position: absolute;
    inset: 0;
    /* Degradado que funde la imagen con el color de la tarjeta */
    background: linear-gradient(to right, transparent 75%, var(--color-secondary));
  }

  /* 3. Contenedor del juego */
  .game-container {
    flex: 1.2;
    padding-inline: 2rem;
    padding-block: 1rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    background: var(--color-background);
  }

  .game-over {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  /* 4. La Tarjeta con efecto GLASS */
  .card.glass {
    background: rgba(26, 26, 26, 0.6); /* Fondo semi-transparente */
    backdrop-filter: blur(12px); /* El toque mágico */
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(222, 255, 154, 0.1); /* Borde sutil con tu verde neón */
    color: var(--color-text);
    padding: 1rem;
    border-radius: 1rem;
    min-height: 400px;
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
  }

  /* 5. Botones usando tus variables globales */
  button.main-btn {
    background: var(--color-logo-primary); /* Verde Neón */
    color: var(--color-secondary); /* Texto negro para contraste */
    padding: 1rem 1.5rem;
    font-size: 1.1rem;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    transition: all 0.2s;
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

  header h2 {
    color: var(--color-semi-transparent-white);
    margin-top: 0;
    margin-bottom: 1rem;
  }

  header span {
    color: var(--color-logo-primary);
    font-size: 2.5rem;
    font-weight: 900;
  }
</style>