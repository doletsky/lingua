<template>
  <div class="explanation-card" v-if="grammar">
    <div class="explanation-header">
      <h3>📚 {{ grammar.title }}</h3>
      <button 
        @click="isExpanded = !isExpanded"
        class="toggle-btn"
      >
        {{ isExpanded ? '▼' : '▶' }}
      </button>
    </div>

    <transition name="expand">
      <div v-if="isExpanded" class="explanation-content">
        <div class="explanation-text">
          <p>{{ grammar.explanation_ru }}</p>
        </div>

        <div v-if="grammar.examples && grammar.examples.length > 0" class="examples">
          <h4>📝 Примеры:</h4>
          <div class="example-list">
            <div v-for="(example, idx) in grammar.examples" :key="idx" class="example-item">
              <div class="example-pt">🇵🇹 {{ example.pt }}</div>
              <div class="example-ru">🇷🇺 {{ example.ru }}</div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  grammar: {
    type: Object,
    default: null
  },
  expanded: {
    type: Boolean,
    default: false
  }
})

const isExpanded = ref(props.expanded)
</script>

<style scoped>
.explanation-card {
  background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%);
  border-left: 5px solid #4caf50;
  border-radius: 8px;
  padding: 1.25rem;
  margin: 1rem 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.explanation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.explanation-header h3 {
  margin: 0;
  color: #2e7d32;
  font-size: 1.1rem;
}

.toggle-btn {
  background: none;
  border: none;
  color: #4caf50;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  transition: transform 0.3s;
}

.toggle-btn:hover {
  transform: scale(1.1);
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin-top: 0;
  margin-bottom: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 500px;
}

.explanation-content {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(76, 175, 80, 0.2);
}

.explanation-text {
  color: #333;
  line-height: 1.6;
  font-size: 0.95rem;
}

.explanation-text p {
  margin: 0;
}

.examples {
  margin-top: 1rem;
}

.examples h4 {
  margin: 0.75rem 0 0.5rem 0;
  color: #2e7d32;
  font-size: 0.95rem;
}

.example-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.example-item {
  background: white;
  padding: 0.75rem;
  border-radius: 6px;
  border-left: 3px solid #81c784;
}

.example-pt {
  font-weight: 600;
  color: #1976d2;
  font-size: 0.95rem;
  margin-bottom: 0.35rem;
}

.example-ru {
  color: #555;
  font-size: 0.9rem;
  font-style: italic;
}

@media (max-width: 640px) {
  .explanation-card {
    padding: 1rem;
  }

  .explanation-header h3 {
    font-size: 1rem;
  }

  .examples h4 {
    font-size: 0.9rem;
  }

  .example-pt,
  .example-ru {
    font-size: 0.85rem;
  }
}
</style>
