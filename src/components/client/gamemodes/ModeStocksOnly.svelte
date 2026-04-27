<script lang="ts">
  import { fade } from 'svelte/transition';
  import StockChart from '../elements/StockChart.svelte';
  import type { GameItem } from '@projectTypes/gameItem';

  // Props siguiendo el estándar de Svelte 5 (callback props)
  export let item: GameItem;
  export let texts: Record<string, string>;
  export let locale: string;
  export let status: string;
  export let showDramaticColor: boolean;
  export let lastAnswerWasCorrect: boolean;
  export let onAnswer: (result: { isCorrect: boolean }) => void;

  function guess(direction: 'higher' | 'lower') {
    const isCorrect = direction === (item.stockChangePct! > 0 ? 'higher' : 'lower');
    onAnswer({ isCorrect });
  }
</script>

<div class="mode-wrapper" class:is-revealed={status === 'revealed'}>
  <div class="stocks-only-header" in:fade>
    <h2 class="company-name">{item.company}</h2>
    <div class="ticker">{item.ticker}</div>
    <p class="date">{new Date(item.date).toLocaleDateString(locale === 'en' ? 'en-GB' : locale)}</p>
  </div>

  {#if status === 'playing'}
    <div class="actions" in:fade>
      <p class="question">{texts.stocks_only_question}</p>
      <div class="buttons">
        <button class="up" on:click={() => guess('higher')}>📈 {texts.higher_button}</button>
        <button class="down" on:click={() => guess('lower')}>📉 {texts.lower_button}</button>
      </div>
    </div>
  {/if}

  {#if status === 'revealed'}
    <div class="result" in:fade>
      <h3>
        {lastAnswerWasCorrect ? `✅ ${texts.correct}` : `❌ ${texts.wrong}`}
      </h3>
      <p>{texts.change_text} <strong>{item.stockChangePct!.toFixed(2)}%</strong></p>

      <StockChart 
        history={item.history} 
        stockChange={item.stockChangePct!} 
        showDramaticColor={showDramaticColor} 
      />
    </div>
  {/if}
</div>

<style>
  .mode-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .stocks-only-header > * {
    transition: all 0.3s ease;
  }

  .company-name {
    font-size: 2rem;
    margin: 0;
    color: #f8fafc;
  }
  .ticker {
    display: inline-block;
    background: #334155;
    padding: 0.2rem 0.6rem;
    border-radius: 0.4rem;
    font-family: monospace;
    font-weight: bold;
    color: #3b82f6;
    margin: 0.5rem 0;
  }
  .date {
    font-size: 1rem;
    color: #94a3b8;
  }

  .is-revealed .company-name {
    font-size: 1.5rem;
    color: #e2e8f0;
  }

  .is-revealed .ticker {
    font-size: 0.8rem;
  }

  .is-revealed .date {
    font-size: 0.75rem;
  }

  .question {
    color: #e2e8f0;
    margin-bottom: 1.5rem;
    font-weight: 500;
  }
  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    justify-content: center;
  }
  button {
    border: none;
    border-radius: 0.6rem;
    cursor: pointer;
    font-weight: bold;
    transition: transform 0.1s, background 0.2s;

    /* MAGIA 1: Padding fluido (Arriba/Abajo | Izquierda/Derecha) */
    padding: clamp(0.6rem, 2vw, 1rem) clamp(0.8rem, 3vw, 1.5rem);
    
    /* MAGIA 2: Letra fluida (Mínimo 13px | Ideal | Máximo ~18px) */
    font-size: clamp(0.85rem, 3vw, 1.1rem);

    /* MAGIA 3: Sobrescribir el "hacha" para que solo rompa por palabras enteras */
    word-break: normal;
    overflow-wrap: break-word;
  }
  button:active { transform: scale(0.95); }
  .up { background: #10b981; color: white; }
  .up:hover { background: #059669; }
  .down { background: #ef4444; color: white; }
  .down:hover { background: #dc2626; }
</style>