// chatbot-api.md 참고 — POST /api/v1/chat, GET /api/v1/chat/suggested-questions 클라이언트.
// 이 API는 stateless라서(백엔드가 세션을 안 가짐) history/productCode 등은
// 호출부(ChatWidget)가 매번 다시 실어 보내야 한다.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

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
