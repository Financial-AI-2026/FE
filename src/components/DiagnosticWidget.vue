<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  type: {
    type: String,
    default: "A",
  },
});

const WIDGET_IMAGES = {
  A: {
    src: "/diagnostic-widgets/widget-a-leverage.png",
    alt: "레버리지 ETF와 기초지수의 수익률 차이를 보여주는 예시 그래프",
  },
  B: {
    src: "/diagnostic-widgets/widget-b-covered-call.png",
    alt: "커버드콜 ETF가 기초지수 상승분 일부를 받지 못하는 구조를 보여주는 예시 그래프",
  },
  C: {
    src: "/diagnostic-widgets/widget-c-mixed-asset.png",
    alt: "주식과 채권을 함께 담은 상품이 주식만 담은 상품과 다르게 움직이는 예시 그래프",
  },
  D: {
    src: "/diagnostic-widgets/widget-d-fx-unhedged.png",
    alt: "환율 하락으로 기초지수 상승분이 실제 수익에 덜 반영되는 예시 그래프",
  },
  E: {
    src: "/diagnostic-widgets/widget-e-distribution.png",
    alt: "분배형 ETF와 일반 ETF의 분배금 수준을 비교하는 예시 막대 그래프",
  },
};

const normalizedType = computed(() => String(props.type || "A").toUpperCase());
const image = computed(() => WIDGET_IMAGES[normalizedType.value] ?? WIDGET_IMAGES.A);
const hasImageError = ref(false);

watch(image, () => {
  hasImageError.value = false;
});
</script>

<template>
  <figure class="diagnostic-widget">
    <img
      v-if="!hasImageError"
      class="diagnostic-widget-image"
      :src="image.src"
      :alt="image.alt"
      loading="lazy"
      decoding="async"
      @error="hasImageError = true"
    />
    <figcaption v-else class="diagnostic-widget-fallback">
      {{ normalizedType }} 타입 시각화 이미지를 불러오지 못했습니다.
    </figcaption>
  </figure>
</template>

<style scoped>
.diagnostic-widget {
  width: 100%;
  margin: 0;
}

.diagnostic-widget-image {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 28px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.24);
}

.diagnostic-widget-fallback {
  box-sizing: border-box;
  width: 100%;
  min-height: clamp(180px, 22vw, 260px);
  padding: 24px;
  border: 1px solid rgba(142, 165, 205, 0.18);
  border-radius: 28px;
  background:
    radial-gradient(circle at 50% 108%, rgba(34, 72, 128, 0.78), rgba(9, 12, 16, 0) 52%),
    #0b0c0f;
  color: #96a5bf;
  font-size: clamp(12px, 0.95vw, 14px);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}
</style>
