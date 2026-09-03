<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import searchDocumentIcon from "../assets/icons/icon-search-document.png";
import BrandLogo from "../components/base/BrandLogo.vue";

const emit = defineEmits(["finish"]);

const questions = [
  {
    title: "ETF를 얼마나 오래 가지고 계실 계획이신가요?",
    subtitle: "어떤 상품은 오래 들고 있을수록 유리할 수 있어요",
    options: [
      "잘 모르겠어요",
      "1년 안에 팔 것 같아요",
      "1~5년 정도\n가지고 있을 거예요.",
      "5년 이상 길게 생각 중이에요.",
    ],
  },
  {
    title: "투자한 돈으로 무엇을 하고 싶으세요?",
    subtitle: "같은 상품도 무엇을 원하는지에 따라 알맞고 안 맞고가 갈려요",
    options: [
      "가격이 올랐을 때 팔아서 차익을 얻고 싶어요",
      "매달·정기적으로 현금을 받고 싶어요",
      "오래 묻어두고 자산을 불리고 싶어요",
    ],
  },
  {
    title: "투자한 돈은 어떤 성격의 돈인가요?",
    subtitle: "꼭 필요한 돈이라면 더 조심해서 알려드릴게요",
    options: [
      "없어져도 크게 문제 없는 여윳돈이에요",
      "나중에 꼭 필요한 목적자금\n(주택·노후·학자금 등)\n하는 돈이에요",
    ],
  },
];

const started = ref(false);
const step = ref(0);

const answers = reactive({});

const current = computed(() => questions[step.value]);

const previousQuestionTitle = computed(() => {
  if (step.value === 0) return null;
  return questions[step.value - 1].title;
});

const progressPct = computed(() => {
  return ((step.value + 1) / questions.length) * 100;
});

function select(i) {
  answers[step.value] = i;
}

function next() {
  if (answers[step.value] === undefined) return;

  if (step.value < questions.length - 1) {
    step.value += 1;
  } else {
    emit("finish");
  }
}

function prev() {
  if (step.value > 0) {
    step.value -= 1;
  }
}

onMounted(() => {
  setTimeout(() => {
    started.value = true;
  }, 2600);
});
</script>

<template>
  <div class="question-intro" :class="{ started }">
    <!-- =========================
         TOP BAR
    ========================== -->
    <header class="top-bar">
      <BrandLogo />

      <div v-if="started" class="progress-track">
        <div class="progress-fill" :style="{ width: progressPct + '%' }" />
      </div>
    </header>

    <!-- =========================
         저장 안내 문구
    ========================== -->
    <div class="note-wrap" :class="{ settled: started }">
      <p class="note">
        진단 기록은 저장되지 않아 나중에 다시 확인할 수 없어요.
      </p>
    </div>

    <!-- =========================
         인트로 / 이전 질문
    ========================== -->
    <div class="intro-title-wrap" :class="{ settled: started }">
      <!-- 첫 번째 질문일 때 -->
      <h1 v-if="step === 0" class="intro-title">
        안녕하세요!<br />
        이제부터 ETF를 쉽게 진단해드릴게요!
      </h1>

      <!-- 두 번째 질문부터 -->
      <h1 v-else class="intro-title previous-title">
        {{ previousQuestionTitle }}
      </h1>
    </div>

    <!-- =========================
         문서 + 펜 아이콘
    ========================== -->
    <div class="icon-stage" :class="{ settled: started }">
      <img :src="searchDocumentIcon" class="rise-icon" alt="" />
    </div>

    <!-- =========================
         QUESTION
    ========================== -->
    <transition name="qrise">
      <div v-if="started" :key="step" class="question-block">
        <div class="question-head">
          <h2 class="q-title">
            {{ current.title }}
          </h2>

          <p class="q-sub">
            {{ current.subtitle }}
          </p>
        </div>

        <!-- 선택 카드 -->
        <div
          class="options"
          :class="{
            'options-3': current.options.length === 3,
            'options-2': current.options.length === 2,
          }"
        >
          <button
            v-for="(opt, i) in current.options"
            :key="i"
            type="button"
            class="option"
            :class="{
              selected: answers[step] === i,
            }"
            @click="select(i)"
          >
            <span>
              {{ opt }}
            </span>
          </button>
        </div>

        <!-- 이전 / 다음 -->
        <div class="nav">
          <button v-if="step > 0" type="button" class="btn ghost" @click="prev">
            이전으로
          </button>

          <button
            type="button"
            class="btn primary"
            :disabled="answers[step] === undefined"
            @click="next"
          >
            다음으로
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* =================================================
   PAGE
