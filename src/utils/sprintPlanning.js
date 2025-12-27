/**
 * Планирование спринта - определение материала и смешивание нового/повторяемого
 * Этап 7.2: Планирование (определение материала, смешивание нового/повторяемого)
 */

/**
 * Анализ готовности материала для спринта
 * Определяет, какой материал готов к использованию в спринте
 * @param {Array} unitVocab - словарь юнита
 * @param {Object} progressStore - хранилище прогресса
 * @returns {Object} анализ готовности материала
 */
export function analyzeUnitReadiness(unitVocab, progressStore) {
  const now = Date.now()
  const analysis = {
    total: unitVocab.length,
    notStarted: 0,      // Уровень 0 (не начинали)
    inProgress: 0,      // Уровни 1-2 (в процессе)
    practiced: 0,       // Уровни 3-5 (отработано)
    mastered: 0,        // Уровни 6-10 (выучено)
    dueForReview: 0,    // Готово к повторению
    details: []
  }

  unitVocab.forEach(vocab => {
    const progress = progressStore.getItemProgress(vocab.id)
    
    if (!progress) {
      // Не начинали
      analysis.notStarted++
      analysis.details.push({
        id: vocab.id,
        word: vocab.word,
        status: 'not_started',
        level: 0
      })
    } else {
      const { level, nextReview, correct, incorrect } = progress
      const isDue = nextReview <= now
      const accuracy = correct + incorrect > 0 
        ? (correct / (correct + incorrect)) * 100 
        : 0

      // Категоризация по уровню
      if (level <= 0) {
        analysis.notStarted++
      } else if (level <= 2) {
        analysis.inProgress++
      } else if (level <= 5) {
        analysis.practiced++
      } else {
        analysis.mastered++
      }

      // Проверка готовности к повторению
      if (isDue) {
        analysis.dueForReview++
      }

      analysis.details.push({
        id: vocab.id,
        word: vocab.word,
        status: level <= 0 ? 'not_started' : 
                level <= 2 ? 'in_progress' : 
                level <= 5 ? 'practiced' : 'mastered',
        level,
        accuracy: Math.round(accuracy),
        correct,
        incorrect,
        daysUntilReview: Math.ceil((nextReview - now) / (24 * 60 * 60 * 1000)),
        isDue
      })
    }
  })

  analysis.completionPercentage = Math.round(
    ((analysis.mastered + analysis.practiced) / analysis.total) * 100
  )

  return analysis
}

/**
 * Определение оптимального распределения материала для спринта
 * Возвращает рекомендацию по количеству новых и повторяемых элементов
 * @param {Object} readiness - результат analyzeUnitReadiness
 * @param {number} targetSprintSize - целевой размер спринта (по умолчанию 10)
 * @returns {Object} распределение { newCount, reviewCount, recommendation }
 */
