<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import ProductCard from '../components/ProductCard.vue'
import BaseBadge from '../components/base/BaseBadge.vue'
import ChatWidget from '../components/ChatWidget.vue'

const emit = defineEmits(['back', 'diagnose', 'retry'])

const productName = 'TIGER 미국S&P500레버리지(합성 H)'

const showUnderstandModal = ref(false)
const chatWidgetRef = ref(null)

// S4(이름 해독) 단계 추천 칩 — 이 상품 이름 토큰(레버리지/합성/H) 기준.
const chatSuggestions = ['레버리지가 뭐예요?', '합성은 무슨 뜻이에요?', '환헤지가 뭔가요?']

const scrollbar = reactive({ heightPct: 100, topPct: 0 })

function updateScrollbar() {
  const doc = document.documentElement
  const viewportH = window.innerHeight
  const fullH = doc.scrollHeight
  const heightPct = Math.min(100, (viewportH / fullH) * 100)
  const maxScroll = fullH - viewportH
  const scrollPct = maxScroll > 0 ? window.scrollY / maxScroll : 0

  scrollbar.heightPct = heightPct
  scrollbar.topPct = (100 - heightPct) * scrollPct
}

function openUnderstandModal() {
  showUnderstandModal.value = true
}

function rereadFromTop() {
  showUnderstandModal.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
  // 이해 확인에서 되돌아온 경우, 질문 경로를 다시 안내한다.
  chatWidgetRef.value?.pingHint()
}

function confirmUnderstood() {
  showUnderstandModal.value = false
  emit('diagnose')
}

onMounted(() => {
  document.body.classList.add('hide-native-scrollbar')
  updateScrollbar()
  window.addEventListener('scroll', updateScrollbar, { passive: true })
  window.addEventListener('resize', updateScrollbar)
})

onUnmounted(() => {
  document.body.classList.remove('hide-native-scrollbar')
  window.removeEventListener('scroll', updateScrollbar)
  window.removeEventListener('resize', updateScrollbar)
})

const terms = [
  {
    label: 'TIGER',
    phrase: '미래에셋이 만든',
    detail:
      'TIGER는 미래에셋자산운용의 ETF 브랜드예요. 어떤 회사가 이 상품을 만들고 운용하는지 알려주는 부분이에요.',
  },
  {
    label: '미국S&P500',
    phrase: '미국 큰 회사 500개를',
    detail: '미국을 대표하는 500개 대기업의 주가로 만든 지수예요. 이 지수를 그대로 따라가도록 설계됐어요.',
  },
  {
    label: '레버리지',
    phrase: '2배로 따라가는데',
    detail: '기초지수가 하루 동안 오르내리는 만큼의 2배로 움직이도록 설계된 상품이에요.',
  },
  {
    label: '합성',
    phrase: '실제 주식은 사지 않고',
    detail: '실제 주식을 직접 사는 대신, 증권사와 계약(스왑)을 맺어 수익률만 그대로 받아오는 방식이에요.',
  },
  {
    label: 'H',
    phrase: '환율 걱정은 없는 상품',
    detail: '환헤지(Hedge)가 적용돼 있어서, 환율이 오르내려도 수익률에 영향을 주지 않아요.',
  },
]

const activeTerm = ref(0)

const qa = [
  { q: '어떤 지수를 따라가나요?', a: 'S&P500 따라가요', tag: '기초지수', sub: 'S&P500은 미국의 500개 회사를 말해요' },
  { q: '몇 배로 움직이나요?', a: '2배로 움직여요', tag: '레버리지 배율', sub: '단, 하루 단위로 2배를 계산해요.' },
  {
    q: '주식을 직접 사는건가요?',
    a: '아니요! 증권사와 계약만 맺어요',
    tag: '복제방식',
    sub: 'S&P500은 미국의 500개 회사를 말해요',
  },
  {
    q: '돈을 나눠주나요?',
    a: '아니요 다시 굴려요',
    tag: '분배 정책',
    sub: 'S&P500은 미국의 500개 회사를 말해요',
  },
  {
    q: '환율에 영향은 받나요?',
    a: '없어요. 막아두는 장치가 있어요',
    tag: '환헤지 여부',
    sub: 'S&P500은 미국의 500개 회사를 말해요',
  },
  { q: '수수료는 얼마 인가요?', a: '1년에 0.25%예요', tag: '총보수', sub: '100만원당 2,500원이에요' },
]

