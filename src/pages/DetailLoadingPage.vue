<script setup>
import { onMounted } from 'vue'
import BaseBadge from '../components/base/BaseBadge.vue'
import ChatWidget from '../components/ChatWidget.vue'
import docSearchIcon from '../assets/icons/loading-doc-search.png'

const emit = defineEmits(['done'])

onMounted(() => {
  setTimeout(() => {
    emit('done')
  }, 1800)
})
</script>

<template>
  <div class="loading-page">
    <header class="top-bar">
      <div class="avatar" />
      <div class="badges">
        <BaseBadge tone="purple">로그인 필요해요</BaseBadge>
        <BaseBadge tone="purple">개인정보 미수집</BaseBadge>
      </div>
    </header>

    <div class="content">
      <h1>TIGER 미국S&amp;P500레버리지(합성 H)</h1>
      <p class="issuer">미래에셋자산운용</p>

      <img :src="docSearchIcon" class="loading-icon" alt="" />

      <p class="msg">투자 설명서를 확인하고 있어요! 잠시만 기다려주세요</p>
      <p class="submsg">투자설명서를 불러오고 있습니다</p>
    </div>

    <ChatWidget disabled :auto-hint="false" />
  </div>
</template>

<style scoped>
.loading-page {
  min-height: 100svh;
  box-sizing: border-box;
  padding: clamp(24px, 2.4vw, 40px) clamp(28px, 5vw, 80px) 60px;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, var(--color-bg-page-deep) 0%, var(--color-bg-page-mid) 45%, var(--color-bg-page) 100%);
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #d9d9d9;
  flex-shrink: 0;
}

.badges {
  display: flex;
  gap: 10px;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 12px;
}

.content h1 {
  margin: 0;
  color: #fff;
  font-size: clamp(20px, 2vw, 30px);
  font-weight: 700;
}

.issuer {
  margin: 0;
  color: #4da3ff;
  font-size: clamp(13px, 1vw, 16px);
}

.loading-icon {
  width: clamp(96px, 9vw, 140px);
  height: auto;
  margin: 20px 0;
  animation: loading-pulse 1.8s ease-in-out infinite;
}

@keyframes loading-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.85;
  }
}

.msg {
  margin: 0;
  color: #dfe3ec;
  font-size: clamp(14px, 1.1vw, 18px);
  font-weight: 600;
}

.submsg {
  margin: 0;
  color: #4da3ff;
  font-size: clamp(12px, 0.9vw, 15px);
}
</style>
