<script>
  import { fade } from 'svelte/transition';
  import StockChart from '../elements/StockChart.svelte';

  // Props recibidas desde Game.svelte (El Padre)
  export let item;
  export let data; // <- ¡Necesitamos toda la base de datos para buscar otros CEOs!
  export let texts;
  export let status;
  export let showDramaticColor;
  export let onAnswer = () => { console.warn("Falta prop onAnswer") };

  let options = [];
  let isCorrect = false;
  let selectedCEO = null;

  // MAGIA REACTIVA: Cada vez que 'item' cambia (pasamos al siguiente turno), 
  // recalculamos las opciones aleatorias.
  $: if (item && data) {
    // 1. Sacamos una lista de TODOS los CEOs únicos que existen en el JSON
    const allCEOs = [...new Set(data.map(d => d.ceo))];
    
    // 2. Quitamos al CEO correcto de esa lista
    const otherCEOs = allCEOs.filter(c => c !== item.ceo);
    
    // 3. Elegimos 2 al azar (Asumimos que tienes al menos 3 CEOs en tu base de datos)
    const random1 = otherCEOs[Math.floor(Math.random() * otherCEOs.length)];
    const remainingCEOs = otherCEOs.filter(c => c !== random1);
    const random2 = remainingCEOs[Math.floor(Math.random() * remainingCEOs.length)];

    // 4. Juntamos el correcto y los 2 falsos, y los BARAJAMOS aleatoriamente
    options = [item.ceo, random1, random2].sort(() => Math.random() - 0.5);
  }

  function guess(chosenOption) {
    selectedCEO = chosenOption;
    isCorrect = chosenOption === item.ceo;
    
    // Le avisamos al Padre
    onAnswer({ isCorrect });
  }
</script>

<h3 class="tweet">"{item.tweet}"</h3>

{#if status === 'playing'}
  <div class="actions" in:fade>
    <p class="question">{texts.who_tweeted || '¿Quién escribió este tweet?'}</p>
    
    <div class="buttons">
      {#each options as option}
        <button class="ceo-btn" on:click={() => guess(option)}>
          👤 {option}
        </button>
      {/each}
    </div>
  </div>
{/if}

{#if status === 'revealed'}
  <div class="result" in:fade>
    <h3>
      {isCorrect ? texts.correct : texts.wrong}
    </h3>
    
    <p>
      El tweet era de <strong>{item.ceo}</strong> ({item.company}). 
      Tras esto, las acciones {item.stockChange >= 0 ? 'subieron' : 'bajaron'} un <strong>{item.stockChange}%</strong>
    </p>

    <StockChart 
      history={item.history} 
      stockChange={item.stockChange} 
      showDramaticColor={showDramaticColor} 
    />
  </div>
{/if}

<style>
  .tweet {
    font-size: 1.5rem;
    font-style: italic;
    margin-bottom: 2rem;
    line-height: 1.4;
  }
  .question {
    color: #94a3b8;
    margin-bottom: 1rem;
    font-size: 1.1rem;
  }
  .buttons {
    display: flex;
    flex-direction: column; /* Ponemos los nombres en lista vertical, queda más elegante */
    gap: 0.75rem;
    margin-top: 1rem;
  }
  button.ceo-btn {
    padding: 0.85rem 1.5rem;
    font-size: 1.1rem;
    border: 2px solid #3b82f6;
    background: transparent;
    color: white;
    border-radius: 0.5rem;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.2s;
  }
  button.ceo-btn:hover {
    background: #3b82f6;
  }
  button.ceo-btn:active { 
    transform: scale(0.95); 
  }
</style>