<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import chatbotLogo from '../assets/images/chat_logo.png'
import { getSuggestedQuestions, postChat } from '../lib/chatApi'

marked.setOptions({ gfm: true, breaks: true })

const props = defineProps({
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
  // 현재 화면 단계. API 호출 시 'S4' | 'S6'로 변환해서 보낸다.
  stage: {
    type: String,
    default: 's4', // 's4' | 's6'
  },
  // chatbot-api.md 기준 POST /api/v1/chat 필수/선택 필드.
  productCode: {
    type: String,
    default: null,
  },
  horizon: {
    type: String,
    default: null, // 'SHORT' | 'MID' | 'LONG' | 'UNKNOWN'
  },
  purpose: {
    type: String,
    default: null, // 'CAPITAL_GAIN' | 'INCOME' | 'GROWTH'
  },
  fundNature: {
    type: String,
    default: null, // 'SPARE' | 'PURPOSE'
  },
  previousProductCode: {
    type: String,
    default: null,
  },
  compareProductCode: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['retry', 'view-products'])

const open = ref(false)
const draft = ref('')
const messages = ref([])
const bodyRef = ref(null)
const showHint = ref(false)
const isBodyScrolled = ref(false)
const sending = ref(false)
const suggestedQuestions = ref([])
const suggestionsLoading = ref(false)
let hintTimer = null

function renderMarkdown(text) {
  return DOMPurify.sanitize(marked.parse(text ?? ''))
}

function apiStage() {
  return props.stage === 's6' ? 'S6' : 'S4'
}

async function loadSuggestions() {
  if (messages.value.length > 0) return
  suggestionsLoading.value = true
  try {
    const stage = apiStage()
    const { suggestedQuestions: qs } = await getSuggestedQuestions({
      stage,
      code: stage === 'S4' ? props.productCode : null,
    })
    suggestedQuestions.value = qs ?? []
  } catch {
    suggestedQuestions.value = []
  } finally {
    suggestionsLoading.value = false
  }
}

function toggle() {
  if (props.disabled) return
  open.value = !open.value
  if (open.value) {
    showHint.value = false
    scrollToBottom()
    loadSuggestions()
  } else {
    isBodyScrolled.value = false
  }
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
    if (bodyRef.value) {
      bodyRef.value.scrollTop = bodyRef.value.scrollHeight
      updateScrollFade()
    }
  })
}

function updateScrollFade() {
  isBodyScrolled.value = (bodyRef.value?.scrollTop ?? 0) > 12
}

// 최근 대화(최대 3턴 = 메시지 6개)만 잘라서 보낸다 — 백엔드가 어차피 마지막 3턴만 사용.
function buildHistory() {
  return messages.value
    .filter((m) => !m.typing)
    .slice(-6)
    .map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }))
}

async function requestAndFill(aiIndex, payload) {
  try {
    const res = await postChat(payload)
    messages.value[aiIndex] = {
      role: 'ai',
      typing: false,
      text: res.message,
      refusal: !!res.refusal,
      action: res.action || 'NONE',
      requestPayload: payload,
    }
  } catch (e) {
    // ETF_NOT_FOUND는 백엔드가 내려준 구체적인 메시지를 그대로 보여준다.
    // 그 외(네트워크 끊김, CORS 차단, 5xx 등)는 브라우저의 원본 에러 문자열
    // ("Failed to fetch" 등)을 그대로 노출하지 않고 안내 문구로 통일한다.
    const isUnsupported = e.code === 'ETF_NOT_FOUND'
    messages.value[aiIndex] = {
      role: 'ai',
      typing: false,
      text: isUnsupported ? e.message : '지금 답변을 받아오지 못했어요. 잠시 후 다시 시도해주세요.',
      refusal: false,
      // 지원하지 않는 종목 에러는 같은 요청을 재전송해도 똑같이 실패하므로 재시도 버튼을 주지 않는다.
      action: isUnsupported ? 'NONE' : 'RETRY',
      requestPayload: payload,
    }
  } finally {
    sending.value = false
    scrollToBottom()
  }
}

function send(text) {
  const question = text.trim()
  if (!question || sending.value) return

  const payload = {
    message: question,
    stage: apiStage(),
    productCode: props.productCode,
    horizon: props.horizon,
    purpose: props.purpose,
    fundNature: props.fundNature,
    compareProductCode: props.compareProductCode,
    previousProductCode: props.previousProductCode,
    history: buildHistory(),
  }

  messages.value.push({ role: 'user', text: question })
  messages.value.push({ role: 'ai', text: '', typing: true, refusal: false, action: 'NONE' })
  const aiIndex = messages.value.length - 1
  draft.value = ''
  sending.value = true
  scrollToBottom()

  requestAndFill(aiIndex, payload)
}

