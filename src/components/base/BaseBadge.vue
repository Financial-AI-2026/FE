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
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-accent-purple);
  background: var(--color-badge-purple-bg);
  border: 1px solid var(--color-badge-purple-border);
}
</style>
