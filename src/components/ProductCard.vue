<script setup>
import { computed } from 'vue'
import BaseButton from './base/BaseButton.vue'
import BaseBadge from './base/BaseBadge.vue'
import kodexLogo from '../assets/icons/kodex.png'
import tigerLogo from '../assets/icons/tiger.png'
import prosharesLogo from '../assets/icons/proshares.png'
import globalxLogo from '../assets/icons/globalx.png'

const logos = {
  kodex: kodexLogo,
  tiger: tigerLogo,
  proshares: prosharesLogo,
  globalx: globalxLogo,
}

const props = defineProps({
  brand: {
    type: String,
    default: 'kodex', // 'kodex' | 'tiger' | 'proshares' | 'globalx'
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const logoSrc = computed(() => logos[props.brand] ?? logos.kodex)

defineEmits(['open'])
</script>

<template>
  <article class="product-card" :class="{ disabled }">
    <BaseBadge v-if="disabled" class="analyzing-badge">분석 중</BaseBadge>

    <div class="banner" :class="brand">
      <img :src="logoSrc" :alt="brand" class="brand-logo" />
    </div>

    <div class="body">
      <p class="line title">금융 상품 이름</p>
      <p class="line sub">번호</p>
      <p class="line sub">회사 이름</p>
    </div>

    <BaseButton
      class="go-btn"
      :disabled="disabled"
      aria-label="상세 보기"
      @click="$emit('open')"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M7 17 17 7" />
        <path d="M9 7h8v8" />
      </svg>
    </BaseButton>
  </article>
</template>

<style scoped>
.product-card {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-default);
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.product-card:not(.disabled):hover {
  transform: translateY(-2px);
  border-color: var(--color-border-hover);
}

.product-card.disabled {
  opacity: 0.55;
}

/* BaseBadge/BaseButton은 자기 자신의 생김새만 책임진다.
   카드 안에서 어디에 놓일지(위치)는 이 카드의 레이아웃 관심사라 여기서 지정한다. */
.analyzing-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
}

.go-btn {
  position: absolute;
  right: clamp(10px, 1vw, 16px);
  bottom: clamp(10px, 1vw, 16px);
}

/* 배너 그라디언트/로고 색상은 kodex·globalx 브랜드 고유 색이라
   앱 디자인 토큰이 아닌 이 컴포넌트의 상수로 둔다. */
.banner {
  height: clamp(96px, 9vw, 140px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.banner.kodex {
  background: linear-gradient(135deg, #eaf3ff 0%, #bdd6ff 100%);
}

.banner.globalx {
  background: linear-gradient(135deg, #eafbe9 0%, #bdeec6 100%);
}

.banner.tiger {
  /* DetailPage.vue의 TIGER ETF 배너와 같은 톤으로 맞춤 */
  background: linear-gradient(135deg, #fff8f2 0%, #ffb37a 100%);
}

.banner.proshares {
  background: linear-gradient(135deg, #f6fff1 0%, #c2ff9f 100%);
}

.brand-logo {
  height: clamp(20px, 1.8vw, 28px);
  width: auto;
  max-width: 78%;
  object-fit: contain;
}

.body {
  padding: clamp(14px, 1.3vw, 20px);
}

.line {
  margin: 0;
  line-height: 1.6;
}

.line.title {
  color: var(--color-fg-soft);
  font-size: clamp(13px, 1.05vw, 16px);
  font-weight: 600;
}

.line.sub {
  color: var(--color-fg-muted);
  font-size: clamp(11px, 0.85vw, 13px);
}
</style>
