<script setup>
import logoImg from "../../assets/icons/ETFit logo.png";
</script>

<template>
  <router-link to="/" class="brand-logo-link" aria-label="홈으로 이동">
    <img :src="logoImg" class="brand-logo" alt="ETFIT 로고" />
  </router-link>
</template>

<style scoped>
.brand-logo-link {
  display: inline-flex;
  flex-shrink: 0;
  line-height: 0;
}

/*
 * 모든 페이지 상단바에 항상 같은 크기로 뜨는 로고라 컴포넌트로 뺐다.
 * 페이지마다 사이즈를 다르게 두지 말고, 필요하면 여기 값만 고친다.
 */
.brand-logo {
  width: 70px;
  height: auto;
  flex-shrink: 0;
}

@media (max-width: 720px) {
  .brand-logo {
    width: 72px;
  }
}
</style>
