import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useMaterialsStore = defineStore('materials', () => {
  // Состояние
  const vocabulary = ref([])
  const grammar = ref([])
  const templates = ref([])
  const texts = ref([])
  const loading = ref(false)
  const error = ref(null)
  const loaded = ref(false)

  // Загрузка всех данных
  const loadAll = async () => {
    if (loaded.value) return // Уже загружено

    loading.value = true
    error.value = null

    try {

      // Относительные/универсальные пути
      const BASE = `${import.meta.env.BASE_URL}data/`
      const fetchWithLog = async (url) => {
        try {
          const response = await fetch(url)
          if (!response.ok) {
            console.error(`Fetch error: ${url} — статус ${response.status}`)
            throw new Error(`Fetch error: ${url} — статус ${response.status}`)
          }
          const data = await response.json()
          return data
        } catch (err) {
          console.error(`Ошибка при загрузке ${url}:`, err)
          throw err
        }
      }

      const [vocabData, grammarData, templatesData, textsData] = await Promise.all([
        fetchWithLog(BASE + 'vocabulary.json'),
        fetchWithLog(BASE + 'grammar.json'),
        fetchWithLog(BASE + 'templates.json'),
        fetchWithLog(BASE + 'texts.json')
      ])


      vocabulary.value = vocabData.vocabulary || []
      grammar.value = grammarData.grammar || []
      templates.value = templatesData.templates || []
      texts.value = textsData.texts || []

      loaded.value = true
    } catch (e) {
      error.value = `Ошибка загрузки материалов: ${e.message}`
      console.error('Ошибка загрузки материалов:', e)
    } finally {
      loading.value = false
    }
  }

  // Геттеры - словарь по юниту
  const getVocabularyByUnit = computed(() => (unitId) => {
    return vocabulary.value.filter(v => v.tags.includes(unitId))
  })

  // Геттеры - грамматика по юниту
  const getGrammarByUnit = computed(() => (unitId) => {
    return grammar.value.filter(g => g.unit === unitId)
  })

  // Геттеры - тексты по юниту
  const getTextsByUnit = computed(() => (unitId) => {
    return texts.value.filter(t => t.unit === unitId)
  })

  // Получить слово по ID
  const getVocabById = computed(() => (id) => {
    return vocabulary.value.find(v => v.id === id)
  })

  // Получить грамматику по ID
  const getGrammarById = computed(() => (id) => {
    return grammar.value.find(g => g.id === id)
  })

  // Получить шаблоны по тегам
  const getTemplatesByTags = (tags) => {
    return templates.value.filter(t => 
      tags.some(tag => t.tags?.includes(tag))
    )
  }

  /**
   * Получить все юниты из загруженных материалов
   */
  const getUnits = computed(() => {
    const unitMap = new Map()
    
    // Агрегируем из грамматики
    grammar.value.forEach(item => {
      if (!unitMap.has(item.unit)) {
        unitMap.set(item.unit, {
          id: item.unit,
          grammarCount: 0,
          vocabCount: 0,
          textCount: 0
        })
      }
      unitMap.get(item.unit).grammarCount++
    })
    
    // Агрегируем из словаря — учитываем только теги юнитов (например, unit1, unit2)
    vocabulary.value.forEach(item => {
      item.tags?.forEach(tag => {
        if (!/^unit\d+$/i.test(tag)) return // Пропускаем общие теги (greetings, numbers и т.п.)
        if (!unitMap.has(tag)) {
          unitMap.set(tag, {
            id: tag,
            grammarCount: 0,
            vocabCount: 0,
            textCount: 0
          })
        }
        unitMap.get(tag).vocabCount++
      })
    })
    
    // Агрегируем из текстов
    texts.value.forEach(item => {
      if (unitMap.has(item.unit)) {
        unitMap.get(item.unit).textCount++
      }
    })
    
    return Array.from(unitMap.values()).sort((a, b) => a.id.localeCompare(b.id))
  })

  /**
   * Получить материалы для спринта (новые + повторяемые по SRS)
   * @param {string} unitId - ID юнита
   * @param {Object} progressStore - прогресс юнита
   * @param {number} newItemsCount - количество новых элементов (по умолчанию 5)
   * @returns {Object} материалы для спринта
   */
  const getSprintMaterials = (unitId, progressStore, newItemsCount = 5) => {
    const unitVocab = getVocabularyByUnit.value(unitId)
    const unitGrammar = getGrammarByUnit.value(unitId)
    const unitTemplates = getTemplatesByTags([unitId])
    const unitTexts = getTextsByUnit.value(unitId)

    // Элементы для повторения (SRS)
    const dueForReview = progressStore.getItemsDueForReview?.value || []
    const reviewItems = unitVocab.filter(v => dueForReview.includes(v.id))

    // Новые элементы (еще не изученные)
    const newItems = progressStore.getNewItems(unitVocab.map(v => v.id))
    const newVocab = unitVocab.filter(v => newItems.includes(v.id)).slice(0, newItemsCount)

    // Объединяем: повторяемые + новые
    const allVocab = [...reviewItems, ...newVocab]

    return {
      vocabulary: allVocab.length > 0 ? allVocab : unitVocab, // Fallback на все слова если SRS пуст
      grammar: unitGrammar,
      templates: unitTemplates.length > 0 ? unitTemplates : templates.value,
      texts: unitTexts,
      stats: {
        dueForReview: reviewItems.length,
        newItems: newVocab.length,
        totalInUnit: unitVocab.length
      }
    }
  }

  return {
    // State
    vocabulary,
    grammar,
    templates,
    texts,
    loading,
    error,
    loaded,
    
    // Actions
    loadAll,
    
    // Getters
    getVocabularyByUnit,
    getGrammarByUnit,
    getTextsByUnit,
    getVocabById,
    getGrammarById,
    getTemplatesByTags,
    getSprintMaterials,
    getUnits
  }
})