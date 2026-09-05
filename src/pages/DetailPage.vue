<script setup>
import { ref, reactive, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import ProductCard from "../components/ProductCard.vue";
import BaseBadge from "../components/base/BaseBadge.vue";
import BrandLogo from "../components/base/BrandLogo.vue";
import ChatWidget from "../components/ChatWidget.vue";
import magnifierIcon from "../assets/icons/icon-search.png";
import warningIcon from "../assets/icons/warning-triangle.svg";
import tigerLogo from "../assets/icons/tiger.png";
import { useSessionStore } from "../stores/session";

// 디자인 데모용 목업 — 실제 상품 조회/진단 API 연동은 아직 붙이지 않음
// (백엔드 서빙 준비 전까지 의도적으로 미연동, code는 라우팅에만 사용).
const props = defineProps({ code: { type: String, required: true } });

const router = useRouter();
const session = useSessionStore();

const loading = ref(false);
const errorMessage = ref(null);

const etf = {
  code: props.code,
  market: "KR",
  hiddenInsight: {
    summary: "레버리지, 항상 2배는 아니에요",
    body: "하루 수익률 기준으로만 2배를 따라가요.",
  },
  evidence: [
    {
      quote:
        "본 투자신탁은 기초지수의 일별수익률의 2배수의 수익률을 추적하는 것을 기본 투자목적으로 하고 있습니다. 이때 하루가 아닌 2영업일 이상의 투자기간에 걸쳐 실현되는 실제 누적수익률은 동 기간 내 기초지수의 누적수익률의 정확히 2배 수익률과 크게 괴리되거나 반대 방향을 나타낼 수 있습니다.",
    },
  ],
};

const productName = "TIGER 미국S&P500레버리지(합성 H)";
const heroLogo = tigerLogo;

// "다른 ETF 상품도 살펴보세요" — 디자인 데모용 목업, 고정 8개.
const recommended = [
  { code: "069500", name: "KODEX 200", manager: "삼성자산운용", ready: true },
  { code: "091160", name: "KODEX 반도체", manager: "삼성자산운용", ready: true },
  { code: "371460", name: "TIGER 차이나전기차SOLACTIVE", manager: "미래에셋자산운용", ready: true },
  { code: "GLOBALX01", name: "Global X Robotics & AI ETF", manager: "Global X", ready: true },
  { code: "195930", name: "KODEX 미국S&P500TR", manager: "삼성자산운용", ready: true },
  { code: "GLOBALX02", name: "Global X SuperDividend ETF", manager: "Global X", ready: false },
  { code: "310970", name: "KODEX 200TR", manager: "삼성자산운용", ready: true },
  { code: "133690", name: "TIGER 미국나스닥100", manager: "미래에셋자산운용", ready: true },
];

const showUnderstandModal = ref(false);
const chatWidgetRef = ref(null);

// S4(이름 해독) 단계 추천 칩.
const chatSuggestions = ["레버리지가 뭐예요?", "합성은 무슨 뜻이에요?", "환헤지가 뭔가요?"];

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

// 이름 토큰 분해 — 디자인 데모용 목업.
const terms = [
  {
    label: "TIGER",
    phrase: "미래에셋이 만든",
    detail:
      "TIGER는 미래에셋자산운용의 ETF 브랜드예요. 어떤 회사가 이 상품을 만들고 운용하는지 알려주는 부분이에요.",
  },
  {
    label: "미국S&P500",
    phrase: "미국 큰 회사 500개를",
    detail:
      "미국을 대표하는 500개 대기업의 주가로 만든 지수예요. 이 지수를 그대로 따라가도록 설계됐어요.",
  },
  {
    label: "레버리지",
    phrase: "2배로 따라가는데",
    detail: "기초지수가 하루 동안 오르내리는 만큼의 2배로 움직이도록 설계된 상품이에요.",
  },
  {
    label: "합성",
    phrase: "실제 주식은 사지 않고",
    detail:
      "실제 주식을 직접 사는 대신, 증권사와 계약(스왑)을 맺어 수익률만 그대로 받아오는 방식이에요.",
  },
  {
    label: "H",
    phrase: "환율 걱정은 없는 상품",
    detail: "환헤지(Hedge)가 적용돼 있어서, 환율이 오르내려도 수익률에 영향을 주지 않아요.",
  },
];

const activeTerm = ref(0);

// 구조 Q&A — 디자인 데모용 목업.
const qa = [
  {
    q: "어떤 지수를 따라가나요?",
    a: "S&P500 따라가요",
    tag: "기초지수",
    sub: "S&P500은 미국의 500개 회사를 말해요",
  },
  {
    q: "몇 배로 움직이나요?",
    a: "2배로 움직여요",
    tag: "레버리지 배율",
    sub: "단, 하루 단위로 2배를 계산해요.",
  },
  {
    q: "주식을 직접 사는건가요?",
    a: "아니요! 증권사와 계약만 맺어요",
    tag: "복제방식",
    sub: "S&P500은 미국의 500개 회사를 말해요",
  },
  {
    q: "돈을 나눠주나요?",
    a: "아니요 다시 굴려요",
    tag: "분배 정책",
    sub: "S&P500은 미국의 500개 회사를 말해요",
  },
  {
    q: "환율에 영향은 받나요?",
    a: "없어요. 막아두는 장치가 있어요",
    tag: "환헤지 여부",
    sub: "S&P500은 미국의 500개 회사를 말해요",
  },
  {
    q: "수수료는 얼마 인가요?",
    a: "1년에 0.25%예요",
    tag: "총보수",
    sub: "100만원당 2,500원이에요",
  },
];

const hiddenInsightEvidence = etf.evidence[0];

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

    <header class="top-bar">
      <BrandLogo />

      <!-- <div class="badges">
        <BaseBadge tone="purple">로그인 불필요</BaseBadge>
        <BaseBadge tone="purple">개인정보 미수집</BaseBadge>
      </div> -->
    </header>

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
      :suggestions="chatSuggestions"
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

.top-bar {
  position: relative;
  z-index: 5;
  display: flex;
  align-items: center;
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
  padding-top: 126px;
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
