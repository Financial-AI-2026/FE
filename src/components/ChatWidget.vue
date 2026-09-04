<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import chatbotLogo from '../assets/images/chat_logo.png'

const props = defineProps({
  // 화면(S4/S6)마다 다른 추천 질문 칩 — 클릭해도 전송되지 않는 예시 텍스트일 뿐이다.
  suggestions: {
    type: Array,
    default: () => ['커버드콜이 뭐예요?', '합성은 무슨 뜻이에요?', '환헤지가 뭔가요?'],
  },
  // S4-2(이해 확인 딤 처리) · S5(분석 중) 동안 버튼을 비활성화하기 위한 prop.
  disabled: {
    type: Boolean,
    default: false,
  },
  // 화면 진입 시 안내 말풍선을 자동으로 띄울지 여부.
  autoHint: {
    type: Boolean,
    default: true,
  },
  // 답변 정책이 단계별로 갈리는 시나리오(SC-03/04/06)를 위한 현재 화면 단계.
  stage: {
    type: String,
    default: 's4', // 's4' | 's6'
  },
})

const emit = defineEmits(['retry', 'view-products'])

const open = ref(false)
const draft = ref('')
const messages = ref([])
const bodyRef = ref(null)
const showHint = ref(false)
let hintTimer = null

// SC-01 용어 설명 — 정확히 일치하는 질문에 대한 사전 정의.
const glossary = {
  '커버드콜이 뭐예요?':
    '커버드콜은 주식을 보유하면서 동시에 그 주식에 대한 콜옵션을 파는 전략이에요. 옵션을 팔아서 받는 프리미엄만큼 추가 수익을 얻지만, 주가가 크게 오르면 그 이익은 제한돼요.',
  '레버리지가 뭐예요?':
    '레버리지는 기초지수가 하루 동안 움직이는 만큼의 배수(예: 2배)로 더 크게 움직이도록 설계된 구조예요. 오를 때도, 내릴 때도 그만큼 더 크게 움직여요.',
  '합성은 무슨 뜻이에요?':
    '합성은 실제 주식을 사는 대신 증권사와 계약(스왑)을 맺어서 그 수익률만큼을 받아오는 방식이에요. 실물 없이도 지수를 그대로 따라갈 수 있다는 장점이 있어요.',
  '환헤지가 뭔가요?':
    '환헤지는 환율이 오르내려도 수익률에 영향을 주지 않도록 미리 조치해두는 걸 말해요. 대신 그만큼의 비용(헤지 비용)이 들어가요.',
  '이 상품, 제 조건에 맞나요?':
    '위쪽 진단 결과에 표시된 경고가 회원님이 선택하신 조건과 어떻게 어긋나는지를 정리한 거예요. 화면에 나온 경고 카드를 함께 확인해보세요.',
  '왜 이런 결과가 나왔나요?':
    '회원님이 선택한 보유 기간·목적 조건과 이 상품의 구조(하루 단위 재계산 등)가 맞지 않는 부분이 있어서예요. 위쪽에서 어떤 조건이 어긋났는지 확인하실 수 있어요.',
  '매수 전에 뭘 더 확인해야 하나요?':
    '이 상품의 보수, 복제방식(합성/실물), 환헤지 여부, 그리고 투자설명서 원문을 함께 확인해보시길 권해드려요. 화면에 이미 정리되어 있어요.',
}

const fallbackAnswer =
  '잘 이해하지 못했어요. 다시 한번 말씀해주시겠어요? 아래 추천 질문을 참고하셔도 좋아요.'

