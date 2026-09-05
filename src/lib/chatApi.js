// chatbot-api.md 참고 — POST /api/v1/chat, GET /api/v1/chat/suggested-questions 클라이언트.
// 이 API는 stateless라서(백엔드가 세션을 안 가짐) history/productCode 등은
// 호출부(ChatWidget)가 매번 다시 실어 보내야 한다.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// GET /api/v1/etfs — 실제 지원 종목 목록. { domestic: EtfListItem[], overseas: EtfListItem[] }
// EtfListItem: { code, name, manager, market: 'KR'|'US', ready, displayOrder }
export async function listEtfs(query) {
  const params = new URLSearchParams()
  if (query) params.set('q', query)
  const qs = params.toString()

  const res = await fetch(`${API_BASE_URL}/api/v1/etfs${qs ? `?${qs}` : ''}`)

  if (!res.ok) {
    throw new Error(`상품 목록 조회 실패 (HTTP ${res.status})`)
  }

  return res.json()
}

export async function getSuggestedQuestions({ stage, code }) {
  const params = new URLSearchParams({ stage })
  if (code) params.set('code', code)

  const res = await fetch(`${API_BASE_URL}/api/v1/chat/suggested-questions?${params}`)

  if (!res.ok) {
    throw new Error(`추천 질문 조회 실패 (HTTP ${res.status})`)
  }

  return res.json()
}

export async function postChat({
  message,
  stage,
  productCode,
  horizon,
  purpose,
  fundNature,
  compareProductCode = null,
  previousProductCode = null,
  history = [],
}) {
  const res = await fetch(`${API_BASE_URL}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      stage,
      productCode,
      horizon,
      purpose,
      fundNature,
      compareProductCode,
      previousProductCode,
      history,
    }),
  })

  if (res.status === 400) {
    const body = await res.json().catch(() => null)
    const err = new Error(body?.error?.message || '지원하지 않는 종목입니다.')
    err.code = body?.error?.code || 'BAD_REQUEST'
    throw err
  }

  if (!res.ok) {
    throw new Error(`챗봇 응답 실패 (HTTP ${res.status})`)
  }

  return res.json()
}

// chatbot-api.md에 문서화된 지원 종목 목록(참고용 스냅샷). SearchPage.vue는 더 이상
// 이 상수를 쓰지 않고 listEtfs()로 실시간 목록을 받아온다 — 실제 지원 종목이 바뀌면
// 이 상수는 오래된 값이 될 수 있으니 화면 렌더링 근거로 삼지 말 것.
// brand는 ProductCard.vue의 로고/배너 색상 키('kodex' | 'tiger' | 'proshares' | 'globalx')와 맞춘 것.
export const SUPPORTED_PRODUCTS = [
  { code: '102110', name: 'TIGER 200', issuer: '미래에셋자산운용', brand: 'tiger' },
  { code: '133690', name: 'TIGER 미국나스닥100', issuer: '미래에셋자산운용', brand: 'tiger' },
  { code: '418660', name: 'TIGER 미국나스닥100레버리지(합성)', issuer: '미래에셋자산운용', brand: 'tiger' },
  { code: '435420', name: 'TIGER 미국나스닥100채권혼합50', issuer: '미래에셋자산운용', brand: 'tiger' },
  { code: '441680', name: 'TIGER 미국나스닥100커버드콜(합성)', issuer: '미래에셋자산운용', brand: 'tiger' },
  { code: '448290', name: 'TIGER 미국S&P500(H)', issuer: '미래에셋자산운용', brand: 'tiger' },
  { code: 'QYLD', name: 'Global X NASDAQ 100 Covered Call ETF', issuer: 'Global X', brand: 'globalx' },
  { code: 'TQQQ', name: 'ProShares UltraPro QQQ', issuer: 'ProShares', brand: 'proshares' },
]
