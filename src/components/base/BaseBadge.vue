<script setup>
defineProps({
  tone: {
    type: String,
    default: 'info', // 'info' | 'purple'
  },
})
</script>

<template>
  <span class="base-badge" :class="tone">
    <slot />
  </span>
</template>

<style scoped>
.base-badge {
  display: inline-block;
  border-radius: var(--radius-pill);
  white-space: nowrap;
}

.base-badge.info {
  padding: 3px 10px;
  font-size: 10px;
  font-weight: 600;
  color: var(--color-fg);
  background: var(--color-accent-blue);
}

.base-badge.purple {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 16px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
  letter-spacing: -0.03em;
  color: var(--color-accent-purple);
  background: var(--color-badge-purple-bg);
  border: none;
}
</style>
