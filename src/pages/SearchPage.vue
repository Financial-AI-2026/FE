<script setup>
import { ref } from 'vue'
import ProductCard from '../components/ProductCard.vue'
import BaseBadge from '../components/base/BaseBadge.vue'

const emit = defineEmits(['back', 'open'])

const query = ref('')

const results = [
  { brand: 'kodex' },
  { brand: 'kodex' },
  { brand: 'kodex' },
  { brand: 'globalx' },
  { brand: 'kodex', disabled: true },
]

const analyzedOnly = ref(false)
</script>

<template>
  <div class="search-page">
    <header class="top-bar">
      <button type="button" class="back-btn" @click="emit('back')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 18 9 12l6-6" />
        </svg>
      </button>

      <div class="avatar" />

      <div class="badges">
        <BaseBadge tone="purple">로그인 필요해요</BaseBadge>
        <BaseBadge tone="purple">개인정보 미수집</BaseBadge>
      </div>
    </header>

    <h1>찾고 싶은 금융 상품을 검색해보세요!</h1>

    <div class="search-bar">
      <input v-model="query" type="text" placeholder="상품명, 티커, 회사 이름으로 검색" />
      <button type="button" class="search-btn" aria-label="검색">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
    </div>

    <div class="result-bar">
      <span class="count">검색 결과 총 {{ results.length }}건</span>
      <button type="button" class="toggle" :class="{ on: analyzedOnly }" @click="analyzedOnly = !analyzedOnly">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        분석 완료 상품만 보기
      </button>
    </div>

    <div class="results">
      <ProductCard
        v-for="(r, i) in results"
        :key="i"
        :brand="r.brand"
        :disabled="r.disabled"
        @open="emit('open')"
      />
    </div>
  </div>
</template>

<style scoped>
.search-page {
  position: relative;
  min-height: 100svh;
  box-sizing: border-box;
  padding: clamp(24px, 2.4vw, 40px) clamp(28px, 5vw, 80px) 60px;
  background: linear-gradient(180deg, var(--color-bg-page-deep) 0%, var(--color-bg-page-mid) 40%, var(--color-bg-page) 100%);
}

.top-bar {
  display: flex;
  align-items: center;
  gap: 14px;
}

.back-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: var(--color-surface-subtle);
  color: #cfd8ea;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.back-btn svg {
  width: 16px;
  height: 16px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #d9d9d9;
  flex-shrink: 0;
}

.badges {
  margin-left: auto;
  display: flex;
  gap: 10px;
}

h1 {
  margin: clamp(28px, 4vw, 56px) 0 clamp(20px, 2.2vw, 32px);
  text-align: center;
  font-size: clamp(24px, 2.6vw, 38px);
  font-weight: 700;
  color: #fff;
}

.search-bar {
  max-width: 1040px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: clamp(6px, 0.6vw, 10px) clamp(8px, 0.8vw, 12px) clamp(6px, 0.6vw, 10px) clamp(18px, 1.6vw, 26px);
  border-radius: 16px;
  background: #0f1a2e;
  border: 1px solid var(--color-border-subtle-strong);
}

.search-bar input {
  flex: 1;
  border: none;
  background: transparent;
  color: #fff;
  font-size: clamp(14px, 1.1vw, 18px);
  outline: none;
}

.search-bar input::placeholder {
  color: #5b667e;
}

.search-btn {
  width: clamp(34px, 3vw, 46px);
  height: clamp(34px, 3vw, 46px);
  border-radius: 50%;
  border: none;
  background: #1d2c48;
  color: #cfd8ea;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.search-btn svg {
  width: 44%;
  height: 44%;
}

.result-bar {
  max-width: 1040px;
  margin: clamp(20px, 2vw, 30px) auto 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--color-border-subtle-strong);
}

.count {
  font-size: clamp(13px, 1vw, 16px);
  color: #8891a6;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: transparent;
  color: var(--color-fg-muted);
  font-size: clamp(12px, 0.9vw, 15px);
  cursor: pointer;
  transition: color 0.2s ease;
}

.toggle svg {
  width: 14px;
  height: 14px;
}

.toggle.on {
  color: #3b82f6;
}

.results {
  max-width: 1040px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: clamp(16px, 1.6vw, 28px);
}

@media (max-width: 700px) {
  .search-page {
    padding: 20px 20px 48px;
  }

  .results {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 420px) {
  .results {
    grid-template-columns: 1fr;
  }
}
</style>
