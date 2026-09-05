import { defineStore } from "pinia";

// QuestionIntroPage.vue의 질문 3개 → 선택한 옵션 인덱스를 백엔드 enum으로 매핑.
// 옵션 순서가 질문 문구와 함께 정의돼 있으므로(QuestionIntroPage.vue의 `questions`),
// 이 매핑도 여기 나란히 둔다 — 질문 문구가 바뀌면 여기도 같이 확인할 것.
export const HORIZON_BY_OPTION = ["UNKNOWN", "SHORT", "MID", "LONG"];
export const PURPOSE_BY_OPTION = ["CAPITAL_GAIN", "INCOME", "GROWTH"];
export const FUND_NATURE_BY_OPTION = ["SPARE", "PURPOSE"];

// /search 이후 화면 상단에 "선택한 투자성향" 배지로 보여줄 라벨.
const HORIZON_LABELS = {
  UNKNOWN: "투자기간 미정",
  SHORT: "단기투자",
  MID: "중기투자",
  LONG: "장기투자",
};
const PURPOSE_LABELS = {
  CAPITAL_GAIN: "시세차익형",
  INCOME: "정기현금흐름형",
  GROWTH: "장기성장형",
};
const FUND_NATURE_LABELS = {
  SPARE: "여유자금",
  PURPOSE: "목적자금",
};

export const useSessionStore = defineStore("session", {
  state: () => ({
    horizon: null, // "SHORT" | "MID" | "LONG" | "UNKNOWN"
    purpose: null, // "CAPITAL_GAIN" | "INCOME" | "GROWTH"
    fundNature: null, // "SPARE" | "PURPOSE"
    viewedCodes: [], // 조회했던 종목 code 이력 (표시 순서 유지용, 중복 없이 추가)
    currentCode: null, // 지금 보고 있는 종목
  }),
  getters: {
    /** S3 이후 화면(S4~S6)이 조건 3개를 전부 갖췄는지. 하나라도 없으면
     * 진단 API(horizon/purpose/fund_nature 전부 필수)를 호출할 수 없다. */
    hasConditions: (state) => Boolean(state.horizon && state.purpose && state.fundNature),
    conditionParams: (state) => ({
      horizon: state.horizon,
      purpose: state.purpose,
      fundNature: state.fundNature,
    }),
    /** 선택한 투자성향 3가지를 배지에 뿌릴 라벨 배열로. 미선택 항목은 건너뛴다. */
    profileBadges: (state) =>
      [
        HORIZON_LABELS[state.horizon],
        PURPOSE_LABELS[state.purpose],
        FUND_NATURE_LABELS[state.fundNature],
      ].filter(Boolean),
  },
  actions: {
    /** QuestionIntroPage의 `answers`(스텝 인덱스 → 선택 옵션 인덱스)를 받아 저장. */
    setAnswers(answers) {
      this.horizon = HORIZON_BY_OPTION[answers[0]] ?? null;
      this.purpose = PURPOSE_BY_OPTION[answers[1]] ?? null;
      this.fundNature = FUND_NATURE_BY_OPTION[answers[2]] ?? null;
    },
    setCurrentCode(code) {
      this.currentCode = code;
      if (code && !this.viewedCodes.includes(code)) {
        this.viewedCodes.push(code);
      }
    },
    resetConditions() {
      this.horizon = null;
      this.purpose = null;
      this.fundNature = null;
    },
  },
});
