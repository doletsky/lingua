import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { openDB } from 'idb'
import {
  calculateNextReview,
  mixItemsForSprint,
  isDueForReview,
  getLearningStats
} from '../utils/srsAlgorithm'

const DB_NAME = 'pt-learning-db'
const DB_VERSION = 2

export const useProgressStore = defineStore('progress', () => {
  const db = ref(null)
  const userProgress = ref({}) // { itemId: { level, nextReview, lastReview, correct, incorrect } }
  const currentUnit = ref('unit1')
  const totalSprints = ref(0)
  const streakDays = ref(0)

  // Инициализация IndexedDB
  const initDB = async () => {
    db.value = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion) {
        console.log(`[ProgressStore] Обновление БД с версии ${oldVersion} до ${newVersion}`)
        
        if (!db.objectStoreNames.contains('progress')) {
          console.log('[ProgressStore] Создание object store: progress')
          db.createObjectStore('progress', { keyPath: 'itemId' })
        }
        if (!db.objectStoreNames.contains('stats')) {
          console.log('[ProgressStore] Создание object store: stats')
          db.createObjectStore('stats', { keyPath: 'key' })
        }
        if (!db.objectStoreNames.contains('sprintHistory')) {
          console.log('[ProgressStore] Создание object store: sprintHistory')
          const store = db.createObjectStore('sprintHistory', { keyPath: 'id', autoIncrement: true })
          store.createIndex('unitId', 'unitId')
          store.createIndex('date', 'date')
        }
        
        console.log('[ProgressStore] Все object stores проверены:', Array.from(db.objectStoreNames))
      }
    })
    console.log('[ProgressStore] БД инициализирована, загружаем прогресс...')
    await loadProgress()
  }

  // Загрузка прогресса из IndexedDB
  const loadProgress = async () => {
    if (!db.value) await initDB()
    
    const tx = db.value.transaction('progress', 'readonly')
    const store = tx.objectStore('progress')
    const allProgress = await store.getAll()
    
    userProgress.value = {}
    allProgress.forEach(item => {
      userProgress.value[item.itemId] = item
    })

    // Загрузка статистики
    const statsTx = db.value.transaction('stats', 'readonly')
    const statsStore = statsTx.objectStore('stats')
    
    const unitData = await statsStore.get('currentUnit')
    const sprintsData = await statsStore.get('totalSprints')
    const streakData = await statsStore.get('streakDays')
    
    if (unitData) {
      // Нормализуем формат юнита: если число, преобразуем в 'unitN'
      const unitValue = unitData.value
      currentUnit.value = typeof unitValue === 'number' ? `unit${unitValue}` : unitValue
    }
    if (sprintsData) totalSprints.value = sprintsData.value
    if (streakData) streakDays.value = streakData.value
  }

  // Сохранение прогресса элемента с SRS алгоритмом
  const saveItemProgress = async (itemId, isCorrect) => {
    if (!db.value) await initDB()

    const now = Date.now()
    // Создаем прогресс только при первом правильном ответе
    if (!userProgress.value[itemId]) {
      if (!isCorrect) {
        // Если первый ответ неверный, не создаем прогресс
        return
      }
      
      userProgress.value[itemId] = {
        itemId,
        level: 0,
        nextReview: now,
        lastReview: now,
        correct: 1,
        incorrect: 0
      }

      // Сохранение в IndexedDB
      const tx = db.value.transaction('progress', 'readwrite')
      await tx.objectStore('progress').put(userProgress.value[itemId])
    } else {
      const existing = userProgress.value[itemId]

      // SRS алгоритм: правильно ×2.5, ошибка → уровень 0 (минимум)
      const srsResult = calculateNextReview(existing.level, isCorrect)
      
      if (isCorrect) {
        existing.correct++
      } else {
        existing.incorrect++
      }
      
      existing.level = srsResult.newLevel
      existing.nextReview = srsResult.nextReviewDate
      existing.lastReview = now
      
      userProgress.value[itemId] = existing

      // Сохранение в IndexedDB
      const tx = db.value.transaction('progress', 'readwrite')
      await tx.objectStore('progress').put(existing)
    }
  }

  // Получить элементы для повторения (SRS)
  const getItemsDueForReview = computed(() => {
    const now = Date.now()
    return Object.values(userProgress.value)
      .filter(item => item.nextReview <= now)
      .map(item => item.itemId)
  })

  // Получить новые элементы (еще не изученные)
  const getNewItems = (allItemIds) => {
    return allItemIds.filter(id => {
      const progress = userProgress.value[id]
      // Считаем элемент новым, если его нет или его уровень 0
      return !progress || progress.level === 0
    })
  }

  // Сохранить статистику спринта
  const saveSprintStats = async () => {
    if (!db.value) await initDB()
    
    totalSprints.value++
    
    const tx = db.value.transaction('stats', 'readwrite')
    await tx.objectStore('stats').put({ key: 'totalSprints', value: totalSprints.value })
    
    // Обновление стрика (упрощенно)
    const lastSprintDate = localStorage.getItem('lastSprintDate')
    const today = new Date().toDateString()
    
    if (lastSprintDate !== today) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      if (lastSprintDate === yesterday.toDateString()) {
        streakDays.value++
      } else {
        streakDays.value = 1
      }
      
      localStorage.setItem('lastSprintDate', today)
      await tx.objectStore('stats').put({ key: 'streakDays', value: streakDays.value })
    }
  }

  // Сменить юнит
  const setCurrentUnit = async (unitId) => {
    currentUnit.value = unitId
    
    if (db.value) {
      const tx = db.value.transaction('stats', 'readwrite')
      await tx.objectStore('stats').put({ key: 'currentUnit', value: unitId })
    }
  }

  // Получить прогресс элемента
  const getItemProgress = (itemId) => {
    const progress = userProgress.value[itemId]
    // Возвращаем null, если прогресс отсутствует или его уровень 0
    return progress && progress.level > 0 ? progress : null
  }

  // Статистика по юниту
  const getUnitStats = computed(() => (unitId, allItems) => {
    const unitItemIds = allItems.filter(item =>
      item.tags?.includes(unitId) || item.unit === unitId
    ).map(item => item.id)

    const learned = unitItemIds.filter(id => {
      const progress = userProgress.value[id]
      // Считаем элемент изученным только если он существует и имеет уровень > 0
      return progress && progress.level > 0 && progress.level >= 3
    }).length

    return {
      total: unitItemIds.length,
      learned,
      percentage: unitItemIds.length > 0 ? Math.round((learned / unitItemIds.length) * 100) : 0
    }
  })

  // Получить историю спринтов по юниту
  const getSprintHistoryByUnit = async (unitId) => {
    if (!db.value) await initDB()
    
    const tx = db.value.transaction('sprintHistory', 'readonly')
    const store = tx.objectStore('sprintHistory')
    const index = store.index('unitId')
    return await index.getAll(unitId)
  }

  // Получить все спринты (последние)
  const getAllSprintHistory = async (limit = 20) => {
    if (!db.value) await initDB()
    
    const tx = db.value.transaction('sprintHistory', 'readonly')
    const store = tx.objectStore('sprintHistory')
    const all = await store.getAll()
    
    // Сортируем по дате (новые первыми) и берем последние
    return all.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit)
  }

  // Получить статистику по спринтам
  const getSprintStatistics = async (unitId = null) => {
    let sprints = []
    
    if (unitId) {
      sprints = await getSprintHistoryByUnit(unitId)
    } else {
      sprints = await getAllSprintHistory(100)
    }

    if (sprints.length === 0) {
      return {
        totalSprints: 0,
        averageAccuracy: 0,
        bestAccuracy: 0,
        lastSprintDate: null
      }
    }

    const accuracies = sprints.map(s => s.stats.accuracy)
    const totalSprints = sprints.length
    const averageAccuracy = Math.round(
      accuracies.reduce((a, b) => a + b, 0) / accuracies.length
    )
    const bestAccuracy = Math.max(...accuracies)
    const lastSprintDate = sprints[0].date

    return {
      totalSprints,
      averageAccuracy,
      bestAccuracy,
      lastSprintDate
    }
  }

  // Получить элементы для спринта с SRS смешиванием
  const getSprintItems = (allItemIds, itemsCount = 10) => {
    // Разделяем элементы на новые и готовые к повторению
    const newItems = getNewItems(allItemIds)
    const reviewItems = allItemIds.filter(id => {
      const progress = userProgress.value[id]
      return progress && isDueForReview(progress.nextReview)
    })
    
    // Смешиваем с оптимальным распределением 70/30
    return mixItemsForSprint(newItems, reviewItems, itemsCount)
  }

  // Получить общую статистику по изучению
  const getLearningStatistics = computed(() => {
    return getLearningStats(userProgress.value)
  })

  return {
    // State
    userProgress,
    currentUnit,
    totalSprints,
    streakDays,
    db,
    
    // Actions
    initDB,
    loadProgress,
    saveItemProgress,
    saveSprintStats,
    setCurrentUnit,
    getItemProgress,
    getSprintHistoryByUnit,
    getAllSprintHistory,
    getSprintStatistics,
    getSprintItems,
    
    // Getters
    getItemsDueForReview,
    getNewItems,
    getUnitStats,
    getLearningStatistics
  }
})