// chatbot.md 3~5장의 답변 정책을 규칙 기반으로 흉내낸다.
// 실제 LLM 없이도 "근거 없는 질문은 거절/대체 답변으로 처리한다"는 원칙을 지키기 위한 것.
function resolveIntent(raw, stage) {
  const q = raw.trim()

  if (glossary[q]) return { kind: 'normal', text: glossary[q] }

  // EX-04 · 대화 맥락을 벗어난 질문
  if (['안녕', '날씨', '너 누구', '심심', '뭐해'].some((k) => q.includes(k))) {
    return {
      kind: 'normal',
      text: '저는 ETF 상품의 구조를 설명해드리는 도우미예요. 투자 상품에 대한 질문만 답변드릴 수 있어요.',
    }
  }

  // SC-09 · 서비스 정체성 (SC-10의 "추천" 키워드보다 먼저 검사)
  if ((q.includes('추천') && q.includes('왜')) || q.includes('이 서비스') || (q.includes('정보') && q.includes('어디서'))) {
    return {
      kind: 'normal',
      text: '저희는 상품을 추천하는 서비스가 아니라, 사기 전에 무엇을 알아야 하는지 알려드리는 서비스예요.\n추천을 하려면 어떤 상품이 더 낫다고 판단해야 하는데, 그 판단은 사람마다 목적이 달라서 저희가 대신할 수 없어요.\n대신 관심 있는 상품의 구조를 투자설명서에서 찾아내고, 회원님 조건에서 주의할 점을 알려드려요.',
    }
  }

  // SC-10 · 추천 요청 ❌ 거절
  if (['추천', '뭘 사', '뭐가 나아', '골라'].some((k) => q.includes(k))) {
    return {
      kind: 'reject',
      text: '저는 특정 상품을 추천하지 않아요.\n어떤 상품이 더 낫다는 판단은 사람마다 목적이 달라서 대신 내려드릴 수 없어요.\n대신 관심 있는 상품을 선택하시면, 그 상품의 구조와 회원님 조건에서 주의할 점을 알려드릴 수 있어요.',
      action: { label: '상품 목록 보기', event: 'view-products' },
    }
  }

  // SC-11 · 예측 요청 ❌ 거절
  if (['오를까', '전망', '어떻게 될'].some((k) => q.includes(k))) {
    return {
      kind: 'reject',
      text: '앞으로 가격이 어떻게 될지는 말씀드릴 수 없어요. 저는 시장을 예측하지 않거든요.\n대신 이 상품이 어떤 구조로 움직이는지는 설명해드릴 수 있어요.',
    }
  }

  // SC-12 · 매매 타이밍 요청 ❌ 거절
  if (['지금 사', '언제 팔', '저점'].some((k) => q.includes(k))) {
    return {
      kind: 'reject',
      text: '언제 사고팔지는 말씀드릴 수 없어요. 투자 시점 판단은 회원님이 하셔야 하는 부분이에요.\n다만 이 상품은 보유 기간에 따라 결과가 크게 달라질 수 있어요.',
      action: { label: '내 조건 바꾸기', event: 'retry' },
    }
  }

  // SC-13 · 수익 계산 요청 ❌ 거절
  if (q.includes('얼마 벌') || q.includes('얼마 넣어') || (q.includes('분배금') && q.includes('얼마'))) {
    return {
      kind: 'reject',
      text: '얼마를 벌 수 있는지는 계산해드릴 수 없어요. 수익은 시장 상황과 운용 결과에 따라 달라지기 때문이에요.\n다만 이 상품은 1년에 한 번, 회계기간이 끝날 때만 소액을 분배해요. 매달 현금이 필요하시다면 이 구조는 맞지 않을 수 있어요.',
    }
  }

  // SC-08 · 미지원 종목 질문
  if (['코덱스', 'kodex', 'spy', '삼성전자', '카카오', '애플'].some((k) => q.toLowerCase().includes(k))) {
    return {
      kind: 'normal',
      text: '지금은 이 8개 상품만 분석할 수 있어요.\n\n[국내] TIGER 미국나스닥100레버리지(합성) · TIGER 미국나스닥100커버드콜(합성) · TIGER 미국나스닥100채권혼합50 · TIGER 미국나스닥100 · TIGER 미국S&P500(H) · TIGER 200\n[해외] ProShares UltraPro QQQ(TQQQ) · Global X NASDAQ 100 Covered Call ETF(QYLD)\n\n투자설명서를 미리 분석해둔 상품들이라 그래요. 앞으로 분석 가능한 상품을 계속 늘려갈 계획입니다.',
      action: { label: '상품 목록 보기', event: 'view-products' },
    }
  }

  // SC-06 · 위험도 질문 (대체 답변, S6에서만 실제 경고를 언급)
  if (q.includes('위험') || q.includes('안전')) {
    return {
      kind: 'normal',
      text:
        stage === 's6'
          ? "위험도를 숫자나 등급으로 매기지는 않아요. 같은 상품도 목적에 따라 위험의 성격이 달라지기 때문이에요.\n대신 지금 조건에서는 '오래 들고 있으면 손해 볼 수 있어요'와 '주식을 직접 사지 않고 증권사와 약속만 했어요', 이 2가지가 어긋나요. 위쪽 진단 결과에서 확인해보세요."
          : '위험도를 숫자나 등급으로 매기지는 않아요. 같은 상품도 어떤 목적으로 사느냐에 따라 위험의 성격이 완전히 달라지기 때문이에요.',
    }
  }

  // SC-07 · 손실 가능성 질문 (일반론만)
  if (['손해', '원금', '잃을'].some((k) => q.includes(k))) {
    return {
      kind: 'normal',
      text: "네, 모든 투자에는 원금 손실 가능성이 있어요. 이 상품도 예외가 아니에요.\n다만 얼마나 손실이 날지는 시장 상황에 따라 달라서 미리 말씀드릴 수 없어요. 이 상품은 구조상 '오래 들고 있으면 손해 볼 수 있다'는 점을 특히 주의하셔야 해요.",
    }
  }

  // SC-02 · 구조 질문
  if (['하루', '뭘 담고', '실제로 뭘'].some((k) => q.includes(k))) {
    return {
      kind: 'normal',
      text: '이 상품은 하루 기준으로 지수의 배수를 맞추도록 설계돼 있어요. 매일 장이 끝나면 다시 계산해서 다음 날 또 배수를 맞춰요.\n그래서 이틀 이상 보유하면, 지수가 움직인 만큼의 배수가 그대로 나오지 않을 수 있어요.\n\n📄 투자설명서 근거: "본 투자신탁은 기초지수의 일별수익률의 2배수의 수익률을 추적하는 것을 기본 투자목적으로 하고 있습니다."',
    }
  }

  // SC-04 · 조건 대조 질문 (S6 전용)
  if (stage === 's6' && ((q.includes('년') && (q.includes('들고') || q.includes('보유'))) || q.includes('짧게 사고팔'))) {
    return {
      kind: 'normal',
      text: "보유 기간을 바꿔서 봐도, 하루 단위로 재계산되는 구조 자체는 똑같아서 며칠만 지나도 차이가 생길 수 있어요.\n다만 1년 안에 파실 계획이라면 '오래 들고 있으면 손해' 경고는 사라져요.\n직접 조건을 바꿔서 확인해보실 수 있어요.",
      action: { label: '내 조건 바꾸기', event: 'retry' },
    }
  }

  // SC-03 · 판정 이유 질문 (S6 전용)
  if (stage === 's6' && (q.includes('안 맞') || (q.includes('경고') && q.includes('왜')) || q.includes('뭐가 문제'))) {
    return {
      kind: 'normal',
      text: '회원님이 선택하신 조건에서는 이 상품이 2가지 지점에서 어긋나요.\n· 오래 들고 있으면 손해 볼 수 있어요\n· 주식을 직접 사지 않고 증권사와 약속만 했어요\n위쪽 진단 결과에서 자세히 확인해보세요.',
    }
  }

  return null
}

