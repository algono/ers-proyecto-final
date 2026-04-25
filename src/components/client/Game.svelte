<script>
  import { draw, fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { onMount } from 'svelte';

  // Props de Astro:
  // Recibimos los textos traducidos al idioma actual desde Astro
  export let texts;
  // Recibimos los datos del JSON/Content Collections desde Astro
  export let data;

  let currentIndex = 0;
  let score = 0;
  let status = 'playing'; // 'playing', 'revealed', 'gameover'
  let guess = null; // 'higher', 'lower'
  let showDramaticColor = false; // Controla el cambio de color al final

  // Variable reactiva: ¿El usuario ha jugado algo ya?
  // Si ha pasado del primer tweet o ya ha pulsado un botón (y no ha terminado), el juego está activo.
  $: isGameActive = (currentIndex > 0 || guess !== null) && status !== 'gameover';

  $: currentItem = data[currentIndex];
  $: isCorrect = guess === (currentItem.stockChange >= 0 ? 'higher' : 'lower');

  // Lógica matemática para convertir el historial en puntos SVG
  $: points = currentItem.history.map((val, i, arr) => {
    const x = (i / (arr.length - 1)) * 100;
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    const range = max - min || 1;
    const y = 50 - (((val - min) / range) * 50); // Invertimos Y para SVG
    return `${x},${y}`;
  }).join(' L ');
  
  $: pathD = `M ${points}`;
  $: finalColor = currentItem.stockChange >= 0 ? '#10b981' : '#ef4444'; // Verde o Rojo

  function makeGuess(userGuess) {
    guess = userGuess;
    status = 'revealed';
    
    // El efecto dramático: esperamos 1.5s (lo que tarda la línea en dibujarse)
    // para cambiar el color al verde/rojo definitivo
    setTimeout(() => {
      showDramaticColor = true;
    }, 1500);
  }

  function next() {
    if (isCorrect) {
      score++;
      if (currentIndex < data.length - 1) {
        currentIndex++;
        status = 'playing';
        guess = null;
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
    guess = null;
    showDramaticColor = false;
  }

  // La función que vigila los clics en enlaces
  function interceptNavigation(e) {
    // 1. Si no hay juego activo, no molestamos
    if (!isGameActive) return;

    // 2. Buscamos si el clic fue en un enlace
    const link = e.target.closest('a');
    if (!link) return;

    // 3. Si el enlace se abre en una pestaña nueva, el juego no se pierde. ¡Le dejamos en paz!
    if (link.target === '_blank') return;

    const url = new URL(link.href, window.location.origin);
    
    // 4. ¿Es un simple salto (ancla) dentro de la misma página en la que ya estamos?
    // Ej: href="#reglas" o href="/es/juego#reglas"
    const isSamePageAnchor = url.pathname === window.location.pathname && url.hash !== '';

    // 5. Si NO es un salto interno de la misma página, significa que va a haber recarga o cambio de ruta
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

    // Svelte ejecutará esta función que devolvemos justo cuando 
    // el componente se desmonte. ¡Es nuestro onDestroy seguro!
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
      <button on:click={restart}>{texts.play_again}</button>
    </div>
  {:else}
    <div class="card">
      <p class="ceo">{currentItem.ceo} {texts.tweeted}:</p>
      <h3 class="tweet">"{currentItem.tweet}"</h3>

      {#if status === 'playing'}
        <div class="actions" in:fade>
          <p>{texts.what_happened}</p>
          <div class="buttons">
            <button class="up" on:click={() => makeGuess('higher')}>📈 {texts.higher_button}</button>
            <button class="down" on:click={() => makeGuess('lower')}>📉 {texts.lower_button}</button>
          </div>
        </div>
      {/if}

      {#if status === 'revealed'}
        <div class="result" in:fade>
          <h3>
            {isCorrect ? texts.correct : texts.wrong}
          </h3>
          <p>{texts.change_text} <strong>{currentItem.stockChange}%</strong></p>

          <div class="chart-container">
            <svg viewBox="-5 -5 110 60" preserveAspectRatio="none">
              <path 
                d={pathD} 
                fill="none" 
                stroke={showDramaticColor ? finalColor : '#64748b'} 
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
                style="transition: stroke 0.3s ease-in;"
                in:draw={{ duration: 1500, easing: quintOut }} 
              />
            </svg>
          </div>

          {#if showDramaticColor}
            <button in:fly={{ y: 10, duration: 300 }} on:click={next}>
              {isCorrect ? texts.next_button : texts.results_button}
            </button>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  /* Unos estilos básicos para que no se vea feo de base */
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
    min-height: 400px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .tweet {
    font-size: 1.5rem;
    font-style: italic;
    margin-bottom: 2rem;
  }
  .buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 1rem;
  }
  button {
    padding: 0.75rem 1.5rem;
    font-size: 1.1rem;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-weight: bold;
    transition: transform 0.1s;
  }
  button:active { transform: scale(0.95); }
  .up { background: #10b981; color: white; }
  .down { background: #ef4444; color: white; }
  
  .chart-container {
    width: 100%;
    height: 150px;
    margin: 2rem 0;
  }
  svg {
    width: 100%;
    height: 100%;
    overflow: visible;
  }
</style>