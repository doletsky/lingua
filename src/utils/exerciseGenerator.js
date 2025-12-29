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
  // Защита: grammar может быть объектом (single theory) или массивом
  if (!grammar) return null

  if (!Array.isArray(grammar)) {
    // Если это одиночная запись грамматики — возвращаем её ТОЛЬКО если явно видно соответствие
    const g = grammar
    const needle = (g.title || '').toLowerCase()
    const q = (exercise.question || '').toLowerCase()
    const correct = (exercise.correct || '').toLowerCase()

    // Прямое совпадение по title/question/correct
    if (q && needle && q.includes(needle)) return g
    if (correct && needle && correct.includes(needle)) return g

    // Совпадение по примерам грамматики (если вопрос или корректный ответ встречается в примере)
    if (Array.isArray(g.examples) && g.examples.length > 0) {
      const matchesExample = g.examples.some(ex => {
        const pt = (ex.pt || '').toLowerCase()
        if (q && pt.includes(q)) return true
        if (correct && pt.includes(correct)) return true
        // для вариантов ответа
        if (exercise.options && Array.isArray(exercise.options)) {
          return exercise.options.some(opt => pt.includes((opt || '').toLowerCase()))
        }
        if (exercise.pairs && Array.isArray(exercise.pairs)) {
          return exercise.pairs.some(p => pt.includes(((p.pt || '')).toLowerCase()))
        }
        return false
      })
      if (matchesExample) return g
    }

    return null
  }

  if (grammar.length === 0) return null
  
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
    g && g.title && relevantTitles.some(title => g.title.includes(title))
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

  if (!template) {
    console.warn('generateFillBlank: missing template')
    return null
  }

  if (template.base) {
    // Динамический шаблон с параметрами
    let text = template.base
    template.params?.forEach(param => {
      let value = ''
      // If an explicit array of values is provided
      if (Array.isArray(param.from)) {
        value = param.from[Math.floor(Math.random() * param.from.length)]
      } else if (param.from === 'vocabulary') {
        // pick a vocabulary item optionally filtered by tags
        if (Array.isArray(vocab) && vocab.length > 0) {
          let candidates = vocab
          if (Array.isArray(param.tags) && param.tags.length > 0) {
            const tagsSet = new Set(param.tags.map(t => t.toLowerCase()))
            candidates = candidates.filter(v => Array.isArray(v.tags) && v.tags.some(t => tagsSet.has(t.toLowerCase())))
          }
          if (candidates.length > 0) {
            const item = candidates[Math.floor(Math.random() * candidates.length)]
            value = item?.word || ''
          }
        }
      } else {
        value = getRandomValue(param.from)
      }
      text = text.replace(param.placeholder, value)
    })

    if (!text || typeof text !== 'string') {
      console.warn('generateFillBlank: generated text is invalid', template)
      return null
    }

    // Try to extract a default correct answer from correct_logic when explicit correct is not provided
    let correct = template.correct || ''
    if (!correct && template.correct_logic) {
      const assignMatch = template.correct_logic.match(/correct\s*[=:\-]\s*['\"]([^'\"]+)['\"]/i)
      if (assignMatch) correct = assignMatch[1].trim()

      // fallback: try to find small words like 'um' or 'meio' in the text of correct_logic
      if (!correct) {
        const m = template.correct_logic.match(/\b(um|meio|uma|duas|dois|doze|onze|um)\b/i)
        if (m) correct = m[0].trim()
      }

      // fallback 2: if text after colon is a direct example (e.g., "Use reflexive verb in present: levanto.")
      if (!correct && template.correct_logic.includes(':')) {
        const after = template.correct_logic.split(':').slice(1).join(':').trim()
        const wordMatch = after.match(/^([^\s.,;()]+)/)
        if (wordMatch) {
          correct = wordMatch[1].replace(/[.]+$/, '').trim()
        }
      }
    }

    if (!correct) {
      // If still no correct answer, log and skip this template
      console.warn('generateFillBlank: invalid generated correct answer, skipping', template)
      return null
    }

    return {
      id,
      type: 'fill_blank',
      question: text,
      hint: template.hint || template.correct_logic,
      correct
    }
  }

  // Статический шаблон
  if (!template.template || !template.correct) {
    console.warn('generateFillBlank: invalid static template, skipping', template)
    return null
  }

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

  if (!template) {
    console.warn('generateMultipleChoice: missing template')
    return null
  }

  // Поддерживаем два формата шаблона:
  // 1) Статический: { template, options, correct }
  // 2) Динамический: { base, params, correct || correct_logic, distractors }

  let questionText = template.template || ''
  // If dynamic base with params, substitute placeholders
  if (template.base) {
    questionText = template.base
    template.params?.forEach(param => {
      let value = ''
      if (param.from === 'time') value = getRandomValue('time')
      else if (param.from === 'numbers') value = getRandomValue('numbers')
      else if (param.from === 'vocabulary' && Array.isArray(vocab) && vocab.length > 0) {
        const item = vocab[Math.floor(Math.random() * vocab.length)]
        // choose word or translation depending on want
        value = item?.word || item?.translation_ru || ''
      }
      questionText = questionText.replace(param.placeholder, value)
    })
  }

  // Derive correct answer: prefer explicit `correct`, else try to parse `correct_logic` maps
  let correct = template.correct || ''
  if (!correct && template.correct_logic && template.params && template.params.length > 0) {
    // Try to parse mappings like "manhã - bom dia, tarde - boa tarde" OR simple assignment like "correct = 'gosto'"

    // 1) simple assignment
    const assignMatch = template.correct_logic.match(/correct\s*[=:\-]\s*['\"]([^'\"]+)['\"]/i)
    if (assignMatch) {
      correct = assignMatch[1].trim()
    }

    // 2) mapping pairs like "manhã - bom dia"
    if (!correct) {
      const pairs = {}
      const parts = template.correct_logic.split(/[,;]+/)
      parts.forEach(p => {
        // remove any prefix like "Match greeting to time:" first
        const afterColon = p.includes(':') ? p.split(':').slice(1).join(':') : p
        const m = afterColon.match(/([^\-:]+)[\-:]+(.+)/)
        if (m) {
          const key = m[1].trim().toLowerCase()
          const val = m[2].trim().replace(/[.]+$/,'')
          pairs[key] = val
        }
      })
      // If we substituted a param, try to find its value in questionText
      const param = template.params[0]
      if (param) {
        // extract value we used for this param
        let paramValue = ''
        if (param.from === 'time') paramValue = questionText.match(/(manhã|tarde|noite)/i)?.[0]
        else if (param.from === 'numbers') paramValue = questionText.match(/\d+/)?.[0]
        else if (param.from === 'vocabulary') paramValue = questionText.match(/\w+/)?.[0]
        if (paramValue) {
          const key = ('' + paramValue).toLowerCase()
          if (pairs[key]) correct = pairs[key]
        }
        // As a fallback, when pairs contain values, pick the first value as correct
        if (!correct && Object.keys(pairs).length > 0) {
          correct = Object.values(pairs)[0]
        }
      }
    }
  }

  // Build options: prefer explicit options, else combine correct + distractors, else use parsed map values
  let options = Array.isArray(template.options) ? [...template.options] : null
  if (!options && Array.isArray(template.distractors) && template.distractors.length > 0 && correct) {
    options = shuffleArray([correct, ...template.distractors])
  }

  // If we still don't have options, try to synthesize them from correct_logic or vocabulary
  if (!options && template.correct_logic) {
    // 1) use parsed values from correct_logic if any
    const vals = []
    const parts = template.correct_logic.split(/[,;]+/)
    parts.forEach(p => {
      const afterColon = p.includes(':') ? p.split(':').slice(1).join(':') : p
      const m = afterColon.match(/([^\-:]+)[\-:]+(.+)/)
      if (m) {
        vals.push(m[2].trim().replace(/[.]+$/,''))
      }
    })
    if (vals.length > 0) options = shuffleArray(vals)

    // 2) support assignment like "correct = 'gosto'": generate conjugation-based distractors or take other verbs from vocab
    if (!options && correct) {
      // conjugation heuristic: if correct ends with 'o' (eu form), generate other person forms
      const conjMatch = correct.match(/(.+?)o$/i)
      if (conjMatch) {
        const root = conjMatch[1]
        const forms = [root + 'o', root + 'as', root + 'a', root + 'amos', root + 'am']
        options = shuffleArray(forms).filter((v,i,a)=>a.indexOf(v)===i).slice(0,4)
        if (!options.includes(correct)) options = shuffleArray([correct, ...options]).slice(0,4)
      }

      // fallback: use verbs from vocabulary
      if (!options) {
        const verbs = Array.isArray(vocab) ? vocab.filter(v=>Array.isArray(v.tags) && v.tags.some(t=>/verb/i.test(t))).map(v=>v.word) : []
        if (verbs.length > 0) options = shuffleArray([correct, ...verbs.slice(0,3)])
      }

      // final fallback: simple filler
      if (!options) options = shuffleArray([correct, 'não'])
    }
  }

  if (!questionText || !correct || !Array.isArray(options) || options.length < 2) {
    console.warn('generateMultipleChoice: invalid template, skipping', template)
    return null
  }

  return {
    id,
    type: 'multiple_choice',
    question: questionText,
    options,
    correct,
    hint: template.hint || template.correct_logic
  }
} 

/**
 * Генерация упражнения на перевод
 */
export function generateTranslation(vocab) {
  const id = generateExerciseId()
  const direction = Math.random() > 0.5 ? 'pt-ru' : 'ru-pt'

  if (!vocab || (!vocab.word && !vocab.translation_ru)) {
    console.warn('generateTranslation: invalid vocab item, skipping', vocab)
    return null
  }

  const question = direction === 'pt-ru' ? vocab.word : vocab.translation_ru
  const correct = direction === 'pt-ru' ? vocab.translation_ru : vocab.word

  if (!question || !correct) {
    console.warn('generateTranslation: incomplete vocab fields', vocab)
    return null
  }

  return {
    id,
    type: 'translation',
    question,
    correct,
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
  const items = shuffleArray(vocabList || []).slice(0, 5).filter(v => v && v.word && v.translation_ru)

  if (items.length < 2) {
    console.warn('generateMatching: not enough valid items for matching, skipping')
    return null
  }

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

  if (!template) {
    console.warn('generateTransform: missing template')
    return null
  }

  let questionText = template.template || ''
  if (template.base) {
    questionText = template.base
    template.params?.forEach(param => {
      let value = ''
      if (param.from === 'numbers') value = getRandomValue('numbers')
      else if (param.from === 'vocabulary' && Array.isArray(vocab) && vocab.length > 0) {
        const item = vocab[Math.floor(Math.random() * vocab.length)]
        value = item?.word || item?.translation_ru || ''
      }
      questionText = questionText.replace(param.placeholder, value)
      // store substituted value for later use
      param._lastValue = value
    })
  }

  let correct = template.correct || ''

  // Special handling for number->word logic (common in templates)
  if (!correct && template.params && template.params.length > 0) {
    const param = template.params.find(p => p.from === 'numbers')
    if (param && param._lastValue) {
      const num = Number(param._lastValue)
      const numMap = {
        1: 'um', 2: 'dois', 3: 'três', 4: 'quatro', 5: 'cinco', 6: 'seis',
        7: 'sete', 8: 'oito', 9: 'nove', 10: 'dez', 11: 'onze', 12: 'doze'
      }
      if (numMap[num]) correct = numMap[num]
    }
  }

  if (!questionText || !correct) {
    console.warn('generateTransform: invalid template, skipping', template)
    return null
  }

  return {
    id,
    type: 'transform',
    question: questionText,
    correct,
    hint: template.hint || template.correct_logic,
    transformType: template.transform_type,
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
  
  let exercises = []
  const { vocabulary = [], templates = [], grammar = null } = materials

  if (!vocabulary || vocabulary.length === 0) {
    console.warn('generateSprintExercises: No vocabulary provided')
    return []
  }

  // Вспомогательные функции для выбора шаблона, чтобы не использовать тематику, которая не была показана
  function templateMatchesGrammar(template, grammarItem) {
    if (!grammarItem || !grammarItem.title) return false
    const needle = grammarItem.title.toLowerCase()
    if (template.base && template.base.toLowerCase().includes(needle)) return true
    if (template.correct_logic && template.correct_logic.toLowerCase().includes(needle)) return true
    if ((template.type || '').toLowerCase().includes(needle)) return true
    return false
  }

  function templateMatchesVocabTags(template, vocabTagsSet) {
    if (!template.params || !Array.isArray(template.params)) return false
    return template.params.some(p => {
      if (p.from === 'vocabulary' && Array.isArray(p.tags)) {
        return p.tags.some(tag => vocabTagsSet.has(tag))
      }
      return false
    })
  }

  function findTemplateForType(templatesList, wantedType, vocabList, grammarItem) {
    const vocabTagsSet = new Set((vocabList || []).flatMap(v => v.tags || []))
    const candidates = templatesList.filter(t => {
      const tTypeNorm = t.type === 'match' ? 'matching' : t.type
      return tTypeNorm === wantedType
    })
    if (candidates.length === 0) return null

    // If a focused grammar is provided — prefer templates directly referencing it
    const grammarMatch = candidates.find(t => templateMatchesGrammar(t, grammarItem))
    if (grammarMatch) return grammarMatch

    // Next, prefer templates that reference vocabulary tags present in the unit
    const vocabMatch = candidates.find(t => templateMatchesVocabTags(t, vocabTagsSet))
    if (vocabMatch) return vocabMatch

    // If a focused grammar is requested but no grammar/vocab match is found,
    // do NOT fall back to arbitrary templates — return null to avoid unrelated exercises
    if (grammarItem) return null

    // Otherwise (no focused grammar) return the first available candidate
    return candidates[0]
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
  
  // Если передана одиночная запись грамматики — переходим в фокусированный режим
  const focusedGrammar = (grammar && !Array.isArray(grammar)) ? grammar : null

  // Найдём словарь, связанный с грамматикой (через примеры и совпадения)
  function findVocabRelatedToGrammar(vocabList, grammarObj) {
    if (!grammarObj || !Array.isArray(vocabList)) return []
    const related = []
    const lowerExamples = (grammarObj.examples || []).map(e => (e.pt || '').toLowerCase())

    for (const v of vocabList) {
      const word = (v.word || '').toLowerCase()
      const translation = (v.translation_ru || '').toLowerCase()

      // Прямое вхождение слова в примеры теории
      if (lowerExamples.some(ex => ex.includes(word))) {
        related.push(v)
        continue
      }

      // Или перевод встречается в русских примерах
      if (grammarObj.examples && grammarObj.examples.some(e => (e.ru || '').toLowerCase().includes(translation))) {
        related.push(v)
        continue
      }

      // Попробуем сопоставить по тегам: если vocab.tags содержит нормализованное title
      const titleSlug = (grammarObj.title || '').toLowerCase().replace(/[^a-z0-9а-яё]+/g, ' ').trim()
      if (Array.isArray(v.tags) && v.tags.some(t => titleSlug.split(' ').some(tok => tok && t.toLowerCase().includes(tok)))) {
        related.push(v)
        continue
      }
    }

    return related
  }

  const grammarVocab = focusedGrammar ? findVocabRelatedToGrammar(vocabulary, focusedGrammar) : []

  // 1. Translation - если фокусная грамматика задана, сначала используем vocab, связанный с ней
  if (grammarVocab.length > 0) {
    for (let i = 0; i < typeCounts.translation && exercises.length < count; i++) {
      const vocab = grammarVocab[Math.floor(Math.random() * grammarVocab.length)]
      const ex = generateTranslation(vocab)
      if (ex) {
        // помечаем только если это действительно из грамматики
        const enriched = enrichExerciseWithGrammar(ex, focusedGrammar)
        exercises.push(enriched)
      }
    }
  }

  // Если не хватает переводов — дополнительно добираем из общего словаря
  for (let i = exercises.length; i < Math.max(typeCounts.translation, 0) && exercises.length < count; i++) {
    const vocab = vocabulary[Math.floor(Math.random() * vocabulary.length)]
    const ex = generateTranslation(vocab)
    if (ex) exercises.push(ex)
  }

  // 2. Multiple Choice — сначала берем шаблоны из самой грамматики (если есть)
  if (focusedGrammar && Array.isArray(focusedGrammar.templates)) {
    const mcTemplates = focusedGrammar.templates.filter(t => t.type === 'multiple_choice')
    for (let i = 0; i < mcTemplates.length && exercises.length < count && i < typeCounts.multiple_choice; i++) {
      const raw = generateMultipleChoice(mcTemplates[i], vocabulary)
      if (raw) {
        const ex = enrichExerciseWithGrammar(raw, focusedGrammar)
        exercises.push(ex)
      }
    }
  }

  // Если шаблонов грамматики не хватает — используем общий подход
  if (templates.length > 0) {
    for (let i = 0; i < typeCounts.multiple_choice && exercises.length < count; i++) {
      const template = findTemplateForType(templates, 'multiple_choice', vocabulary, grammar)
      if (template) {
        const raw = generateMultipleChoice(template, vocabulary)
        if (raw) {
          const relevantGrammar = findRelevantGrammar(raw, grammar)
          const ex = enrichExerciseWithGrammar(raw, relevantGrammar)
          console.debug('[generateSprintExercises] multiple_choice enriched with grammar:', { exerciseId: ex.id, grammarId: ex.grammarId, grammarTitle: ex.grammarTitle })
          exercises.push(ex)
        }
      }
    }
  }

  // 3. Fill Blank — сначала из грамматики
  if (focusedGrammar && Array.isArray(focusedGrammar.templates)) {
    const fbTemplates = focusedGrammar.templates.filter(t => t.type === 'fill_blank')
    for (let i = 0; i < fbTemplates.length && exercises.length < count && i < typeCounts.fill_blank; i++) {
      const raw = generateFillBlank(fbTemplates[i], vocabulary)
      if (raw) {
        const ex = enrichExerciseWithGrammar(raw, focusedGrammar)
        exercises.push(ex)
      }
    }
  }

  // Затем общий подход
  if (templates.length > 0) {
    for (let i = 0; i < typeCounts.fill_blank && exercises.length < count; i++) {
      const template = findTemplateForType(templates, 'fill_blank', vocabulary, grammar)
      if (template) {
        const raw = generateFillBlank(template, vocabulary)
        if (raw) {
          const relevantGrammar = findRelevantGrammar(raw, grammar)
          const ex = enrichExerciseWithGrammar(raw, relevantGrammar)
          console.debug('[generateSprintExercises] fill_blank enriched with grammar:', { exerciseId: ex.id, grammarId: ex.grammarId, grammarTitle: ex.grammarTitle })
          exercises.push(ex)
        }
      }
    }
  }

  // 4. Matching — используем словарь, связанный с грамматикой, если есть
  if ((grammarVocab.length >= 2) && exercises.length < count) {
    for (let i = 0; i < typeCounts.matching && exercises.length < count; i++) {
      const ex = generateMatching(grammarVocab)
      if (ex) {
        const enriched = focusedGrammar ? enrichExerciseWithGrammar(ex, focusedGrammar) : ex
        exercises.push(enriched)
      }
    }
  } else if (vocabulary.length >= 5) {
    for (let i = 0; i < typeCounts.matching && exercises.length < count; i++) {
      const ex = generateMatching(vocabulary)
      if (ex) exercises.push(ex)
    }
  }

  // 5. Transform — сначала из грамматики
  if (focusedGrammar && Array.isArray(focusedGrammar.templates)) {
    const trTemplates = focusedGrammar.templates.filter(t => t.type === 'transform')
    for (let i = 0; i < trTemplates.length && exercises.length < count && i < typeCounts.transform; i++) {
      const raw = generateTransform(trTemplates[i], vocabulary)
      if (raw) {
        const ex = enrichExerciseWithGrammar(raw, focusedGrammar)
        exercises.push(ex)
      }
    }
  }

  // Затем общий подход
  if (templates.length > 0) {
    for (let i = 0; i < typeCounts.transform && exercises.length < count; i++) {
      const template = findTemplateForType(templates, 'transform', vocabulary, grammar)
      if (template) {
        const raw = generateTransform(template, vocabulary)
        if (raw) {
          const relevantGrammar = findRelevantGrammar(raw, grammar)
          const ex = enrichExerciseWithGrammar(raw, relevantGrammar)
          console.debug('[generateSprintExercises] transform enriched with grammar:', { exerciseId: ex.id, grammarId: ex.grammarId, grammarTitle: ex.grammarTitle })
          exercises.push(ex)
        }
      }
    }
  }

  // Фильтруем и валидируем сгенерированные упражнения
  const isValidExercise = (ex) => {
    if (!ex || !ex.type) return false
    switch (ex.type) {
      case 'translation':
        return !!ex.question && !!ex.correct
      case 'multiple_choice':
        return !!ex.question && Array.isArray(ex.options) && ex.options.length >= 2 && !!ex.correct
      case 'fill_blank':
        return !!ex.question && !!ex.correct
      case 'matching':
        return Array.isArray(ex.pairs) && ex.pairs.length >= 2
      case 'transform':
        return !!ex.question && !!ex.correct
      default:
        return false
    }
  }

  const beforeFilterCount = exercises.length
  // debug: list invalid exercises and reasons
  const invalids = exercises.map((ex, idx) => ({ex, idx, valid: isValidExercise(ex)})).filter(x => !x.valid)
  if (invalids.length > 0) {
    invalids.forEach(({ex, idx}) => {
      console.warn('generateSprintExercises: invalid exercise at index', idx, JSON.stringify(ex, null, 2))
    })
  }
  const filtered = exercises.filter(isValidExercise)
  if (filtered.length !== beforeFilterCount) {
    console.warn(`generateSprintExercises: filtered out ${beforeFilterCount - filtered.length} invalid exercises`)
  }
  exercises.length = 0
  exercises.push(...filtered)

  // Пополняем упражнения переводами из валидных слов, если не хватает
  const target = Math.max(5, count)
  if (exercises.length < target) {
    const validVocab = vocabulary.filter(v => v && v.word && v.translation_ru)
    while (exercises.length < Math.min(count, target) && validVocab.length > 0) {
      const vocab = validVocab.splice(Math.floor(Math.random() * validVocab.length), 1)[0]
      const ex = generateTranslation(vocab)
      if (ex) exercises.push(ex)
    }
  }

  // Если все еще недостаточно — пробуем заполнить любыми корректными переводами повторно
  while (exercises.length < count) {
    const vocab = vocabulary[Math.floor(Math.random() * vocabulary.length)]
    const ex = generateTranslation(vocab)
    if (ex) exercises.push(ex)
    else {
      // Если не удалось сгенерировать с текущего vocab, попробуем другой
      const fallback = vocabulary.find(v => v && v.word && v.translation_ru)
      if (!fallback) break
    }
  }

  // +++ Когда есть фокусная грамматика — гарантируем, что все упражнения относятся к ней +++
  if (focusedGrammar) {
    const related = exercises.filter(ex => {
      if (!ex) return false
      if (ex.grammarId && String(ex.grammarId) === String(focusedGrammar.id)) return true
      if (ex.grammarTitle && ex.grammarTitle === focusedGrammar.title) return true
      if (ex.itemId && grammarVocab.some(v => String(v.id) === String(ex.itemId))) return true
      if (ex.itemIds && ex.itemIds.some(id => grammarVocab.some(v => String(v.id) === String(id)))) return true
      return false
    })

    // Try to top-up using grammar templates and grammarVocab when related exercises are missing
    const usedVocabIds = new Set(related.flatMap(e => [e.itemId].concat(e.itemIds || []).filter(Boolean)))
    const remainingGrammarVocab = grammarVocab.filter(v => !usedVocabIds.has(v.id))

    // First try to add translations from grammar vocab
    while (related.length < count && remainingGrammarVocab.length > 0) {
      const v = remainingGrammarVocab.splice(Math.floor(Math.random() * remainingGrammarVocab.length), 1)[0]
      const t = generateTranslation(v)
      if (t) {
        related.push(enrichExerciseWithGrammar(t, focusedGrammar))
      }
    }

    // Then try to add more exercises from focusedGrammar.templates
    if (Array.isArray(focusedGrammar.templates) && related.length < count) {
      const typesPriority = ['fill_blank', 'multiple_choice', 'transform', 'matching']
      for (const tp of typesPriority) {
        const templatesOfType = focusedGrammar.templates.filter(t => t.type === tp)
        for (const tmpl of templatesOfType) {
          if (related.length >= count) break
          let gen = null
          if (tp === 'fill_blank') gen = generateFillBlank(tmpl, grammarVocab.length ? grammarVocab : vocabulary)
          else if (tp === 'multiple_choice') gen = generateMultipleChoice(tmpl, grammarVocab.length ? grammarVocab : vocabulary)
          else if (tp === 'transform') gen = generateTransform(tmpl, grammarVocab.length ? grammarVocab : vocabulary)
          else if (tp === 'matching') gen = generateMatching(grammarVocab.length ? grammarVocab : vocabulary)

          if (gen) {
            related.push(enrichExerciseWithGrammar(gen, focusedGrammar))
          }
        }
        if (related.length >= count) break
      }
    }

    // Finally replace exercises with related ones
    exercises.length = 0
    exercises.push(...related)

    // If still less than target and we have at least one related exercise, duplicate with new ids
    if (exercises.length > 0 && exercises.length < count) {
      console.warn('[generateSprintExercises] Not enough unique grammar-linked items; duplicating related exercises to reach target count')
      let idx = 0
      while (exercises.length < count) {
        const src = exercises[idx % exercises.length]
        const clone = { ...src, id: generateExerciseId() }
        exercises.push(clone)
        idx++
      }
    }
  }

  // Логирование
  console.log(`✅ Generated ${exercises.length} exercises (target: ${count})`)

  // Убедимся, что у каждого упражнения есть метаданные грамматики для отображения в UI (если доступна)
  exercises = exercises.map(ex => {
    // Если по каким-то причинам уже есть метаданные, оставим как есть
    if ((ex.grammarId || ex.grammarTitle || ex.explanationRu) || !grammar) return ex

    const relevant = findRelevantGrammar(ex, grammar)
    if (relevant) {
      const enriched = enrichExerciseWithGrammar(ex, relevant)
      console.debug('[generateSprintExercises] enriched exercise with grammar (post-process):', { exerciseId: enriched.id, grammarId: enriched.grammarId, grammarTitle: enriched.grammarTitle })
      return enriched
    }

    return ex
  })

  // Перемешиваем порядок упражнений и срезаем до целевого количества
  return shuffleArray(exercises).slice(0, count)
}