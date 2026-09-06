<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import ProductCard from "../components/ProductCard.vue";
import BaseBadge from "../components/base/BaseBadge.vue";
import PageHeader from "../components/base/PageHeader.vue";
import { useSessionStore } from "../stores/session";
import { fetchEtfs, ApiError } from "../api/client";
import { brandForEtf } from "../constants/etfBrand";

const router = useRouter();
const session = useSessionStore();

const query = ref("");
const analyzedOnly = ref(false);
const allItems = ref([]); // 현재 검색어 기준 결과 (domestic+overseas 합침)
const loading = ref(false);
const errorMessage = ref(null);

const DEBOUNCE_MS = 300;
let debounceTimer = null;

function combine(response) {
  return [...(response?.domestic ?? []), ...(response?.overseas ?? [])];
}

// displayOrder(널 포함) 기준 정렬 — domestic/overseas 두 배열을 합치면서
// 다시 섞이므로 여기서 한 번 더 맞춘다.
function sortByDisplayOrder(items) {
  return [...items].sort((a, b) => {
    const aOrder = a.displayOrder ?? Infinity;
    const bOrder = b.displayOrder ?? Infinity;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.code.localeCompare(b.code);
  });
}

async function runSearch(q) {
  loading.value = true;
  errorMessage.value = null;
  try {
    const response = await fetchEtfs(q || undefined);
    allItems.value = sortByDisplayOrder(combine(response));
  } catch (err) {
    errorMessage.value =
      err instanceof ApiError ? err.message : "검색 결과를 불러오지 못했습니다.";
    allItems.value = [];
  } finally {
    loading.value = false;
  }
}

// 검색어가 비어 있을 때는 "고정 8개 카드"만 노출한다 — 백엔드 API는 필터
// 없이 전체 유니버스를 열어두고(docs/13 §5 결정), 8개 고정 노출은 FE에서
// displayOrder 상위 8개만 골라 보여주는 방식으로 분리했다.
//
// `renderLimit`으로 처음엔 적게만 그리는 이유: `allItems`는 디바운스가
// 끝나기 전까지 "이전 검색 결과"(빈 검색어일 땐 전체 유니버스 6천여 건)를
// 그대로 들고 있다. 캡이 없으면 글자를 치는 순간 그 수천 건을 통째로
// 렌더링하려다 타이핑 자체가 버벅였다 — 실사용 중 발견된 실제 버그.
// 서버는 이미 전체 매칭 결과를 다 내려주므로(추가 API 호출 없이) 스크롤이
// 바닥에 닿을 때마다 `renderLimit`만 늘려서 더 보여준다 — 무한 스크롤.
const PAGE_SIZE = 40;
const renderLimit = ref(PAGE_SIZE);

const displayedItems = computed(() => {
  const trimmed = query.value.trim();
  if (!trimmed) {
    return allItems.value.filter((item) => item.displayOrder != null).slice(0, 8);
  }
  return allItems.value.slice(0, renderLimit.value);
});

const visibleItems = computed(() =>
  analyzedOnly.value
    ? displayedItems.value.filter((item) => item.ready)
    : displayedItems.value,
);

const totalMatchCount = computed(() => allItems.value.length);
const hasMore = computed(() => query.value.trim() && renderLimit.value < allItems.value.length);

function loadMore() {
  renderLimit.value += PAGE_SIZE;
}

watch(query, (value) => {
  loading.value = true; // 디바운스 대기 중에도 "검색 중"으로 보이게 — 이전 건수가 잠깐 남아 헷갈리는 것 방지
  renderLimit.value = PAGE_SIZE; // 새 검색이면 스크롤로 늘려온 개수를 리셋
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => runSearch(value.trim()), DEBOUNCE_MS);
});

const loadMoreSentinel = ref(null);
let loadMoreObserver = null;

function observeLoadMore() {
  if (loadMoreObserver) loadMoreObserver.disconnect();
  if (!loadMoreSentinel.value) return;
  loadMoreObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting && hasMore.value) loadMore();
    },
    { rootMargin: "600px 0px" }, // 바닥에 닿기 전에 미리 불러와 스크롤이 끊기지 않게
  );
  loadMoreObserver.observe(loadMoreSentinel.value);
}

onMounted(() => {
  runSearch("");
  observeLoadMore();
});
onBeforeUnmount(() => {
  clearTimeout(debounceTimer);
  loadMoreObserver?.disconnect();
});

