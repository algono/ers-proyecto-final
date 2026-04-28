<script lang="ts">
  export let stocksImage: string;
  export let currentIndex: number; // Para que aplique un color nuevo cada vez que el juego avanza

  // Por si algún día decidimos mostrar la imagen del CEO aquí en vez de la imagen estática de stocks
  export let ceoImage: string | undefined;
  export let ceo: string | undefined;

  // --- VARIABLES PARA EL EFECTO GENERATIVO ---
  let currentHue = Math.floor(Math.random() * 360); // El primer color es 100% aleatorio
  let currentGray = 20;

  function updateImageEffect() {
    // 1. Tono anti-repetición:
    // Generamos un salto aleatorio entre 90 y 270 grados.
    const hueJump = Math.floor(Math.random() * 180) + 90;
    
    // Le sumamos el salto al tono anterior y usamos el módulo 360 (%) 
    // para que si se pasa de 360, vuelva a empezar por el 0 (como un reloj).
    currentHue = (currentHue + hueJump) % 360;

    // 2. Grayscale aleatorio (Weighted/Priorizado para más colores vivos)
    currentGray = Math.floor(Math.pow(Math.random(), 3) * 100); 
  }

  // Reactividad atada estrictamente al avance del juego
  $: if (currentIndex !== undefined) {
    updateImageEffect();
  }

  $: randomFilterStyle = `filter: grayscale(${currentGray}%) hue-rotate(${currentHue}deg);`;
</script>

<div class="game-image-container">
  <img 
    src={ceoImage || stocksImage} 
    alt={(ceoImage && ceo) ? ceo : 'Stock Market'} 
    class="game-image"
    style={randomFilterStyle}
  />
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

    transition: filter 1s ease-in-out;
  }

  .image-overlay {
    position: absolute;
    inset: 0;
    /* Degradado que funde la imagen con el color de la tarjeta */
    background: linear-gradient(to right, transparent 75%, var(--color-secondary));
    z-index: 10; /* Aseguramos que el degradado siempre esté por encima de las imágenes que se funden */
  }
</style>