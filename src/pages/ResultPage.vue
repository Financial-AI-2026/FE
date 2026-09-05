<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import ProductCard from "../components/ProductCard.vue";
import BaseBadge from "../components/base/BaseBadge.vue";
import ChatWidget from "../components/ChatWidget.vue";
import PageHeader from "../components/base/PageHeader.vue";
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

// warningsVisible만큼만 노출 (F-S6-02 "경고 카드 정렬·최대 2개 노출") — 각
// 경고는 hero+sim 블록을 하나씩 갖는다. "이런 점도 있어요!"는 별개로
// `infos[]`(경고까지는 아닌 참고 정보) 자리다 — 애초에 이 화면 mock의
// points 문구("주식을 직접 사지 않고 증권사와 약속만 했어요" 등)가 실제
// `I-SYN-01`/`I-FXH-01` info 규칙 문구와 그대로 일치해서 확인됨(2번째
// warning 카드가 아니었다). infos는 warnings 유무와 무관하게 내려올 수
// 있어 두 갈래(경고 있음/없음) 어느 쪽에서도 노출한다.
const visibleWarnings = computed(() =>
  (diagnosis.value?.warnings ?? []).slice(0, diagnosis.value?.warningsVisible ?? 0),
);
const heroWarning = computed(() => visibleWarnings.value[0] ?? null);
const heroEvidence = computed(() => heroWarning.value?.evidence?.[0] ?? null);
const infoCards = computed(() => diagnosis.value?.infos ?? []);

async function loadDiagnosis(code) {
  loading.value = true;
  errorMessage.value = null;
  try {
    diagnosis.value = await fetchEtfDiagnosis(code, session.conditionParams);
  } catch (err) {
    diagnosis.value = null;
    errorMessage.value =
      err instanceof ApiError ? err.message : "진단 결과를 불러오지 못했습니다.";
  } finally {
    loading.value = false;
    // reveal 애니메이션 대상(v-if로 늦게 나타난 요소)이 자리 잡은 다음 관찰 시작.
    nextTick(observeReveals);
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
      router.replace({ name: "questions" });
      return;
    }
    loadDiagnosis(code);
    loadRecommended(code);
  },
  { immediate: true },
);


let observer = null;

function observeReveals() {
  if (observer) observer.disconnect();
  const els = document.querySelectorAll(".reveal:not(.in-view)");
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
  );
  els.forEach((el) => observer.observe(el));
}

onMounted(() => {
  observeReveals();
});

onUnmounted(() => {
  if (observer) observer.disconnect();
});
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

    <button type="button" class="back-btn" @click="router.back()">
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
      <section class="hero-section">
        <h1 class="reveal">
          <span class="hl">{{ diagnosis.banner.text }}</span>
        </h1>
        <p class="hero-sub reveal">{{ diagnosis.banner.subtext }}</p>

        <!-- 종합 멘트 — 발동된 경고 전체를 문장으로 (아래 sim-section 카드는 최대
             2개만 보여주는 것과 다르다, [최종]진단결과_종합멘트.md 참고). -->
        <ul v-if="diagnosis.banner.sentences.length" class="composite-sentences reveal">
          <li v-for="(sentence, i) in diagnosis.banner.sentences" :key="i">{{ sentence }}</li>
        </ul>
        <p v-if="diagnosis.banner.sentences.length" class="composite-closing reveal">
          {{ diagnosis.banner.note }}
        </p>
      </section>

      <template v-if="heroWarning">
        <!-- warningsVisible만큼(최대 2개, F-S6-02) 각자 hero+sim 블록 하나씩 -->
        <section v-for="w in visibleWarnings" :key="w.code" class="sim-section">
          <h2 class="reveal">{{ w.title || w.summary }}</h2>
          <div class="sim-box reveal">{{ w.body }}</div>
          <p v-if="w.widget" class="sim-desc reveal">{{ w.widget.disclaimer }}</p>
        </section>

        <div v-if="heroEvidence" class="source-box reveal">
          <p class="source-label">*상품설명서(투자설명서) 근거 원문</p>
          <p class="source-text">"{{ heroEvidence.quote }}"</p>
          <p v-if="heroEvidence.quoteOriginal" class="source-text source-text-original">
            "{{ heroEvidence.quoteOriginal }}"
          </p>
        </div>
      </template>

      <section v-else class="also-section">
        <div class="also-icon reveal">✓</div>
        <h2 class="reveal">{{ diagnosis.banner.note }}</h2>

        <div v-if="diagnosis.checklist" class="also-cards">
          <div
            v-for="item in diagnosis.checklist.items"
            :key="item.rule"
            class="also-card reveal"
          >
            <span class="also-tag">{{ item.label }}</span>
            <p class="also-desc">{{ item.value }}</p>
          </div>
        </div>

        <ul v-if="diagnosis.checklist" class="general-risks reveal">
          <li v-for="risk in diagnosis.checklist.generalRisks" :key="risk">{{ risk }}</li>
        </ul>
      </section>

      <!-- infos[] — 경고까진 아니지만 알아두면 좋은 정보. warnings 유무와
           무관하게 내려올 수 있어 위 두 갈래와 별개로 노출한다. -->
      <section v-if="infoCards.length" class="also-section">
        <div class="also-icon reveal">!</div>
        <h2 class="reveal">이런 점도 있어요!</h2>

        <div class="also-cards">
          <div v-for="info in infoCards" :key="info.code" class="also-card reveal">
            <span class="also-tag">{{ info.summary }}</span>
            <p class="also-desc">{{ info.body }}</p>
          </div>
        </div>
      </section>

      <button
        type="button"
        class="retry-btn reveal"
        @click="router.push({ name: 'questions' })"
      >
        조건 수정해서 다시 진단받기
      </button>

      <section class="reco-section reveal">
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
    </template>

    <ChatWidget
      stage="s6"
      :product-code="props.code"
      :horizon="session.horizon"
      :purpose="session.purpose"
      :fund-nature="session.fundNature"
      @retry="router.push({ name: 'questions' })"
      @view-products="router.push({ name: 'search' })"
    />
  </div>
