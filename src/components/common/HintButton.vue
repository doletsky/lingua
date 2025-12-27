<template>
  <button 
    @click="toggleHint"
    :disabled="disabled"
    class="hint-button"
    :class="{ 'hint-active': isActive }"
    :title="isActive ? 'Закрыть подсказку' : 'Показать подсказку'"
  >
    <span class="hint-icon">💡</span>
    <span class="hint-text">{{ isActive ? 'Скрыть' : 'Подсказка' }}</span>
  </button>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle'])

const isActive = ref(false)

const toggleHint = () => {
  if (props.disabled) return
  isActive.value = !isActive.value
  emit('toggle', isActive.value)
}
</script>

<style scoped>
.hint-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: #fff3cd;
  color: #333;
  border: 2px solid #ffc107;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.hint-button:hover:not(:disabled) {
  background: #ffc107;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(255, 193, 7, 0.3);
}

.hint-button:active:not(:disabled) {
  transform: translateY(0);
}

.hint-button.hint-active {
  background: #ffc107;
  color: #333;
}

.hint-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.hint-icon {
  font-size: 1.1rem;
}

.hint-text {
  font-size: 0.9rem;
}

@media (max-width: 640px) {
  .hint-button {
    padding: 0.6rem 1rem;
    font-size: 0.85rem;
  }
  
  .hint-text {
    display: none;
  }
}
</style>
