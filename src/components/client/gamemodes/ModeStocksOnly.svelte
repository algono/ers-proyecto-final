<script lang="ts">
  import { fade } from 'svelte/transition';
  import StockChart from '../elements/StockChart.svelte';
  import type { Tweet } from '@projectTypes/tweets';

  // Props siguiendo el estándar de Svelte 5 (callback props)
  export let item: Tweet;
  export let texts: Record<string, string>;
  export let locale: string;
  export let status: string;
  export let showDramaticColor: boolean;
  export let onAnswer: (result: { isCorrect: boolean }) => void;

  let isCorrect = false;

  function guess(direction: 'higher' | 'lower') {
    isCorrect = direction === (item.stockChange >= 0 ? 'higher' : 'lower');
    onAnswer({ isCorrect });
  }
</script>

<div class="mode-wrapper" class:is-revealed={status === 'revealed'}>
  <div class="stocks-only-header" in:fade>
    <h2 class="company-name">{item.company}</h2>
    <div class="ticker">{item.stockCompany}</div>
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
        {isCorrect ? `✅ ${texts.correct}` : `❌ ${texts.wrong}`}
      </h3>
      <p>{texts.change_text} <strong>{item.stockChange}%</strong></p>

      <StockChart 
        history={item.history} 
        stockChange={item.stockChange} 
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
    gap: 1rem;
    justify-content: center;
  }
  button {
    padding: 1rem 2rem;
    font-size: 1.2rem;
    border: none;
    border-radius: 0.6rem;
    cursor: pointer;
    font-weight: bold;
    transition: transform 0.1s, background 0.2s;
  }
  button:active { transform: scale(0.95); }
  .up { background: #10b981; color: white; }
  .up:hover { background: #059669; }
  .down { background: #ef4444; color: white; }
  .down:hover { background: #dc2626; }
</style>