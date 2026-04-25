<script>
  import { fade } from 'svelte/transition';
  import StockChart from '../elements/StockChart.svelte';

  // Props recibidas desde Game.svelte
  export let item;
  export let data; 
  export let texts;
  export let status;
  export let showDramaticColor;
  export let onAnswer = () => { console.warn("Falta prop onAnswer") };

  let options = [];
  let isCorrect = false;
  let selectedCEO = null;

  // Cada vez que 'item' cambia (pasamos al siguiente turno), 
  // recalculamos las opciones aleatorias.
  $: if (item && data) {
    const allCEOs = [...new Set(data.map(d => d.ceo))];
    const otherCEOs = allCEOs.filter(c => c !== item.ceo);
    
    // Elegimos 2 al azar
    const randoms = otherCEOs.sort(() => Math.random() - 0.5).slice(0, 2);

    // Barajamos los 3
    options = [item.ceo, ...randoms].sort(() => Math.random() - 0.5);
    selectedCEO = null; // Reseteamos selección al cambiar de turno
  }

  function guess(chosenOption) {
    selectedCEO = chosenOption;
    isCorrect = chosenOption === item.ceo;
    onAnswer({ isCorrect });
  }
</script>

<h3 class="tweet">"{item.tweet}"</h3>

{#if status === 'playing'}
  <div class="actions" in:fade>
    <p class="question">{texts.who_tweeted}</p>
    
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
      {isCorrect ? `✅ ${texts.correct}` : `❌ ${texts.wrong}`}
    </h3>
    
    <p>
      {texts.revealed_info_by} <strong>{item.ceo}</strong> ({item.company}). 
      <br>
      {texts.revealed_info_after} 
      <strong>
        {item.stockChange >= 0 ? texts.revealed_info_up : texts.revealed_info_down}
      </strong> 
      un <strong>{item.stockChange}%</strong>
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
    margin-bottom: 1.5rem;
    line-height: 1.4;
  }
  .question {
    color: #94a3b8;
    margin-bottom: 1rem;
    font-size: 1.1rem;
    font-weight: 500;
  }
  .buttons {
    display: flex;
    flex-direction: column;
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
    transition: all 0.2s ease;
    text-align: left;
  }
  button.ceo-btn:hover {
    background: rgba(59, 130, 246, 0.1);
    border-color: #60a5fa;
  }
  button.ceo-btn:active { 
    transform: scale(0.98); 
  }
  .result p {
    margin-top: 1rem;
    line-height: 1.6;
    color: #e2e8f0;
  }
</style>