function sendDraft() {
  send(draft.value)
}

function retry(index) {
  const payload = messages.value[index]?.requestPayload
  if (!payload || sending.value) return
  messages.value[index] = { role: 'ai', text: '', typing: true, refusal: false, action: 'NONE' }
  sending.value = true
  scrollToBottom()
  requestAndFill(index, payload)
}

function runAction(action, index) {
  if (action === 'CHANGE_CONDITIONS') {
    emit('retry')
    open.value = false
  } else if (action === 'VIEW_PRODUCT_LIST') {
    emit('view-products')
    open.value = false
  } else if (action === 'RETRY') {
    retry(index)
  }
}

const actionLabels = {
  CHANGE_CONDITIONS: '내 조건 바꾸기',
  VIEW_PRODUCT_LIST: '상품 목록 보기',
  RETRY: '다시 시도',
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
        <div
          class="chat-panel"
          :class="{
            'has-conversation': messages.length > 0,
            'is-scrolled': isBodyScrolled,
          }"
        >

        <button type="button" class="chat-close" aria-label="닫기" @click="toggle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </button>

        <div ref="bodyRef" class="chat-body" @scroll="updateScrollFade">
          <div v-if="messages.length === 0" class="chat-empty">
            <h3>저에게 무엇이든 물어보세요!</h3>
            <p>어려운 용어와 상품 구조를 쉽게 풀어드려요</p>

            <div class="chat-suggestions">
              <button
                v-for="s in suggestedQuestions"
                :key="s"
                type="button"
                class="chat-chip"
                @click="send(s)"
              >
                {{ s }}
              </button>
            </div>
          </div>

          <div v-else class="chat-messages">
            <div v-for="(m, i) in messages" :key="i" class="chat-msg" :class="m.role">
              <p v-if="m.role === 'user'">{{ m.text }}</p>

              <div v-else-if="m.typing" class="chat-typing">
                <span /><span /><span />
              </div>

              <div v-else class="chat-answer" :class="{ reject: m.refusal }">
                <div v-html="renderMarkdown(m.text)" />
                <button
                  v-if="m.action && m.action !== 'NONE'"
                  type="button"
                  class="chat-action-btn"
                  @click="runAction(m.action, i)"
                >
                  {{ actionLabels[m.action] }}
                </button>
              </div>
            </div>

          </div>
        </div>

        <form class="chat-input-bar" @submit.prevent="sendDraft">
          <input v-model="draft" type="text" placeholder="무엇이든 물어보세요" :disabled="sending" />
          <button type="submit" class="chat-send" :disabled="!draft.trim() || sending" aria-label="보내기">
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

.chat-panel.has-conversation .chat-body {
  padding-bottom: 48px;
}

.chat-panel.is-scrolled::before {
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
  /* 좌우 모두 입력창 테두리에서 12px 간격이다. */
  padding: 64px 36px 16px 36px;
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
  font-family: inherit;
  font-size: var(--type-caption);
  font-weight: var(--type-weight-regular);
  line-height: var(--type-line-height);
  letter-spacing: var(--type-letter-spacing);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.chat-chip:hover {
  background: #f4f6fa;
  color: #6b7280;
}

.chat-messages {
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* 한 답변이 끝난 뒤 다음 사용자 질문이 시작되는 턴 사이는 더 넓게 구분한다. */
.chat-msg.ai + .chat-msg.user {
  margin-top: 16px;
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

.chat-answer :deep(p) {
  margin: 0 0 8px;
  color: #0d0d0d;
}

.chat-answer :deep(p:last-child) {
  margin-bottom: 0;
}

.chat-answer :deep(ul),
.chat-answer :deep(ol) {
  margin: 4px 0 8px;
  padding-left: 20px;
}

.chat-answer :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 10px 0;
  font-size: 0.92em;
}

.chat-answer :deep(th),
.chat-answer :deep(td) {
  border: 1px solid #e2e4ea;
  padding: 6px 10px;
  text-align: left;
  color: #0d0d0d;
}

.chat-answer :deep(th) {
  background: #f7f8fa;
  font-weight: 700;
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
    /* 모바일에서도 좌우 모두 입력창 테두리에서 12px 간격을 유지한다. */
    padding: 64px 28px 16px 28px;
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
