<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import ProductCard from "../components/ProductCard.vue";
import BaseBadge from "../components/base/BaseBadge.vue";
import PageHeader from "../components/base/PageHeader.vue";
import ChatWidget from "../components/ChatWidget.vue";
import magnifierIcon from "../assets/icons/icon-search.png";
import warningIcon from "../assets/icons/warning-triangle.svg";
import tigerLogo from "../assets/icons/tiger.png";
import globalxLogo from "../assets/icons/globalx.png";
import prosharesLogo from "../assets/icons/proshares.png";
import { fetchEtfDetail, fetchEtfs, fetchEtfsByCodes, ApiError } from "../api/client";
import { useSessionStore } from "../stores/session";

const props = defineProps({ code: { type: String, required: true } });

const router = useRouter();
const session = useSessionStore();

// 로고가 확실한 MVP 8종만 (검색 확장 이후 나머지 수천 종은 매핑 정보가
// 없다 — ProductCard와 동일하게 로고 없는 기본 배너로 대체).
const HERO_LOGO_BY_CODE = {
  "102110": tigerLogo,
  "133690": tigerLogo,
  "418660": tigerLogo,
  "435420": tigerLogo,
  "441680": tigerLogo,
  "448290": tigerLogo,
  QYLD: globalxLogo,
  TQQQ: prosharesLogo,
};

const etf = ref(null);
const loading = ref(true);
const errorMessage = ref(null);

const recommended = ref([]); // "다른 ETF 상품도 살펴보세요" — 고정순, 현재 종목 제외

async function loadEtf(code) {
  loading.value = true;
  errorMessage.value = null;
  try {
    etf.value = await fetchEtfDetail(code);
    session.setCurrentCode(code);
  } catch (err) {
    etf.value = null;
    errorMessage.value =
      err instanceof ApiError && err.status === 404
        ? "아직 분석이 끝나지 않은 상품이에요."
        : "상품 정보를 불러오지 못했습니다.";
  } finally {
    loading.value = false;
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
    if (code) {
      loadEtf(code);
      loadRecommended(code);
    }
  },
  { immediate: true },
);

const productName = computed(() => etf.value?.name ?? "");
const heroLogo = computed(() => HERO_LOGO_BY_CODE[props.code] ?? null);

const showUnderstandModal = ref(false);
const chatWidgetRef = ref(null);

const scrollbar = reactive({ heightPct: 100, topPct: 0 });

function updateScrollbar() {
  const doc = document.documentElement;
  const viewportH = window.innerHeight;
  const fullH = doc.scrollHeight;
  const heightPct = Math.min(100, (viewportH / fullH) * 100);
  const maxScroll = fullH - viewportH;
  const scrollPct = maxScroll > 0 ? window.scrollY / maxScroll : 0;

  scrollbar.heightPct = heightPct;
  scrollbar.topPct = (100 - heightPct) * scrollPct;
}

function openUnderstandModal() {
  showUnderstandModal.value = true;
}

function rereadFromTop() {
  showUnderstandModal.value = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
  // 이해 확인에서 되돌아온 경우, 질문 경로를 다시 안내한다.
  chatWidgetRef.value?.pingHint();
}

function confirmUnderstood() {
  showUnderstandModal.value = false;
  if (!session.hasConditions) {
    // 조건(투자기간/목적/자금성격) 없이 여기로 바로 들어온 경우 — 진단 API가
    // 세 값을 전부 필수로 요구하므로 먼저 질문 화면으로 보낸다.
    router.push({ name: "questions" });
    return;
  }
  router.push({ name: "detail-loading", params: { code: props.code } });
}

onMounted(() => {
  document.body.classList.add("hide-native-scrollbar");
  updateScrollbar();
  window.addEventListener("scroll", updateScrollbar, { passive: true });
  window.addEventListener("resize", updateScrollbar);
});