function toggle() {
  if (props.disabled) return
  open.value = !open.value
  if (open.value) showHint.value = false
}

function pingHint() {
  if (props.disabled || open.value) return
  showHint.value = true
  clearTimeout(hintTimer)
  hintTimer = setTimeout(() => {
    showHint.value = false
  }, 4000)
}

defineExpose({ pingHint })

onMounted(() => {
  if (props.autoHint) pingHint()
})

onUnmounted(() => {
  clearTimeout(hintTimer)
})

function scrollToBottom() {
  nextTick(() => {
    if (bodyRef.value) bodyRef.value.scrollTop = bodyRef.value.scrollHeight
  })
}

function send(text) {
  const question = text.trim()
  if (!question) return

  messages.value.push({ role: 'user', text: question })
  messages.value.push({ role: 'ai', text: '', typing: true, kind: 'normal', action: null })
  const aiIndex = messages.value.length - 1
  draft.value = ''
  scrollToBottom()

  setTimeout(() => {
    const intent = resolveIntent(question, props.stage)
    if (intent) {
      messages.value[aiIndex] = { role: 'ai', typing: false, text: intent.text, kind: intent.kind, action: intent.action || null }
    } else {
      messages.value[aiIndex] = { role: 'ai', typing: false, text: fallbackAnswer, kind: 'normal', action: null }
    }
    scrollToBottom()
  }, 1100)
}

function sendDraft() {
  send(draft.value)
}

