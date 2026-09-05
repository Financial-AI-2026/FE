import { defineStore } from "pinia";

// QuestionIntroPage.vue의 질문 3개 → 선택한 옵션 인덱스를 백엔드 enum으로 매핑.
// 옵션 순서가 질문 문구와 함께 정의돼 있으므로(QuestionIntroPage.vue의 `questions`),
// 이 매핑도 여기 나란히 둔다 — 질문 문구가 바뀌면 여기도 같이 확인할 것.
export const HORIZON_BY_OPTION = ["UNKNOWN", "SHORT", "MID", "LONG"];
export const PURPOSE_BY_OPTION = ["CAPITAL_GAIN", "INCOME", "GROWTH"];
export const FUND_NATURE_BY_OPTION = ["SPARE", "PURPOSE"];

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
