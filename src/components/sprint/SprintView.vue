<template>
  <div class="sprint-view">
    <!-- Ошибка инициализации -->
    <div v-if="error" class="error-container">
      <h2>⚠️ Ошибка</h2>
      <p>{{ error }}</p>
      <button @click="$router.push('/')" class="btn-primary">
        На главную
      </button>
    </div>

    <!-- Хедер спринта -->
    <header v-else class="sprint-header">
      <div class="timer">
        <span class="timer-icon">⏱️</span>
        <span class="timer-value">{{ formattedTime }}</span>
      </div>
      <div class="progress">
        <span>{{ currentIndex + 1 }} / {{ totalExercises }}</span>
      </div>
    </header>

    <!-- Теория (показывается в начале) -->
    <TheoryCard
      v-if="showingTheory && !error && currentTheory"
      :theory="currentTheory"
      @continue="startExercises"
    />

    <!-- Упражнения -->
    <ExerciseCard
      v-else-if="currentExercise && !error"
      :exercise="currentExercise"
      :key="currentIndex"
      @answer="handleAnswer"
    />

    <!-- Результаты спринта -->
    <div v-else-if="sprintCompleted" class="sprint-results">
      <h2>🎉 Спринт завершен!</h2>
      <div class="stats">
        <div class="stat">
          <span class="stat-value">{{ correctAnswers }}</span>
          <span class="stat-label">Правильно</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ incorrectAnswers }}</span>
          <span class="stat-label">Неправильно</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ accuracy }}%</span>
          <span class="stat-label">Точность</span>
        </div>
      </div>

      <!-- Анализ по типам упражнений -->
      <div v-if="Object.keys(typeStats).length > 0" class="type-analysis">
        <h3>📊 Анализ по типам:</h3>
        <div class="type-stats">
          <div v-for="(stat, type) in typeStats" :key="type" class="type-stat">
            <span class="type-name">{{ type }}</span>
            <span class="type-accuracy">{{ stat.accuracy }}%</span>
            <span class="type-count">({{ stat.correct }}/{{ stat.total }})</span>
          </div>
        </div>
      </div>

      <!-- Время выполнения -->
      <div class="time-info">
        <p>⏱️ Время: {{ Math.floor(elapsedSeconds / 60) }}м {{ elapsedSeconds % 60 }}с</p>
      </div>

      <button @click="finishSprint" class="btn-primary">
        Завершить
      </button>
    </div>

    <!-- Загрузка -->
    <div v-else class="loading">
      <span class="spinner"></span>
      <p>Генерация упражнений...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useMaterialsStore } from '@/stores/materialsStore'
import { useProgressStore } from '@/stores/progressStore'
import { generateSprintExercises } from '@/utils/exerciseGenerator'
import { calculateSprintStats, formatSprintResult, analyzeExerciseTypes, generateSprintFeedback } from '@/utils/sprintLogic'
import { planSprint, identifyErrorProneItems, getStudyRecommendation } from '@/utils/sprintPlanning'
import TheoryCard from './TheoryCard.vue'
import ExerciseCard from './ExerciseCard.vue'

const materialsStore = useMaterialsStore()
const progressStore = useProgressStore()

// Состояние спринта
const showingTheory = ref(true)
const currentTheory = ref(null)
const exercises = ref([])
const currentIndex = ref(0)
const correctAnswers = ref(0)
const incorrectAnswers = ref(0)
const sprintCompleted = ref(false)
const error = ref(null)
const exerciseResults = ref([]) // Отслеживание результатов каждого упражнения
const sprintPlan = ref(null) // План спринта из планирования
const studyRecommendation = ref(null) // Рекомендация по изучению

// Таймер
const elapsedSeconds = ref(0)
const timerInterval = ref(null)

// Вычисляемые свойства
const currentExercise = computed(() => exercises.value[currentIndex.value])
const totalExercises = computed(() => exercises.value.length)

const formattedTime = computed(() => {
  const mins = Math.floor(elapsedSeconds.value / 60)
  const secs = elapsedSeconds.value % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
})

