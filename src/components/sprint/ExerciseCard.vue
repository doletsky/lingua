<template>
  <div class="exercise-card">
    <!-- on-screen log: show which grammar record was used to generate this exercise -->
    <div v-if="exercise.grammarTitle || exercise.grammarId || exercise.explanationRu" class="exercise-log">
      <div class="exercise-log-row">
        <strong class="log-label">Грамматика:</strong>
        <span class="log-title">{{ exercise.grammarTitle || '—' }}</span>
        <span v-if="exercise.grammarId" class="log-id"> (id: {{ exercise.grammarId }})</span>
      </div>
      <div v-if="exercise.explanationRu" class="exercise-log-expl">{{ exercise.explanationRu.length > 120 ? exercise.explanationRu.slice(0,120) + '…' : exercise.explanationRu }}</div>
    </div>

    <MultipleChoiceExercise 
      v-if="exercise.type === 'multiple_choice'"
      :exercise="exercise"
      @answer="handleAnswer"
    />
    
    <FillBlankExercise 
      v-else-if="exercise.type === 'fill_blank'"
      :exercise="exercise"
      @answer="handleAnswer"
    />
    
    <TranslationExercise 
      v-else-if="exercise.type === 'translation'"
      :exercise="exercise"
      @answer="handleAnswer"
    />
    
    <MatchingExercise 
      v-else-if="exercise.type === 'matching'"
      :exercise="exercise"
      @answer="handleAnswer"
    />
    
    <TransformExercise 
      v-else-if="exercise.type === 'transform'"
      :exercise="exercise"
      @answer="handleAnswer"
    />
  </div>
</template>

<style scoped>
.exercise-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  min-height: 400px;
}

.exercise-log {
  font-size: 0.9rem;
  background: #f6fffb;
  border-left: 4px solid #42b883;
  padding: 0.6rem 0.9rem;
  margin-bottom: 1rem;
  border-radius: 8px;
}

.exercise-log-row {
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
}

.log-label {
  color: #0b6b4a;
}

.log-title {
  font-weight: 600;
  color: #235e48;
}

.log-id {
  color: #666;
  font-size: 0.85rem;
}

.exercise-log-expl {
  margin-top: 0.4rem;
  color: #333;
  opacity: 0.9;
}

@media (max-width: 768px) {
  .exercise-card {
    padding: 1.5rem;
  }
}
</style>

<script setup>
import MultipleChoiceExercise from '../exercises/MultipleChoiceExercise.vue'
import FillBlankExercise from '../exercises/FillBlankExercise.vue'
import TranslationExercise from '../exercises/TranslationExercise.vue'
import MatchingExercise from '../exercises/MatchingExercise.vue'
import TransformExercise from '../exercises/TransformExercise.vue'

defineProps({
  exercise: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['answer'])

const handleAnswer = (result) => {
  emit('answer', result)
}
</script>

<style scoped>
.exercise-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  min-height: 400px;
}

@media (max-width: 768px) {
  .exercise-card {
    padding: 1.5rem;
  }
}
</style>