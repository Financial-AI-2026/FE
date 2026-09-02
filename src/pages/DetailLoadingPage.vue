<script setup>
import { onMounted } from 'vue'

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
        <span class="badge">로그인 필요해요</span>
        <span class="badge">개인정보 미수집</span>
      </div>
    </header>

    <div class="content">
      <h1>TIGER 미국S&amp;P500레버리지(합성 H)</h1>
      <p class="issuer">미래에셋자산운용</p>

      <div class="spinner-stage">
        <div class="spinner-ring" />
        <div class="spinner-core" />
      </div>

      <p class="msg">투자 설명서를 확인하고 있어요! 잠시만 기다려주세요</p>
      <p class="submsg">투자설명서를 불러오고 있습니다</p>
    </div>
  </div>
</template>

<style scoped>
.loading-page {
  min-height: 100svh;
  box-sizing: border-box;
  padding: clamp(24px, 2.4vw, 40px) clamp(28px, 5vw, 80px) 60px;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #0b1220 0%, #070c16 45%, #05070d 100%);
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

.badge {
  font-size: 12px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 999px;
  color: #c9a8ff;
  background: rgba(168, 116, 255, 0.14);
  border: 1px solid rgba(168, 116, 255, 0.35);
  white-space: nowrap;
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

.spinner-stage {
  position: relative;
  width: clamp(96px, 9vw, 140px);
  height: clamp(96px, 9vw, 140px);
  margin: 20px 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner-core {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #e4ecfb, #b7c6e6);
}

.spinner-ring {
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  border: 3px solid rgba(77, 163, 255, 0.15);
  border-top-color: #4da3ff;
  animation: spin 1.1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
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
