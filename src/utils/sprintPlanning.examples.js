/**
 * Примеры использования функций планирования спринта (Stage 7.2)
 * 
 * Этот файл содержит примеры и интеграцию функций планирования
 * для различных сценариев использования в приложении
 */

import {
  analyzeUnitReadiness,
  determineOptimalDistribution,
  planSprint,
  identifyErrorProneItems,
  getStudyRecommendation
} from './sprintPlanning'

/**
 * Пример 1: Полный цикл планирования спринта
 * Используется в SprintView.vue при инициализации спринта
 */
export function exampleFullSprintPlanning(unitVocab, progressStore, materialsStore) {
  console.log('=== ПРИМЕР 1: Полный цикл планирования ===')
  
  // Шаг 1: Получить историю ошибок
  const sprintHistory = progressStore.getAllSprintHistory(50)
  const errorProneItems = identifyErrorProneItems(sprintHistory, unitVocab)
  
  // Шаг 2: Создать план спринта
  const plan = planSprint({
    unitVocab,
    progressStore,
    targetSprintSize: 10,
    errorProne: errorProneItems
  })
  
  // Шаг 3: Получить рекомендации
  const recommendation = getStudyRecommendation(plan)
  
  console.log('План создан:', {
    phase: plan.metadata.phase,
    items: plan.metadata.actualSize,
    newPercentage: plan.statistics.newItemsPercentage,
    reviewPercentage: plan.statistics.reviewItemsPercentage
  })
  
  console.log('Рекомендация:', recommendation.advice)
  
  return { plan, recommendation }
}

/**
 * Пример 2: Анализ только готовности материала
 * Используется в ProgressDashboard.vue для отображения статистики
 */
export function exampleAnalyzeReadiness(unitVocab, progressStore) {
  console.log('=== ПРИМЕР 2: Анализ готовности ===')
  
  const readiness = analyzeUnitReadiness(unitVocab, progressStore)
  
  console.log('Готовность материала:', {
    total: readiness.total,
    notStarted: readiness.notStarted,
    inProgress: readiness.inProgress,
    practiced: readiness.practiced,
    mastered: readiness.mastered,
    completion: `${readiness.completionPercentage}%`,
    readyForReview: readiness.dueForReview
  })
  
  return readiness
}

/**
 * Пример 3: Определение фазы обучения
 * Используется для адаптивного показа рекомендаций
 */
export function exampleDeterminePhase(readiness, targetSprintSize = 10) {
  console.log('=== ПРИМЕР 3: Определение фазы ===')
  
  const distribution = determineOptimalDistribution(readiness, targetSprintSize)
  
  console.log('Текущая фаза:', distribution.phase)
  console.log('Рекомендуемое распределение:', {
    newItems: distribution.newCount,
    reviewItems: distribution.reviewCount,
    reason: distribution.reason
  })
  
  return distribution
}

/**
 * Пример 4: Выявление проблемных слов
 * Используется для создания дополнительных тренировок
 */
export function exampleIdentifyProblems(sprintHistory, unitVocab) {
  console.log('=== ПРИМЕР 4: Выявление проблемных слов ===')
  
  const errorProneItems = identifyErrorProneItems(sprintHistory, unitVocab)
  
  if (errorProneItems.length === 0) {
    console.log('✅ Нет проблемных слов - отличный прогресс!')
  } else {
    console.log('🚨 Обнаружены проблемные слова:', {
      count: errorProneItems.length,
      words: errorProneItems.slice(0, 5).map(id => {
        const vocab = unitVocab.find(v => v.id === id)
        return vocab?.word
      })
    })
  }
  
  return errorProneItems
}

/**
 * Пример 5: Интеграция в ProgressDashboard для расширенной статистики
 */
export function exampleProgressDashboardIntegration(unitVocab, progressStore) {
  console.log('=== ПРИМЕР 5: Интеграция в Dashboard ===')
  
  const readiness = analyzeUnitReadiness(unitVocab, progressStore)
  const distribution = determineOptimalDistribution(readiness)
  
  const dashboardData = {
    unitId: progressStore.currentUnit,
    summary: {
      totalItems: readiness.total,
      completionPercentage: readiness.completionPercentage,
      phase: distribution.phase
    },
    breakdown: {
      notStarted: readiness.notStarted,
      inProgress: readiness.inProgress,
      practiced: readiness.practiced,
      mastered: readiness.mastered
    },
    nextSprintInfo: {
      recommendedNewItems: distribution.newCount,
      recommendedReviewItems: distribution.reviewCount,
      reason: distribution.reason
    }
  }
  
  console.log('Dashboard data:', dashboardData)
  return dashboardData
}

/**
 * ИНТЕГРАЦИЯ: Использование в ProgressDashboard.vue
 * 
 * <template>
 *   <div class="progress-dashboard">
 *     <div v-if="planData" class="planning-info">
 *       <div class="phase-indicator">
 *         Фаза: {{ planData.metadata.phase }}
 *       </div>
 *       
 *       <div class="next-sprint-preview">
 *         <h3>Следующий спринт:</h3>
 *         <p>{{ planData.statistics.newItemsPercentage }}% новых упражнений</p>
 *         <p>{{ planData.statistics.reviewItemsPercentage }}% повторения</p>
 *         <p class="advice">{{ recommendation.advice }}</p>
 *       </div>
 *       
 *       <div class="study-intensity">
 *         Рекомендуемая интенсивность: {{ recommendation.intensity }}
 *         Цель: {{ recommendation.dailyGoal }} спринтов в день
 *       </div>
 *     </div>
 *   </div>
 * </template>
 * 
 * <script setup>
 * import { ref, computed, onMounted } from 'vue'
 * import { planSprint, getStudyRecommendation } from '@/utils/sprintPlanning'
 * 
 * const planData = ref(null)
 * const recommendation = ref(null)
 * 
 * onMounted(async () => {
 *   const plan = planSprint({
 *     unitVocab: materialsStore.getVocabularyByUnit(progressStore.currentUnit),
 *     progressStore,
 *     targetSprintSize: 10
 *   })
 *   
 *   planData.value = plan
 *   recommendation.value = getStudyRecommendation(plan)
 * })
 * </script>
 */

