<script setup>
import { ref, computed, watch, nextTick } from "vue";
import { Swiper, SwiperSlide } from "swiper/vue";
import { Keyboard, Mousewheel } from "swiper/modules";
import "swiper/css";
import { useRouter } from "vue-router";
import ProductCard from "../components/ProductCard.vue";
import BaseBadge from "../components/base/BaseBadge.vue";
import ChatWidget from "../components/ChatWidget.vue";
import PageHeader from "../components/base/PageHeader.vue";
import DiagnosticWidget from "../components/DiagnosticWidget.vue";
import { fetchEtfDiagnosis, fetchEtfs, fetchEtfsByCodes, ApiError } from "../api/client";
import { useSessionStore } from "../stores/session";

const props = defineProps({ code: { type: String, required: true } });
const router = useRouter();
const session = useSessionStore();

const diagnosis = ref(null);
const loading = ref(true);
const errorMessage = ref(null);
const recommended = ref([]);

const BRAND_BY_MANAGER_KEYWORD = [
  ["미래에셋", "tiger"],
  ["삼성", "kodex"],
  ["Global X", "globalx"],
  ["ProShares", "proshares"],
];

function brandFor(manager) {
  if (!manager) return "default";
  const hit = BRAND_BY_MANAGER_KEYWORD.find(([keyword]) => manager.includes(keyword));
  return hit ? hit[1] : "default";
}

function openEtf(code) {
  router.push({ name: "detail", params: { code } });
}

function retryCurrentDiagnosis() {
  router.push({
    name: "questions",
    query: { returnTo: "result", code: props.code },
  });
}

function goBackFromResult() {
  router.push({ name: "detail", params: { code: props.code } });
}

// BE가 판정한 경고는 모두 보여준다. `warningsVisible`은 기존 최대 2개 노출
// 정책의 잔재라, 더보기 UI가 없는 현재 화면에서는 사용자에게 경고가 누락된다.
const visibleWarnings = computed(() => diagnosis.value?.warnings ?? []);
const heroWarning = computed(() => visibleWarnings.value[0] ?? null);
const heroEvidence = computed(() => heroWarning.value?.evidence?.[0] ?? null);
const infoCards = computed(() => diagnosis.value?.infos ?? []);

// 진단 결과에 따라 화면(슬라이드) 개수가 달라진다 — 경고 개수, "이런 점도
// 있어요!" 유무에 따라 유동적. 진행바(progressPct)가 이 값을 기준으로 계산된다.
const totalSlides = computed(() => {
  let count = 1; // 배너(hero)
  count += heroWarning.value ? visibleWarnings.value.length : 1; // 경고들 또는 체크리스트
  if (infoCards.value.length) count += 1;
  count += 1; // 추천 상품
  return count;
});

// "조건 수정해서 다시 진단받기" 버튼은 추천 상품 슬라이드 바로 앞,
// 마지막 안내성 슬라이드 하나에만 붙인다.
const retryOnInfoSlide = computed(() => infoCards.value.length > 0);

const resultSwiper = ref(null);
const currentSlide = ref(0);
const swiperModules = [Mousewheel, Keyboard];

const progressPct = computed(() => ((currentSlide.value + 1) / totalSlides.value) * 100);

const mousewheelOptions = {
  enabled: true,
  forceToAxis: true,
  thresholdDelta: 16,
  thresholdTime: 280,
  releaseOnEdges: false,
};

const keyboardOptions = { enabled: true, onlyInViewport: true };

function updateScrollbar(activeIndex = 0) {
  currentSlide.value = Math.min(activeIndex, totalSlides.value - 1);
}

function handleSwiper(swiper) {
  resultSwiper.value = swiper;
  updateScrollbar(swiper.activeIndex);
}

function handleSlideChange(swiper) {
  updateScrollbar(swiper.activeIndex);
}

