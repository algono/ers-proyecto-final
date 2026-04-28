<script lang="ts">
  export let texts: Record<string, string>;
  export let guess: (direction: 'higher' | 'lower') => void;
</script>

<div class="buttons">
  <button class="up" on:click={() => guess('higher')}>📈 {texts.higher_button}</button>
  <button class="down" on:click={() => guess('lower')}>📉 {texts.lower_button}</button>
</div>

<style>
  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    justify-content: center;
    margin-top: 1rem;
  }
  button {
    border: 1px solid transparent; 
    border-radius: 0.5rem;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.2s ease-in-out; /* Transición suave para colores y sombras */

    /* Sombra negra para que se vea bien sobre cualquier fondo */
    text-shadow: 4px 1px 10px rgba(0,0,0, 0.7);

    /* MAGIA 1: Padding fluido (Arriba/Abajo | Izquierda/Derecha) */
    padding: clamp(0.85rem, 3vw, 1.2rem) clamp(1.2rem, 4vw, 2rem);
    
    /* MAGIA 2: Letra fluida (Mínimo 16px | Ideal | Máximo ~18px) */
    font-size: clamp(1rem, 3vw, 1.15rem);

    /* MAGIA 3: Sobrescribir el "hacha" para que solo rompa por palabras enteras */
    word-break: normal;
    overflow-wrap: break-word;
  }
  
  button:active { 
    transform: scale(0.95); 
  }

  /* --- UP: Verde Esmeralda Profundo (Elegante y legible con blanco) --- */
  .up {
    background: #06402b; /* Verde muy oscuro, puro y cibernético */
    color: white;
    /* border: 1px solid rgba(16, 185, 129, 0.2); */
    box-shadow: 0 0 3px rgb(16, 185, 129); /* Resplandor verde sutil */
  }
  
  .up:hover {
    background: #095c3e; /* Se aclara un poco al pasar el ratón */
    border-color: rgba(222, 255, 154, 0.8);
    box-shadow: 0 0 15px rgba(222, 255, 154, 0.15); /* Resplandor neón sutil */
    transform: translateY(-2px); /* Se levanta un poquito, efecto premium */
  }

  /* --- DOWN: Granate Oscuro (Peligro, pero sofisticado) --- */
  .down {
    background: #3f0a0a; /* Un granate que es casi negro */
    color: white;
    /* border: 1px solid rgba(239, 68, 68, 0.2); */
    box-shadow: 0 0 3px rgb(239, 68, 68);
  }
  
  .down:hover {
    background: #5c0f0f; 
    border-color: rgba(239, 68, 68, 0.8);
    box-shadow: 0 0 15px rgba(239, 68, 68, 0.15);
    transform: translateY(-2px);
  }
</style>