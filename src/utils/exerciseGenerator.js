/**
 * Генератор упражнений на основе шаблонов
 */

/**
 * Генерирует уникальный ID упражнения
 */
function generateExerciseId() {
  return `ex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Находит релевантную грамматику для упражнения
 * @param {Object} exercise - упражнение
 * @param {Array} grammar - список грамматических правил
 * @returns {Object|null} грамматическое объяснение
 */
export function findRelevantGrammar(exercise, grammar = []) {
  if (!grammar || grammar.length === 0) return null
  
  // Определяем тип грамматики по типу упражнения
  const grammarMap = {
    'multiple_choice': ['Ser vs Estar', 'Possessivos', 'Preposições de Lugar'],
    'fill_blank': ['Ser vs Estar', 'Presente do Indicativo', 'Verbos Reflexivos', 'Expressões de Tempo'],
    'translation': ['Ser vs Estar', 'Possessivos', 'Verbos Reflexivos'],
    'matching': ['Números Cardinais', 'Dias da Semana'],
    'transform': ['Possessivos', 'Verbos Reflexivos']
  }
  
  const relevantTitles = grammarMap[exercise.type] || []
  const relevant = grammar.find(g =>
    relevantTitles.some(title => g.title.includes(title))
  )
  
  return relevant || grammar[Math.floor(Math.random() * grammar.length)]
}

/**
 * Обогащает упражнение информацией о грамматике
 * @param {Object} exercise - упражнение
 * @param {Object} grammar - грамматическое объяснение
 * @returns {Object} упражнение с информацией о грамматике
 */
export function enrichExerciseWithGrammar(exercise, grammar) {
  return {
    ...exercise,
    grammarId: grammar?.id,
    grammarTitle: grammar?.title,
    explanationRu: grammar?.explanation_ru,
    grammarExamples: grammar?.examples
  }
}

/**
 * Генерация упражнения типа fill_blank
 */
export function generateFillBlank(template, vocab) {
  const id = generateExerciseId()
  
  if (template.base) {
    // Динамический шаблон с параметрами
    let text = template.base
    template.params?.forEach(param => {
      const value = getRandomValue(param.from)
      text = text.replace(param.placeholder, value)
    })
    return {
      id,
      type: 'fill_blank',
      question: text,
      hint: template.correct_logic
    }
  }

  // Статический шаблон
  return {
    id,
    type: 'fill_blank',
    question: template.template,
    correct: template.correct,
    hint: template.hint,
    distractors: template.distractors || []
  }
}

/**
 * Генерация упражнения типа multiple_choice
 */
export function generateMultipleChoice(template, vocab) {
  const id = generateExerciseId()
  
  return {
    id,
    type: 'multiple_choice',
    question: template.template,
    options: template.options,
    correct: template.correct,
    hint: template.hint
  }
}

/**
 * Генерация упражнения на перевод
 */
export function generateTranslation(vocab) {
  const id = generateExerciseId()
  const direction = Math.random() > 0.5 ? 'pt-ru' : 'ru-pt'
  
  return {
    id,
    type: 'translation',
    question: direction === 'pt-ru' ? vocab.word : vocab.translation_ru,
    correct: direction === 'pt-ru' ? vocab.translation_ru : vocab.word,
    direction,
    hint: vocab.example_pt,
    itemId: vocab.id // Связь с исходным словарем для SRS
  }
}

/**
 * Генерация упражнения matching (сопоставление)
 */
export function generateMatching(vocabList) {
  const id = generateExerciseId()
  const items = shuffleArray(vocabList).slice(0, 5)
  
  return {
    id,
    type: 'matching',
    pairs: items.map(v => ({
      id: v.id,
      pt: v.word,
      ru: v.translation_ru
    })),
    itemIds: items.map(v => v.id) // Связи с исходными элементами
  }
}

// Вспомогательные функции
function getRandomValue(type) {
  if (type === 'time') {
    const times = ['manhã', 'tarde', 'noite']
    return times[Math.floor(Math.random() * times.length)]
  }
  if (type === 'numbers') {
    return Math.floor(Math.random() * 12) + 1
  }
  return ''
}

function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Генерация упражнения transform (трансформация)
 */
export function generateTransform(template, vocab) {
  const id = generateExerciseId()
  
  return {
    id,
    type: 'transform',
    question: template.template,
    correct: template.correct,
    hint: template.hint,
    transformType: template.transform_type, // e.g., 'pluralize', 'conjugate'
    distractors: template.distractors || []
  }
}

/**
 * Главная функция генерации упражнений для спринта
 * Генерирует смешанный набор из 5-10 упражнений различных типов
 * @param {Object} materials - {vocabulary, templates}
 * @param {number} count - количество упражнений (по умолчанию 10)
 * @returns {Array} массив сгенерированных упражнений
 */
export function generateSprintExercises(materials, count = 10) {
  // Валидация входных данных
  count = Math.max(5, Math.min(count, 15)) // Гарантируем 5-15 упражнений
  
  const exercises = []
  const { vocabulary = [], templates = [] } = materials

  if (!vocabulary || vocabulary.length === 0) {
    console.warn('generateSprintExercises: No vocabulary provided')
    return []
  }

  // Типы упражнений с их долями
  const exerciseTypes = [
    { type: 'translation', weight: 0.4, minCount: 2 },
    { type: 'multiple_choice', weight: 0.25, minCount: 1 },
    { type: 'fill_blank', weight: 0.2, minCount: 1 },
    { type: 'matching', weight: 0.1, minCount: 0 },
    { type: 'transform', weight: 0.05, minCount: 0 }
  ]

  // Вычисляем количество упражнений каждого типа
  const typeCounts = {}
  let minTotal = 0

  exerciseTypes.forEach(et => {
    typeCounts[et.type] = Math.max(
      et.minCount,
      Math.round(count * et.weight)
    )
    minTotal += et.minCount
  })

  // Если минимальное количество превышает целевое, пересчитываем
  if (minTotal > count) {
    const scale = count / minTotal
    exerciseTypes.forEach(et => {
      if (typeCounts[et.type] > et.minCount) {
        typeCounts[et.type] = Math.max(
          et.minCount,
          Math.round(typeCounts[et.type] * scale)
        )
      }
    })
  }

  // Добавляем по типам с логированием
  
  // 1. Translation - основной тип
  for (let i = 0; i < typeCounts.translation && exercises.length < count; i++) {
    const vocab = vocabulary[Math.floor(Math.random() * vocabulary.length)]
    exercises.push(generateTranslation(vocab))
  }

  // 2. Multiple Choice
  if (templates.length > 0) {
    for (let i = 0; i < typeCounts.multiple_choice && exercises.length < count; i++) {
      const template = templates.find(t => t.type === 'multiple_choice')
      if (template) {
        exercises.push(generateMultipleChoice(template, vocabulary))
      }
    }
  }

  // 3. Fill Blank
  if (templates.length > 0) {
    for (let i = 0; i < typeCounts.fill_blank && exercises.length < count; i++) {
      const template = templates.find(t => t.type === 'fill_blank')
      if (template) {
        exercises.push(generateFillBlank(template, vocabulary))
      }
    }
  }

  // 4. Matching
  if (vocabulary.length >= 5) {
    for (let i = 0; i < typeCounts.matching && exercises.length < count; i++) {
      exercises.push(generateMatching(vocabulary))
    }
  }

  // 5. Transform
  if (templates.length > 0) {
    for (let i = 0; i < typeCounts.transform && exercises.length < count; i++) {
      const template = templates.find(t => t.type === 'transform')
      if (template) {
        exercises.push(generateTransform(template, vocabulary))
      }
    }
  }

  // Гарантируем минимум упражнений (5 штук)
  while (exercises.length < 5) {
    const vocab = vocabulary[Math.floor(Math.random() * vocabulary.length)]
    exercises.push(generateTranslation(vocab))
  }

  // Если все еще недостаточно, добавляем перевод
  while (exercises.length < count) {
    const vocab = vocabulary[Math.floor(Math.random() * vocabulary.length)]
    exercises.push(generateTranslation(vocab))
  }

  // Логирование
  console.log(`✅ Generated ${exercises.length} exercises (target: ${count})`)

  // Перемешиваем порядок упражнений и срезаем до целевого количества
  return shuffleArray(exercises).slice(0, count)
}