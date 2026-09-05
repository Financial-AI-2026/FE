<script setup>
import BrandLogo from "./BrandLogo.vue";
</script>

<template>
  <header class="page-header">
    <BrandLogo />
    <slot />
  </header>
</template>

<style scoped>
/*
 * 모든 화면 상단에 항상 같은 좌표로 뜨는 로고 자리라 컴포넌트로 뺐다.
 * 화면마다 따로 값을 두지 말고, 위치를 바꾸려면 여기 값만 고친다
 * (전 화면 공통: top 21px / left 59px / right 48px).
 * 반응형으로 좌표를 바꿔야 하는 화면은 부모 쪽 <style scoped>에서
 * `:deep(.page-header)` 셀렉터로 오버라이드한다.
 */
.page-header {
  position: absolute;
  z-index: 20;

  top: 21px;
  left: 59px;
  right: 48px;

  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
