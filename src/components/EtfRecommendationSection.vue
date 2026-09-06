<script setup>
import ProductCard from "./ProductCard.vue";

defineProps({
  title: { type: String, default: "이런 ETF도 있어요!" },
  items: { type: Array, default: () => [] },
  brandFor: { type: Function, required: true },
});

defineEmits(["open"]);
</script>

<template>
  <section class="reco-section">
    <h2>{{ title }}</h2>

    <div class="reco-grid">
      <div v-for="item in items" :key="item.code" class="reco-item">
        <ProductCard
          :brand="brandFor(item.manager)"
          :code="item.code"
          :name="item.name"
          :manager="item.manager"
          :disabled="!item.ready"
          @open="$emit('open', item.code)"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.reco-section {
  position: relative;
  max-width: 1068px;
  height: 100%;
  min-height: 100%;
  box-sizing: border-box;
  margin: 0 auto;
  padding-top: clamp(120px, 14svh, 160px);
}

.reco-section::before {
  content: "";
  position: absolute;
  top: 0;
  left: 50%;
  width: 100vw;
  height: var(--size-section-divider);
  transform: translateX(-50%);
  background: var(--color-divider-strong);
}

.reco-section h2 {
  margin: 0 0 28px;
  color: #dfe3ec;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -0.72px;
}

.reco-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 32px;
}

@media (max-width: 700px) {
  .reco-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 420px) {
  .reco-grid {
    grid-template-columns: 1fr;
  }
}
</style>
