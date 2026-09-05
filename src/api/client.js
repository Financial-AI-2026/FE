// 백엔드 API 클라이언트 — fetch 래퍼 하나로 통일.
// 에러 응답 계약: { error: { code, message, field } } (ctx/docs/05_API_계약.md)

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error?.message || `요청이 실패했습니다 (${status})`);
    this.name = "ApiError";
    this.status = status;
    this.code = body?.error?.code ?? null;
    this.field = body?.error?.field ?? null;
  }
}

async function request(path, { params, signal } = {}) {
  const url = new URL(path, BASE_URL);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    }
  }

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal,
  });

  // 204 등 바디 없는 응답 대비
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new ApiError(response.status, body);
  }
  return body;
}

/** S3 — 목록/검색. `q` 없으면 전체 유니버스(표시순: 8종 우선), 있으면 부분검색. */
export function fetchEtfs(q, options) {
  return request("/api/v1/etfs", { params: { q }, ...options });
}

/** S4 — 이름 해독. */
export function fetchEtfDetail(code, options) {
  return request(`/api/v1/etfs/${encodeURIComponent(code)}`, options);
}

/** S6 — 진단 결과. horizon/purpose/fundNature 전부 필수. */
export function fetchEtfDiagnosis(code, { horizon, purpose, fundNature }, options) {
  return request(`/api/v1/etfs/${encodeURIComponent(code)}/diagnosis`, {
    params: { horizon, purpose, fund_nature: fundNature },
    ...options,
  });
}

/** S4+S6 데이터를 한 번에 (structure+diagnosis+evidence). */
export function fetchEtfContext(code, { horizon, purpose, fundNature }, options) {
  return request(`/api/v1/etfs/${encodeURIComponent(code)}/context`, {
    params: { horizon, purpose, fund_nature: fundNature },
    ...options,
  });
}

/**
 * "다른 ETF 상품도 살펴보세요!" 등 — 특정 종목 코드 목록을 정확히 그 순서대로
 * 조회. 백엔드에 `codes=` 일괄 조회 파라미터가 없어서, 코드 하나당 `GET /etfs?q=`
 * 검색 하나씩(병렬)으로 흉내낸다 — 조회 이력처럼 몇 개 안 되는 목록에만 쓸 것.
 * 개수가 많아지면 백엔드에 전용 파라미터를 추가하는 게 낫다.
 */
export async function fetchEtfsByCodes(codes) {
  const responses = await Promise.all(
    codes.map((code) => fetchEtfs(code).catch(() => null)),
  );
  const items = [];
  codes.forEach((code, i) => {
    const response = responses[i];
    if (!response) return;
    const match = [...(response.domestic ?? []), ...(response.overseas ?? [])].find(
      (item) => item.code === code,
    );
    if (match) items.push(match);
  });
  return items;
}
