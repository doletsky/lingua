<template>
  <div class="exercise-card">
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