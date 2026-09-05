<script setup>
import iconCheck from "../assets/icons/icon-check.png";
import iconSearch from "../assets/icons/icon-search.png";
import iconDocument from "../assets/icons/icon-document.png";
import iconTarget from "../assets/icons/target.png";
import earthImg from "../assets/images/earth.png";
import { useRouter } from "vue-router";
import BaseBadge from "../components/base/BaseBadge.vue";
import PageHeader from "../components/base/PageHeader.vue";

const router = useRouter();

const iconMap = {
  check: iconCheck,
  search: iconSearch,
  doc: iconDocument,
  target: iconTarget,
};

const cards = [
  {
    no: "01.",
    title: "나의 상황을 선택해보세요",
    desc: "나에게 맞는 카드를 골라,\n여러 ETF를 만나보세요.",
    icon: "check",
  },
  {
    no: "02.",
    title: "선택한 ETF를 쉽게 알아보세요",
    desc: "어려운 ETF 이름과 특징을 쉽게 풀어\n설명해드려요.",
    icon: "search",
  },
  {
    no: "03.",
    title: "투자설명서, 쉽게 살펴보세요",
    desc: "해당 ETF의 투자설명서를 바탕으로\n주요 위험 요소를 쉽게 풀어 알려드려요.",
    icon: "doc",
  },
  {
    no: "04.",
    title: "진단결과를 본 후 고민해보세요!",
    desc: "살펴본 ETF의 주요 특징과 정보를\n비교하며, 더 잘 맞는 ETF를 찾아보세요.",
    icon: "target",
  },
];

const stars = Array.from({ length: 34 }, () => ({
  top: `${(Math.random() * 55).toFixed(1)}%`,
  left: `${(Math.random() * 100).toFixed(1)}%`,
  size: `${(Math.random() * 1.6 + 0.8).toFixed(1)}px`,
  delay: `${(Math.random() * 4).toFixed(2)}s`,
  duration: `${(2.5 + Math.random() * 3).toFixed(2)}s`,
}));
</script>

<template>
  <div class="landing">
    <!-- =========================
         HERO
    ========================== -->
    <section class="hero">
      <!-- 별 -->
      <!-- <div class="stars">
        <span
          v-for="(s, i) in stars"
          :key="i"
          class="star"
          :style="{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            animationDelay: s.delay,
            animationDuration: s.duration,
          }"
        />
      </div> -->

      <!-- 지구 -->
      <div class="globe-wrap">
        <div class="globe">
          <img :src="earthImg" class="globe-photo" alt="" />

          <!-- 대기 -->
          <!-- <div class="atmosphere" /> -->
        </div>
      </div>

      <!-- 상단 -->
      <PageHeader>
        <div class="badges">
          <BaseBadge tone="purple">로그인 불필요</BaseBadge>
          <BaseBadge tone="purple">개인정보 미수집</BaseBadge>
        </div>
      </PageHeader>

      <!-- HERO CONTENT -->
      <div class="hero-content">
        <h1>
          나의 상황에 맞는<br />
          ETF를 진단해보세요!
        </h1>

        <p>
          모든 ETF의 투자설명서를 대신 읽고, 당신 기준으로 위험을 알려드려요
        </p>

        <button
          class="cta"
          type="button"
          @click="router.push({ name: 'questions' })"
        >
          ETF 진단하러 가기
        </button>
      </div>
    </section>

    <!-- =========================
         INFO
    ========================== -->
    <section class="info">
      <div class="info-inner">
        <h2>서비스가 궁금하다면!</h2>

        <div class="cards">
          <article v-for="c in cards" :key="c.no" class="card">
            <span class="no">
              {{ c.no }}
            </span>

            <h3>
              {{ c.title }}
            </h3>

            <p>
              {{ c.desc }}
            </p>

            <img :src="iconMap[c.icon]" class="icon" alt="" />
          </article>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ==================================================
   전체
================================================== */

.landing {
  width: 100%;
  min-height: 100svh;

  background: #081422;

  overflow-x: hidden;
}

/* ==================================================
   HERO
================================================== */

