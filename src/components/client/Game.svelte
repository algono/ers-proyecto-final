<script>
  import { fade, fly } from 'svelte/transition';
  import { onMount } from 'svelte';
  
  // Importamos los modos de juego
  import ModeClassic from './gamemodes/ModeClassic.svelte';
  import ModeGuessCEO from './gamemodes/ModeGuessCEO.svelte';
  import ModeStocksOnly from './gamemodes/ModeStocksOnly.svelte';
  import ModeWhoSaidWhat from './gamemodes/ModeWhoSaidWhat.svelte';

  // Props de Astro:
  export let locale;
  export let texts;
  export let data;
  export let gameMode = 'classic';

  // Diccionario para cargar el componente dinámicamente
  const componentsMap = {
    'classic': ModeClassic,
    'guess-ceo': ModeGuessCEO,
    'stocks-only': ModeStocksOnly,
    'who-said-what': ModeWhoSaidWhat
  };
  $: ActiveModeComponent = componentsMap[gameMode];

  // Variables de estado iniciales
  let currentIndex = 0;
  let score = 0;
  let status = 'playing'; // 'playing', 'revealed', 'gameover'
  let showDramaticColor = false; 
  let lastAnswerWasCorrect = false; 

  // --- 🔥 LA MAGIA DEL AUTOGUARDADO 🔥 ---
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

  $: currentItem = data[currentIndex];
  
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
        status = 'gameover'; // ¡Ganó el juego! (Se acabaron los datos)
      }
    } else {
      status = 'gameover'; // Falló
    }
  }

  function restart() {
    currentIndex = 0;
    score = 0;
    status = 'playing';
    showDramaticColor = false;
    lastAnswerWasCorrect = false;
    // Limpiamos el guardado
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('finance_game_state');
    }
  }
</script>

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
  {:else}
    <div class="card">
      
      <svelte:component 
        this={ActiveModeComponent}
        item={currentItem}
        data={data}
        texts={texts}
        locale={locale}
        status={status}
        showDramaticColor={showDramaticColor}
        onAnswer={handleAnswer}
      />

      {#if showDramaticColor}
        <button class="main-btn" in:fly={{ y: 10, duration: 300 }} on:click={next}>
          {lastAnswerWasCorrect ? texts.next_button : texts.results_button}
        </button>
      {/if}

    </div>
  {/if}
</div>

<style>
  /* Estilos estructurales y globales del juego */
  .game-container {
    max-width: 600px;
    margin: 0 auto;
    font-family: system-ui, sans-serif;
    text-align: center;
  }
  .card {
    background: #1e293b;
    color: white;
    padding: 2rem;
    border-radius: 1rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    min-height: 350px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  
  /* Estilos para los botones genéricos del padre (Siguiente, Volver a jugar) */
  button.main-btn {
    padding: 0.75rem 1.5rem;
    font-size: 1.1rem;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-weight: bold;
    transition: transform 0.1s;
    background: #3b82f6; 
    color: white;
    margin-top: 1.5rem;
    width: 100%;
  }
  button.main-btn:active { 
    transform: scale(0.95); 
  }
</style>