const accuracy = computed(() => {
  const total = correctAnswers.value + incorrectAnswers.value
  return total > 0 ? Math.round((correctAnswers.value / total) * 100) : 0
})

// Статистика по типам упражнений
const typeStats = computed(() => analyzeExerciseTypes(exerciseResults.value))

// Инициализация спринта
onMounted(async () => {
  try {
    console.log('🚀 [SprintView] Инициализация спринта...')
    
    // Проверяем, выбран ли юнит
    console.log('🔍 [SprintView] Текущий юнит:', progressStore.currentUnit)
    if (!progressStore.currentUnit || progressStore.currentUnit === '') {
      error.value = 'Пожалуйста, выберите юнит перед началом спринта'
      console.error('❌ [SprintView] Юнит не выбран:', progressStore.currentUnit)
      return
    }
    
    // Расширенная диагностика хранилищ
    console.log('🔬 [SprintView] Диагностика хранилищ:', {
      progressStore: {
        currentUnit: progressStore.currentUnit,
        exists: !!progressStore,
        hasDB: !!progressStore.db,
        dbName: progressStore.db?.name
      },
      materialsStore: {
        exists: !!materialsStore,
        vocabularyLength: materialsStore?.vocabulary?.length || 0,
        vocabularySample: materialsStore?.vocabulary?.slice(0, 3)
      }
    })
    
    // Проверка состояния хранилищ
    if (!materialsStore) {
      const errorMsg = 'Хранилище материалов не инициализировано'
      console.error(`❌ [SprintView] ${errorMsg}`)
      error.value = errorMsg
      return
    }
    
    // Проверка наличия материалов
    if (!materialsStore.vocabulary || materialsStore.vocabulary.length === 0) {
      const errorMsg = 'Словарь материалов пуст'
      console.error(`❌ [SprintView] ${errorMsg}`)
      error.value = errorMsg
      return
    }
    
    // Диагностика структуры словаря
    const vocabularyStructureCheck = materialsStore.vocabulary.map((item, index) => ({
      index,
      hasTags: !!item.tags,
      tagCount: item.tags?.length || 0,
      hasId: !!item.id,
      hasTitle: !!item.title
    }))
    
    console.log('🕵️ [SprintView] Структура словаря:', {
      totalItems: vocabularyStructureCheck.length,
      itemsWithTags: vocabularyStructureCheck.filter(item => item.hasTags).length,
      itemsWithoutTags: vocabularyStructureCheck.filter(item => !item.hasTags).length,
      sampleStructure: vocabularyStructureCheck.slice(0, 5)
    })
    
    // Проверка состояния хранилища материалов
    if (!materialsStore) {
      const errorMsg = 'Хранилище материалов не инициализировано'
      console.error(`❌ [SprintView] ${errorMsg}`)
      error.value = errorMsg
      return
    }
    
    // Проверка наличия материалов
    if (!materialsStore.vocabulary || materialsStore.vocabulary.length === 0) {
      const errorMsg = 'Словарь материалов пуст'
      console.error(`❌ [SprintView] ${errorMsg}`)
      error.value = errorMsg
      return
    }
    
    // Расширенная диагностика материалов
    console.log('📊 [SprintView] Диагностика материалов:', {
      vocabularyTotal: materialsStore.vocabulary.length,
      vocabularySample: materialsStore.vocabulary.slice(0, 3),
      currentUnit: progressStore.currentUnit
    })
    
    // Загружаем материалы
    console.log('📚 [SprintView] Загрузка материалов...')
    await materialsStore.loadAll()
    console.log('✅ [SprintView] Материалы загружены:', {
      vocabulary: materialsStore.vocabulary.length,
      grammar: materialsStore.grammar.length,
      templates: materialsStore.templates.length,
      texts: materialsStore.texts.length
    })
    
    console.log('🗂️ [SprintView] Инициализация БД...')
    await progressStore.initDB()
    console.log('✅ [SprintView] БД инициализирована')

    // ===== НОВОЕ: Планирование спринта (7.2) =====
    console.log('📋 [SprintView] Планирование спринта...')
    console.log('🔍 [SprintView] Текущий юнит:', progressStore.currentUnit)
    console.log('📚 [SprintView] Словарь:', materialsStore.vocabulary.length)
    
    // Безопасный и подробный фильтр словаря
    const vocabularyFilterDiagnostics = {
      total: materialsStore.vocabulary.length,
      processedItems: 0,
      validItems: 0,
      invalidItems: 0,
      missingTags: 0,
      invalidTagType: 0
    }
    
    const unitVocab = materialsStore.vocabulary.reduce((acc, v, index) => {
      vocabularyFilterDiagnostics.processedItems++
      
      // Проверка наличия тегов
      if (!v.tags) {
        vocabularyFilterDiagnostics.missingTags++
        console.warn(`⚠️ [SprintView] Элемент словаря ${index} не имеет тегов:`, v)
        return acc
      }
      
      // Проверка типа тегов
      if (!Array.isArray(v.tags)) {
        vocabularyFilterDiagnostics.invalidTagType++
        console.error(`❌ [SprintView] Теги элемента ${index} не являются массивом:`, {
          tags: v.tags,
          type: typeof v.tags
        })
        return acc
      }
      
      // Проверка наличия тега текущего юнита
      const hasCurrentUnitTag = v.tags.includes(progressStore.currentUnit)
      
      if (hasCurrentUnitTag) {
        vocabularyFilterDiagnostics.validItems++
        acc.push(v)
      } else {
        vocabularyFilterDiagnostics.invalidItems++
        console.debug(`📝 [SprintView] Элемент словаря не содержит тег ${progressStore.currentUnit}:`, {
          id: v.id,
          tags: v.tags
        })
      }
      
      return acc
    }, [])
    
    // Логирование диагностики фильтрации
    console.log('📊 [SprintView] Диагностика фильтрации словаря:', {
      currentUnit: progressStore.currentUnit,
      ...vocabularyFilterDiagnostics,
      validItemsPercentage:
        Math.round((vocabularyFilterDiagnostics.validItems / vocabularyFilterDiagnostics.processedItems) * 100)
    })
    
    // Проверка наличия словаря для юнита
    if (unitVocab.length === 0) {
      const errorMsg = `Не найдено материалов для юнита: ${progressStore.currentUnit}`
      console.error(`❌ [SprintView] ${errorMsg}`)
      console.error('📋 [SprintView] Полный список тегов в словаре:',
        [...new Set(materialsStore.vocabulary.flatMap(v => v.tags || []))]
      )
      error.value = errorMsg
      return
    }
    
    // Определяем проблемные слова из истории
    let errorProneItems = []
    const sprintHistory = await progressStore.getAllSprintHistory(50)
    if (sprintHistory.length > 0) {
      errorProneItems = identifyErrorProneItems(sprintHistory, unitVocab)
      console.log('🚨 [SprintView] Определены проблемные слова:', errorProneItems.length)
    }
    
    // Создаем план спринта
    sprintPlan.value = planSprint({
      unitVocab,
      progressStore,
      targetSprintSize: 10,
      errorProne: errorProneItems
    })
    
    // Получаем рекомендацию по изучению
    studyRecommendation.value = getStudyRecommendation(sprintPlan.value)
    console.log('💡 [SprintView] Рекомендация по изучению:', {
      phase: studyRecommendation.value.phase,
      intensity: studyRecommendation.value.intensity,
      dailyGoal: studyRecommendation.value.dailyGoal,
      focusArea: studyRecommendation.value.focusArea
    })
    // ===== КОНЕЦ ПЛАНИРОВАНИЯ =====

    // Получаем материалы для спринта (с учетом SRS и плана)
    console.log('📖 [SprintView] Получение материалов спринта для юнита:', progressStore.currentUnit)
    const sprintMaterials = materialsStore.getSprintMaterials(
      progressStore.currentUnit,
      progressStore,
      sprintPlan.value.statistics.newItemsPercentage === 100 ? 10 : 5
    )
    
    console.log('📊 [SprintView] Материалы спринта:', {
      dueForReview: sprintMaterials.stats.dueForReview,
      newItems: sprintMaterials.stats.newItems,
      totalInUnit: sprintMaterials.stats.totalInUnit,
      vocabularyForSprint: sprintMaterials.vocabulary.length,
      grammarForSprint: sprintMaterials.grammar.length,
      templatesForSprint: sprintMaterials.templates.length
    })

    // Загружаем теорию для текущего юнита
    console.log('📝 [SprintView] Загрузка теории...')
    if (sprintMaterials.grammar.length > 0) {
      currentTheory.value = sprintMaterials.grammar[0]
      console.log('✅ [SprintView] Теория загружена:', currentTheory.value.title)
    } else {
      console.warn('⚠️ [SprintView] Теория не найдена для юнита:', progressStore.currentUnit)
    }

    // Генерируем упражнения из материалов спринта
    console.log('🎯 [SprintView] Генерация упражнений...')
    exercises.value = generateSprintExercises(
      {
        vocabulary: sprintMaterials.vocabulary,
        templates: sprintMaterials.templates
      },
      sprintPlan.value.metadata.actualSize // Используем размер из плана
    )
    
    console.log('✅ [SprintView] Упражнения сгенерированы:', {
      total: exercises.value.length,
      types: exercises.value.reduce((acc, ex) => {
        acc[ex.type] = (acc[ex.type] || 0) + 1
        return acc
      }, {})
    })

    // Проверка успешной генерации
    if (exercises.value.length === 0) {
      console.error('❌ [SprintView] Ошибка: упражнения не сгенерированы')
      error.value = 'Ошибка генерации упражнений'
    } else {
      console.log('🎉 [SprintView] Спринт готов к началу')
      console.log('📋 [SprintView] План спринта применен:', {
        phase: sprintPlan.value.metadata.phase,
        items: sprintPlan.value.metadata.actualSize,
        recommendation: studyRecommendation.value.advice
      })
    }

    // Запускаем таймер
    timerInterval.value = setInterval(() => {
      elapsedSeconds.value++
    }, 1000)
    
    console.log('⏱️ [SprintView] Таймер запущен')
  } catch (err) {
    console.error('❌ [SprintView] Ошибка инициализации спринта:', err)
    error.value = `Ошибка инициализации спринта: ${err.message}`
  }
})

