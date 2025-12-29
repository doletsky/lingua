<template>
  <div class="multiple-choice">
    <div v-if="!exercise || !exercise.question || !exercise.options || exercise.options.length < 2 || !exercise.correct" class="incomplete">
      <p>⚠️ Упражнение неполное. Пропустить?</p>
      <button @click="continueNext" class="btn-skip">Пропустить →</button>
    </div>

    <div v-else>
      <h3 class="question">{{ exercise.question }}</h3>

      <div class="options">
        <button
          v-for="(option, index) in (exercise.options || [])"
          :key="index"
          @click="selectAnswer(option)"
          :class="['option-btn', getOptionClass(option)]"
          :disabled="answered"
        >
          {{ option }}
        </button>
      </div>

      <div v-if="showHint" class="hint">
        💡 <strong>Подсказка:</strong> {{ exercise.hint }}
      </div>

      <div v-if="answered" class="feedback" :class="isCorrect ? 'correct' : 'incorrect'">
        <p v-if="isCorrect">✅ Правильно!</p>
        <div v-else>
          <p>❌ Неправильно.</p>
          <p class="correct-answer">Правильный ответ: <strong>{{ exercise.correct }}</strong></p>
          <p v-if="exercise.explanationRu" class="explanation">
            <strong>Объяснение:</strong> {{ exercise.explanationRu }}
          </p>
        </div>
        <button @click="continueNext" class="btn-continue">Далее →</button>
      </div>

      <button
        v-if="!answered && !showHint"
        @click="showHint = true"
        class="btn-hint"
      >
        💡 Подсказка
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  exercise: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['answer'])

const selectedAnswer = ref(null)
const answered = ref(false)
const showHint = ref(false)

const isCorrect = computed(() => 
  selectedAnswer.value === (props.exercise?.correct ?? null)
)

const getOptionClass = (option) => {
  if (!answered.value) return ''
  if (option === props.exercise.correct) return 'correct'
  if (option === selectedAnswer.value) return 'incorrect'
  return 'disabled'
}

const selectAnswer = (option) => {
  if (answered.value) return
  selectedAnswer.value = option
  answered.value = true
}

const continueNext = () => {
  emit('answer', {
    isCorrect: isCorrect.value,
    itemId: props.exercise?.itemId
  })
}
</script>

<style scoped>
.multiple-choice {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.question {
  font-size: 1.3rem;
  color: #333;
  margin-bottom: 1rem;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.option-btn {
  padding: 1rem 1.5rem;
  font-size: 1.1rem;
  text-align: left;
  background: #f5f5f5;
  border: 2px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.option-btn:hover:not(:disabled) {
  background: #e8e8e8;
  border-color: #42b883;
}

.option-btn.correct {
  background: #d4edda;
  border-color: #28a745;
  color: #155724;
}

.option-btn.incorrect {
  background: #f8d7da;
  border-color: #dc3545;
  color: #721c24;
}

.option-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.hint {
  padding: 1rem;
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  border-radius: 4px;
  font-size: 0.95rem;
  animation: slideIn 0.3s ease-in-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.feedback {
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
}

.feedback.correct {
  background: #d4edda;
  color: #155724;
}

.feedback.incorrect {
  background: #f8d7da;
  color: #721c24;
}

.correct-answer {
  margin-top: 0.75rem;
  font-size: 1.05rem;
}

.explanation {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  font-size: 0.95rem;
  line-height: 1.5;
  text-align: left;
  background: rgba(0, 0, 0, 0.05);
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  padding-bottom: 0.75rem;
  border-radius: 4px;
}

.btn-continue {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #42b883;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
}

.btn-hint {
  background: #ffc107;
  color: #333;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
}

.btn-hint:hover {
  background: #ffb300;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(255, 193, 7, 0.3);
}
.incomplete {
  padding: 1rem;
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  border-radius: 8px;
  text-align: center;
}

.btn-skip {
  margin-top: 0.75rem;
  padding: 0.6rem 1rem;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

</style>