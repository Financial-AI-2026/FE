<script setup>
defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  ariaLabel: {
    type: String,
    default: undefined,
  },
})

defineEmits(['click'])
</script>

<template>
  <button
    type="button"
    class="base-button"
    :disabled="disabled"
    :aria-label="ariaLabel"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<style scoped>
.base-button {
  width: clamp(26px, 2.2vw, 34px);
  height: clamp(26px, 2.2vw, 34px);
  border-radius: var(--radius-pill);
  background: var(--color-surface-hover);
  color: var(--color-icon-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.base-button :deep(svg) {
  width: 48%;
  height: 48%;
}

.base-button:not(:disabled):hover {
  background: var(--color-surface-hover-strong);
}

.base-button:disabled {
  cursor: not-allowed;
}
</style>
