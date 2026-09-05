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
    default: 'default', // 'kodex' | 'tiger' | 'proshares' | 'globalx' | 'default'(로고 없음)
  },
  code: {
    type: String,
    default: '',
  },
  name: {
    type: String,
    default: '금융 상품 이름',
  },
  manager: {
    type: String,
    default: '',
  },
  // SearchPage.vue처럼 실제 종목을 나열할 때만 채워서 쓴다. DetailPage.vue의 추천
  // 캐러셀처럼 장식 목적으로만 쓰는 곳은 안 넘겨도 되게 플레이스홀더를 기본값으로 둔다.
  code: {
    type: String,
    default: '번호',
  },
  name: {
    type: String,
    default: '금융 상품 이름',
  },
  issuer: {
    type: String,
    default: '회사 이름',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

// 로고 이미지가 있는 브랜드는 4개뿐 — 그 외(운용사 정보가 없거나 매핑이 안
// 되는 대부분의 확장 유니버스 종목)는 로고 없이 코드 이니셜만 보여준다.
const logoSrc = computed(() => logos[props.brand] ?? null)

defineEmits(['open'])
</script>

<template>
  <article class="product-card" :class="{ disabled }">
    <BaseBadge v-if="disabled" class="analyzing-badge">분석 중</BaseBadge>

    <div class="banner" :class="brand">
      <img v-if="logoSrc" :src="logoSrc" :alt="brand" class="brand-logo" />
      <span v-else class="brand-fallback">{{ code || '?' }}</span>
    </div>

    <div class="body">
      <p class="line title">{{ name }}</p>
      <p class="line sub">{{ code }}</p>
      <p class="line sub">{{ issuer }}</p>
    </div>

    <BaseButton
      class="go-btn"
      :disabled="disabled"
      aria-label="상세 보기"
      @click="$emit('open', code)"
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
  min-height: 258px;
  border-radius: 20px;
  overflow: hidden;
  background: #404040;
  border: 0;
  box-shadow: none;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.product-card:not(.disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 0 20px rgba(99, 123, 185, 0.25);
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
  right: 16px;
  bottom: 16px;

  width: 38px;
  height: 38px;

  background: #1d2e49;
  color: #ffffff;
}

.go-btn:hover {
  background: #0f1826;
}

/* 배너 그라디언트/로고 색상은 kodex·globalx 브랜드 고유 색이라
   앱 디자인 토큰이 아닌 이 컴포넌트의 상수로 둔다. */
.banner {
  height: 172px;
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

.banner.default {
  background: linear-gradient(135deg, var(--color-surface-subtle) 0%, var(--color-bg-card) 100%);
}

.brand-logo {
  height: clamp(28px, 2.6vw, 37px);
  width: auto;
  max-width: 78%;
  object-fit: contain;
}

.brand-fallback {
  font-size: clamp(13px, 1.1vw, 16px);
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--color-fg-muted);
}

.body {
  min-height: 86px;
  box-sizing: border-box;
  padding: 16px;
  background: #404040;
}

.line {
  margin: 0;
  line-height: 1.4;
  letter-spacing: -0.03em;
}

.line.title {
  max-width: calc(100% - 54px);

  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.line.sub {
  max-width: calc(100% - 54px);

  color: #8fbaf8;
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