onUnmounted(() => {
  document.body.classList.remove("hide-native-scrollbar");
  window.removeEventListener("scroll", updateScrollbar);
  window.removeEventListener("resize", updateScrollbar);
});

// 이름 토큰 분해 — API `tokens`를 그대로 쓴다. `label`은 원문(없으면 "absent"
// 마커), `phrase`/`detail`은 둘 다 같은 실제 번역문(`translation`)을 쓴다 —
// API가 짧은 설명 한 줄만 주기 때문에, 없는 문구를 새로 짓는 대신 그 한 줄을
// 두 자리에 그대로 재사용한다 (문구는 창작하지 않는다는 원칙).
const terms = computed(() =>
  (etf.value?.tokens ?? []).map((token) => ({
    label: token.text ?? (token.absent ? `(${token.absent} 없음)` : `#${token.seq}`),
    phrase: token.translation,
    detail: token.translation,
  })),
);

const activeTerm = ref(0);
watch(terms, () => {
  activeTerm.value = 0;
});

// 구조 Q&A — API `structure`(label/question/value/sub)를 그대로 옮긴다.
// `sub`는 API가 실제로 계산·용어 정의해서 내려주는 값 — 없으면(예: 배율
// 1배는 sub 없음) 템플릿에서 그 줄 자체를 숨긴다.
const STRUCTURE_ORDER = [
  "baseIndex",
  "leverage",
  "replication",
  "distribution",
  "fxHedge",
  "totalExpense",
];
const qa = computed(() => {
  const structure = etf.value?.structure ?? {};
  return STRUCTURE_ORDER.filter((key) => structure[key]).map((key) => ({
    q: structure[key].question,
    a: structure[key].value,
    tag: structure[key].label,
    sub: structure[key].sub ?? "",
  }));
});

// "이건 꼭 알고 투자해야해요" 카드 — hiddenInsight가 없는 상품(현재 MVP 8종
// 전부)에서는 그 카드만 숨기고, 진단으로 넘어가는 CTA는 항상 노출한다.
const hiddenInsightEvidence = computed(() => etf.value?.evidence?.[0] ?? null);

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
</script>

