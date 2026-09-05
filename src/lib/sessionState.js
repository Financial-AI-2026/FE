import { reactive } from 'vue'

// QuestionIntroPage(S2)의 답변을 챗봇 API(horizon/purpose/fundNature)로 연결하기 위한
// 화면 간 공유 상태. 이 프로젝트엔 Pinia/router가 없어서(App.vue의 단일 page ref로만
// 화면 전환) reactive 싱글턴으로 최소한으로 구현한다.
export const session = reactive({
  horizon: null, // 'SHORT' | 'MID' | 'LONG' | 'UNKNOWN'
  purpose: null, // 'CAPITAL_GAIN' | 'INCOME' | 'GROWTH'
  fundNature: null, // 'SPARE' | 'PURPOSE'
})

// QuestionIntroPage.vue의 3개 질문 선택지 순서 그대로 매핑한다.
const HORIZON_BY_INDEX = ['UNKNOWN', 'SHORT', 'MID', 'LONG']
const PURPOSE_BY_INDEX = ['CAPITAL_GAIN', 'INCOME', 'GROWTH']
const FUND_NATURE_BY_INDEX = ['SPARE', 'PURPOSE']

export function setProfileAnswers(answers) {
  session.horizon = HORIZON_BY_INDEX[answers[0]] ?? null
  session.purpose = PURPOSE_BY_INDEX[answers[1]] ?? null
  session.fundNature = FUND_NATURE_BY_INDEX[answers[2]] ?? null
}