export function determineOptimalDistribution(readiness, targetSprintSize = 10) {
  const distribution = {
    newCount: 0,
    reviewCount: 0,
    reason: '',
    recommendation: '',
    phase: 'initial' // initial, consolidation, maintenance, review
  }

  const completionRate = readiness.completionPercentage
  const totalAvailable = readiness.dueForReview + readiness.notStarted

  // Фаза 1: Начальное изучение (0-25% завершено)
  if (completionRate <= 25) {
    distribution.phase = 'initial'
    distribution.newCount = Math.min(8, Math.ceil(targetSprintSize * 0.8))
    distribution.reviewCount = Math.max(2, Math.floor(targetSprintSize * 0.2))
    distribution.reason = 'Ранняя фаза изучения - фокус на новом материале'
    distribution.recommendation = 'Активно изучайте новые слова и структуры'
  }
  // Фаза 2: Консолидация (25-50% завершено)
  else if (completionRate <= 50) {
    distribution.phase = 'consolidation'
    distribution.newCount = Math.min(6, Math.ceil(targetSprintSize * 0.6))
    distribution.reviewCount = Math.max(4, Math.floor(targetSprintSize * 0.4))
    distribution.reason = 'Балансировка между новым и повторением'
    distribution.recommendation = 'Балансируйте изучение нового с повторением'
  }
  // Фаза 3: Поддержка (50-75% завершено)
  else if (completionRate <= 75) {
    distribution.phase = 'maintenance'
    distribution.newCount = Math.min(4, Math.ceil(targetSprintSize * 0.4))
    distribution.reviewCount = Math.max(6, Math.floor(targetSprintSize * 0.6))
    distribution.reason = 'Фокус на повторение и укрепление'
    distribution.recommendation = 'Больше внимания повторению для долгосрочного запоминания'
  }
  // Фаза 4: Доработка (75%+ завершено)
  else {
    distribution.phase = 'review'
    distribution.newCount = Math.max(1, Math.floor(targetSprintSize * 0.2))
    distribution.reviewCount = Math.min(9, Math.ceil(targetSprintSize * 0.8))
    distribution.reason = 'Закрепление и полное овладение материалом'
    distribution.recommendation = 'Повторяйте сложные моменты и оттачивайте навыки'
  }

  // Корректировка если материал недостаточен
  if (readiness.notStarted === 0) {
    // Если нет новых элементов, все на повторение
    distribution.newCount = 0
    distribution.reviewCount = targetSprintSize
    distribution.reason += ' (новых элементов нет)'
  }

  if (readiness.dueForReview === 0 && readiness.inProgress === 0) {
    // Если нет элементов для повторения, все новое
    distribution.newCount = targetSprintSize
    distribution.reviewCount = 0
    distribution.reason += ' (нет элементов для повторения)'
  }

  return distribution
}

/**
 * Планирование спринта с анализом и оптимизацией
 * Основная функция для подготовки плана спринта
 * @param {Object} params - параметры планирования
 * @param {Array} params.unitVocab - словарь юнита
 * @param {Object} params.progressStore - хранилище прогресса
 * @param {number} params.targetSprintSize - целевой размер спринта (по умолчанию 10)
 * @param {Array} params.errorProne - слова с высокой вероятностью ошибки (опционально)
 * @returns {Object} план спринта с все информацией для выполнения
 */
