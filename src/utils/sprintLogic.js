/**
 * Логика расчета результатов спринта
 */

/**
 * Расчет статистики спринта
 * @param {Array} exercises - массив выполненных упражнений с результатами
 * @param {number} elapsedSeconds - прошедшие секунды
 * @returns {Object} статистика спринта
 */
export function calculateSprintStats(exercises, elapsedSeconds) {
  const totalExercises = exercises.length
  const correctAnswers = exercises.filter(ex => ex.isCorrect).length
  const incorrectAnswers = totalExercises - correctAnswers
  const accuracy = totalExercises > 0 ? Math.round((correctAnswers / totalExercises) * 100) : 0

  // Расчет скорости выполнения
  const minutesTaken = Math.ceil(elapsedSeconds / 60)
  const exercisesPerMinute = minutesTaken > 0 ? (totalExercises / minutesTaken).toFixed(1) : 0

  // Определение оценки по результатам
  let grade = 'F'
  if (accuracy >= 90) grade = 'A'
  else if (accuracy >= 80) grade = 'B'
  else if (accuracy >= 70) grade = 'C'
  else if (accuracy >= 60) grade = 'D'

  return {
    totalExercises,
    correctAnswers,
    incorrectAnswers,
    accuracy,
    elapsedSeconds,
    minutesTaken,
    exercisesPerMinute,
    grade,
    timestamp: Date.now()
  }
}

/**
 * Формирование объекта результата для сохранения в IndexedDB
 * @param {Object} stats - статистика спринта
 * @param {string} unitId - ID юнита
 * @param {Array} exerciseResults - результаты отдельных упражнений
 * @returns {Object} объект для сохранения
 */
export function formatSprintResult(stats, unitId, exerciseResults = []) {
  // Если в снимках есть grammarId — используем его как ключ спринта (чтобы повторные прогoны того же набора перезаписывали запись)
  const grammarId = (exerciseResults || []).find(er => er.snapshot && (er.snapshot.grammarId || er.snapshot.grammarId === 0))?.snapshot?.grammarId
  const id = grammarId !== undefined && grammarId !== null ? `grammar_${String(unitId || '')}_${String(grammarId)}` : `sprint_${Date.now()}`

  return {
    id,
    unitId,
    date: new Date(stats.timestamp).toISOString(),
    stats: {
      ...stats
    },
    exerciseResults: exerciseResults.map(result => ({
      exerciseId: result.exerciseId,
      itemId: result.itemId,
      isCorrect: result.isCorrect,
      type: result.type,
      timestamp: result.timestamp || Date.now(),
      // Сохраняем снимок упражнения для возможности повтора
      snapshot: result.snapshot || null
    }))
  }
}

/**
 * Получить типы упражнений из результатов
 * @param {Array} exerciseResults - результаты упражнений
 * @returns {Object} статистика по типам
 */
export function analyzeExerciseTypes(exerciseResults) {
  const typeStats = {}

  exerciseResults.forEach(result => {
    if (!typeStats[result.type]) {
      typeStats[result.type] = {
        total: 0,
        correct: 0,
        accuracy: 0
      }
    }
    typeStats[result.type].total++
    if (result.isCorrect) {
      typeStats[result.type].correct++
    }
  })

  // Расчет accuracy по типам
  Object.keys(typeStats).forEach(type => {
    const stat = typeStats[type]
    stat.accuracy = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0
  })

  return typeStats
}

/**
 * Формирование сообщения о результатах спринта
 * @param {Object} stats - статистика спринта
 * @returns {Object} сообщение и рекомендации
 */
export function generateSprintFeedback(stats) {
  let message = ''
  let recommendation = ''
  const { accuracy, grade } = stats

  // Сообщение на основе точности
  if (accuracy === 100) {
    message = '🌟 Идеально! Ты справился на 100%'
    recommendation = 'Отличный результат! Можешь переходить на следующий уровень.'
  } else if (accuracy >= 80) {
    message = '✨ Отлично выполнено!'
    recommendation = 'Очень хороший результат. Рекомендуем повторить сложные моменты.'
  } else if (accuracy >= 60) {
    message = '👍 Хороший старт'
    recommendation = 'Неплохо! Нужно немного подтянуть некоторые области.'
  } else {
    message = '💪 Продолжай работать'
    recommendation = 'Не расстраивайся! Повторение - мать учения. Попробуй еще раз.'
  }

  return {
    message,
    recommendation,
    grade,
    shouldRepeat: accuracy < 70
  }
}