</template>

<style scoped>
.result-page {
  position: relative;
  min-height: 100svh;
  box-sizing: border-box;
  padding: clamp(24px, 2.4vw, 40px) clamp(28px, 5vw, 80px) 60px;
  background: linear-gradient(
    180deg,
    var(--color-bg-page-deep) 0%,
    var(--color-bg-page-mid) 30%,
    var(--color-bg-page) 100%
  );
}

.badges {
  margin-left: auto;
  display: flex;
  gap: 10px;
}

.back-btn {
  margin-top: 50px;
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

section {
  max-width: 780px;
  margin: 0 auto;
}

/* ==================================================
   스크롤 리빌 공통
================================================== */

.reveal {
  opacity: 0;
  transform: translateY(30px);
  transition:
    opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}

.reveal.in-view {
  opacity: 1;
  transform: translateY(0);
}

.also-cards .reveal:nth-child(2) {
  transition-delay: 0.12s;
}

/* ==================================================
   HERO
================================================== */

.hero-section {
  min-height: calc(100svh - 120px);
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
  /*
    부모(.hero-section)가 flex + align-items:center라서, width를 못박아두지
    않으면 이 문단이 "가장 긴 줄"의 내용 너비에 맞춰 shrink-wrap된다.
    그 상태에서는 폰트 렌더링이 아주 조금만 달라져도(브라우저/폰트 차이)
    나머지 줄이 그 너비를 살짝 넘겨서 혼자 다음 줄로 밀려나는 문제가 생김.
    width:100%로 고정해서 항상 max-width(560px)까지 안정적으로 차지하게 한다.
  */
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
  margin-top: clamp(56px, 5.5vw, 88px);
  text-align: center;
}

.sim-section h2 {
  margin: 0 0 clamp(24px, 2.4vw, 36px);
  color: #fff;
  font-size: clamp(16px, 1.4vw, 20px);
  font-weight: 700;
}

.sim-box {
  width: 100%;
  height: clamp(180px, 22vw, 260px);
  border-radius: 18px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9098ab;
  font-size: clamp(12px, 0.95vw, 14px);
}

.sim-desc {
  margin: clamp(28px, 2.6vw, 40px) 0 0;
  color: #8891a6;
  font-size: clamp(13px, 1vw, 15px);
  line-height: 1.7;
}

/* ==================================================
   기타 유의사항
================================================== */

.also-section {
  margin-top: clamp(72px, 6.5vw, 104px);
  text-align: center;
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
  margin-top: clamp(56px, 5.5vw, 88px);
}

.reco-section h2 {
  margin: 0 0 16px;
  color: #dfe3ec;
  font-size: clamp(15px, 1.2vw, 19px);
  font-weight: 600;
}

.reco-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: clamp(14px, 1.4vw, 22px);
}

@media (max-width: 700px) {
  .result-page {
    padding: 20px 20px 48px;
  }

  /*
    좁은 화면에서는 강제 줄바꿈을 없애고 자연스럽게 흘러가게 둔다.
    (고정 <br/> + 좁아진 max-width 컬럼이 겹치면 두 번째 문장이 또 한 번
    꺾여서 마지막 줄에 "있습니다."만 남는 고아 텍스트가 생겼었음)
  */
  .sub-break {
    display: none;
  }

  .also-cards {
    grid-template-columns: 1fr;
  }

  .reco-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
