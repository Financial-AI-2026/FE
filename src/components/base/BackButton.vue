<script setup>
defineProps({
  ariaLabel: { type: String, default: "뒤로가기" },
});

defineEmits(["click"]);
</script>

<template>
  <button
    type="button"
    class="back-btn"
    :aria-label="ariaLabel"
    @click="$emit('click')"
  >
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M15 18 9 12l6-6" />
    </svg>
  </button>
</template>

<style scoped>
.back-btn {
  position: absolute;
  top: 126px;
  left: 48px;
  z-index: 5;

  width: 48px;
  height: 48px;
  border-radius: 12px;
  border: none;
  background: #1d2634;
  color: #cfd8ea;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.back-btn svg {
  width: 24px;
  height: 24px;
}

@media (max-width: 700px) {
  .back-btn {
    left: 20px;
  }
}
</style>