<template>
  <div class="detail-page">
    <div
      class="left-scrollbar-track"
      :style="{ opacity: scrollbar.heightPct < 100 ? 1 : 0.5 }"
    >
      <div
        class="left-scrollbar-thumb"
        :style="{
          height: scrollbar.heightPct + '%',
          top: scrollbar.topPct + '%',
        }"
      />
    </div>

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

    <template v-else-if="etf">
      <section class="hero-section">
        <h1>{{ productName }}</h1>
        <p class="issuer">{{ etf.market === "US" ? "해외(US) 상장" : "국내(KR) 상장" }}</p>

        <div class="promo-banner">
          <img v-if="heroLogo" :src="heroLogo" class="promo-logo" :alt="productName" />
          <span v-else class="promo-fallback">{{ etf.code }}</span>
        </div>
      </section>

      <section class="name-section">
      <h2>이름에 대해서 먼저 알려드릴게요!</h2>

      <div class="name-breakdown">
        <img
          :src="magnifierIcon"
          class="name-icon-bg"
          aria-hidden="true"
          alt=""
        />

        <div class="term-col">
          <div
            v-for="(t, i) in terms"
            :key="t.label"
            class="term-item"
            :class="{ active: activeTerm === i }"
            @click="activeTerm = i"
          >
            <span class="term-label">{{ t.label }}</span>

            <template v-if="activeTerm === i">
              <span class="term-phrase">{{ t.phrase }}</span>
              <p class="term-detail">{{ t.detail }}</p>
            </template>
          </div>
        </div>

        <div class="phrase-col">
          <p
            v-for="(t, i) in terms"
            :key="t.label"
            class="phrase"
            :class="{ active: activeTerm === i }"
            @click="activeTerm = i"
          >
            {{ t.phrase }}
          </p>
        </div>
      </div>
    </section>

    <section class="qa-section">
      <h2>{{ productName }}는 이렇게 움직여요</h2>

      <div class="qa-grid">
        <div v-for="(item, i) in qa" :key="item.q" class="qa-card">
          <div class="qa-top">
            <span class="qa-no">Q{{ i + 1 }}.</span>
            <span class="qa-badge">A</span>
          </div>

          <div class="qa-row">
            <h3>{{ item.q }}</h3>
            <p class="qa-answer">{{ item.a }}</p>
          </div>

          <div class="qa-row qa-row-sub">
            <p class="qa-tag">{{ item.tag }}</p>
            <p v-if="item.sub" class="qa-sub">{{ item.sub }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="warn-section">
      <img :src="warningIcon" class="warn-icon" alt="" />

      <h2>이건 꼭 알고 투자해야해요!</h2>

      <div v-if="etf.hiddenInsight" class="warn-card">
        <p class="warn-title">{{ etf.hiddenInsight.summary }}</p>
        <p class="warn-desc">{{ etf.hiddenInsight.body }}</p>
      </div>

      <button type="button" class="warn-cta" @click="openUnderstandModal">
        {{ productName }} 진단하러 가기
      </button>

      <p class="warn-disclaimer">
        이 정보는 특정 매수 권유가 아니며, 누구나 동일하게 조회하는 사전 이해
        목적의 구조 분석 결과입니다.
      </p>

      <div v-if="hiddenInsightEvidence" class="source-box">
        <p class="source-label">*상품설명서(투자설명서) 근거 원문</p>
        <p class="source-text">"{{ hiddenInsightEvidence.quote }}"</p>
        <p v-if="hiddenInsightEvidence.quoteOriginal" class="source-text source-text-original">
          "{{ hiddenInsightEvidence.quoteOriginal }}"
        </p>
      </div>
    </section>

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

    <ChatWidget
      ref="chatWidgetRef"
      stage="s4"
      :product-code="props.code"
      :horizon="session.horizon"
      :purpose="session.purpose"
      :fund-nature="session.fundNature"
      :disabled="showUnderstandModal"
      @retry="router.push({ name: 'questions' })"
      @view-products="router.push({ name: 'search' })"
    />

    <Transition name="modal-fade">
      <div v-if="showUnderstandModal" class="modal-backdrop">
        <div class="modal-card">
          <h3>{{ productName }}에 대해서 이해하셨나요?</h3>
          <p>
            이해하신 후 진단하면 나에게 필요한지 더 정확하게 판단할 수 있어요!
          </p>

          <div class="modal-actions">
            <button
              type="button"
              class="modal-btn ghost"
              @click="rereadFromTop"
            >
              다시 읽어볼게요
            </button>
            <button
              type="button"
              class="modal-btn primary"
              @click="confirmUnderstood"
            >
              네, 이해했어요
            </button>
          </div>
        </div>
      </div>
    </Transition>
    </template>
  </div>
</template>

<style scoped>
.detail-page {
  position: relative;
  min-height: 100svh;
  box-sizing: border-box;
  padding: 24px 48px 80px;
  background: linear-gradient(180deg, #09101a 0%, #2f4c76 100%);
}

.badges {
  margin-left: auto;
  display: flex;
  gap: 10px;
}

.back-btn {
  position: absolute;
  top: 126px;
  left: 48px;
  z-index: 5;

  width: 48px;
  height: 48px;
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
  width: 24px;
  height: 24px;
}

section {
  max-width: 1105px;
  margin: 0 auto;
}

/* ==================================================
   HERO
================================================== */

.hero-section {
  text-align: center;
  /* 헤더가 absolute로 빠지면서 사라진 문서 흐름상의 높이(약 32px)를
     보정 — 헤더 도입 전과 같은 시각적 여백을 유지한다. */
  padding-top: 158px;
}

.hero-section h1 {
  margin: 0;
  color: #fff;
  font-size: 32px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -0.96px;
}

.issuer {
  margin: 4px 0 0;
  color: #66c2ff;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -0.54px;
}

.promo-banner {
  width: min(100%, 1063px);
  height: 237px;
  margin: 44px auto 0;
  padding: 0;
  border-radius: 30px;
  background: linear-gradient(180deg, #fff8f2 0%, #ffb37a 60%, #ff8a3d 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.promo-logo {
  width: 280px;
  height: auto;
}

.promo-fallback {
  font-size: clamp(28px, 3vw, 44px);
  font-weight: 800;
  letter-spacing: 0.02em;
  color: #fff;
}

.state-text {
  max-width: 920px;
  margin: 80px auto;
  text-align: center;
  color: var(--color-fg-muted);
  font-size: clamp(14px, 1.1vw, 18px);
}

/* ==================================================
   이름 뜯어보기
================================================== */

.name-section {
  margin-top: 245px;
}

.name-section h2 {
  margin: 0 0 50px;
  color: #f2f2f2;
  font-size: 30px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -0.9px;
  text-align: left;
}

.name-breakdown {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(20px, 3vw, 48px);
  padding: clamp(28px, 3vw, 48px) 0;
}

.name-icon-bg {
  position: absolute;
  top: 50%;
  right: -20%;
  transform: translateY(-50%) rotate(-5deg);
  z-index: 0;
  width: clamp(420px, 33vw, 520px);
  height: auto;
  opacity: 0.14;
  /* filter: grayscale(1) blur(0.5px); */
  filter: blur(0.5px);
  pointer-events: none;
  user-select: none;
}

.term-col {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: clamp(15px, 1.6vw, 24px);
}

.term-item {
  cursor: pointer;
  padding: 4px 0;
}

.term-label {
  display: block;
  color: #b6b6b6;
  font-size: 28px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -0.03em;
  transition: color 0.2s ease;
}

.term-item.active .term-label {
  color: #fff;
  font-size: 28px;
  font-weight: 600;
}

.term-phrase {
  display: block;
  margin-top: 4px;
  color: #1aa7ff;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -0.03em;
}

.term-detail {
  margin: 12px 0 0;
  color: #e7e7e7;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.4;
  letter-spacing: -0.03em;
  max-width: 435px;
}

.phrase-col {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(17px, 1.9vw, 29px);
}

.phrase {
  margin: 0;
  cursor: pointer;
  color: #4f6f84;
  font-size: 32px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -0.03em;
  text-align: center;
  transition: color 0.2s ease;
}

.phrase.active {
  color: #60c2ff;
}

/* ==================================================
   Q&A
================================================== */

.qa-section {
  margin-top: 190px;
}

.qa-section h2 {
  margin: 0 0 30px;
  color: #fff;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -0.72px;
  text-align: center;
}

.qa-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.qa-card {
  min-height: 139px;
  box-sizing: border-box;
  padding: 17px 20px 20px;
  border-radius: 20px;
  background: #fff;
}

.qa-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.qa-no {
  color: #9aa3b5;
  font-size: clamp(12px, 0.95vw, 15px);
  font-weight: 700;
}

.qa-badge {
  color: #0099ff;
  font-size: 13px;
  font-weight: 700;
}

.qa-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.qa-row-sub {
  margin-top: 2px;
}

.qa-card h3 {
  margin: 0;
  color: #1a2233;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -0.54px;
}

.qa-answer {
  margin: 0;
  color: #2f6fe0;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -0.54px;
  text-align: right;
  white-space: nowrap;
}

.qa-tag {
  margin: 0;
  color: #9098ab;
  font-size: clamp(11px, 0.85vw, 13px);
}

.qa-sub {
  margin: 0;
  color: #9098ab;
  font-size: clamp(11px, 0.85vw, 13px);
  text-align: right;
}

/* ==================================================
   경고 / 팁
================================================== */

.warn-section {
  max-width: 528px;
  margin-top: 190px;
  text-align: center;
}

.warn-icon {
  width: 40.881px;
  height: auto;
  margin: 0 auto;
  margin-bottom: clamp(12px, 1.2vw, 18px);
}

.warn-section h2 {
  margin: 10px 0 60px;
  color: #fff;
  font-size: 28px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -0.84px;
}

.warn-card {
  width: 319px;
  min-height: 139px;
  max-width: 100%;
  margin: 0 auto;
  padding: clamp(24px, 2.4vw, 36px);
  border-radius: 20px;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.warn-tag {
  padding: 1px 5px;
  /* border-radius: 2px; */
  background: #0099ff;
  color: #fff;
  font-size: clamp(17px, 1.3vw, 20px);
  font-weight: 700;
  white-space: nowrap;
}

.warn-title {
  margin: 18px 0 0;
  color: #1d2c48;
  font-size: clamp(15px, 1.25vw, 19px);
  font-weight: 700;
}

.warn-desc {
  margin: 6px 0 0;
  color: var(--color-fg-muted);
  font-size: clamp(12px, 0.95vw, 15px);
}

.warn-cta {
  min-height: 42px;
  margin-top: 28px;
  padding: 10px 20px;
  border: none;
  border-radius: 999px;
  background: linear-gradient(180deg, #0099ff 0%, #0088e2 100%);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -0.48px;
  box-shadow: 0 0 5px #1a3a6a;
  cursor: pointer;
  transition: background 0.2s ease;
}

.warn-cta:hover {
  background: #2f6fe0;
}

.warn-disclaimer {
  margin: 16px 0 0;
  color: #5b667e;
  font-size: clamp(11px, 0.85vw, 13px);
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

/* ==================================================
   추천 상품
================================================== */

.reco-section {
  max-width: 1068px;
  margin-top: 190px;
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
  .detail-page {
    padding: 20px 20px 48px;
  }

  .name-breakdown {
    grid-template-columns: 1fr;
  }

  .qa-grid {
    grid-template-columns: 1fr;
  }

  .reco-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* ==================================================
   이해도 확인 팝업
================================================== */

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(8, 11, 18, 0.7);
}

.modal-card {
  width: 100%;
  max-width: 460px;
  padding: clamp(24px, 2.6vw, 36px);
  border-radius: 20px;
  background: #fff;
  text-align: center;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4);
}

.modal-card h3 {
  margin: 0;
  color: #1a2233;
  font-size: clamp(16px, 1.4vw, 20px);
  font-weight: 700;
  line-height: 1.4;
}

.modal-card p {
  margin: 10px 0 0;
  color: #7b8399;
  font-size: clamp(12px, 0.95vw, 14px);
}

.modal-actions {
  margin-top: clamp(20px, 2vw, 28px);
  display: flex;
  justify-content: center;
  gap: 10px;
}

.modal-btn {
  padding: clamp(10px, 1vw, 13px) clamp(20px, 1.8vw, 28px);
  border: none;
  border-radius: 999px;
  font-size: clamp(13px, 1vw, 15px);
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.2s ease,
    opacity 0.2s ease;
}

.modal-btn.ghost {
  background: #eef0f4;
  color: #6b7280;
}

.modal-btn.ghost:hover {
  background: #e2e5eb;
}

.modal-btn.primary {
  background: #3b82f6;
  color: #fff;
}

.modal-btn.primary:hover {
  background: #2f6fe0;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-fade-enter-active .modal-card,
.modal-fade-leave-active .modal-card {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-card,
.modal-fade-leave-to .modal-card {
  transform: scale(0.94) translateY(10px);
}

/* ==================================================
   좌측 스크롤바 (이 페이지 전용)
================================================== */

.left-scrollbar-track {
  position: fixed;
  top: 0;
  left: 0;
  width: 5px;
  height: 100vh;
  z-index: 999;
  pointer-events: none;
}

.left-scrollbar-thumb {
  position: absolute;
  left: 0;
  width: 100%;
  background: #0099ff;
  border-radius: 999px;
  transition: top 0.05s linear;
}
</style>
