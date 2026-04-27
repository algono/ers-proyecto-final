<script lang="ts">
  import { fade } from 'svelte/transition';
  import StockChart from '../elements/StockChart.svelte';
  import type { GameItem } from '@projectTypes/gameItem';

  // Props recibidas desde Game.svelte
  export let item: GameItem;
  export let texts: Record<string, string>;
  export let status: string;
  export let showDramaticColor: boolean;
  export let lastAnswerWasCorrect: boolean;
  export let onAnswer: (result: { isCorrect: boolean }) => void;

  function guess(chosenOption: string) {
    const isCorrect = chosenOption === item.tweetAuthorDisplayName;
    onAnswer({ isCorrect });
  }
</script>

<div class="mode-wrapper" class:is-revealed={status === 'revealed'}>
  <h3 class="tweet">"{item.tweetText}"</h3>

  {#if status === 'playing'}
    <div class="actions" in:fade>
      <p class="question">{texts.who_tweeted}</p>
      
      <div class="buttons">
        {#each item.options as option}
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
        {lastAnswerWasCorrect ? `✅ ${texts.correct}` : `❌ ${texts.wrong}`}
      </h3>
      
      <p>
        {texts.revealed_info_by} <strong>{item.tweetAuthorDisplayName}</strong> ({item.company}). 
        <br>
        {texts.revealed_info_after}
        <strong>
          {item.stockChangePct! >= 0 ? texts.revealed_info_up : texts.revealed_info_down}
        </strong> 
        <strong>{item.stockChangePct!.toFixed(2)}%</strong>
      </p>

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
  .tweet {
    font-size: 1.5rem;
    font-style: italic;
    margin-bottom: 1.5rem;
    line-height: 1.4;
    transition: all 0.3s ease; /* ¡Clave para que no dé un salto brusco! */
  }

  .is-revealed .tweet {
    font-size: 1.1rem; /* Encogemos el tweet */
    margin-bottom: 1rem; /* Quitamos espacio por debajo */
    opacity: 0.8; /* Lo apagamos un poco para dar foco a la gráfica */
  }

  .question {
    color: #94a3b8;
    margin-bottom: 1rem;
    font-size: 1.1rem;
    font-weight: 500;
  }
  .buttons {
    display: flex;
    flex-wrap: wrap;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 1rem;
  }
  button.ceo-btn {
    border: 2px solid #3b82f6;
    background: transparent;
    color: white;
    border-radius: 0.5rem;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.2s ease;
    text-align: left;

    /* MAGIA 1: Padding fluido (Arriba/Abajo | Izquierda/Derecha) */
    padding: clamp(0.6rem, 2vw, 1rem) clamp(0.8rem, 3vw, 1.5rem);
    
    /* MAGIA 2: Letra fluida (Mínimo 13px | Ideal | Máximo ~18px) */
    font-size: clamp(0.85rem, 3vw, 1.1rem);

    /* MAGIA 3: Sobrescribir el "hacha" para que solo rompa por palabras enteras */
    word-break: normal;
    overflow-wrap: break-word;
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