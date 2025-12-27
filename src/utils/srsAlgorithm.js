// Генерация интервалов повторений (в днях) с множителем 2.5
// Начало: 1 день, каждый правильный ответ - умножение на 2.5
// 1, 2.5, 6.25, 15.625, 39.0625, 97.65625...
function generateSRSIntervals(levels = 10) {
  const intervals = []
  let current = 1 // начало с 1 дня
  intervals.push(current)
  
  for (let i = 1; i < levels; i++) {
    current = current * 2.5
    intervals.push(Math.round(current * 10) / 10) // округляем до 1 знака после запятой
  }
  
  return intervals
}

const SRS_INTERVALS = generateSRSIntervals(10)

/**
 * Рассчитать следующий интервал повторения
 * Алгоритм: правильно → уровень +1, ошибка → уровень 0 (минимум)
 * @param {number} currentLevel - текущий уровень (0-10)
 * @param {boolean} isCorrect - правильный ли ответ
 * @returns {object} { newLevel, daysToNext, nextReviewDate }
 */
export function calculateNextReview(currentLevel, isCorrect) {
  let newLevel = currentLevel

  if (isCorrect) {
    // Правильно → повышаем уровень (множитель 2.5)
    newLevel = Math.min(currentLevel + 1, SRS_INTERVALS.length - 1)
  } else {
    // Ошибка → сброс на минимум (начало сначала)
    newLevel = 0
  }

  const daysToNext = SRS_INTERVALS[newLevel] || 960

  return {
    newLevel,
    daysToNext,
    nextReviewDate: Date.now() + (daysToNext * 24 * 60 * 60 * 1000)
  }
}

/**
 * Проверка, нужно ли повторять элемент
 * @param {number} nextReviewTimestamp - timestamp следующего повторения
 * @returns {boolean}
 */
export function isDueForReview(nextReviewTimestamp) {
  return Date.now() >= nextReviewTimestamp
}

/**
 * Смешивание новых и повторяемых элементов для спринта
 * Логика: определение материала, смешивание нового/повторяемого 70/30
 * @param {Array} newItems - новые элементы
 * @param {Array} reviewItems - элементы для повторения (SRS)
 * @param {number} totalCount - общее количество нужных элементов
 * @returns {Array} смешанный массив элементов для спринта
 */
export function mixItemsForSprint(newItems, reviewItems, totalCount = 10) {
  // Если нечего повторять, берем только новое
  if (reviewItems.length === 0) {
    return shuffleArray(newItems).slice(0, totalCount)
  }
  
  // Если нет новых элементов, берем только старое
  if (newItems.length === 0) {
    return shuffleArray(reviewItems).slice(0, totalCount)
  }
  
  // Оптимальное распределение: 70% повторение, 30% новое
  const reviewCount = Math.min(
    Math.ceil(totalCount * 0.7),
    reviewItems.length
  )
  const newCount = Math.min(
    totalCount - reviewCount,
    newItems.length
  )
  
  // Если недостаточно элементов, заполняем другими
  const deficit = totalCount - (reviewCount + newCount)
  let finalReviewCount = reviewCount
  let finalNewCount = newCount
  
  if (deficit > 0) {
    // Если не хватает новых, берем больше старых
    if (newItems.length < newCount + deficit) {
      finalReviewCount = Math.min(
        reviewCount + deficit,
        reviewItems.length
      )
    } else {
      finalNewCount = newCount + deficit
    }
  }

  const selectedReview = shuffleArray(reviewItems).slice(0, finalReviewCount)
  const selectedNew = shuffleArray(newItems).slice(0, finalNewCount)

  return shuffleArray([...selectedReview, ...selectedNew])
}

/**
 * Перемешивание массива (Fisher-Yates)
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
 * Получить количество дней до следующего повторения по уровню
 * @param {number} level - текущий уровень
 * @returns {number} количество дней
 */
export function getDaysUntilNextReview(level) {
  return SRS_INTERVALS[Math.min(level, SRS_INTERVALS.length - 1)] || 960
}

/**
 * Получить статистику SRS по уровням
 * @param {Object} progressData - объект прогресса { itemId: { level, ... } }
 * @returns {Object} статистика { level0: count, level1: count, ... }
 */
export function getProgressStats(progressData) {
  const stats = {}
  
  // Инициализация счетчиков для каждого уровня
  for (let i = 0; i < SRS_INTERVALS.length; i++) {
    stats[`level${i}`] = 0
  }
  
  // Подсчет элементов на каждом уровне
  Object.values(progressData).forEach(item => {
    const levelKey = `level${item.level}`
    if (levelKey in stats) {
      stats[levelKey]++
    }
  })
  
  return stats
}

/**
 * Получить список элементов, готовых к повторению
 * @param {Array} itemIds - список ID элементов
 * @param {Object} progressData - объект прогресса
 * @returns {Array} отфильтрованный список ID элементов
 */
export function getItemsReadyForReview(itemIds, progressData) {
  const now = Date.now()
  
  return itemIds.filter(itemId => {
    const progress = progressData[itemId]
    if (!progress) return false
    return progress.nextReview <= now
  })
}

/**
 * Получить общую статистику по изучению
 * @param {Object} progressData - объект прогресса
 * @returns {Object} { totalLearned, totalAttempts, averageLevel }
 */
export function getLearningStats(progressData) {
  const items = Object.values(progressData)
  
  if (items.length === 0) {
    return {
      totalLearned: 0,
      totalAttempts: 0,
      averageLevel: 0,
      totalCorrect: 0,
      totalIncorrect: 0
    }
  }
  
  const totalCorrect = items.reduce((sum, item) => sum + (item.correct || 0), 0)
  const totalIncorrect = items.reduce((sum, item) => sum + (item.incorrect || 0), 0)
  const totalAttempts = totalCorrect + totalIncorrect
  const averageLevel = items.reduce((sum, item) => sum + item.level, 0) / items.length
  
  // Считаем "выученным" элементом на уровне 3 и выше
  const totalLearned = items.filter(item => item.level >= 3).length
  
  return {
    totalLearned,
    totalAttempts,
    averageLevel: Math.round(averageLevel * 10) / 10,
    totalCorrect,
    totalIncorrect,
    accuracy: totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0
  }
}

/**
 * Экспортировать интервалы для внешнего использования
 */
export function getSRSIntervals() {
  return [...SRS_INTERVALS]
}