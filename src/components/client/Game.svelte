<script>
  import { draw, fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { onMount } from 'svelte';

  // Props: Astro pasará los datos del CSV/Content Collections aquí
  export let data = [
    { 
      ceo: "Elon Musk", 
      tweet: "Funding secured at $420.", 
      stockChange: 12.5, 
      // Histórico simulado para la gráfica (precios)
      history: [100, 102, 105, 103, 108, 112.5] 
    },
    { 
      ceo: "Mark Zuckerberg", 
      tweet: "Metaverse is the future.", 
      stockChange: -8.4, 
      history: [300, 290, 285, 295, 280, 275] 
    }
  ];

  let currentIndex = 0;
  let score = 0;
  let status = 'playing'; // 'playing', 'revealed', 'gameover'
  let guess = null; // 'higher', 'lower'
  let showDramaticColor = false; // Controla el cambio de color al final

  // Variable reactiva: ¿El usuario ha jugado algo ya?
  // Si ha pasado del primer tweet o ya ha pulsado un botón, el juego está activo.
  $: isGameActive = currentIndex > 0 || guess !== null;

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
    // Si no ha empezado a jugar, no molestamos
    if (!isGameActive) return;

    // Buscamos si el clic fue en un enlace (<a>) o dentro de uno
    const link = e.target.closest('a');
    if (!link) return;

    // Comprobamos si es un enlace interno (de tu propia web)
    // PERO distinta ruta (ignora enlaces con # o la misma página)
    const url = new URL(link.href, window.location.origin);
    if (url.origin === window.location.origin && url.pathname !== window.location.pathname) {
      // ¡Es un enlace interno! (Ej: cambio de idioma, ir a la home)
      const confirmExit = window.confirm(
        "Tienes una partida en curso. ¿Seguro que quieres salir? Perderás tu progreso actual."
      );
      
      // Si el usuario le da a "Cancelar", detenemos la navegación
      if (!confirmExit) {
        e.preventDefault();
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
    <h2>Puntuación: <span>{score}</span></h2>
  </header>

  {#if status === 'gameover'}
    <div in:fade class="game-over">
      <h2>¡Juego Terminado!</h2>
      <p>Puntuación final: {score}</p>
      <button on:click={restart}>Volver a jugar</button>
    </div>
  {:else}
    <div class="card">
      <p class="ceo">{currentItem.ceo} twitteó:</p>
      <h3 class="tweet">"{currentItem.tweet}"</h3>

      {#if status === 'playing'}
        <div class="actions" in:fade>
          <p>¿Qué pasó con las acciones?</p>
          <div class="buttons">
            <button class="up" on:click={() => makeGuess('higher')}>📈 Subieron</button>
            <button class="down" on:click={() => makeGuess('lower')}>📉 Bajaron</button>
          </div>
        </div>
      {/if}

      {#if status === 'revealed'}
        <div class="result" in:fade>
          <h3>
            {isCorrect ? '¡Acertaste!' : '¡Fallaste!'}
          </h3>
          <p>Las acciones cambiaron un <strong>{currentItem.stockChange}%</strong></p>

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
              {isCorrect ? 'Siguiente Tweet ➡️' : 'Ver resultados'}
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