export function planSprint({
  unitVocab,
  progressStore,
  targetSprintSize = 10,
  errorProne = []
}) {
  // Шаг 1: Анализ готовности материала
  const readiness = analyzeUnitReadiness(unitVocab, progressStore)
  
  console.log('📊 [SprintPlanning] Анализ готовности материала:', {
    total: readiness.total,
    notStarted: readiness.notStarted,
    inProgress: readiness.inProgress,
    practiced: readiness.practiced,
    mastered: readiness.mastered,
    dueForReview: readiness.dueForReview,
    completionPercentage: readiness.completionPercentage
  })

  // Шаг 2: Определение оптимального распределения
  const distribution = determineOptimalDistribution(readiness, targetSprintSize)
  
  console.log('⚖️ [SprintPlanning] Определено распределение:', {
    phase: distribution.phase,
    newCount: distribution.newCount,
    reviewCount: distribution.reviewCount,
    reason: distribution.reason
  })

  // Шаг 3: Подготовка элементов для спринта
  const now = Date.now()
  const items = {
    new: [],
    review: [],
    errorProne: []
  }

  // Разделяем на категории
  readiness.details.forEach(detail => {
    if (detail.status === 'not_started') {
      items.new.push(detail)
    } else if (detail.isDue) {
      items.review.push(detail)
    }
  })

  // Выделяем проблемные элементы
  if (errorProne && errorProne.length > 0) {
    items.errorProne = readiness.details.filter(d => 
      errorProne.includes(d.id) && d.status !== 'not_started'
    )
  }

  // Сортируем для оптимальности
  // Новые элементы: случайный порядок
  items.new = shuffleArray(items.new)
  
  // Повторяемые: сортируем по времени (давно не повторяли идут первыми)
  items.review.sort((a, b) => a.daysUntilReview - b.daysUntilReview)
  
  // Проблемные: по точности (низкая точность идет первой)
  items.errorProne.sort((a, b) => a.accuracy - b.accuracy)

  console.log('🔍 [SprintPlanning] Категоризация элементов:', {
    newItems: items.new.length,
    reviewItems: items.review.length,
    errorProneItems: items.errorProne.length
  })

  // Шаг 4: Формирование финального списка элементов спринта
  const sprintItems = []
  
  // Добавляем новые элементы
  const newToAdd = Math.min(distribution.newCount, items.new.length)
  sprintItems.push(...items.new.slice(0, newToAdd))
  
  // Добавляем элементы для повторения
  const reviewToAdd = Math.min(
    distribution.reviewCount,
    items.review.length + items.errorProne.length
  )
  
  // Приоритет: сначала проблемные элементы
  const priorityItems = items.errorProne.slice(0, Math.ceil(reviewToAdd * 0.3))
  sprintItems.push(...priorityItems)
  
  // Затем элементы для обычного повторения
  const regularReviewCount = reviewToAdd - priorityItems.length
  sprintItems.push(...items.review.slice(0, regularReviewCount))
  
  // Если недостаточно элементов, добавляем больше новых
  if (sprintItems.length < targetSprintSize) {
    const deficit = targetSprintSize - sprintItems.length
    sprintItems.push(...items.new.slice(newToAdd, newToAdd + deficit))
  }

  console.log('✅ [SprintPlanning] Финальный список спринта:', {
    totalItems: sprintItems.length,
    newItems: sprintItems.filter(i => i.status === 'not_started').length,
    reviewItems: sprintItems.filter(i => i.status !== 'not_started').length
  })

  // Итоговый план спринта
  const sprintPlan = {
    metadata: {
      timestamp: Date.now(),
      targetSize: targetSprintSize,
      actualSize: sprintItems.length,
      phase: distribution.phase
    },
    readiness,
    distribution,
    items: sprintItems.slice(0, targetSprintSize),
    statistics: {
      newItemsPercentage: Math.round((
        sprintItems.filter(i => i.status === 'not_started').length / 
        sprintItems.length
      ) * 100),
      reviewItemsPercentage: Math.round((
        sprintItems.filter(i => i.status !== 'not_started').length / 
        sprintItems.length
      ) * 100),
      avgAccuracyOfReviewItems: calculateAverageAccuracy(
        sprintItems.filter(i => i.status !== 'not_started')
      ),
      priorityFocus: items.errorProne.length > 0 ? 'error-prone words' : 'new material'
    }
  }

  console.log('📋 [SprintPlanning] План спринта готов:', {
    phase: sprintPlan.metadata.phase,
    actualSize: sprintPlan.metadata.actualSize,
    newItemsPercentage: sprintPlan.statistics.newItemsPercentage,
    reviewItemsPercentage: sprintPlan.statistics.reviewItemsPercentage,
    recommendation: distribution.recommendation
  })

  return sprintPlan
}

/**
 * Анализ истории ошибок для определения проблемных элементов
 * @param {Array} sprintHistory - история спринтов
 * @param {Array} unitVocab - словарь юнита
 * @returns {Array} ID слов с частыми ошибками
 */
