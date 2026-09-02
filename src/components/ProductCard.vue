<script setup>
defineProps({
  brand: {
    type: String,
    default: 'kodex', // 'kodex' | 'globalx'
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['open'])
</script>

<template>
  <article class="product-card" :class="{ disabled }">
    <span v-if="disabled" class="analyzing-badge">분석 중</span>

    <div class="banner" :class="brand">
      <div v-if="brand === 'kodex'" class="logo logo-kodex">
        <svg viewBox="0 0 24 24" fill="currentColor" class="pin">
          <path
            d="M12 2C7.6 2 4 5.6 4 10c0 6 8 12 8 12s8-6 8-12c0-4.4-3.6-8-8-8Zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"
          />
        </svg>
        <span>Kodex</span>
      </div>
      <div v-else class="logo logo-globalx">GLOBAL X</div>
    </div>

    <div class="body">
      <p class="line title">금융 상품 이름</p>
      <p class="line sub">번호</p>
      <p class="line sub">회사 이름</p>
    </div>

    <button
      type="button"
      class="go-btn"
      :disabled="disabled"
      @click="$emit('open')"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M7 17 17 7" />
        <path d="M9 7h8v8" />
      </svg>
    </button>
  </article>
</template>

<style scoped>
.product-card {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  background: #101c33;
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.product-card:not(.disabled):hover {
  transform: translateY(-2px);
  border-color: rgba(150, 180, 230, 0.2);
}

.product-card.disabled {
  opacity: 0.55;
}

.analyzing-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
  padding: 3px 10px;
  border-radius: 999px;
  background: #2563eb;
  color: #fff;
  font-size: 10px;
  font-weight: 600;
}

.banner {
  height: clamp(96px, 9vw, 140px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.banner.kodex {
  background: linear-gradient(135deg, #eaf3ff 0%, #bdd6ff 100%);
}

.banner.globalx {
  background: linear-gradient(135deg, #eafbe9 0%, #bdeec6 100%);
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: clamp(20px, 1.8vw, 28px);
  font-weight: 700;
}

.logo-kodex {
  color: #1d4ed8;
}

.logo-kodex .pin {
  width: 1em;
  height: 1em;
}

.logo-globalx {
  color: #ea580c;
  font-style: italic;
  letter-spacing: -0.5px;
}

.body {
  padding: clamp(14px, 1.3vw, 20px);
}

.line {
  margin: 0;
  line-height: 1.6;
}

.line.title {
  color: #e8ecf5;
  font-size: clamp(13px, 1.05vw, 16px);
  font-weight: 600;
}

.line.sub {
  color: #6b7690;
  font-size: clamp(11px, 0.85vw, 13px);
}

.go-btn {
  position: absolute;
  right: clamp(10px, 1vw, 16px);
  bottom: clamp(10px, 1vw, 16px);
  width: clamp(26px, 2.2vw, 34px);
  height: clamp(26px, 2.2vw, 34px);
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: #cfd8ea;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease;
}

.go-btn svg {
  width: 48%;
  height: 48%;
}

.go-btn:not(:disabled):hover {
  background: rgba(255, 255, 255, 0.16);
}

.go-btn:disabled {
  cursor: not-allowed;
}
</style>
