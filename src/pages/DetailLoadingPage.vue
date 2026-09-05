<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import BaseBadge from "../components/base/BaseBadge.vue";
import PageHeader from "../components/base/PageHeader.vue";
import ChatWidget from "../components/ChatWidget.vue";
import docSearchIcon from "../assets/icons/loading-doc-search.png";
import { fetchEtfDetail, fetchEtfDiagnosis } from "../api/client";
import { useSessionStore } from "../stores/session";

const props = defineProps({ code: { type: String, required: true } });

const router = useRouter();
const session = useSessionStore();

const etfName = ref("");

const MIN_DISPLAY_MS = 1800; // 연출용 최소 노출 시간 — 실제 조회가 더 빨라도 이 정도는 보여준다

onMounted(async () => {
  if (!session.hasConditions) {
    router.replace({ name: "questions" });
    return;
  }

  const started = Date.now();
  try {
    const [detail] = await Promise.all([
      fetchEtfDetail(props.code),
      // S6에서 다시 조회하긴 하지만, 여기서 미리 한 번 호출해두면 진단
      // API가 실패하는 경우(조건 오류 등)를 로딩 화면에서 먼저 알아챌 수 있다.
      fetchEtfDiagnosis(props.code, session.conditionParams),
    ]);
    etfName.value = detail.name;
  } catch {
    // 실패해도 진행 — 실제 에러 메시지는 ResultPage가 다시 조회하며 보여준다.
  }

  const elapsed = Date.now() - started;
  const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);
  setTimeout(() => {
    router.push({ name: "result", params: { code: props.code } });
  }, remaining);
});
</script>

<template>
  <div class="loading-page">
    <PageHeader>
      <div class="badges">
        <BaseBadge v-for="label in session.profileBadges" :key="label" tone="gold">
          {{ label }}
        </BaseBadge>
      </div>
    </PageHeader>

    <div class="content">
      <h1>{{ etfName || code }}</h1>

      <img :src="docSearchIcon" class="loading-icon" alt="" />

      <p class="msg">투자 설명서를 확인하고 있어요! 잠시만 기다려주세요</p>
      <p class="submsg">투자설명서를 불러오고 있습니다</p>
    </div>

    <ChatWidget disabled :auto-hint="false" />
  </div>
</template>

<style scoped>
.loading-page {
  position: relative;
  min-height: 100svh;
  box-sizing: border-box;
  padding: clamp(24px, 2.4vw, 40px) clamp(28px, 5vw, 80px) 60px;
  display: flex;
  flex-direction: column;
  background: linear-gradient(
    180deg,
    var(--color-bg-page-deep) 0%,
    var(--color-bg-page-mid) 45%,
    var(--color-bg-page) 100%
  );
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
  width: clamp(200px, 20vw, 280px);
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
