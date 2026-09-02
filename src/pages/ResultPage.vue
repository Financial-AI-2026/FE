<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import ProductCard from '../components/ProductCard.vue'

const emit = defineEmits(['back', 'retry', 'open'])

const productName = 'TIGER 미국S&P500레버리지(합성 H)'

const points = [
  {
    tag: '주식을 직접 사지 않고 증권사와 약속만 했어요',
    desc: '주식 대신 증권사와 계약만 맺는 방식이에요.\n증권사에 문제가 생기면 투자에 영향을 줄 수 있어요.',
  },
  {
    tag: '환율이 오르내려도 크게 상관없어요',
    desc: '환율이 바뀌어도 영향을 덜 받도록 만들었어요.\n대신 이를 위한 비용이 들어요.',
  },
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

let observer = null

onMounted(() => {
  const els = document.querySelectorAll('.reveal')
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view')
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
  )
  els.forEach((el) => observer.observe(el))
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>

<template>
  <div class="result-page">
    <header class="top-bar">
      <div class="avatar" />

      <div class="badges">
        <span class="badge">로그인 필요해요</span>
        <span class="badge">개인정보 미수집</span>
      </div>
    </header>

    <button type="button" class="back-btn" @click="emit('back')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15 18 9 12l6-6" />
      </svg>
    </button>

    <section class="hero-section">
      <h1 class="reveal">
        <span class="hl">오래 들고 있으면 손해 볼 수 있어요</span>
      </h1>

      <p class="hero-sub reveal">
        이 상품은 하루 기준으로 2배를 따라가도록 매일 다시 계산(리밸런싱)합니다.<br />
        오르내림이 반복되면 5년 뒤에는 따라가는 지수(기초지수)가 제자리여도 원금이 줄어들 수 있습니다.
      </p>
    </section>

    <section class="sim-section">
      <h2 class="reveal">이 상품에 100만원을 넣었다면 어떻게 됐을까요?</h2>

      <div class="sim-box reveal" />

      <p class="sim-desc reveal">
        따라가는 지수는 제자리인데, 이 상품은 18만원이 사라졌습니다.<br />
        오르내림이 반복될수록 차이가 커집니다.
      </p>
    </section>

    <section class="also-section">
      <div class="also-icon reveal">!</div>
      <h2 class="reveal">이런 점도 있어요!</h2>

      <div class="also-cards">
        <div v-for="p in points" :key="p.tag" class="also-card reveal">
          <span class="also-tag">{{ p.tag }}</span>
          <p class="also-desc">{{ p.desc }}</p>
        </div>
      </div>

      <div class="source-box reveal">
        <p class="source-label">*상품설명서(투자설명서) 근거 원문</p>
        <p class="source-text">
          "기초지수가 일정 기간 후 최초 수준을 회복하더라도, 일별 재산정 구조로 인해 펀드의 누적수익률은
          최초 수준을 회복하지 못할 수 있습니다."
        </p>
      </div>

      <button type="button" class="retry-btn reveal" @click="emit('retry')">조건 수정해서 다시 진단받기</button>
    </section>

    <section class="reco-section reveal">
      <h2>다른 ETF 상품도 살펴보세요!</h2>

      <div class="reco-carousel">
        <div ref="recoTrack" class="reco-grid">
          <div v-for="(r, i) in recommended" :key="i" class="reco-item">
            <ProductCard :brand="r.brand" @open="emit('open')" />
          </div>
        </div>

        <button type="button" class="reco-next" aria-label="다음 상품 보기" @click="scrollRecoNext">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.result-page {
  min-height: 100svh;
  box-sizing: border-box;
  padding: clamp(24px, 2.4vw, 40px) clamp(28px, 5vw, 80px) 60px;
  background: linear-gradient(180deg, #0b1220 0%, #070c16 30%, #05070d 100%);
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

.badge {
  font-size: 12px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 999px;
  color: #c9a8ff;
  background: rgba(168, 116, 255, 0.14);
  border: 1px solid rgba(168, 116, 255, 0.35);
  white-space: nowrap;
}

.back-btn {
  margin-top: 18px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.06);
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
  transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
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
  margin: clamp(20px, 2vw, 30px) auto 0;
  max-width: 560px;
  color: #8891a6;
  font-size: clamp(13px, 1vw, 15px);
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
  width: 26px;
  height: 26px;
  margin: 0 auto 10px;
  border-radius: 50%;
  background: #3b82f6;
  color: #fff;
  font-size: 14px;
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
  text-align: left;
}

.also-card {
  padding: clamp(18px, 1.8vw, 26px);
  border-radius: 16px;
  background: #fff;
}

.also-tag {
  display: inline-block;
  padding: 5px 12px;
  border-radius: 999px;
  background: #3b82f6;
  color: #fff;
  font-size: clamp(11px, 0.9vw, 13px);
  font-weight: 600;
}

.also-desc {
  margin: 12px 0 0;
  color: #6b7690;
  font-size: clamp(12px, 0.95vw, 14px);
  line-height: 1.6;
}

.source-box {
  margin-top: clamp(24px, 2.4vw, 36px);
  padding: clamp(18px, 1.8vw, 26px);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
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
  .result-page {
    padding: 20px 20px 48px;
  }

  .also-cards {
    grid-template-columns: 1fr;
  }

  .reco-item {
    width: clamp(140px, 42vw, 200px);
  }

  .reco-next {
    right: -8px;
  }
}
</style>
