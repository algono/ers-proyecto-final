<script lang="ts">
  export let stocksImage: string;
  export let ceoImage: string | undefined;
  export let ceo: string | undefined;
</script>

<div class="game-image-container">
  <img 
    src={ceoImage || stocksImage} 
    alt={ceo || 'Stock Market'} 
    class="game-image"
  />
  <div class="image-overlay"></div>
</div>

<style>
.game-image-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.game-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.6; /* Para que no distraiga demasiado del texto */
  filter: grayscale(20%);
}

.image-overlay {
  position: absolute;
  inset: 0;
  /* Degradado que funde la imagen con el color de la tarjeta */
  background: linear-gradient(to right, transparent 75%, var(--color-secondary));
}
</style>