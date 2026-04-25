<script>
  import { fade, fly } from 'svelte/transition';
  import { onMount } from 'svelte';
  
  // Importamos los modos de juego
  import ModeClassic from './gamemodes/ModeClassic.svelte';
  import ModeGuessCEO from './gamemodes/ModeGuessCEO.svelte';

  // Props de Astro:
  export let locale;
  export let texts;
  export let data;
  export let gameMode = 'classic'; // Permitirá a Astro elegir el modo en el futuro

  // Diccionario para cargar el componente dinámicamente
  const componentsMap = {
    'classic': ModeClassic,
    'guess-ceo': ModeGuessCEO
  };
  $: ActiveModeComponent = componentsMap[gameMode];

  let currentIndex = 0;
  let score = 0;
  let status = 'playing'; // 'playing', 'revealed', 'gameover'
  let showDramaticColor = false; 
  let lastAnswerWasCorrect = false; // Guardamos si el hijo dijo que acertamos

  // Variable reactiva para interceptar navegación. 
  $: isGameActive = status === 'revealed' || (currentIndex > 0 && status !== 'gameover');
  $: currentItem = data[currentIndex];

  // El hijo lanza esta función cuando el usuario hace clic en un botón
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
  }

  function interceptNavigation(e) {
    // Solo intervenimos si el juego está activo (jugando o mostrando resultado)
    if (!isGameActive) return;

    // Buscamos si el clic fue en un enlace y no se abre en una nueva pestaña
    const link = e.target.closest('a');
    if (!link || link.target === '_blank') return;

    const url = new URL(link.href, window.location.origin);
    
    // ¿Es un simple salto (ancla) dentro de la misma página en la que ya estamos?
    // Ej: href="#reglas" o href="/es/juego#reglas"
    const isSamePageAnchor = url.pathname === window.location.pathname && url.hash !== '';

    // Si NO es un salto interno de la misma página, significa que va a haber recarga o cambio de ruta
    if (!isSamePageAnchor) {
      const confirmExit = window.confirm(texts.confirm_exit);
      
      // Si el usuario le da a "Cancelar", detenemos la navegación
      if (!confirmExit) {
        e.preventDefault(); // Abortamos el clic
      }
    }
  }

  // Activamos el "vigilante" al cargar el componente y lo quitamos al salir
  onMount(() => {
    // Esto SOLO ocurre en el navegador del usuario
    document.addEventListener('click', interceptNavigation);

    // Svelte ejecutará esta función que devolvemos justo cuando el componente se desmonte
    return () => {
      document.removeEventListener('click', interceptNavigation);
    };
  });
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