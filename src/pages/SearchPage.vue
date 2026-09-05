<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import ProductCard from "../components/ProductCard.vue";
import BaseBadge from "../components/base/BaseBadge.vue";
import BrandLogo from "../components/base/BrandLogo.vue";
import { useSessionStore } from "../stores/session";

const router = useRouter();
const session = useSessionStore();

const query = ref("");

// 디자인 데모용 목업 — 실제 검색 API 연동은 아직 붙이지 않음.
const results = [
  { code: "069500", brand: "kodex" },
  { code: "091160", brand: "kodex" },
  { code: "371460", brand: "kodex" },
  { code: "GLOBALX01", brand: "globalx" },
  { code: "133690", brand: "kodex", disabled: true },
];

const analyzedOnly = ref(false);
</script>

<template>
  <div class="search-page">
    <header class="top-bar">
      <BrandLogo />

      <div class="badges">
        <BaseBadge v-for="label in session.profileBadges" :key="label" tone="gold">
          {{ label }}
        </BaseBadge>
      </div>
    </header>

    <h1>찾고 싶은 금융 상품을 검색해보세요!</h1>

    <div class="search-bar">
      <input
        v-model="query"
        type="text"
        placeholder="상품명, 티커, 회사 이름으로 검색"
      />
      <button type="button" class="search-btn" aria-label="검색">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
    </div>

    <div class="result-bar">
      <span class="count">검색 결과 총 {{ results.length }}건</span>
      <button
        type="button"
        class="toggle"
        :class="{ on: analyzedOnly }"
        @click="analyzedOnly = !analyzedOnly"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
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
        @open="router.push({ name: 'detail', params: { code: r.code } })"
      />
    </div>
  </div>
</template>

<style scoped>
.search-page {
  position: relative;
  min-height: 100svh;
  box-sizing: border-box;
  padding: 0 48px 72px;
  background: linear-gradient(
    180deg,
    #09101a 0%,
    #2f4c76 100%
  );
}

.top-bar {
  position: absolute;
  top: 21px;
  left: 59px;
  right: 48px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 14px;
}

.badges {
  margin-left: auto;
  display: flex;
  gap: 10px;
}

h1 {
  margin: 0 0 40px;
  padding-top: 160px;
  text-align: center;
  font-size: 32px;
  font-weight: 600;
  color: #fff;
  line-height: 1.4;
  letter-spacing: -0.96px;
}

.search-bar {
  width: min(100%, 491px);
  min-height: 52px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 12px;
  box-sizing: border-box;
  padding: 16px 20px;
  border-radius: 999px;
  background: #1d2e49;
  border: 0;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.25);
}

.search-bar input {
  flex: 1;
  border: none;
  background: transparent;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  letter-spacing: -0.42px;
  outline: none;
}

.search-bar input::placeholder {
  color: #5b667e;
}

.search-btn {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #83a8e9;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.search-btn svg {
  width: 16.25px;
  height: 16.25px;
}

.result-bar {
  width: auto;
  margin: 56px -48px 25px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 25px max(48px, calc((100% - 1066px) / 2)) 0;
  border-top: 4px solid #1d2e49;
  border-bottom: 0;
}

.count {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -0.72px;
  color: #f2f2f2;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: transparent;
  color: #e6e6e6;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  letter-spacing: -0.42px;
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
  max-width: 1066px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
}

@media (max-width: 700px) {
  .search-page {
    padding: 20px 20px 48px;
  }

  h1 {
    margin-top: 64px;
    font-size: 26px;
  }

  .search-bar {
    max-width: 100%;
  }

  .results {
    grid-template-columns: repeat(2, 1fr);
    gap: 18px;
  }
}

@media (max-width: 420px) {
  .results {
    grid-template-columns: 1fr;
  }
}
</style>