const recommended = [
  { brand: 'kodex' },
  { brand: 'kodex' },
  { brand: 'kodex' },
  { brand: 'globalx' },
  { brand: 'kodex' },
  { brand: 'kodex' },
  { brand: 'globalx' },
  { brand: 'kodex' },
]

const recoTrack = ref(null)

function scrollRecoNext() {
  const el = recoTrack.value
  if (!el) return
  const amount = el.clientWidth * 0.8
  const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4
  el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + amount, behavior: 'smooth' })
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
        :style="{ height: scrollbar.heightPct + '%', top: scrollbar.topPct + '%' }"
      />
    </div>

    <header class="top-bar">
      <div class="avatar" />

      <div class="badges">
        <BaseBadge tone="purple">로그인 필요해요</BaseBadge>
        <BaseBadge tone="purple">개인정보 미수집</BaseBadge>
      </div>
    </header>

    <button type="button" class="back-btn" @click="emit('back')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15 18 9 12l6-6" />
      </svg>
    </button>

    <section class="hero-section">
      <h1>{{ productName }}</h1>
      <p class="issuer">미래에셋자산운용</p>

      <div class="promo-banner">
        <span class="promo-tiger">TIGER</span>
        <span class="promo-etf">ETF</span>
      </div>
    </section>

    <section class="name-section">
      <h2>이름에 대해서 먼저 알려드릴게요!</h2>

      <div class="name-breakdown">
        <svg class="name-icon-bg" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

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

          <h3>{{ item.q }}</h3>
          <p class="qa-answer">{{ item.a }}</p>
          <p class="qa-tag">{{ item.tag }}</p>
          <p class="qa-sub">{{ item.sub }}</p>
        </div>
      </div>
    </section>

    <section class="warn-section">
      <svg class="warn-icon" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>

      <h2>이건 꼭 알고 투자해야해요!</h2>

      <div class="warn-card">
        <span class="warn-tag">레버리지 ETF, 항상 2배일까요?</span>

        <div class="warn-icon-doc">
          <svg viewBox="0 0 24 24" fill="none" stroke="#3b5ba0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="8" y1="13" x2="16" y2="13" />
            <line x1="8" y1="17" x2="13" y2="17" />
          </svg>
        </div>

        <p class="warn-title">레버리지, 항상 2배는 아니에요</p>
        <p class="warn-desc">하루 수익률 기준으로만 2배를 따라가요.</p>
      </div>

      <button type="button" class="warn-cta" @click="openUnderstandModal">{{ productName }} 진단하러 가기</button>

      <p class="warn-disclaimer">
        이 정보는 특정 매수 권유가 아니며, 누구나 동일하게 조회하는 사전 이해 목적의 구조 분석 결과입니다.
      </p>

      <div class="source-box">
        <p class="source-label">*상품설명서(투자설명서) 근거 원문</p>
        <p class="source-text">
          "본 투자신탁은 기초지수의 일별수익률의 2배수의 수익률을 추적하는 것을 기본 투자목적으로 하고 있습니다.
          이때 하루가 아닌 2영업일 이상의 투자기간에 걸쳐 실현되는 실제 누적수익률은 동 기간 내 기초지수의
          누적수익률의 정확히 2배 수익률과 크게 괴리되거나 반대 방향을 나타낼 수 있습니다."
        </p>
      </div>
    </section>

    <section class="reco-section">
      <h2>다른 ETF 상품도 살펴보세요!</h2>

      <div class="reco-carousel">
        <div ref="recoTrack" class="reco-grid">
          <div v-for="(r, i) in recommended" :key="i" class="reco-item">
            <ProductCard :brand="r.brand" />
          </div>
        </div>

        <button type="button" class="reco-next" aria-label="다음 상품 보기" @click="scrollRecoNext">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </button>
      </div>
    </section>

    <ChatWidget
      ref="chatWidgetRef"
      stage="s4"
      :suggestions="chatSuggestions"
      :disabled="showUnderstandModal"
      @retry="emit('retry')"
      @view-products="emit('back')"
    />

    <Transition name="modal-fade">
      <div v-if="showUnderstandModal" class="modal-backdrop">
        <div class="modal-card">
          <h3>{{ productName }}에 대해서 이해하셨나요?</h3>
          <p>이해하신 후 진단하면 나에게 필요한지 더 정확하게 판단할 수 있어요!</p>

          <div class="modal-actions">
            <button type="button" class="modal-btn ghost" @click="rereadFromTop">다시 읽어볼게요</button>
            <button type="button" class="modal-btn primary" @click="confirmUnderstood">네, 이해했어요</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.detail-page {
  position: relative;
  min-height: 100svh;
  box-sizing: border-box;
  padding: clamp(24px, 2.4vw, 40px) clamp(28px, 5vw, 80px) 60px;
  background: linear-gradient(180deg, var(--color-bg-page-deep) 0%, var(--color-bg-page-mid) 30%, var(--color-bg-page) 100%);
}