onUnmounted(() => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
})

// Начать упражнения (после теории)
const startExercises = () => {
  showingTheory.value = false
}

// Обработка ответа
const handleAnswer = async (result) => {
  const { isCorrect, userAnswer } = result
  const currentExerciseData = exercises.value[currentIndex.value]

  console.log(`📝 [SprintView] Упражнение ${currentIndex.value + 1}/${exercises.value.length}:`, {
    type: currentExerciseData.type,
    isCorrect,
    answer: userAnswer?.substring(0, 50) || 'N/A'
  })

  // Обновляем счетчики правильности
  if (isCorrect) {
    correctAnswers.value++
  } else {
    incorrectAnswers.value++
  }

  // Сохраняем результат упражнения
  exerciseResults.value.push({
    exerciseId: currentExerciseData.id,
    itemId: currentExerciseData.itemId,
    itemIds: currentExerciseData.itemIds,
    type: currentExerciseData.type,
    isCorrect,
    userAnswer,
    timestamp: Date.now()
  })

  // Сохраняем прогресс в SRS для элементов упражнения
  try {
    // Для перевода - сохраняем конкретное слово
    if (currentExerciseData.itemId) {
      console.log(`💾 [SprintView] Сохранение прогресса для itemId: ${currentExerciseData.itemId}`)
      await progressStore.saveItemProgress(currentExerciseData.itemId, isCorrect)
    }
    // Для matching - сохраняем все пары
    else if (currentExerciseData.itemIds && Array.isArray(currentExerciseData.itemIds)) {
      console.log(`💾 [SprintView] Сохранение прогресса для ${currentExerciseData.itemIds.length} itemIds`)
      for (const itemId of currentExerciseData.itemIds) {
        await progressStore.saveItemProgress(itemId, isCorrect)
      }
    }
  } catch (err) {
    console.error('❌ [SprintView] Ошибка сохранения прогресса:', err)
  }

  console.log(`📊 [SprintView] Статистика: ${correctAnswers.value} правильно, ${incorrectAnswers.value} неправильно`)

  // Переход к следующему упражнению
  if (currentIndex.value < exercises.value.length - 1) {
    currentIndex.value++
    console.log(`➡️ [SprintView] Переход к упражнению ${currentIndex.value + 1}`)
  } else {
    // Спринт завершен
    console.log('🎯 [SprintView] Все упражнения завершены!')
    sprintCompleted.value = true
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
    }
    
    // Сохраняем полную историю спринта в IndexedDB
    try {
      console.log('💾 [SprintView] Сохранение истории спринта...')
      await saveSprintHistory()
      await progressStore.saveSprintStats()
      console.log('✅ [SprintView] История спринта сохранена')
    } catch (err) {
      console.error('❌ [SprintView] Ошибка сохранения истории:', err)
    }
  }
}