// 슬라이드 안 내용이 화면보다 길 때(경고/체크리스트/추천 목록 등) 안에서
// 먼저 스크롤하게 하고, 끝에 닿았을 때만 다음/이전 슬라이드로 넘어가게 한다.
function handleInnerScrollWheel(event) {
  const target = event.currentTarget;
  const scrollingDown = event.deltaY > 0;
  const scrollingUp = event.deltaY < 0;
  const canScrollDown = target.scrollTop + target.clientHeight < target.scrollHeight - 1;
  const canScrollUp = target.scrollTop > 0;

  if ((scrollingDown && canScrollDown) || (scrollingUp && canScrollUp)) {
    event.stopPropagation();
  }
}

async function loadDiagnosis(code) {
  loading.value = true;
  errorMessage.value = null;
  try {
    session.setCurrentCode(code);
    diagnosis.value = await fetchEtfDiagnosis(code, session.conditionParams);
  } catch (err) {
    diagnosis.value = null;
    errorMessage.value =
      err instanceof ApiError ? err.message : "진단 결과를 불러오지 못했습니다.";
  } finally {
    loading.value = false;
    // 슬라이드 개수가 데이터마다 달라지므로, DOM이 새로 그려진 뒤 Swiper
    // 레이아웃을 다시 계산하고 처음 화면(배너)으로 되돌린다.
    nextTick(() => {
      resultSwiper.value?.update();
      resultSwiper.value?.slideTo(0, 0);
      currentSlide.value = 0;
    });
  }
}

async function loadRecommended(excludeCode) {
  try {
    // 이전에 조회했던(클릭해서 들어가본) 종목을 앞에 두고, 모자란 자리는 고정
    // 8종으로 채운다 — 조회 이력이 1~2개뿐일 때 목록이 확 줄어들지 않게.
    const viewedCodes = session.viewedCodes.filter((code) => code !== excludeCode);
    const [viewedItems, response] = await Promise.all([
      viewedCodes.length > 0 ? fetchEtfsByCodes(viewedCodes) : Promise.resolve([]),
      fetchEtfs(),
    ]);
    const fallbackItems = [...(response?.domestic ?? []), ...(response?.overseas ?? [])]
      .filter((item) => item.displayOrder != null && item.code !== excludeCode)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    const seen = new Set();
    const merged = [];
    for (const item of [...viewedItems, ...fallbackItems]) {
      if (seen.has(item.code)) continue;
      seen.add(item.code);
      merged.push(item);
    }
    recommended.value = merged;
  } catch {
    recommended.value = [];
  }
}

watch(
  () => props.code,
  (code) => {
    if (!code) return;
    if (!session.hasConditions) {
      router.replace({
        name: "questions",
        query: { returnTo: "result", code },
      });
      return;
    }
    loadDiagnosis(code);
    loadRecommended(code);
  },
  { immediate: true },
);
</script>

