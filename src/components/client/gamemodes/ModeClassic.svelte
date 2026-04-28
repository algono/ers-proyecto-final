<script lang="ts">
  import { fade } from 'svelte/transition';
  import StockChart from '../elements/StockChart.svelte';
  import type { GameItem } from '@projectTypes/gameItem';

  export let item: GameItem;
  export let texts: Record<string, string>;
  export let locale: string;
  export let status: string;
  export let lastAnswerWasCorrect: boolean;
  export let showDramaticColor: boolean;

  // 1. ¡Nueva Prop! Recibimos la función del padre directamente
  export let onAnswer: (result: { isCorrect: boolean }) => void;

  function guess(direction: 'higher' | 'lower') {
    const isCorrect = direction === (item.stockDirection === 'UP' ? 'higher' : 'lower');
    
    // 2. Ejecutamos la función pasándole los datos directamente
    if (onAnswer) {
      onAnswer({ isCorrect });
    }
  }
</script>

<div class="mode-wrapper" class:is-revealed={status === 'revealed'}>
  <p class="ceo">{item.tweetAuthorDisplayName} {texts.tweeted}:</p>
  <h3 class="tweet">"{item.tweetText}"</h3>
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
        {lastAnswerWasCorrect ? `✅ ${texts.correct}` : `❌ ${texts.wrong}`}
      </h3>
      <p>{item.company} ({item.ticker}) - {texts.change_text} <strong>{item.stockChangePct}%</strong></p>

      <StockChart 
        history={item.history} 
        stockChange={item.stockChangePct} 
        showDramaticColor={showDramaticColor} 
      />
    </div>
  {/if}
</div>

<style>
  /* ESTADO NORMAL (Jugando) */
  .mode-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    transition: all 0.3s ease;
  }

  .ceo {
    margin-bottom: 0.5rem;
    transition: all 0.3s ease;
  }

  .tweet {
    font-size: 1.5rem; /* Grande por defecto */
    font-style: italic;
    margin-bottom: 2rem;
    line-height: 1.4;
    transition: all 0.3s ease; /* ¡Clave para que no dé un salto brusco! */
  }

  /* ESTADO REVELADO (is-revealed) */
  /* Svelte aplicará esto automáticamente cuando status sea 'revealed' */
  .is-revealed .ceo {
    font-size: 0.85rem; /* Hacemos el nombre más pequeño */
    margin-bottom: 0.2rem;
    color: var(--color-semi-transparent-white);
  }

  .is-revealed .tweet {
    font-size: 1.1rem; /* Encogemos el tweet */
    margin-bottom: 1rem; /* Quitamos espacio por debajo */
    opacity: 0.8; /* Lo apagamos un poco para dar foco a la gráfica */
  }
  .date {
    font-size: 0.9rem;
    color: #94a3b8;
    margin-bottom: 1rem;
  }

  .is-revealed .date {
    font-size: 0.75rem;
  }

  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    justify-content: center;
    margin-top: 1rem;
  }
  button {
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-weight: bold;
    transition: transform 0.1s;

    /* MAGIA 1: Padding fluido (Arriba/Abajo | Izquierda/Derecha) */
    padding: clamp(0.6rem, 2vw, 1rem) clamp(0.8rem, 3vw, 1.5rem);
    
    /* MAGIA 2: Letra fluida (Mínimo 13px | Ideal | Máximo ~18px) */
    font-size: clamp(0.85rem, 3vw, 1.1rem);

    /* MAGIA 3: Sobrescribir el "hacha" para que solo rompa por palabras enteras */
    word-break: normal;
    overflow-wrap: break-word;

    /* Sombra negra durísima para que se vea bien sobre cualquier fondo, heredada de card-content en Game.svelte */
    text-shadow: inherit;
  }
  button:active { transform: scale(0.95); }
  .up { background: #10b981; color: white; }
  .up:hover { background: #059669; }
  .down { background: #ef4444; color: white; }
  .down:hover { background: #dc2626; }
</style>