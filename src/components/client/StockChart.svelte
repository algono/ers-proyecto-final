<script>
  import { draw, fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  // Props que recibirá desde el componente padre
  export let history = [];
  export let stockChange = 0;
  export let showDramaticColor = false;

  // 1. Ajuste matemático: Hacemos que la gráfica ocupe de Y=0 a Y=35.
  // Así dejamos espacio libre abajo (hasta Y=55) para las líneas y los textos.
  $: pointCoords = history.map((val, i, arr) => {
    const x = (i / (arr.length - 1)) * 100;
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    // Le damos un pequeño padding superior/inferior para que no toque los bordes absolutos
    const padding = (max - min) * 0.1 || 1; 
    const range = (max + padding) - (min - padding) || 1;
    
    // Invertimos Y para SVG y lo mapeamos a una altura máxima de 35
    const y = 35 - (((val - (min - padding)) / range) * 35); 
    return { x, y, val };
  });
  
  // Reconstruimos el Path de la línea principal
  $: pathD = pointCoords.length > 0 ? `M ${pointCoords.map(p => `${p.x},${p.y}`).join(' L ')}` : '';
  $: finalColor = stockChange >= 0 ? '#10b981' : '#ef4444'; // Verde o Rojo

  // Transición personalizada de la línea cayendo
  function dropLine(node, { delay = 0, duration = 400 }) {
    const y1 = parseFloat(node.getAttribute('y1'));
    const y2 = parseFloat(node.getAttribute('y2')); // El destino final
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
  <svg viewBox="-5 -5 110 65" preserveAspectRatio="xMidYMid meet">
    
    {#each pointCoords as p, i}
      <line 
        x1={p.x} y1={p.y} 
        x2={p.x} y2="45" 
        stroke="#475569" 
        stroke-width="0.5" 
        stroke-dasharray="1 1.5"
        in:dropLine={{ 
          duration: 400, 
          delay: i * (1500 / Math.max(1, pointCoords.length - 1)) 
        }} 
      />
    {/each}

    {#each pointCoords as p, i}
      <text 
        x={p.x} y="52" 
        font-size="4" 
        fill={showDramaticColor ? finalColor : '#94a3b8'} 
        text-anchor="middle"
        font-family="system-ui, sans-serif"
        font-weight="bold"
        style="transition: fill 0.3s ease-in;"
        in:fade={{ 
          duration: 200, 
          /* Mismo delay exacto que los circulitos y líneas para que aparezca al pasar el trazo */
          delay: i * (1500 / Math.max(1, pointCoords.length - 1)) 
        }}
      >
        {p.val}
      </text>
    {/each}

    <path 
      d={pathD} 
      fill="none" 
      stroke={showDramaticColor ? finalColor : '#64748b'} 
      stroke-width="2.5"
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
    /* Aumentamos la altura real para que no se vea tan estirada a lo ancho */
    height: 200px; 
    margin: 2rem 0;
  }
  svg {
    width: 100%;
    height: 100%;
    overflow: visible;
  }
</style>