function openEtf(code) {
  router.push({ name: "detail", params: { code } });
}
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
        <svg viewBox="0 0 16.2501 16.2501" fill="currentColor">
          <path d="M12.3592 6.86624C12.3592 3.83255 9.89994 1.37325 6.86624 1.37325C3.83255 1.37325 1.37325 3.83255 1.37325 6.86624C1.37325 9.89994 3.83255 12.3592 6.86624 12.3592V13.7325C3.07412 13.7325 0 10.6584 0 6.86624C0 3.07412 3.07412 0 6.86624 0C10.6584 0 13.7325 3.07412 13.7325 6.86624C13.7325 10.6584 10.6584 13.7325 6.86624 13.7325V12.3592C9.89994 12.3592 12.3592 9.89994 12.3592 6.86624Z" />
          <path d="M10.9583 10.9583C11.2264 10.6901 11.6611 10.6901 11.9292 10.9583L16.049 15.078C16.3171 15.3462 16.3171 15.7808 16.049 16.049C15.7808 16.3171 15.3462 16.3171 15.078 16.049L10.9583 11.9292C10.6901 11.6611 10.6901 11.2264 10.9583 10.9583Z" />
        </svg>
      </button>
    </div>

    <div class="result-bar">
      <span class="count">
        <template v-if="loading">검색 중…</template>
        <template v-else>MVP에서는 아래 8개 상품만 검색할 수 있어요</template>
      </span>
      <button
        type="button"
        class="toggle"
        :class="{ on: analyzedOnly }"
        @click="analyzedOnly = !analyzedOnly"
      >
        분석 완료 상품만 보기
        <svg viewBox="0 0 15.4885 15.4885" fill="currentColor">
          <path d="M14.1609 7.74425C14.1609 4.20043 11.2881 1.32759 7.74425 1.32759C4.20043 1.32759 1.32759 4.20043 1.32759 7.74425C1.32759 11.2881 4.20043 14.1609 7.74425 14.1609C11.2881 14.1609 14.1609 11.2881 14.1609 7.74425ZM15.4885 7.74425C15.4885 12.0213 12.0213 15.4885 7.74425 15.4885C3.46722 15.4885 0 12.0213 0 7.74425C0 3.46722 3.46722 0 7.74425 0C12.0213 0 15.4885 3.46722 15.4885 7.74425Z" />
          <path d="M10.7944 5.52642C11.0417 5.25592 11.4616 5.23688 11.7322 5.48407C12.0027 5.73139 12.0217 6.15128 11.7745 6.42185L8.85317 9.61636C7.98421 10.5668 6.52529 10.6759 5.52469 9.86528L3.78656 8.45645C3.50173 8.22569 3.45731 7.80783 3.68803 7.52299C3.91876 7.2382 4.33664 7.19469 4.62149 7.42532L6.36049 8.83415C6.8153 9.20264 7.47892 9.15294 7.8739 8.72093L10.7944 5.52642Z" />
        </svg>
      </button>
    </div>

    <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

    <div class="results">
      <ProductCard
        v-for="item in visibleItems"
        :key="item.code"
        :brand="brandForEtf(item)"
        :code="item.code"
        :name="item.name"
        :manager="item.manager"
        :disabled="!item.ready"
        @open="openEtf(item.code)"
      />
    </div>

    <!-- 무한 스크롤 트리거 — 화면에 아무 문구도 안 띄우고, 바닥 근처에
         닿으면 조용히 더 불러온다(이미 fetch된 목록에서 더 그리는 것뿐이라
         추가 API 호출은 없음). -->
    <div ref="loadMoreSentinel" class="load-more-sentinel" aria-hidden="true" />
  </div>
</template>

<style scoped>
.search-page {
  position: relative;
  min-height: 100svh;
  box-sizing: border-box;
  padding: 0 48px 72px;
  /* 피그마엔 배경 사각형이 두 겹(프레임 전체용 + 1495px짜리) 겹쳐 있지만,
     위쪽 사각형이 프레임(1173px) 전체를 이미 덮고 있어서 아래쪽 사각형은
     실제로 화면에 전혀 보이지 않는다 — 보이는 색만 그대로 옮겼다.
     정지 지점이 자기 높이 기준 53.515%/133.86%(음수 범위 밖)라 위쪽은
     거의 단색이다가 아래로 갈수록 서서히 밝아진다. */
  background: linear-gradient(180deg, #09101a 800.1px, #2f4c76 2001.2px);
}

.badges {
  margin-left: auto;
  display: flex;
  gap: 12px;
}

h1 {
  margin: 0 0 32px;
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
  margin: 0 auto 40px;
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
  width: 16.25px;
  height: 16.25px;
  padding: 0;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #6e8fc4;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.search-btn svg {
  width: 100%;
  height: 100%;
  flex-shrink: 0;
}

.result-bar {
  width: auto;
  margin: 0 -48px 25px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 56px calc(48px + max(0px, (100% - 1066px) / 2)) 0;
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

.error-text {
  max-width: 1040px;
  margin: 0 auto 16px;
  color: var(--color-accent-danger, #e5484d);
  font-size: 14px;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 8px;
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
  width: 15.489px;
  height: 15.489px;
}

.toggle.on {
  color: #3b82f6;
}

.results {
  max-width: 1066px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 25px 32px;
}

.load-more-sentinel {
  height: 1px;
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
