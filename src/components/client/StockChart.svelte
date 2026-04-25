<script>
  import { draw, fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  // Props que recibirá desde el componente padre (Game)
  export let history = [];
  export let stockChange = 0;
  export let showDramaticColor = false;

  // Lógica matemática: Guardamos las coordenadas X e Y exactas de cada punto
  $: pointCoords = history.map((val, i, arr) => {
    const x = (i / (arr.length - 1)) * 100;
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    const range = max - min || 1;
    const y = 50 - (((val - min) / range) * 50); // Invertimos Y para SVG
    return { x, y, val };
  });
  
  // Reconstruimos el Path de la línea principal a partir de las coordenadas
  $: pathD = pointCoords.length > 0 ? `M ${pointCoords.map(p => `${p.x},${p.y}`).join(' L ')}` : '';
  $: finalColor = stockChange >= 0 ? '#10b981' : '#ef4444'; // Verde o Rojo

  // Transición personalizada que hace crecer la línea hacia abajo
  function dropLine(node, { delay = 0, duration = 400 }) {
    const y1 = parseFloat(node.getAttribute('y1'));
    const y2 = parseFloat(node.getAttribute('y2')); // El destino final (55)
    return {
      delay,
      duration,
      tick: t => {
        // 't' va de 0 a 1 durante la animación. Movemos el punto final hacia abajo.
        node.setAttribute('y2', y1 + (y2 - y1) * t);
      }
    };
  }
</script>

<div class="chart-container">
  <svg viewBox="-5 -5 110 60" preserveAspectRatio="none">
    
    {#each pointCoords as p, i}
      <line 
        x1={p.x} y1={p.y} 
        x2={p.x} y2="55" 
        stroke="#475569" 
        stroke-width="0.5" 
        stroke-dasharray="1 1.5"
        in:dropLine={{ 
          duration: 400, 
          delay: i * (1500 / Math.max(1, pointCoords.length - 1)) 
        }} 
      />
    {/each}

    <path 
      d={pathD} 
      fill="none" 
      stroke={showDramaticColor ? finalColor : '#64748b'} 
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
      style="transition: stroke 0.3s ease-in;"
      in:draw={{ duration: 1500, easing: quintOut }} 
    />
    
    {#each pointCoords as p, i}
      <circle 
        cx={p.x} cy={p.y} r="1.5" 
        fill={showDramaticColor ? finalColor : '#1e293b'} 
        stroke={showDramaticColor ? finalColor : '#64748b'} 
        stroke-width="0.5"
        style="transition: all 0.3s ease-in;"
        in:fade={{ 
          duration: 200, 
          delay: i * (1500 / Math.max(1, pointCoords.length - 1)) 
        }}
      />
    {/each}

  </svg>
</div>

<style>
  .chart-container {
    width: 100%;
    height: 150px;
    margin: 2rem 0;
  }
  svg {
    width: 100%;
    height: 100%;
    overflow: visible;
  }
</style>