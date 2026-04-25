<script>
  import { fade } from 'svelte/transition';
  import StockChart from '../elements/StockChart.svelte';

  export let item;
  export let texts;
  export let locale;
  export let status;
  export let showDramaticColor;
  
  // 1. ¡Nueva Prop! Recibimos la función del padre directamente
  export let onAnswer; 

  let isCorrect = false;

  function guess(direction) {
    isCorrect = direction === (item.stockChange >= 0 ? 'higher' : 'lower');
    
    // 2. Ejecutamos la función pasándole los datos directamente
    if (onAnswer) {
      onAnswer({ isCorrect });
    }
  }
</script>

<p class="ceo">{item.ceo} {texts.tweeted}:</p>
<h3 class="tweet">"{item.tweet}"</h3>
<p class="date">{new Date(item.date).toLocaleDateString(locale === 'en' ? 'en-GB' : locale)}</p>

{#if status === 'playing'}
  <div class="actions" in:fade>
    <p>{texts.what_happened}</p>
    <div class="buttons">
      <button class="up" on:click={() => guess('higher')}>📈 {texts.higher_button}</button>
      <button class="down" on:click={() => guess('lower')}>📉 {texts.lower_button}</button>
    </div>
  </div>
{/if}

{#if status === 'revealed'}
  <div class="result" in:fade>
    <h3>
      {isCorrect ? `✅ ${texts.correct}` : `❌ ${texts.wrong}`}
    </h3>
    <p>{item.company} ({item.stockCompany}) - {texts.change_text} <strong>{item.stockChange}%</strong></p>

    <StockChart 
      history={item.history} 
      stockChange={item.stockChange} 
      showDramaticColor={showDramaticColor} 
    />
  </div>
{/if}

<style>
  /* Solo los estilos que pertenecen a los elementos internos de este modo */
  .ceo {
    margin-bottom: 0.5rem;
  }
  .tweet {
    font-size: 1.5rem;
    font-style: italic;
    margin-bottom: 2rem;
  }
  .date {
    font-size: 0.9rem;
    color: #94a3b8;
    margin-bottom: 1rem;
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
</style>