.hero {
  position: relative;

  width: 100%;
  height: 525px;
  min-height: 525px;

  box-sizing: border-box;

  display: flex;
  flex-direction: column;

  padding: 24px 48px 0;

  overflow: hidden;

  background:
    radial-gradient(
      ellipse at 50% -15%,
      rgba(39, 75, 140, 0.3) 0%,
      rgba(15, 34, 68, 0.18) 32%,
      transparent 58%
    ),
    linear-gradient(180deg, #07101e 0%, #050b14 55%, #03070d 100%);
}

/* ==================================================
   별
================================================== */

.stars {
  position: absolute;
  inset: 0;

  z-index: 0;

  pointer-events: none;
}

.star {
  position: absolute;

  border-radius: 50%;

  background: #ffffff;

  animation-name: twinkle;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}

@keyframes twinkle {
  0%,
  100% {
    opacity: 0.15;
  }

  50% {
    opacity: 0.9;
  }
}

/* ==================================================
   지구
================================================== */

.globe-wrap {
  position: absolute;

  top: 0;
  left: 50%;

  /* width: clamp(760px, 72.2vw, 1040px); */

  width: min(100vw, 1440px);

  aspect-ratio: 1 / 1;

  z-index: 1;

  pointer-events: none;

  transform: translate(-50%, -81%);
}

/* 지구 본체 */

.globe {
  position: relative;

  width: 100%;
  height: 100%;

  overflow: hidden;

  border-radius: 50%;

  background: #050914;

  border: 0;

  /* box-shadow:
    0 0 45px rgba(58, 113, 204, 0.18),
    0 0 120px rgba(37, 82, 159, 0.18); */
}

/* 실제 지구 사진 */

.globe-photo {
  position: absolute;
  inset: 0;

  z-index: 2;

  width: 100%;
  height: 100%;

  object-fit: cover;

  transform: rotate(180deg);

  opacity: 0.2;

  filter: blur(5px);
}

/* 대기 */

.atmosphere {
  position: absolute;
  inset: -28px;

  z-index: 1;

  border-radius: 50%;

  background: radial-gradient(
    circle at 50% 50%,
    transparent 0%,
    transparent 61%,
    rgba(47, 128, 237, 0.5) 72%,
    rgba(47, 128, 237, 0.28) 84%,
    transparent 96%
  );

  filter: blur(18px);
}

/* ==================================================
   TOP BAR
================================================== */

.badges {
  display: flex;

  gap: 10px;
}

/* ==================================================
   HERO CONTENT
================================================== */

.hero-content {
  position: absolute;

  z-index: 3;

  display: flex;
  flex-direction: column;

  align-items: center;

  text-align: center;

  top: 174px;
  left: 50%;
  width: min(100% - 40px, 720px);

  transform: translateX(-50%);
}

.hero-content h1 {
  margin: 0 0 14px;

  color: #ffffff;

  font-size: 48px;

  font-weight: 600;

  line-height: 1.4;

  letter-spacing: -1.44px;
}

.hero-content p {
  margin: 0 0 32px;

  color: #e6e6e6;

  font-size: 18px;
  font-weight: 600;

  line-height: 1.4;
  letter-spacing: -0.54px;
}

/* ==================================================
   CTA
================================================== */

.cta {
  min-height: 42px;
  padding: 10px 20px;

  border: 0;

  border-radius: 999px;

  background: #0099ff;

  color: #ffffff;

  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -0.48px;

  cursor: pointer;

  box-shadow: 0 4px 18px rgba(59, 130, 246, 0.18);

  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.cta:hover {
  background: #0086dd;

  transform: translateY(-2px);
}

/* ==================================================
   INFO

   중요:
   남은 화면 높이를 억지로 채우지 않음
================================================== */

.info {
  width: 100%;

  box-sizing: border-box;

  /*
    위 / 좌우 / 아래

    마지막 26px이
    카드 밑 여백
  */
  padding: 78px clamp(60px, 7.9vw, 114px) 76px;

  background: linear-gradient(180deg, #0a1728 0%, #081422 100%);

  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.info-inner {
  width: 100%;

  max-width: 1212px;

  margin: 0 auto;
}

/* ==================================================
   서비스가 궁금하다면
================================================== */

.info h2 {
  margin: 0 0 24px;

  color: #ffffff;

  font-size: 24px;
  font-weight: 600;

  line-height: 1.4;
  letter-spacing: -0.03em;
}

/* ==================================================
   카드 GRID
================================================== */

.cards {
  width: 100%;

  display: grid;

  grid-template-columns: repeat(4, minmax(0, 1fr));

  gap: 36px;
}

/* ==================================================
   카드
================================================== */

.card {
  position: relative;

  min-height: 288px;

  box-sizing: border-box;

  padding: 20px;

  display: flex;
  flex-direction: column;

  background: #1d2e49;

  border: 1px solid rgba(116, 153, 213, 0.14);

  border-radius: 20px;

  transition:
    transform 0.25s ease,
    background 0.25s ease,
    border-color 0.25s ease;
}

.card:hover {
  transform: translateY(-4px);

  background: #24365a;

  border-color: rgba(150, 180, 230, 0.22);
}

/* ==================================================
   번호
================================================== */

.card .no {
  display: block;

  margin-bottom: 32px;

  color: #0f1826;

  font-size: 32px;
  font-weight: 500;

  line-height: 1.4;
  letter-spacing: -0.96px;
}

/* ==================================================
   카드 제목
================================================== */

.card h3 {
  margin: 0 0 12px;

  color: #edf1f8;

  font-size: 20px;
  font-weight: 600;

  line-height: 1.4;
  letter-spacing: -0.6px;
}

/* ==================================================
   카드 설명
================================================== */

.card p {
  margin: 0;

  flex: 1;

  color: #92abd3;

  font-size: 15px;
  font-weight: 600;

  line-height: 1.4;
  letter-spacing: -0.45px;

  white-space: pre-line;
}

/* ==================================================
   카드 아이콘
================================================== */

.card .icon {
  width: clamp(46px, 4.7vw, 68px);
  height: clamp(46px, 4.6vw, 66px);
  object-fit: contain;

  flex-shrink: 0;

  align-self: flex-start;

  margin-top: 16px;
}

/* ==================================================
   큰 화면
================================================== */

@media (min-width: 1600px) {
  .info-inner {
    max-width: 1480px;
  }

  .hero {
    height: 525px;
  }

  .card {
    min-height: 288px;
  }
}

/* ==================================================
   노트북
================================================== */

@media (max-width: 1200px) {
  .hero {
    height: clamp(460px, 52svh, 500px);
    min-height: 460px;
    padding: 18px 40px 0;
  }

  .info {
    padding: 30px 40px 24px;
  }

  .cards {
    gap: 16px;
  }

  .card {
    min-height: 240px;

    padding: 20px 18px;
  }
}

/* ==================================================
   TABLET
================================================== */

@media (max-width: 900px) {
  .hero {
    height: 500px;
    min-height: 500px;
  }

  .globe-wrap {
    width: 700px;
  }

  .cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .card {
    height: 210px;
  }
}

/* ==================================================
   MOBILE
================================================== */

@media (max-width: 520px) {
  .hero {
    height: 480px;

    min-height: 480px;

    padding: 20px;
  }

  .globe-wrap {
    width: 520px;
  }

  .badges {
    gap: 6px;
  }

  .badges :deep(.base-badge.purple) {
    height: 28px;
    padding: 0 10px;
    font-size: 10px;
  }

  .hero-content {
    top: 150px;
    width: calc(100% - 40px);
  }

  .hero-content h1 {
    font-size: 25px;
  }

  .hero-content p {
    max-width: 310px;

    font-size: 12px;
  }

  .cta {
    padding: 10px 21px;

    font-size: 13px;
  }

  .info {
    padding: 28px 20px 22px;
  }

  .info h2 {
    margin-bottom: 18px;

    font-size: 16px;
  }

  .cards {
    grid-template-columns: 1fr;

    gap: 14px;
  }

  .card {
    height: 190px;

    padding: 19px 18px 17px;
  }

  .card .no {
    margin-bottom: 13px;

    font-size: 19px;
  }

  .card h3 {
    font-size: 13px;
  }

  .card p {
    font-size: 11px;
  }

  .card .icon {
    width: 42px;
    height: 42px;

    margin-top: 8px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .star {
    animation: none;
  }
}
</style>