export function identifyErrorProneItems(sprintHistory, unitVocab) {
  const errorCounts = {}
  const totalAttempts = {}

  // Подсчитываем ошибки для каждого слова
  sprintHistory.forEach(sprint => {
    sprint.exerciseResults?.forEach(result => {
      if (result.itemId) {
        totalAttempts[result.itemId] = (totalAttempts[result.itemId] || 0) + 1
        if (!result.isCorrect) {
          errorCounts[result.itemId] = (errorCounts[result.itemId] || 0) + 1
        }
      }
    })
  })

  // Вычисляем процент ошибок и фильтруем проблемные
  const errorProne = []
  Object.keys(errorCounts).forEach(itemId => {
    const errorRate = errorCounts[itemId] / totalAttempts[itemId]
    // Считаем проблемным если 30%+ ошибок
    if (errorRate >= 0.3) {
      const vocab = unitVocab.find(v => v.id === itemId)
      if (vocab) {
        errorProne.push({
          id: itemId,
          word: vocab.word,
          errorRate: Math.round(errorRate * 100),
          totalAttempts: totalAttempts[itemId],
          errors: errorCounts[itemId]
        })
      }
    }
  })

  // Сортируем по проценту ошибок (выше - опаснее)
  return errorProne.sort((a, b) => b.errorRate - a.errorRate).map(e => e.id)
}

/**
 * Помощник: перемешивание массива (Fisher-Yates)
 */
function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Помощник: расчет средней точности элементов
 */
function calculateAverageAccuracy(items) {
  if (items.length === 0) return 0
  const totalAccuracy = items.reduce((sum, item) => sum + (item.accuracy || 0), 0)
  return Math.round(totalAccuracy / items.length)
}

/**
 * Получить рекомендацию по интенсивности изучения
 * @param {Object} sprintPlan - план спринта
 * @returns {Object} рекомендация с советами
 */
export function getStudyRecommendation(sprintPlan) {
  const { metadata, distribution, statistics, readiness } = sprintPlan
  const phase = metadata.phase

  let intensity = 'moderate'
  let dailyGoal = 3  // спринта в день
  let focusArea = []

  // Анализируем фазу и определяем интенсивность
  if (phase === 'initial') {
    intensity = 'high'
    dailyGoal = 5
    focusArea = ['vocabulary', 'pronunciation', 'basic structures']
  } else if (phase === 'consolidation') {
    intensity = 'high'
    dailyGoal = 4
    focusArea = ['grammar', 'sentence building', 'listening']
  } else if (phase === 'maintenance') {
    intensity = 'moderate'
    dailyGoal = 3
    focusArea = ['speaking', 'writing', 'reading comprehension']
  } else {
    intensity = 'moderate'
    dailyGoal = 2
    focusArea = ['advanced topics', 'cultural context', 'native patterns']
  }

  // Проверяем точность - если низкая, увеличиваем сложность
  if (statistics.avgAccuracyOfReviewItems < 60) {
    intensity = 'high'
    dailyGoal = Math.ceil(dailyGoal * 1.5)
    focusArea.unshift('review weak areas')
  }

  // Определяем следующий шаг
  let nextStep = ''
  if (readiness.completionPercentage === 0) {
    nextStep = 'Start learning the first vocabulary set'
  } else if (readiness.notStarted === 0) {
    nextStep = 'All vocabulary started! Focus on consolidation'
  } else if (readiness.dueForReview > readiness.notStarted) {
    nextStep = 'More items are ready for review than new ones'
  } else {
    nextStep = `Continue learning ${readiness.notStarted} remaining items`
  }

  return {
    phase,
    intensity,
    dailyGoal,
    focusArea,
    nextStep,
    estimatedTimeToCompletion: estimateTimeToCompletion(readiness),
    advice: distribution.recommendation
  }
}

/**
 * Помощник: расчет примерного времени до полного завершения юнита
 */
function estimateTimeToCompletion(readiness) {
  const remaining = readiness.notStarted + readiness.inProgress
  const daysPerItem = 2 // условно: повторение каждые 2 дня в среднем
  const estimatedDays = Math.ceil(remaining * daysPerItem)
  
  return {
    days: estimatedDays,
    weeks: Math.ceil(estimatedDays / 7),
    description: estimatedDays <= 7 
      ? `~${estimatedDays} дней`
      : `~${Math.ceil(estimatedDays / 7)} недель`
  }
}
