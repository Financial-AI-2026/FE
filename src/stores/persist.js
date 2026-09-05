// Pinia 스토어를 sessionStorage에만 영속화하는 최소 플러그인.
// localStorage 금지 (CLAUDE.md §3-3, 사용자 입력 무저장 — 서버 DB뿐 아니라
// 브라우저에 남기는 범위도 "이 탭이 닫히면 사라지는" sessionStorage로 한정한다).

const STORAGE_PREFIX = "etf-diagnosis:";

export function sessionStoragePersistPlugin({ store }) {
  const key = STORAGE_PREFIX + store.$id;

  try {
    const saved = sessionStorage.getItem(key);
    if (saved) {
      store.$patch(JSON.parse(saved));
    }
  } catch {
    // 손상된 값이면 무시하고 초기 상태로 시작
  }

  store.$subscribe((_mutation, state) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(state));
    } catch {
      // 사생활 보호 모드/용량 초과 등은 조용히 무시 — 세션 지속은 편의 기능일 뿐
    }
  });
}