// Сохранение полной истории спринта в IndexedDB
const saveSprintHistory = async () => {
  try {
    const stats = calculateSprintStats(exerciseResults.value, elapsedSeconds.value)
    const sprintResult = formatSprintResult(stats, progressStore.currentUnit, exerciseResults.value)
    
    if (!progressStore.db) {
      console.log('[SprintView] БД не инициализирована, выполняем инициализацию...')
      await progressStore.initDB()
    }

    // Проверяем, что object store существует
    if (!progressStore.db.objectStoreNames.contains('sprintHistory')) {
      console.error('[SprintView] Object store sprintHistory не найден!')
      throw new Error('Object store sprintHistory не найден в базе данных')
    }

    console.log('[SprintView] Сохранение истории спринта...')
    const tx = progressStore.db.transaction('sprintHistory', 'readwrite')
    const store = tx.objectStore('sprintHistory')
    await store.add(sprintResult)
    
    console.log('[SprintView] История спринта сохранена:', sprintResult)
  } catch (err) {
    console.error('[SprintView] Ошибка сохранения истории спринта:', err)
    throw err
  }
}

// Завершение спринта
const finishSprint = () => {
  // Переход на главную или дашборд
  window.location.href = '/'
}
</script>

<style scoped>
.sprint-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
  min-height: 100vh;
}

