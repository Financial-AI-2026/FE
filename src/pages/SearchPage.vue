<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import ProductCard from "../components/ProductCard.vue";
import BaseBadge from "../components/base/BaseBadge.vue";
import BrandLogo from "../components/base/BrandLogo.vue";
import { listEtfs } from "../lib/chatApi";

const router = useRouter();
const session = useSessionStore();

const query = ref("");
const analyzedOnly = ref(false);

const items = ref([]);
const loading = ref(false);
const loadError = ref(false);

// ProductCard.vue엔 이 4개 브랜드의 로고/배너 색만 있어서, 매칭 안 되는 발행사는
// ProductCard 자체 기본값(kodex 스타일)으로 떨어진다.
function inferBrand(item) {
  const name = item.name ?? "";
  const manager = item.manager ?? "";
  if (name.startsWith("TIGER")) return "tiger";
  if (name.startsWith("KODEX")) return "kodex";
  if (manager.includes("ProShares")) return "proshares";
  if (manager.includes("Global X")) return "globalx";
  return undefined;
}

function toCard(item) {
  return {
    code: item.code,
    name: item.name,
    issuer: item.manager ?? "",
    brand: inferBrand(item),
    ready: item.ready,
    displayOrder: item.displayOrder ?? 0,
  };
}

async function fetchList(q) {
  loading.value = true;
  loadError.value = false;
  try {
    const res = await listEtfs(q || undefined);
    items.value = [...res.domestic, ...res.overseas]
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
      .map(toCard);
  } catch {
    items.value = [];
    loadError.value = true;
  } finally {
    loading.value = false;
  }
}

const results = computed(() =>
  analyzedOnly.value ? items.value.filter((i) => i.ready) : items.value,
);

onMounted(() => fetchList());

let debounceTimer = null;
watch(query, (q) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => fetchList(q), 300);
});

onUnmounted(() => clearTimeout(debounceTimer));
</script>

<template>
  <div class="search-page">
    <PageHeader>
      <div class="badges">
        <BaseBadge v-for="label in session.profileBadges" :key="label" tone="gold">
          {{ label }}
        </BaseBadge>
      </div>
    </PageHeader>

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

    <p v-if="loading" class="state-msg">불러오는 중이에요...</p>
    <p v-else-if="loadError" class="state-msg">상품 목록을 불러오지 못했어요. 잠시 후 다시 시도해주세요.</p>

    <div v-else class="results">
      <ProductCard
        v-for="r in results"
        :key="r.code"
        :brand="r.brand"
        :code="r.code"
        :name="r.name"
        :issuer="r.issuer"
        :disabled="!r.ready"
        @open="emit('open', r.code)"
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

.state-msg {
  max-width: 1040px;
  margin: 40px auto;
  text-align: center;
  color: var(--color-fg-muted);
  font-size: clamp(13px, 1vw, 16px);
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