================================================= */

.question-intro {
  position: relative;

  width: 100%;
  height: 100svh;
  min-height: 680px;

  box-sizing: border-box;

  overflow: hidden;

  background: linear-gradient(
    180deg,
    #0f0f0f 0%,
    #0f0f0f 44%,
    #111318 56%,
    #151c27 67%,
    #1a2636 80%,
    #213450 100%
  );

  color: #ffffff;
}

/* =================================================
   TOP BAR
================================================= */

.top-bar {
  position: absolute;

  z-index: 20;

  top: 20px;
  left: 30px;
  right: 30px;

  display: flex;
  align-items: center;

  height: 44px;
}

/* =================================================
   PROGRESS
================================================= */

.progress-track {
  position: absolute;

  left: 50px;
  right: 0;

  top: 50%;

  height: 4px;

  transform: translateY(-50%);

  border-radius: 999px;

  overflow: hidden;

  background: rgba(255, 255, 255, 0.12);
}

.progress-fill {
  height: 100%;

  border-radius: inherit;

  background: #3b82f6;

  transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

/* =================================================
   SAVE NOTE
================================================= */

.note-wrap {
  position: absolute;

  z-index: 10;

  left: 50%;

  /*
    인트로 화면에서 안내 문구를
    기존보다 위쪽으로
  */
  top: 48%;

  transform: translate(-50%, -50%);

  transition:
    top 0.8s cubic-bezier(0.16, 1, 0.3, 1),
    left 0.8s cubic-bezier(0.16, 1, 0.3, 1),
    right 0.8s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.note {
  margin: 0;

  color: #4da3ff;

  font-size: 20px;
  font-weight: 400;

  line-height: 1.5;

  white-space: nowrap;

  opacity: 0;

  animation: intro-rise 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;

  animation-delay: 0.75s;

  transition:
    font-size 0.8s ease,
    color 0.8s ease;
}

/* 질문 시작 후 우측 상단 */

.note-wrap.settled {
  left: auto;

  top: 20px;
  right: 30px;

  transform: none;
}

.note-wrap.settled .note {
  animation: none;

  opacity: 1;

  color: rgba(255, 255, 255, 0.28);

  font-size: 10px;

  font-weight: 400;

  white-space: nowrap;
}

/* =================================================
   INTRO / PREVIOUS QUESTION
================================================= */

.intro-title-wrap {
  position: absolute;

  z-index: 10;

  left: 50%;

  /*
    화면 중앙보다 살짝 위
  */
  top: 35%;

  width: 90%;

  transform: translate(-50%, -50%);

  text-align: center;

  transition:
    top 0.85s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.85s cubic-bezier(0.16, 1, 0.3, 1);
}

.intro-title {
  margin: 0;

  color: #ffffff;

  font-size: 42px;
  font-weight: 700;

  line-height: 1.4;

  letter-spacing: -0.8px;

  opacity: 0;

  animation: intro-rise 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;

  animation-delay: 0.15s;

  transition:
    font-size 0.8s ease,
    color 0.8s ease,
    line-height 0.8s ease;
}

/* 질문 시작 후 */

.intro-title-wrap.settled {
  top: 115px;

  transform: translateX(-50%);
}

.intro-title-wrap.settled .intro-title {
  animation: none;

  opacity: 1;

  color: rgba(38, 91, 141, 0.55);

  font-size: 13px;

  font-weight: 500;

  line-height: 1.45;

  letter-spacing: -0.1px;
}

/* 이전 질문 */

.intro-title-wrap.settled .previous-title {
  color: rgba(77, 163, 255, 0.45);

  font-size: 16px;

  font-weight: 500;

  line-height: 1.45;

  letter-spacing: -0.15px;
}

/* =================================================
   INTRO ICON
================================================= */

.icon-stage {
  position: absolute;

  z-index: 1;

  left: 50%;

  /*
    아이콘도 중앙에 더 가깝게
  */
  top: 66%;

  width: 310px;
  height: 310px;

  transform: translate(-50%, -50%);

  display: flex;

  align-items: center;
  justify-content: center;

  pointer-events: none;

  transition:
    left 1s cubic-bezier(0.16, 1, 0.3, 1),
    top 1s cubic-bezier(0.16, 1, 0.3, 1),
    transform 1s cubic-bezier(0.16, 1, 0.3, 1);
}

/* 실제 아이콘 */

.rise-icon {
  width: 280px;
  height: 280px;
  object-fit: contain;

  opacity: 0;

  filter: drop-shadow(0 16px 32px rgba(60, 100, 220, 0.4));

  animation: intro-rise 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;

  animation-delay: 1.35s;

  transition:
    opacity 1s ease,
    filter 1s ease;
}

/* 질문 시작 후 배경 아이콘 */

.icon-stage.settled {
  left: 72%;
  top: 90%;

  width: 460px;
  height: 460px;

  transform: translate(-50%, -50%) scale(2);
}

.icon-stage.settled .rise-icon {
  width: 100%;
  height: 100%;

  animation: none;

  opacity: 0.1;

  filter: blur(1px) drop-shadow(0 15px 40px rgba(70, 120, 230, 0.18));
}

/* =================================================
   INTRO ANIMATION
================================================= */

@keyframes intro-rise {
  from {
    opacity: 0;

    transform: translateY(35px);
  }

  to {
    opacity: 1;

    transform: translateY(0);
  }
}

/* =================================================
   QUESTION AREA
================================================= */

.question-block {
  position: absolute;

  z-index: 5;

  left: 50%;

  /*
    질문 전체를 화면 중심 근처에 배치
  */
  top: 54%;

  width: min(90%, 1180px);

  transform: translate(-50%, -50%);

  display: flex;

  flex-direction: column;

  align-items: center;

  text-align: center;

  margin-top: -10px;
}

/* =================================================
   QUESTION HEAD
================================================= */

.question-head {
  display: flex;

  flex-direction: column;

  align-items: center;

  gap: 12px;
}

.q-title {
  margin: 0;

  max-width: 860px;

  color: #ffffff;

  font-size: 30px;
  font-weight: 700;

  line-height: 1.4;

  letter-spacing: -0.6px;
}

.q-sub {
  margin: 0;

  color: #4da3ff;

  font-size: 15px;
  font-weight: 500;

  line-height: 1.5;
}

/* =================================================
   OPTIONS
================================================= */

.options {
  width: 100%;

  margin-top: 52px;

  display: grid;

  grid-template-columns: repeat(4, minmax(0, 1fr));

  gap: 28px;
}

/* 3개 */

.options.options-3 {
  max-width: 900px;

  grid-template-columns: repeat(3, minmax(0, 1fr));
}

/* 2개 */

.options.options-2 {
  max-width: 620px;

  grid-template-columns: repeat(2, minmax(0, 1fr));
}

/* =================================================
   OPTION CARD
================================================= */

.option {
  width: 100%;

  height: 250px;

  padding: 28px 24px;

  box-sizing: border-box;

  display: flex;

  align-items: center;
  justify-content: center;

  border: none;

  border-radius: 16px;

  background: #e5e5e5;

  color: #16191f;

  font-size: 17px;
  font-weight: 600;

  line-height: 1.5;

  text-align: center;

  word-break: keep-all;

  cursor: pointer;

  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);

  transition:
    background 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.option span {
  display: block;

  max-width: 200px;

  white-space: pre-line;
}

.option:hover {
  transform: translateY(-3px);

  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* 선택 */

.option.selected {
  background: #3b82f6;

  color: #ffffff;

  box-shadow: 0 10px 24px rgba(59, 130, 246, 0.22);
}

/* =================================================
   NAVIGATION
================================================= */

.nav {
  display: flex;

  align-items: center;
  justify-content: center;

  gap: 12px;

  margin-top: 58px;
}

.btn {
  min-width: 88px;

  padding: 13px 26px;

  border: none;

  border-radius: 999px;

  font-size: 14px;
  font-weight: 600;

  line-height: 1;

  cursor: pointer;

  transition:
    background 0.2s ease,
    transform 0.15s ease;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.4;
  transform: none;
}

.btn.primary {
  background: #3b82f6;

  color: #ffffff;
}

.btn.primary:hover {
  background: #2f6fe0;
}

.btn.primary:disabled:hover {
  background: #3b82f6;
}

.btn.ghost {
  background: rgba(255, 255, 255, 0.1);

  color: #d6dbe5;
}

.btn.ghost:hover {
  background: rgba(255, 255, 255, 0.15);
}

/* =================================================
   QUESTION TRANSITION
================================================= */

.qrise-enter-active {
  transition:
    opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.qrise-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.qrise-enter-from {
  opacity: 0;

  transform: translate(-50%, calc(-50% + 45px));
}

.qrise-enter-to {
  opacity: 1;

  transform: translate(-50%, -50%);
}

.qrise-leave-to {
  opacity: 0;

  transform: translate(-50%, calc(-50% - 15px));
}

/* =================================================
   낮은 데스크톱
================================================= */

@media (max-height: 820px) and (min-width: 901px) {
  .intro-title-wrap.settled {
    top: 150px;
  }

  .question-block {
    top: 55%;

    width: min(90%, 1080px);
  }

  .q-title {
    font-size: 27px;
  }

  .q-sub {
    font-size: 14px;
  }

  .options {
    margin-top: 40px;

    gap: 24px;
  }

  .option {
    height: 215px;

    font-size: 16px;
  }

  .nav {
    margin-top: 40px;
  }
}

/* =================================================
   TABLET
================================================= */

@media (max-width: 900px) {
  .question-intro {
    height: auto;

    min-height: 100svh;

    overflow-y: auto;
  }

  .top-bar {
    left: 24px;
    right: 24px;
  }

  .note-wrap.settled {
    right: 24px;
  }

  .question-block {
    position: relative;

    top: auto;
    left: auto;

    width: calc(100% - 48px);

    margin: 180px auto 0;

    transform: none;
  }

  .q-title {
    font-size: 26px;
  }

  .q-sub {
    font-size: 14px;
  }

  .options {
    max-width: 720px;

    grid-template-columns: repeat(2, minmax(0, 1fr));

    gap: 18px;
  }

  .options.options-3 {
    max-width: 720px;

    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .options.options-2 {
    max-width: 580px;
  }

  .option {
    height: 190px;

    font-size: 15px;
  }

  .icon-stage.settled {
    left: 80%;

    transform: translate(-50%, -50%) scale(1.65);
  }

  .qrise-enter-from {
    transform: translateY(40px);
  }

  .qrise-enter-to {
    transform: translateY(0);
  }

  .qrise-leave-to {
    transform: translateY(-15px);
  }
}

/* =================================================
   MOBILE
================================================= */

@media (max-width: 520px) {
  .question-intro {
    height: auto;

    min-height: 100svh;

    padding-bottom: 50px;
  }

  .top-bar {
    top: 18px;

    left: 20px;
    right: 20px;
  }

  .avatar {
    width: 92px;
    height: auto;
  }

  .progress-track {
    left: 42px;
  }

  .note-wrap {
    top: 47%;
  }

  .note {
    font-size: 14px;
  }

  .note-wrap.settled {
    top: 62px;
    right: 20px;
  }

  .note-wrap.settled .note {
    font-size: 8px;
  }

  .intro-title-wrap {
    top: 34%;
  }

  .intro-title {
    font-size: 26px;
  }

  .intro-title-wrap.settled {
    top: 108px;
  }

  .intro-title-wrap.settled .intro-title {
    font-size: 11px;
  }

  .icon-stage {
    top: 65%;

    width: 220px;
    height: 220px;
  }

  .rise-icon {
    width: 205px;
    height: 205px;
  }

  .question-block {
    width: auto;

    margin: 175px 20px 0;
  }

  .question-head {
    gap: 9px;
  }

  .q-title {
    font-size: 23px;
  }

  .q-sub {
    font-size: 12px;
  }

  .options,
  .options.options-3,
  .options.options-2 {
    width: 100%;

    max-width: none;

    margin-top: 30px;

    grid-template-columns: 1fr;

    gap: 12px;
  }

  .option {
    height: 125px;

    padding: 20px 18px;

    font-size: 14px;
  }

  .option span {
    max-width: 250px;
  }

  .nav {
    margin-top: 30px;
  }

  .btn {
    min-width: 82px;

    padding: 12px 22px;

    font-size: 13px;
  }

  .icon-stage.settled {
    left: 80%;
    top: 87%;

    transform: translate(-50%, -50%) scale(1.25);
  }
}
</style>
