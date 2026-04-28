<script lang="ts">
  import { THEME_COLOR } from '@constants';

  export let currentIndex: number; // Para que aplique un color nuevo cada vez que el juego avanza

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

  $: neonStyle = `
    --neon-color: ${THEME_COLOR}; 
    filter: grayscale(${currentGray}%) hue-rotate(${currentHue}deg);
  `;
</script>

<div class="bg-container" style={neonStyle}>
  <svg class="neon-chart" viewBox="0 0 1000 300" preserveAspectRatio="none">
    <g filter="drop-shadow(0 0 15px var(--neon-color)) drop-shadow(0 0 5px var(--neon-color))">
      <path 
        d="M0,250 L100,200 L200,220 L300,100 L400,150 L500,50 L600,80 L700,20 L800,90 L900,10 L1000,60" 
        fill="none" 
        stroke="var(--neon-color)" 
        stroke-width="3"
        vector-effect="non-scaling-stroke" 
      />
    </g>
  </svg>
  
  <div class="bg-fade"></div>
</div>

<style>
  .bg-container {
    position: fixed; /* Lo anclamos al fondo de la pantalla */
    inset: 0;
    z-index: -1; /* Por detrás de todo */
    background-color: var(--color-background, #0a0a0a);
    overflow: hidden;
    transition: filter 1.5s ease-out; /* Transición súper suave del color */
  }

  .neon-chart {
    width: 100%;
    height: 100%;
    opacity: 0.15; /* SÚPER IMPORTANTE: Muy baja opacidad para que no moleste al leer */
    transform: scale(1.1); /* Lo hacemos un pelín más grande para esconder los bordes */
  }

  .bg-fade {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at center, transparent 0%, var(--color-background, #0a0a0a) 80%);
  }
</style>