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

  let ceosPool: string[] = [];
  let slots: (string | null)[] = [null, null]; // Los dos huecos vacíos
  let activeCeo: string | null = null; // Para el clic-to-slot o drag

  // 1. Preparación del tablero usando item.matchData y item.options
  $: if (item && status === 'playing') {
    // Las opciones vienen del mapper (barajadas)
    ceosPool = [...(item.options || [])];
    slots = [null, null];
    activeCeo = null;
  }

  // 2. Lógica HÍBRIDA (Drag & Drop + Clic)
  function selectCeo(ceo: string) {
    activeCeo = ceo;
  }

  function handleDragStart(e: DragEvent, ceo: string) {
    activeCeo = ceo;
    // Efecto visual al arrastrar
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  }

  function placeCeo(slotIndex: number) {
    if (!activeCeo) return;

    // Si ya había alguien en ese hueco, lo devolvemos a la mesa (pool)
    if (slots[slotIndex] !== null) {
      ceosPool = [...ceosPool, slots[slotIndex]];
    }

    // Quitamos al CEO seleccionado de la mesa
    ceosPool = ceosPool.filter(c => c !== activeCeo);
    
    // Lo metemos en el hueco
    slots[slotIndex] = activeCeo;
    slots = [...slots]; // Forzamos reactividad en Svelte
    
    activeCeo = null;

    // ¿Hemos terminado de colocar a los dos? ¡Comprobamos!
    if (slots[0] !== null && slots[1] !== null) {
      checkWinCondition();
    }
  }

  function returnToPool(slotIndex: number) {
    const ceoToReturn = slots[slotIndex];
    if (ceoToReturn) {
      ceosPool = [...ceosPool, ceoToReturn];
      slots[slotIndex] = null;
      slots = [...slots];
    }
  }

  function checkWinCondition() {
    // Es correcto solo si AMBOS huecos coinciden con el autor (CEO) de ese tweet
    const firstMatch = slots[0] === item.matchData![0].tweetAuthorDisplayName;
    const secondMatch = slots[1] === item.matchData![1].tweetAuthorDisplayName;
    
    const isCorrect = firstMatch && secondMatch;
    
    // Le decimos al Padre Game.svelte que hemos terminado
    onAnswer({ isCorrect });
  }
</script>

{#if status === 'playing'}
  <div class="match-game" in:fade>
    <p class="instruction">{texts.match_instruction}</p>
    
    <div class="drop-zones">
      {#each item.matchData as tw, i}
        <div class="tweet-row">
          <div class="tweet-bubble">"{tw.tweetText}"</div>
          
          <button 
            type="button"
            class="slot {slots[i] ? 'filled' : 'empty'} {activeCeo && !slots[i] ? 'highlight' : ''}"
            on:dragover|preventDefault
            on:drop={() => placeCeo(i)}
            on:click={() => slots[i] ? returnToPool(i) : placeCeo(i)}
          >
            {#if slots[i]}
              👤 {slots[i]}
            {:else}
              [ {texts.who_tweeted?.replace('?', '...') || texts.ceo_placeholder} ]
            {/if}
          </button>
        </div>
      {/each}
    </div>

    <div class="draggable-pool">
      {#each ceosPool as ceo}
        <button 
          type="button"
          class="ceo-token {activeCeo === ceo ? 'active' : ''}"
          draggable="true"
          on:dragstart={(e) => handleDragStart(e, ceo)}
          on:click={() => selectCeo(ceo)}
        >
          👤 {ceo}
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
    
    <div class="side-by-side-charts">
      {#each item.matchData as tw}
        <div class="chart-wrapper">
          <p class="ceo-result-name">
            <strong>👤 {tw.tweetAuthorDisplayName}</strong> <br>
            <span class="company-subtext">{tw.company} ({tw.ticker})</span>
          </p>
          <p class="stock-result-text">
            {texts.revealed_info_after} 
            <strong>
              {tw.stockChangePct! >= 0 ? texts.revealed_info_up : texts.revealed_info_down}
            </strong> 
            <strong>{tw.stockChangePct!.toFixed(2)}%</strong>
          </p>

          <StockChart 
            history={tw.history} 
            stockChange={tw.stockChangePct!} 
            showDramaticColor={showDramaticColor} 
          />
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .instruction {
    color: #94a3b8;
    margin-bottom: 2rem;
    font-weight: bold;
  }
  .drop-zones {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-bottom: 2.5rem;
  }
  .tweet-row {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    text-align: left;
  }
  .tweet-bubble {
    background: #334155;
    padding: 1rem;
    border-radius: 0.8rem 0.8rem 0.8rem 0;
    font-style: italic;
    font-size: 1.1rem;
    color: #f8fafc;
  }
  button.slot {
    align-self: flex-start;
    padding: 0.8rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 1rem;
  }
  button.slot.empty {
    background: transparent;
    border: 2px dashed #64748b;
    color: #64748b;
  }
  button.slot.empty.highlight {
    border-color: #3b82f6;
    background: rgba(59, 130, 246, 0.1);
  }
  button.slot.filled {
    background: #3b82f6;
    border: 2px solid #2563eb;
    color: white;
  }

  .draggable-pool {
    display: flex;
    justify-content: center;
    gap: 1rem;
    flex-wrap: wrap;
    min-height: 60px;
    padding: 1rem;
    background: #0f172a;
    border-radius: 1rem;
  }
  button.ceo-token {
    background: #1e293b;
    border: 2px solid #475569;
    color: white;
    padding: 0.8rem 1.2rem;
    border-radius: 2rem;
    font-weight: bold;
    cursor: grab;
    transition: all 0.2s;
  }
  button.ceo-token:active {
    cursor: grabbing;
  }
  button.ceo-token.active {
    border-color: #10b981;
    transform: scale(1.05);
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
  }

  /* Estilos para el Side-by-Side de los resultados */
  .side-by-side-charts {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    margin-top: 2rem;
  }
  .chart-wrapper {
    flex: 1;
    background: #0f172a;
    padding: 1.5rem;
    border-radius: 1rem;
    /* Evita que el contenedor crezca más de su mitad y rompa el flexbox */
    min-width: 0; 
  }
  .ceo-result-name {
    margin: 0 0 0.5rem 0;
    font-size: 1.2rem;
  }
  .company-subtext {
    font-size: 0.9rem;
    color: #94a3b8;
  }
  .stock-result-text {
    font-size: 0.95rem;
    color: #cbd5e1;
    margin-bottom: 1rem;
  }

  /* En pantallas de tablet o mayores, se ponen uno junto al otro */
  @media (min-width: 640px) {
    .side-by-side-charts {
      flex-direction: row;
    }
  }
</style>