<template>
  <div class="result-page">
    <PageHeader>
      <div class="badges">
        <BaseBadge v-for="label in session.profileBadges" :key="label" tone="gold">
          {{ label }}
        </BaseBadge>
      </div>
    </PageHeader>

    <div class="result-progress-track">
      <div class="result-progress-fill" :style="{ height: progressPct + '%' }" />
    </div>

    <button type="button" class="back-btn" @click="goBackFromResult">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M15 18 9 12l6-6" />
      </svg>
    </button>

    <p v-if="loading" class="state-text">불러오는 중…</p>
    <p v-else-if="errorMessage" class="state-text">{{ errorMessage }}</p>

    <template v-else-if="diagnosis">
      <Swiper
        class="result-fullpage"
        direction="vertical"
        :modules="swiperModules"
        :slides-per-view="1"
        :speed="640"
        :mousewheel="mousewheelOptions"
        :keyboard="keyboardOptions"
        @swiper="handleSwiper"
        @slideChange="handleSlideChange"
      >
        <SwiperSlide class="result-slide hero-slide">
          <section class="hero-section">
            <h1>
              <span class="hl">{{ diagnosis.banner.text }}</span>
            </h1>
            <p class="hero-sub">{{ diagnosis.banner.subtext }}</p>

            <!-- 종합 멘트 — 발동된 경고 전체를 문장으로 (아래 sim-section 카드는
                 슬라이드별로 하나씩 보여주는 것과 다르다). -->
            <ul v-if="diagnosis.banner.sentences.length" class="composite-sentences">
              <li v-for="(sentence, i) in diagnosis.banner.sentences" :key="i">{{ sentence }}</li>
            </ul>
            <p v-if="diagnosis.banner.sentences.length" class="composite-closing">
              {{ diagnosis.banner.note }}
            </p>
          </section>
        </SwiperSlide>

        <template v-if="heroWarning">
          <!-- 경고는 BE가 내려준 순서대로 하나당 슬라이드 하나씩 모두 노출한다. -->
          <SwiperSlide
            v-for="(w, i) in visibleWarnings"
            :key="w.code"
            class="result-slide sim-slide"
            @wheel="handleInnerScrollWheel"
          >
            <section class="sim-section">
              <h2>{{ w.title || w.summary }}</h2>
              <DiagnosticWidget v-if="w.widget" :type="w.widget.type" />
              <p class="sim-desc">{{ w.body }}</p>
              <p v-if="w.widget" class="sim-disclaimer">{{ w.widget.disclaimer }}</p>

              <div
                v-if="heroEvidence && i === visibleWarnings.length - 1"
                class="source-box"
              >
                <p class="source-label">*상품설명서(투자설명서) 근거 원문</p>
                <p class="source-text">"{{ heroEvidence.quote }}"</p>
                <p v-if="heroEvidence.quoteOriginal" class="source-text source-text-original">
                  "{{ heroEvidence.quoteOriginal }}"
                </p>
              </div>

              <button
                v-if="!retryOnInfoSlide && i === visibleWarnings.length - 1"
                type="button"
                class="retry-btn"
                @click="retryCurrentDiagnosis"
              >
                조건 수정해서 다시 진단받기
              </button>
            </section>
          </SwiperSlide>
        </template>

        <SwiperSlide v-else class="result-slide also-slide" @wheel="handleInnerScrollWheel">
          <section class="also-section">
            <div class="also-icon">✓</div>
            <h2>{{ diagnosis.banner.note }}</h2>

            <div v-if="diagnosis.checklist" class="also-cards">
              <div
                v-for="item in diagnosis.checklist.items"
                :key="item.rule"
                class="also-card"
              >
                <span class="also-tag">{{ item.label }}</span>
                <p class="also-desc">{{ item.value }}</p>
              </div>
            </div>

            <ul v-if="diagnosis.checklist" class="general-risks">
              <li v-for="risk in diagnosis.checklist.generalRisks" :key="risk">{{ risk }}</li>
            </ul>

            <button
              v-if="!retryOnInfoSlide"
              type="button"
              class="retry-btn"
              @click="retryCurrentDiagnosis"
            >
              조건 수정해서 다시 진단받기
            </button>
          </section>
        </SwiperSlide>

        <!-- infos[] — 경고까진 아니지만 알아두면 좋은 정보. warnings 유무와
             무관하게 내려올 수 있어 위 두 갈래와 별개 슬라이드로 노출한다. -->
        <SwiperSlide
          v-if="infoCards.length"
          class="result-slide also-slide info-slide"
          @wheel="handleInnerScrollWheel"
        >
          <section class="also-section info-section">
            <div class="also-icon">!</div>
            <h2>이런 점도 있어요!</h2>

            <div class="also-cards">
              <div v-for="info in infoCards" :key="info.code" class="also-card">
                <span class="also-tag">{{ info.summary }}</span>
                <p class="also-desc">{{ info.body }}</p>
              </div>
            </div>

            <button type="button" class="retry-btn" @click="retryCurrentDiagnosis">
              조건 수정해서 다시 진단받기
            </button>
          </section>
        </SwiperSlide>

        <SwiperSlide class="result-slide reco-slide" @wheel="handleInnerScrollWheel">
          <section class="reco-section">
            <h2>다른 ETF 상품도 살펴보세요!</h2>

            <div class="reco-grid">
              <div v-for="item in recommended" :key="item.code" class="reco-item">
                <ProductCard
                  :brand="brandFor(item.manager)"
                  :code="item.code"
                  :name="item.name"
                  :manager="item.manager"
                  :disabled="!item.ready"
                  @open="openEtf(item.code)"
                />
              </div>
            </div>
          </section>
        </SwiperSlide>
      </Swiper>
    </template>

    <ChatWidget
      stage="s6"
      :product-code="props.code"
      :horizon="session.horizon"
      :purpose="session.purpose"
      :fund-nature="session.fundNature"
      @retry="retryCurrentDiagnosis"
      @view-products="router.push({ name: 'search' })"
    />
  </div>