function runAction(action) {
  if (!action) return
  emit(action.event)
  open.value = false
}

// 답변 데이터에 들어 있는 줄바꿈과 <br> 태그만 허용한다.
// 다른 HTML은 이스케이프해 답변 문자열이 마크업으로 실행되지 않게 한다.
function formatAnswer(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&lt;br\s*\/?&gt;/gi, '<br>')
    .replace(/\n/g, '<br>')
}
</script>

<template>
  <Teleport to="body">
    <div class="chat-anchor">
      <Transition name="hint-fade">
        <div v-if="showHint && !open" class="chat-hint">모르는 부분은 AI에게 물어보세요</div>
      </Transition>

      <button
        type="button"
        class="chat-fab"
        :class="{ disabled, open }"
        :disabled="disabled"
        :aria-label="open ? '챗봇 닫기' : '챗봇 열기'"
        @click="toggle"
      >
        <img :src="chatbotLogo" class="chat-fab-logo" alt="" />
      </button>
    </div>

    <Transition name="chat-fade">
      <div v-if="open" class="chat-overlay" @click.self="toggle">
        <div class="chat-panel" :class="{ 'has-messages': messages.length > 0 }">

        <button type="button" class="chat-close" aria-label="닫기" @click="toggle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </button>

        <div ref="bodyRef" class="chat-body">
          <div v-if="messages.length === 0" class="chat-empty">
            <h3>저에게 무엇이든 물어보세요!</h3>
            <p>어려운 용어와 상품 구조를 쉽게 풀어드려요</p>

            <div class="chat-suggestions">
              <span v-for="s in suggestions" :key="s" class="chat-chip">{{ s }}</span>
            </div>
          </div>

          <div v-else class="chat-messages">
            <div v-for="(m, i) in messages" :key="i" class="chat-msg" :class="m.role">
              <p v-if="m.role === 'user'">{{ m.text }}</p>

              <div v-else-if="m.typing" class="chat-typing">
                <span /><span /><span />
              </div>

              <div v-else class="chat-answer" :class="{ reject: m.kind === 'reject' }">
                <p v-html="formatAnswer(m.text)" />
                <button
                  v-if="m.action"
                  type="button"
                  class="chat-action-btn"
                  @click="runAction(m.action)"
                >
                  {{ m.action.label }}
                </button>
              </div>
            </div>

          </div>
        </div>

        <form class="chat-input-bar" @submit.prevent="sendDraft">
          <input v-model="draft" type="text" placeholder="무엇이든 물어보세요" />
          <button type="submit" class="chat-send" :disabled="!draft.trim()" aria-label="보내기">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 19V5" />
              <path d="m5 12 7-7 7 7" />
            </svg>
          </button>
        </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.chat-anchor {
  /* viewport를 기준으로 두어 페이지를 스크롤해도 사용자를 따라간다. */
  position: fixed;
  right: 28px;
  bottom: 28px;
  z-index: calc(var(--z-modal) + 1);
  display: flex;
  align-items: center;
  gap: 10px;
}

.chat-hint {
  padding: 9px 14px;
  border-radius: 999px;
  background: #1a2233;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

.hint-fade-enter-active,
.hint-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.hint-fade-enter-from,
.hint-fade-leave-to {
  opacity: 0;
  transform: translateX(6px);
}

.chat-fab {
  width: 59px;
  height: 59px;
  padding: 0;
  border-radius: 30%;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: 0 6px 18px rgba(10, 14, 25, 0.5);
  transition: width 0.25s ease, height 0.25s ease, border-radius 0.25s ease,
    box-shadow 0.25s ease, transform 0.25s ease;
}

.chat-fab.open {
  width: 72px;
  height: 72px;
  border-radius: 28%;
  box-shadow: 0 10px 28px rgba(10, 14, 25, 0.55);
}

.chat-fab-logo {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.chat-fab.disabled {
  filter: grayscale(1);
  opacity: 0.5;
  box-shadow: none;
  cursor: not-allowed;
}

.chat-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(8, 11, 18, 0.55);
}

.chat-panel {
  position: relative;
  width: min(820px, 94vw);
  height: min(400px, 70vh);
  display: flex;
  flex-direction: column;
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

.chat-panel.has-messages::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  z-index: 2;
  height: 82px;
  pointer-events: none;
  background: linear-gradient(to bottom, #fff 12%, rgba(255, 255, 255, 0));
}

.chat-pin-notice {
  position: absolute;
  top: 18px;
  left: 24px;
  z-index: 1;
  margin: 0;
  color: #b3bac7;
  font-size: 11px;
  font-weight: 500;
}

.chat-close {
  position: absolute;
  top: 18px;
  right: 18px;
  z-index: 3;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #9aa3b5;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.chat-close svg {
  width: 18px;
  height: 18px;
}

.chat-close:hover {
  background: #f2f3f6;
}

.chat-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 64px 72px 16px;
}

.chat-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 14px;
}