/**
 * ИНТЕГРАЦИЯ: Использование в HomeView.vue для начального совета
 * 
 * <script setup>
 * import { getStudyRecommendation } from '@/utils/sprintPlanning'
 * 
 * const showStudyAdvice = async () => {
 *   const recommendation = getStudyRecommendation(sprintPlan)
 *   
 *   return {
 *     message: `${recommendation.intensity} интенсивность`,
 *     focus: recommendation.focusArea.join(', '),
 *     nextStep: recommendation.nextStep,
 *     timeToCompletion: recommendation.estimatedTimeToCompletion.description
 *   }
 * }
 * </script>
 */

/**
 * ИНТЕГРАЦИЯ: Использование в SprintView.vue
 * 
 * Уже реализовано в SprintView.vue:
 * 1. Определение проблемных слов из истории
 * 2. Создание плана спринта перед генерацией упражнений
 * 3. Получение рекомендаций по изучению
 * 4. Логирование информации плана
 */

/**
 * СТРУКТУРА данных планирования спринта
 * 
 * sprintPlan = {
 *   metadata: {
 *     timestamp: number,           // Время создания плана
 *     targetSize: number,           // Целевой размер спринта
 *     actualSize: number,           // Реальный размер спринта
 *     phase: string                 // 'initial' | 'consolidation' | 'maintenance' | 'review'
 *   },
 *   readiness: {
 *     total: number,                // Всего элементов в юните
 *     notStarted: number,           // Не начинали
 *     inProgress: number,           // В процессе (уровни 1-2)
 *     practiced: number,            // Отработано (уровни 3-5)
 *     mastered: number,             // Выучено (уровни 6-10)
 *     dueForReview: number,         // Готово к повторению
 *     completionPercentage: number, // Процент завершения
 *     details: Array<{
 *       id: string,
 *       word: string,
 *       status: string,             // 'not_started' | 'in_progress' | 'practiced' | 'mastered'
 *       level: number,
 *       accuracy: number,
 *       daysUntilReview: number,
 *       isDue: boolean
 *     }>
 *   },
 *   distribution: {
 *     newCount: number,             // Рекомендуемое кол-во новых упражнений
 *     reviewCount: number,          // Рекомендуемое кол-во повторений
 *     phase: string,                // Текущая фаза обучения
 *     reason: string,               // Причина распределения
 *     recommendation: string        // Рекомендация по изучению
 *   },
 *   items: Array<{                  // Элементы для спринта (отсортированные)
 *     id: string,
 *     word: string,
 *     status: string,
 *     level: number
 *   }>,
 *   statistics: {
 *     newItemsPercentage: number,    // % новых упражнений
 *     reviewItemsPercentage: number, // % повторений
 *     avgAccuracyOfReviewItems: number, // Средняя точность повторяемых
 *     priorityFocus: string          // 'error-prone words' | 'new material'
 *   }
 * }
 * 
 * recommendation = {
 *   phase: string,                   // 'initial' | 'consolidation' | 'maintenance' | 'review'
 *   intensity: string,               // 'high' | 'moderate' | 'low'
 *   dailyGoal: number,               // Спринтов в день
 *   focusArea: Array<string>,        // Области фокуса
 *   nextStep: string,                // Следующий шаг
 *   estimatedTimeToCompletion: {
 *     days: number,
 *     weeks: number,
 *     description: string
 *   },
 *   advice: string                   // Общий совет по изучению
 * }
 */

/**
 * ОПТИМИЗАЦИЯ: Кэширование результатов планирования
 * 
 * Использовать в больших приложениях:
 */
export class SprintPlannerCache {
  constructor(ttl = 5 * 60 * 1000) { // 5 минут по умолчанию
    this.cache = new Map()
    this.ttl = ttl
  }

  getCacheKey(unitId, progressStoreId) {
    return `${unitId}:${progressStoreId}`
  }

  get(unitId, progressStoreId) {
    const key = this.getCacheKey(unitId, progressStoreId)
    const cached = this.cache.get(key)
    
    if (!cached) return null
    
    const isExpired = Date.now() - cached.timestamp > this.ttl
    if (isExpired) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data
  }

  set(unitId, progressStoreId, data) {
    const key = this.getCacheKey(unitId, progressStoreId)
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  clear(unitId = null) {
    if (!unitId) {
      this.cache.clear()
    } else {
      const keysToDelete = Array.from(this.cache.keys()).filter(k =>
        k.startsWith(`${unitId}:`)
      )
      keysToDelete.forEach(k => this.cache.delete(k))
    }
  }
}

/**
 * ИСПОЛЬЗОВАНИЕ КЭША:
 * 
 * const plannerCache = new SprintPlannerCache()
 * 
 * const getCachedPlan = (unitVocab, progressStore) => {
 *   const cached = plannerCache.get(progressStore.currentUnit, progressStore.id)
 *   if (cached) return cached
 *   
 *   const plan = planSprint({ unitVocab, progressStore, targetSprintSize: 10 })
 *   plannerCache.set(progressStore.currentUnit, progressStore.id, plan)
 *   return plan
 * }
 */