.top-bar {
  display: flex;
  align-items: center;
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

.back-btn {
  margin-top: 18px;
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
  max-width: 920px;
  margin: 0 auto;
}

/* ==================================================
   HERO
================================================== */

.hero-section {
  text-align: center;
  padding-top: clamp(28px, 2.6vw, 44px);
}

.hero-section h1 {
  margin: 0;
  color: #fff;
  font-size: clamp(20px, 2vw, 30px);
  font-weight: 700;
}

.issuer {
  margin: 6px 0 0;
  color: #4da3ff;
  font-size: clamp(13px, 1vw, 16px);
}

.promo-banner {
  margin-top: clamp(20px, 2vw, 32px);
  padding: clamp(28px, 3vw, 48px);
  border-radius: 20px;
  background: linear-gradient(120deg, #fff8f2 0%, #ffb37a 60%, #ff8a3d 100%);
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 10px;
}

.promo-tiger {
  color: #ff5f2e;
  font-size: clamp(26px, 2.8vw, 40px);
  font-weight: 800;
  letter-spacing: -0.5px;
}

.promo-etf {
  color: #1d2c48;
  font-size: clamp(26px, 2.8vw, 40px);
  font-weight: 800;
}

/* ==================================================
   이름 뜯어보기
================================================== */

.name-section {
  margin-top: clamp(48px, 4.5vw, 72px);
}

.name-section h2 {
  margin: 0 0 clamp(20px, 2vw, 30px);
  color: #fff;
  font-size: clamp(17px, 1.5vw, 22px);
  font-weight: 700;
  text-align: center;
}

.name-breakdown {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(20px, 3vw, 48px);
  padding: clamp(28px, 3vw, 48px) 0;
  overflow: hidden;
}

.name-icon-bg {
  position: absolute;
  top: 50%;
  right: 6%;
  transform: translateY(-50%);
  z-index: 0;
  width: clamp(160px, 16vw, 260px);
  height: clamp(160px, 16vw, 260px);
  color: var(--color-fg-soft);
  opacity: 0.16;
  filter: blur(0.5px);
  pointer-events: none;
  user-select: none;
}

.term-col {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: clamp(10px, 1.2vw, 18px);
}

.term-item {
  cursor: pointer;
  padding: 4px 0;
}

.term-label {
  display: block;
  color: #5b667e;
  font-size: clamp(15px, 1.3vw, 19px);
  font-weight: 600;
  transition: color 0.2s ease;
}

.term-item.active .term-label {
  color: #fff;
  font-size: clamp(22px, 2.2vw, 32px);
  font-weight: 800;
}

.term-phrase {
  display: block;
  margin-top: 6px;
  color: #4da3ff;
  font-size: clamp(13px, 1vw, 16px);
  font-weight: 600;
}

.term-detail {
  margin: 8px 0 0;
  color: #8891a6;
  font-size: clamp(12px, 0.95vw, 15px);
  line-height: 1.6;
  max-width: 380px;
}

.phrase-col {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: clamp(10px, 1vw, 16px);
}

.phrase {
  margin: 0;
  cursor: pointer;
  color: #4a5468;
  font-size: clamp(14px, 1.2vw, 19px);
  font-weight: 500;
  transition: color 0.2s ease, font-weight 0.2s ease;
}

.phrase.active {
  color: #4da3ff;
  font-weight: 700;
}

/* ==================================================
   Q&A
================================================== */

.qa-section {
  margin-top: clamp(48px, 4.5vw, 72px);
}

.qa-section h2 {
  margin: 0 0 clamp(20px, 2vw, 30px);
  color: #fff;
  font-size: clamp(17px, 1.5vw, 22px);
  font-weight: 700;
  text-align: center;
}

.qa-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(14px, 1.4vw, 22px);
}

.qa-card {
  padding: clamp(16px, 1.6vw, 24px);
  border-radius: 16px;
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
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3b82f6;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qa-card h3 {
  margin: 0 0 8px;
  color: #1a2233;
  font-size: clamp(14px, 1.15vw, 18px);
  font-weight: 700;
}

.qa-answer {
  margin: 0 0 10px;
  color: #2f6fe0;
  font-size: clamp(14px, 1.1vw, 17px);
  font-weight: 700;
}

.qa-tag {
  margin: 0;
  color: #9098ab;
  font-size: clamp(11px, 0.85vw, 13px);
}

.qa-sub {
  margin: 2px 0 0;
  color: #9098ab;
  font-size: clamp(11px, 0.85vw, 13px);
}

/* ==================================================
   경고 / 팁
================================================== */

.warn-section {
  margin-top: clamp(48px, 4.5vw, 72px);
  text-align: center;
}

.warn-icon {
  width: 30px;
  height: 30px;
}

.warn-section h2 {
  margin: 10px 0 clamp(20px, 2vw, 30px);
  color: #fff;
  font-size: clamp(17px, 1.5vw, 22px);
  font-weight: 700;
}

.warn-card {
  padding: clamp(24px, 2.4vw, 36px);
  border-radius: 18px;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.warn-tag {
  padding: 5px 12px;
  border-radius: 999px;
  background: #3b82f6;
  color: #fff;
  font-size: clamp(11px, 0.9vw, 14px);
  font-weight: 600;
}

.warn-icon-doc {
  width: clamp(56px, 5vw, 76px);
  height: clamp(56px, 5vw, 76px);
  margin: 18px 0 14px;
  border-radius: 14px;
  background: #eef4ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.warn-icon-doc svg {
  width: 50%;
  height: 50%;
}

.warn-title {
  margin: 0;
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
  margin-top: clamp(20px, 2vw, 28px);
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
  padding: clamp(18px, 1.8vw, 26px);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--color-border-default);
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

/* ==================================================
   추천 상품
================================================== */

.reco-section {
  margin-top: clamp(48px, 4.5vw, 72px);
}

.reco-section h2 {
  margin: 0 0 16px;
  color: #dfe3ec;
  font-size: clamp(15px, 1.2vw, 19px);
  font-weight: 600;
}

.reco-carousel {
  position: relative;
}

.reco-grid {
  display: flex;
  gap: clamp(14px, 1.4vw, 22px);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  padding-bottom: 4px;
  scrollbar-width: none;
}

.reco-grid::-webkit-scrollbar {
  display: none;
}

.reco-item {
  flex: 0 0 auto;
  width: clamp(160px, 21vw, 220px);
  scroll-snap-align: start;
}

.reco-next {
  position: absolute;
  top: 50%;
  right: -18px;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(20, 28, 46, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #cfd8ea;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.15s ease, color 0.2s ease;
}

.reco-next svg {
  width: 18px;
  height: 18px;
}

.reco-next:hover {
  background: rgba(59, 130, 246, 0.16);
  border-color: rgba(77, 163, 255, 0.4);
  color: #4da3ff;
  transform: translateY(-50%) scale(1.06);
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

  .reco-item {
    width: clamp(140px, 42vw, 200px);
  }

  .reco-next {
    right: -8px;
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
  transition: background 0.2s ease, opacity 0.2s ease;
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
  width: 3px;
  height: 100vh;
  z-index: 999;
  pointer-events: none;
}

.left-scrollbar-thumb {
  position: absolute;
  left: 0;
  width: 100%;
  background: #3b82f6;
  border-radius: 999px;
  transition: top 0.05s linear;
}
</style>
