<template>
  <div class="matching">
      <div v-if="!exercise || !exercise.pairs || exercise.pairs.length < 2" class="incomplete">
      <p>⚠️ Упражнение неполное. Пропустить?</p>
      <button @click="continueNext" class="btn-skip sprint-btn">Пропустить →</button>
    </div>

    <div v-else>
      <h3 class="instruction">Сопоставьте пары:</h3>

      <div class="matching-grid">
        <!-- Левая колонка (португальский) -->
        <div class="column left">
          <button
            v-for="(pair, index) in shuffledLeft"
            :key="`left-${index}`"
            @click="selectLeft(pair, index)"
            :class="['match-btn', getLeftClass(pair, index)]"
            :disabled="matched.includes(pair.id)"
          >
            {{ pair.pt }}
          </button>
        </div>

        <!-- Правая колонка (русский) -->
        <div class="column right">
          <button
            v-for="(pair, index) in shuffledRight"
            :key="`right-${index}`"
            @click="selectRight(pair, index)"
            :class="['match-btn', getRightClass(pair, index)]"
            :disabled="matched.includes(pair.id)"
          >
            {{ pair.ru }}
          </button>
        </div>
      </div>

      <div v-if="feedback" class="feedback" :class="feedback.type">
        {{ feedback.message }}
      </div>

      <div v-if="allMatched" class="completion">
        <p>🎉 Все пары сопоставлены!</p>
        <p v-if="exercise.explanationRu" class="explanation">
          <strong>Объяснение:</strong> {{ exercise.explanationRu }}
        </p>
        <button @click="continueNext" class="btn-continue sprint-btn">Далее →</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  exercise: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['answer'])

const shuffledLeft = ref([])
const shuffledRight = ref([])
const selectedLeft = ref(null)
const selectedRight = ref(null)
const matched = ref([])
const feedback = ref(null)

const allMatched = computed(() => 
  matched.value.length === (props.exercise?.pairs?.length || 0)
)

onMounted(() => {
  // Добавляем ID к парам для отслеживания
  const pairsWithIds = (props.exercise?.pairs || []).map((pair, index) => ({
    ...pair,
    id: index
  }))

  // Перемешиваем колонки отдельно
  shuffledLeft.value = shuffle([...pairsWithIds])
  shuffledRight.value = shuffle([...pairsWithIds])
})

const selectLeft = (pair, index) => {
  if (matched.value.includes(pair.id)) return
  selectedLeft.value = { pair, index }
  checkMatch()
}

const selectRight = (pair, index) => {
  if (matched.value.includes(pair.id)) return
  selectedRight.value = { pair, index }
  checkMatch()
}

const checkMatch = () => {
  if (!selectedLeft.value || !selectedRight.value) return

  if (selectedLeft.value.pair.id === selectedRight.value.pair.id) {
    // Правильная пара
    matched.value.push(selectedLeft.value.pair.id)
    feedback.value = { type: 'correct', message: '✅ Правильно!' }
    
    setTimeout(() => {
      feedback.value = null
      selectedLeft.value = null
      selectedRight.value = null
    }, 800)
  } else {
    // Неправильная пара
    feedback.value = { type: 'incorrect', message: '❌ Попробуйте еще раз' }
    
    setTimeout(() => {
      feedback.value = null
      selectedLeft.value = null
      selectedRight.value = null
    }, 1000)
  }
}

const getLeftClass = (pair, index) => {
  if (matched.value.includes(pair.id)) return 'matched'
  if (selectedLeft.value?.index === index) return 'selected'
  return ''
}

const getRightClass = (pair, index) => {
  if (matched.value.includes(pair.id)) return 'matched'
  if (selectedRight.value?.index === index) return 'selected'
  return ''
}

const continueNext = () => {
  emit('answer', {
    isCorrect: true,
    itemId: props.exercise.itemId
  })
}

function shuffle(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
</script>

<style scoped>
.matching {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.instruction {
  font-size: 1.3rem;
  color: #333;
  text-align: center;
}

.matching-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.column {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.match-btn {
  padding: 1rem;
  font-size: 1rem;
  text-align: center;
  background: #f5f5f5;
  border: 2px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.match-btn:hover:not(:disabled) {
  background: #e8e8e8;
  border-color: #42b883;
}

.match-btn.selected {
  background: #42b883;
  color: white;
  border-color: #42b883;
}

.match-btn.matched {
  background: #d4edda;
  border-color: #28a745;
  color: #155724;
  cursor: not-allowed;
  opacity: 0.7;
}

.feedback {
  padding: 1rem;
  text-align: center;
  border-radius: 8px;
  font-weight: 600;
  animation: fadeIn 0.3s;
}

.feedback.correct {
  background: #d4edda;
  color: #155724;
}

.feedback.incorrect {
  background: #f8d7da;
  color: #721c24;
}

.completion {
  text-align: center;
  padding: 1.5rem;
  background: #d4edda;
  border-radius: 8px;
}

.completion p {
  font-size: 1.3rem;
  color: #155724;
  margin-bottom: 1rem;
}

.completion .explanation {
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
  margin-bottom: 1rem;
}

.btn-continue {
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

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .matching-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
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

<style scoped>
.sprint-btn { margin-top: 1rem; }
</style>