.error-container {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  margin-top: 2rem;
}

.error-container h2 {
  color: #856404;
  margin-bottom: 1rem;
}

.error-container p {
  color: #856404;
  font-size: 1rem;
  margin-bottom: 1.5rem;
}

.sprint-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 12px;
  margin-bottom: 2rem;
}

.timer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
}

.progress {
  font-size: 1rem;
  color: #666;
}

.sprint-results {
  text-align: center;
  padding: 2rem;
}

.sprint-results h2 {
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #42b883;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin: 2rem 0;
}

.stat {
  padding: 1.5rem;
  background: #f9f9f9;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #42b883;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
}

.type-analysis {
  background: #f0f8ff;
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  border-left: 4px solid #42b883;
}

.type-analysis h3 {
  margin-top: 0;
  color: #333;
}

.type-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.type-stat {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border: 1px solid #e0e0e0;
}

.type-name {
  font-weight: 600;
  color: #333;
  text-transform: capitalize;
}

.type-accuracy {
  font-size: 1.5rem;
  font-weight: 700;
  color: #42b883;
}

.type-count {
  font-size: 0.9rem;
  color: #999;
}

.time-info {
  font-size: 1rem;
  color: #666;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 8px;
  margin: 1rem 0;
}

.btn-primary {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  background: #42b883;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-primary:hover {
  background: #35a372;
}

.loading {
  text-align: center;
  padding: 3rem;
}

.spinner {
  display: inline-block;
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #42b883;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .sprint-view {
    padding: 0.5rem;
  }
  
  .stats {
    grid-template-columns: 1fr;
  }
}
</style>