</template>

<style scoped>
.result-page {
  position: relative;
  height: 100svh;
  box-sizing: border-box;
  overflow: hidden;
  padding: 0;
  background: linear-gradient(
    180deg,
    var(--color-bg-page-deep) 0%,
    var(--color-bg-page-mid) 30%,
    var(--color-bg-page) 100%
  );
}

.result-fullpage {
  width: 100%;
  height: 100%;
}

.result-fullpage :deep(.swiper-wrapper) {
  will-change: transform;
}

.result-slide {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
  padding: 0 clamp(28px, 5vw, 80px);
  backface-visibility: hidden;
}

.sim-slide,
.also-slide,
.reco-slide {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.sim-slide::-webkit-scrollbar,
.also-slide::-webkit-scrollbar,
.reco-slide::-webkit-scrollbar {
  display: none;
}

.badges {
  margin-left: auto;
  display: flex;
  gap: 10px;
}

.result-progress-track {
  position: fixed;
  left: 0;
  top: 0;
  z-index: 20;
  width: 5px;
  height: 100svh;
  overflow: hidden;
  background: transparent;
  pointer-events: none;
}

.result-progress-fill {
  width: 100%;
  background: linear-gradient(180deg, #003b66 0%, #007acc 100%);
  border-radius: 0 999px 999px 0;
  transition: height 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.back-btn {
  position: absolute;
  top: 50px;
  left: clamp(28px, 5vw, 80px);
  z-index: 5;

  width: 32px;
  height: 32px;
  border-radius: 12px;
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

section {
  max-width: 780px;
  margin: 0 auto;
}

/* ==================================================
   HERO
================================================== */

.hero-section {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.hero-section h1 {
  margin: 0;
  font-size: clamp(22px, 2.4vw, 34px);
  font-weight: 800;
  line-height: 1.4;
}

.hl {
  color: #fff;
  background-image: linear-gradient(to top, #3b82f6 42%, transparent 42%);
  padding: 0 4px;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
}

.hero-sub {
  width: 100%;
  margin: clamp(20px, 2vw, 30px) auto 0;
  max-width: 620px;
  color: #8891a6;
  font-size: clamp(13px, 1vw, 15px);
  line-height: 1.7;
}

.composite-sentences {
  width: 100%;
  max-width: 620px;
  margin: clamp(16px, 1.6vw, 22px) auto 0;
  padding: 0 0 0 1.1em;
  text-align: left;
  color: #c7cee0;
  font-size: clamp(13px, 1vw, 15px);
  line-height: 1.8;
}

.composite-sentences li + li {
  margin-top: 8px;
}

.composite-closing {
  width: 100%;
  max-width: 620px;
  margin: clamp(14px, 1.4vw, 18px) auto 0;
  padding-top: clamp(14px, 1.4vw, 18px);
  border-top: 1px solid var(--color-border-subtle-strong);
  color: #8891a6;
  font-size: clamp(12px, 0.95vw, 14px);
  line-height: 1.7;
}

/* ==================================================
   시뮬레이션
================================================== */

.sim-section {
  min-height: 100%;
  box-sizing: border-box;
  padding: 96px 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
}

.sim-section h2 {
  margin: 0 0 clamp(24px, 2.4vw, 36px);
  color: #fff;
  font-size: clamp(16px, 1.4vw, 20px);
  font-weight: 700;
}

.sim-disclaimer {
  margin: clamp(12px, 1.2vw, 18px) 0 0;
  color: #5b667e;
  font-size: clamp(11px, 0.85vw, 13px);
  line-height: 1.6;
}

.sim-desc {
  margin: clamp(28px, 2.6vw, 40px) 0 0;
  color: #8891a6;
  font-size: clamp(13px, 1vw, 15px);
  line-height: 1.7;
}

/* ==================================================
   기타 유의사항 / 이런 점도 있어요
================================================== */

.also-section {
  position: relative;
  min-height: 100%;
  box-sizing: border-box;
  padding: 96px 0;
  text-align: center;
}

/* 피그마 기준 — "이런 점도 있어요!" 슬라이드 위에 구분선. */
.info-section::before {
  content: "";
  position: absolute;
  top: 0;
  left: 50%;
  width: 100vw;
  height: var(--size-section-divider);
  transform: translateX(-50%);
  background: var(--color-divider-strong);
}

.also-icon {
  width: clamp(30px, 2.6vw, 38px);
  height: clamp(30px, 2.6vw, 38px);
  margin: 0 auto 10px;
  border-radius: 50%;
  background: radial-gradient(
    circle at 32% 28%,
    #bde3fa 0%,
    #4aa8e8 55%,
    #0f6fc4 100%
  );
  color: #fff;
  font-size: clamp(15px, 1.3vw, 19px);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-left: auto;
  margin-right: auto;
}

.also-section h2 {
  margin: 0 0 clamp(24px, 2.4vw, 36px);
  color: #fff;
  font-size: clamp(16px, 1.4vw, 20px);
  font-weight: 700;
}

.also-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(14px, 1.4vw, 22px);
  text-align: center;
}

.also-card {
  padding: clamp(18px, 1.8vw, 26px);
  border-radius: 16px;
  background: #fff;
}

.also-tag {
  display: inline-block;
  padding: 1px 5px;
  border-radius: 2px;
  background: #0099ff;
  color: #fff;
  font-size: clamp(14px, 1.15vw, 17px);
  font-weight: 700;
  white-space: nowrap;
}

.also-desc {
  margin: 12px 0 0;
  color: var(--color-fg-muted);
  font-size: clamp(12px, 0.95vw, 14px);
  line-height: 1.6;
  white-space: pre-line;
}

.general-risks {
  max-width: 560px;
  margin: clamp(20px, 2vw, 32px) auto 0;
  padding: 0 0 0 1.2em;
  text-align: left;
  color: var(--color-fg-muted);
  font-size: clamp(12px, 0.95vw, 14px);
  line-height: 1.8;
}

.state-text {
  max-width: 920px;
  margin: 80px auto;
  text-align: center;
  color: var(--color-fg-muted);
  font-size: clamp(14px, 1.1vw, 18px);
}

.source-box {
  margin-top: clamp(24px, 2.4vw, 36px);
  text-align: left;
}

.source-label {
  margin: 0 0 8px;
  color: #8891a6;
  font-size: clamp(11px, 0.9vw, 14px);
  font-weight: 600;
}

.source-text {
  margin: 0;
  color: #5b667e;
  font-size: clamp(11px, 0.85vw, 13px);
  line-height: 1.7;
}

.source-text-original {
  margin-top: 6px;
  font-style: italic;
  color: #454e60;
}

.retry-btn {
  display: block;
  margin: clamp(28px, 2.6vw, 40px) auto 0;
  padding: clamp(12px, 1.1vw, 16px) clamp(26px, 2.4vw, 38px);
  border: none;
  border-radius: 999px;
  background: #3b82f6;
  color: #fff;
  font-size: clamp(13px, 1.05vw, 16px);
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease;
}

.retry-btn:hover {
  background: #2f6fe0;
}

/* ==================================================
   추천 상품
================================================== */

.reco-section {
  position: relative;
  max-width: 1066px;
  min-height: 100%;
  box-sizing: border-box;
  padding: 96px 0;
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
  margin: 0 0 16px;
  color: #dfe3ec;
  font-size: clamp(15px, 1.2vw, 19px);
  font-weight: 600;
}

.reco-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 25px 32px;
}

@media (max-width: 700px) {
  .result-slide {
    padding: 0 20px;
  }

  .also-cards {
    grid-template-columns: 1fr;
  }

  .reco-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 18px;
  }
}

@media (max-width: 420px) {
  .reco-grid {
    grid-template-columns: 1fr;
  }
}
</style>
