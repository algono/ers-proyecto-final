<script lang="ts">
  import { fade } from 'svelte/transition'; // Importamos el fundido de Svelte

  export let stocksImage: string;
  export let currentIndex: number; // Para que aplique un color nuevo cada vez que el juego avanza

  // Por si algún día decidimos mostrar la imagen del CEO aquí en vez de la imagen estática de stocks
  export let ceoImage: string | undefined;
  export let ceo: string | undefined;

  // --- VARIABLES PARA EL EFECTO GENERATIVO ---
  let currentHue = 0; // Entre 0 y 359
  let currentGray = 20; // Entre 0 y 100, pero priorizando bajos

  // Esta función genera los valores aleatorios
  function updateImageEffect() {
    // 1. Tono aleatorio (Linear): Cualquier color es bueno.
    // Usamos Math.floor para tener ints limpios.
    currentHue = Math.floor(Math.random() * 360);

    // 2. Grayscale aleatorio (Weighted/Priorizado): Queremos colores vivos la mayor parte del tiempo.
    // Math.random() elevado al cubo (pow 3) hace que los números bajos sean extremadamente probables.
    // El resultado final lo multiplicamos por 100 para tener el porcentaje.
    currentGray = Math.floor(Math.pow(Math.random(), 3) * 100); 
  }

  // Reactividad atada estrictamente al avance del juego
  $: if (currentIndex !== undefined) {
    updateImageEffect();
  }

  $: randomFilterStyle = `filter: grayscale(${currentGray}%) hue-rotate(${currentHue}deg);`;
</script>

<div class="game-image-container">
  {#key currentIndex}
    <img 
      src={ceoImage || stocksImage} 
      alt={(ceoImage && ceo) ? ceo : 'Stock Market'} 
      class="game-image"
      style={randomFilterStyle}
      in:fade={{ duration: 600 }}
      out:fade={{ duration: 600 }}
    />
  {/key}
  <div class="image-overlay"></div>
</div>

<style>
  .game-image-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden; /* Evitamos que el fundido desborde si hay redimensiones */
  }

  .game-image {
    /* Absoluto para que la imagen vieja y la nueva se superpongan en el fundido */
    position: absolute; 
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.6; /* Para que no distraiga demasiado del texto */
  }

  .image-overlay {
    position: absolute;
    inset: 0;
    /* Degradado que funde la imagen con el color de la tarjeta */
    background: linear-gradient(to right, transparent 75%, var(--color-secondary));
    z-index: 10; /* Aseguramos que el degradado siempre esté por encima de las imágenes que se funden */
  }
</style>