.chat-empty h3 {
  margin: 0;
  color: #9e9e9e;
  font-size: var(--type-title-01);
  font-weight: var(--type-weight-semibold);
  line-height: var(--type-line-height);
  letter-spacing: var(--type-letter-spacing);
}

.chat-empty p {
  margin: 0;
  color: #9e9e9e;
  font-size: var(--type-caption);
  font-weight: var(--type-weight-regular);
  line-height: var(--type-line-height);
  letter-spacing: var(--type-letter-spacing);
}

.chat-suggestions {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.chat-chip {
  padding: 10px 18px;
  border-radius: 999px;
  border: 1px solid #e2e4ea;
  background: #fff;
  color: #a6a6a6;
  font-size: var(--type-caption);
  font-weight: var(--type-weight-regular);
  line-height: var(--type-line-height);
  letter-spacing: var(--type-letter-spacing);
}

.chat-messages {
  width: 100%;
  max-width: 676px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chat-msg p {
  margin: 0;
  font-size: var(--type-body-01);
  font-weight: var(--type-weight-medium);
  line-height: var(--type-line-height);
  letter-spacing: var(--type-letter-spacing);
  white-space: pre-line;
}

.chat-msg.user {
  text-align: right;
}

.chat-msg.user p {
  color: #666666;
  font-weight: 500;
}

.chat-msg.ai {
  text-align: left;
}

.chat-answer p {
  color: #0d0d0d;
}

/* SC-10~13 거절 카드: 일반 답변과 시각적으로 구분되는 중립 톤 배경. 아이콘은 넣지 않는다. */
.chat-answer.reject {
  background: #f3f4f6;
  border-radius: 14px;
  padding: 14px 16px;
}

.chat-action-btn {
  display: inline-block;
  margin-top: 10px;
  padding: 8px 16px;
  border: none;
  border-radius: 999px;
  background: #eef4ff;
  color: #2f6fe0;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.chat-action-btn:hover {
  background: #dfeaff;
}

.chat-typing {
  display: inline-flex;
  gap: 5px;
  padding: 6px 0;
}

.chat-typing span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #93c5fd;
  animation: chat-typing-bounce 1.2s ease-in-out infinite;
}

.chat-typing span:nth-child(2) {
  animation-delay: 0.15s;
}

.chat-typing span:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes chat-typing-bounce {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  30% {
    transform: translateY(-4px);
    opacity: 1;
  }
}

.chat-input-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 24px 24px;
  padding: 8px 8px 8px 22px;
  border-radius: 999px;
  background: #eceef2;
}

.chat-input-bar input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: var(--type-body-01);
  font-weight: var(--type-weight-semibold);
  line-height: var(--type-line-height);
  letter-spacing: var(--type-letter-spacing);
  color: #1a2233;
  outline: none;
}

.chat-input-bar input::placeholder {
  color: #9aa3b5;
}

.chat-send {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  background: #3b82f6;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s ease;
}

.chat-send svg {
  width: 18px;
  height: 18px;
}

.chat-send:hover:not(:disabled) {
  background: #2f6fe0;
}

.chat-send:disabled {
  background: #b7c6e6;
  cursor: not-allowed;
}

.chat-fade-enter-active,
.chat-fade-leave-active {
  transition: opacity 0.2s ease;
}

.chat-fade-enter-active .chat-panel,
.chat-fade-leave-active .chat-panel {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.chat-fade-enter-from,
.chat-fade-leave-to {
  opacity: 0;
}

.chat-fade-enter-from .chat-panel,
.chat-fade-leave-to .chat-panel {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

@media (max-width: 560px) {
  .chat-body {
    padding: 64px 24px 16px;
  }

  .chat-anchor {
    right: 16px;
    bottom: 16px;
  }

  .chat-input-bar {
    margin: 0 16px 16px;
  }
}
</style>
