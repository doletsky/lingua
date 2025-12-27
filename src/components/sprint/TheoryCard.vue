<template>
  <div class="theory-card">
    <div class="theory-header">
      <span class="theory-icon">📚</span>
      <h2>{{ theory.title }}</h2>
    </div>

    <div class="theory-content">
      <p class="explanation">{{ theory.explanation_ru }}</p>

      <div v-if="theory.examples" class="examples">
        <h3>Примеры:</h3>
        <div 
          v-for="(example, index) in theory.examples" 
          :key="index"
          class="example"
        >
          <p class="example-pt">{{ example.pt }}</p>
          <p class="example-ru">{{ example.ru }}</p>
        </div>
      </div>
    </div>

    <button @click="$emit('continue')" class="btn-continue">
      Начать упражнения →
    </button>
  </div>
</template>

<script setup>
defineProps({
  theory: {
    type: Object,
    required: true
  }
})

defineEmits(['continue'])
</script>

<style scoped>
.theory-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.theory-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.theory-icon {
  font-size: 2rem;
}

.theory-header h2 {
  font-size: 1.5rem;
  color: #333;
  margin: 0;
}

.explanation {
  font-size: 1.1rem;
  line-height: 1.6;
  color: #555;
  margin-bottom: 2rem;
}

.examples {
  background: #f9f9f9;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
}

.examples h3 {
  font-size: 1.1rem;
  color: #42b883;
  margin-bottom: 1rem;
}

.example {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.example:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.example-pt {
  font-size: 1.05rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.example-ru {
  font-size: 0.95rem;
  color: #777;
  font-style: italic;
}

.btn-continue {
  width: 100%;
  padding: 1rem;
  font-size: 1.1rem;
  background: #42b883;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-continue:hover {
  background: #35a372;
}

@media (max-width: 768px) {
  .theory-card {
    padding: 1.5rem;
  }
}
</style>