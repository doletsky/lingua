<template>
  <div class="transform">
    <h3 class="instruction">Исправьте предложение:</h3>

    <div class="original-sentence">
      <p class="label">Неправильно:</p>
      <p class="text">{{ exercise.template }}</p>
    </div>

    <textarea
      v-model="userAnswer"
      @keyup.ctrl.enter="checkAnswer"
      :disabled="answered"
      class="answer-textarea"
      placeholder="Введите правильный вариант..."
      rows="3"
    />

    <p class="keyboard-hint">Нажмите Ctrl+Enter для проверки</p>

    <div v-if="showHint && exercise.hint" class="hint">
      💡 <strong>Подсказка:</strong> {{ exercise.hint }}
    </div>

    <div v-if="answered" class="feedback" :class="isCorrect ? 'correct' : 'incorrect'">
      <p v-if="isCorrect">✅ Правильно!</p>
      <div v-else>
        <p>❌ Не совсем точно</p>
        <p class="correct-answer">Правильный ответ: <strong>{{ exercise.correct }}</strong></p>
        <p v-if="exercise.explanationRu" class="explanation">
          <strong>Объяснение:</strong> {{ exercise.explanationRu }}
        </p>
      </div>
      <button @click="continueNext" class="btn-continue">Далее →</button>
    </div>

    <div v-if="!answered" class="actions">
      <button @click="showHint = true" v-if="!showHint && exercise.hint" class="btn-hint">
        💡 Подсказка
      </button>
      <button @click="checkAnswer" class="btn-check">
        Проверить
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

const userAnswer = ref('')
const answered = ref(false)
const showHint = ref(false)

const isCorrect = computed(() => {
  const userClean = userAnswer.value.trim().toLowerCase()
  const correctClean = props.exercise.correct.toLowerCase()
  return userClean === correctClean
})

const checkAnswer = () => {
  if (!userAnswer.value.trim() || answered.value) return
  answered.value = true
}

const continueNext = () => {
  emit('answer', {
    isCorrect: isCorrect.value,
    itemId: props.exercise.itemId
  })
}
</script>

<style scoped>
.transform {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.instruction {
  font-size: 1.3rem;
  color: #333;
  text-align: center;
}

.original-sentence {
  padding: 1.5rem;
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  border-radius: 8px;
}

.label {
  font-size: 0.9rem;
  color: #856404;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.text {
  font-size: 1.2rem;
  color: #333;
  font-style: italic;
}

.answer-textarea {
  padding: 1rem;
  font-size: 1.1rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.3s;
}

.answer-textarea:focus {
  outline: none;
  border-color: #42b883;
}

.keyboard-hint {
  font-size: 0.85rem;
  color: #999;
  margin-top: -1rem;
}

.actions {
  display: flex;
  gap: 1rem;
}

.btn-hint, .btn-check {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
}

.btn-hint {
  background: #ffc107;
  color: #333;
}

.btn-check {
  background: #42b883;
  color: white;
  flex: 1;
}

.hint {
  padding: 1rem;
  background: #e3f2fd;
  border-left: 4px solid #2196f3;
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
  margin-top: 1rem;
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
  transition: all 0.3s;
}

.btn-continue:hover {
  background: #35a372;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(66, 184, 131, 0.3);
}

.btn-hint {
  transition: all 0.3s;
}

.btn-hint:hover {
  background: #ffb300;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(255, 193, 7, 0.3);
}

.btn-check {
  transition: all 0.3s;
}

.btn-check:hover {
  background: #35a372;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(66, 184, 131, 0.3);
}
</style>