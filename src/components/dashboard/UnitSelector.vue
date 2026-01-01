<template>
  <div class="unit-selector-section">
    <div class="section-header">
      <h2>📚 Выберите юнит</h2>
      <p class="subtitle">Проходите юниты по порядку и достигайте новых уровней</p>
    </div>

    <!-- Состояние загрузки -->
    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <p>Загрузка юнитов...</p>
    </div>

    <!-- Ошибка загрузки -->
    <div v-else-if="loadingError" class="error-container">
      <p>😕 Не удалось загрузить юниты. {{ loadingError }}</p>
      <button @click="retryLoading" class="retry-button">Попробовать снова</button>
    </div>

    <!-- Список юнитов -->
    <template v-else-if="units.length > 0">
      <div class="units-grid">
        <div
          v-for="(unit, index) in units"
          :key="index"
          @click="selectUnit(unit.unitId)"
          :class="['unit-card', {
            'unit-active': currentUnit === unit.unitId,
            'unit-locked': !isUnitUnlocked(unit.unitId),
            'unit-completed': isUnitCompleted(unit.unitId)
          }]"
        >
          <!-- Иконка статуса -->
          <div class="unit-status">
            <span v-if="isUnitCompleted(unit.unitId)" class="status-badge">✅</span>
            <span v-else-if="currentUnit === unit.unitId" class="status-badge active">📍</span>
            <span v-else-if="!isUnitUnlocked(unit.unitId)" class="status-badge">🔒</span>
          </div>

          <!-- Номер и название юнита -->
          <div class="unit-info">
            <h3 class="unit-title">Юнит {{ unit.number }}</h3>
            <p class="unit-name">{{ unit.name }}</p>
          </div>

          <!-- Прогресс -->
          <div class="unit-details">
            <span class="unit-items">{{ unit.totalItems }} слов</span>
            <ProgressBar
              :current="unit.learnedItems"
              :total="unit.totalItems"
              :color="getUnitColor(unit.percentage)"
              :show-percentage="false"
            />
            <span class="unit-progress-text">{{ unit.percentage }}% изучено</span>
          </div>

          <!-- Дополнительная информация -->
          <div class="unit-extra">
            <span v-if="unit.sprintsCompleted" class="extra-item">
              🎯 {{ unit.sprintsCompleted }} спринтов
            </span>
            <span v-if="unit.lastAccuracy" class="extra-item">
              📊 {{ unit.lastAccuracy }}% точность
            </span>
          </div>

        </div>
      </div>

      <!-- Статистика по юнитам -->
      <div class="units-stats">
        <div class="stat-row">
          <span class="stat-label">Всего юнитов:</span>
          <span class="stat-value">{{ units.length }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Завершено:</span>
          <span class="stat-value">{{ completedUnits }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">В процессе:</span>
          <span class="stat-value">{{ currentUnit }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Средний прогресс:</span>
          <span class="stat-value">{{ averageProgress }}%</span>
        </div>
      </div>
    </template>

    <!-- Пустое состояние -->
    <div v-else class="empty-state">
      <p>🤷‍♀️ Юниты не найдены</p>
      <p>Попробуйте обновить страницу или проверьте подключение</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import ProgressBar from '../common/ProgressBar.vue'
import { useProgressStore } from '@/stores/progressStore'
import { useMaterialsStore } from '@/stores/materialsStore'

const props = defineProps({
  currentUnit: {
    type: String,
    default: 'unit1'
  }
})

const emit = defineEmits(['select-unit'])


const progressStore = useProgressStore()
const materialsStore = useMaterialsStore()

// Диагностика Pinia store (убрана лишняя детализация)

// Флаг загрузки данных
const isLoading = ref(true)
const loadingError = ref(null)
const unitData = ref([])

// Асинхронная функция для получения данных о юнитах
const fetchUnitData = async () => {
  // Проверяем, что данные загружены
  if (!materialsStore || !materialsStore.loaded || !materialsStore.loaded.value) {
    await materialsStore?.loadAll?.()
  }

  // Проверяем была ли ошибка при загрузке
  if (materialsStore?.error && materialsStore.error.value) {
    throw new Error(materialsStore.error.value)
  }

  // Используем геттеры стора (избегаем прямого чтения `.value` ранним доступом)
  const storeGetUnits = materialsStore?.getUnits?.value || []
  const getVocabularyByUnit = materialsStore?.getVocabularyByUnit
  const getGrammarByUnit = materialsStore?.getGrammarByUnit

  // Утилита для безопасного получения значения (учитывает авто-распаковку Pinia)
  const unwrap = (v) => (v && typeof v === 'object' && 'value' in v) ? v.value : v

  // Получаем массивы непосредственно из стора после загрузки
  const vocabularyArr = unwrap(materialsStore?.vocabulary) || []
  const grammarArr = unwrap(materialsStore?.grammar) || []

  if (!Array.isArray(vocabularyArr) || vocabularyArr.length === 0 || !Array.isArray(grammarArr) || grammarArr.length === 0) {
    const storeError = unwrap(materialsStore?.error)
    if (storeError) {
      throw new Error('Не удалось загрузить данные материалов: ' + storeError)
    }
    throw new Error('Не удалось загрузить данные материалов: пустой массив vocabulary или grammar')
  }

  // Сконструируем юниты локально аналогично логике стора
  const normalizeUnitId = (id) => String(id || '').trim().toLowerCase()
  const toUnitNumber = (unitId) => {
    const m = String(unitId || '').match(/unit(\d+)/i)
    return m ? Number(m[1]) : Number.POSITIVE_INFINITY
  }

  const unitMap = new Map()
  grammarArr.forEach(item => {
    const unitId = normalizeUnitId(item.unit)
    if (!unitId) return
    if (!unitMap.has(unitId)) {
      unitMap.set(unitId, { id: unitId, grammarCount: 0, vocabCount: 0, textCount: 0 })
    }
    unitMap.get(unitId).grammarCount++
  })
  vocabularyArr.forEach(item => {
    item.tags?.forEach(tag => {
      const t = normalizeUnitId(tag)
      if (!/^unit\d+$/i.test(t)) return // ignore non-unit tags
      if (!unitMap.has(t)) {
        unitMap.set(t, { id: t, grammarCount: 0, vocabCount: 0, textCount: 0 })
      }
      unitMap.get(t).vocabCount++
    })
  })
  const textsArr = unwrap(materialsStore?.texts) || []
  textsArr.forEach(item => {
    const unitId = normalizeUnitId(item.unit)
    if (unitMap.has(unitId)) unitMap.get(unitId).textCount++
  })
  const units = Array.from(unitMap.values()).sort((a, b) => {
    const an = toUnitNumber(a.id)
    const bn = toUnitNumber(b.id)
    if (an !== bn) return an - bn
    return String(a.id).localeCompare(String(b.id))
  })
  if (!units || units.length === 0) {
    throw new Error('В материалах не найдены юниты')
  }

  // Асинхронное получение данных о юнитах
  const unitPromises = units.map(async (unit, index) => {
    try {
      const unitId = normalizeUnitId(unit.id)

      // Не показываем "фантомные" юниты без корректного формата unitN
      if (!/^unit\d+$/i.test(unitId)) {
        return null
      }

      // Получаем статистику по юниту (через геттеры стора)
      const vocabularyItems = (getVocabularyByUnit && getVocabularyByUnit.value)
        ? getVocabularyByUnit.value(unitId)
        : (materialsStore?.vocabulary?.value || []).filter(v => (v.tags || []).map(t => String(t || '').trim().toLowerCase()).includes(unitId))
      const grammarItems = (getGrammarByUnit && getGrammarByUnit.value)
        ? getGrammarByUnit.value(unitId)
        : (materialsStore?.grammar?.value || []).filter(g => normalizeUnitId(g.unit) === unitId)
      const allItems = [...vocabularyItems, ...grammarItems]

      let unitStats = { total: 0, learned: 0, percentage: 0 }
      if (progressStore.getUnitStats) {
        let stats = null
        if (typeof progressStore.getUnitStats === 'function') {
          stats = progressStore.getUnitStats(unitId, allItems)
        } else if (progressStore.getUnitStats.value) {
          stats = progressStore.getUnitStats.value(unitId, allItems)
        }
        if (stats) unitStats = stats
      }

      // Получаем последнюю точность из истории спринтов
      let sprintHistory = []
      if (progressStore.getSprintHistoryByUnit) {
        const history = await progressStore.getSprintHistoryByUnit(unitId)
        if (Array.isArray(history)) sprintHistory = history
      }
      const lastSprintAccuracy = sprintHistory.length > 0 && sprintHistory[sprintHistory.length - 1]?.stats
        ? sprintHistory[sprintHistory.length - 1].stats.accuracy
        : null

      return {
        id: index + 1,
        unitId,
        number: (() => {
          const m = String(unitId || '').match(/unit(\d+)/i)
          return m ? Number(m[1]) : null
        })(),
        name: (() => {
          const m = String(unitId || '').match(/unit(\d+)/i)
          return m ? `Юнит ${Number(m[1])}` : unitId
        })(),
        totalItems: unitStats.total,
        learnedItems: unitStats.learned,
        sprintsCompleted: sprintHistory.length,
        lastAccuracy: lastSprintAccuracy,
        percentage: unitStats.percentage
      }
    } catch (error) {
      console.error(`Ошибка при загрузке данных юнита ${unit.id}:`, error)
      // Возвращаем базовые данные даже при ошибке
      const unitId = normalizeUnitId(unit.id)
      if (!/^unit\d+$/i.test(unitId)) {
        return null
      }
      return {
        id: index + 1,
        unitId,
        number: (() => {
          const m = String(unitId || '').match(/unit(\d+)/i)
          return m ? Number(m[1]) : null
        })(),
        name: (() => {
          const m = String(unitId || '').match(/unit(\d+)/i)
          return m ? `Юнит ${Number(m[1])}` : unitId
        })(),
        totalItems: 0,
        learnedItems: 0,
        sprintsCompleted: 0,
        lastAccuracy: null,
        percentage: 0
      }
    }
  })

  const resolved = await Promise.all(unitPromises)
  return resolved.filter(Boolean)
}

// Метод повторной загрузки
const retryLoading = async () => {
  isLoading.value = true
  loadingError.value = null
  
  try {
    // Инициализируем прогресс, если база данных не инициализирована
    if (!progressStore.db || !progressStore.db.value) {
      await progressStore.initDB()
    }

    // Получаем данные о юнитах
    unitData.value = await fetchUnitData()
    
    if (unitData.value.length === 0) {
      loadingError.value = 'Не найдено ни одного юнита. Проверьте данные в файлах JSON.'
    }
  } catch (error) {
    console.error('Ошибка инициализации:', error)
    loadingError.value = error.message || 'Неизвестная ошибка при загрузке данных'
  } finally {
    isLoading.value = false
  }
}

// Генерируем список юнитов с использованием progressStore
const units = computed(() => {
  // Проверяем, что данные загружены
  if (!unitData.value) return []
  return unitData.value
    .filter(u => u && /^unit\d+$/i.test(String(u.unitId || '')))
    .slice()
    .sort((a, b) => {
      const an = typeof a.number === 'number' ? a.number : Number.POSITIVE_INFINITY
      const bn = typeof b.number === 'number' ? b.number : Number.POSITIVE_INFINITY
      if (an !== bn) return an - bn
      return String(a.unitId).localeCompare(String(b.unitId))
    })
})

// Инициализация данных при монтировании компонента
onMounted(retryLoading)

// Вычисляемые свойства
const completedUnits = computed(() => {
  return units.value.filter(u => u.percentage === 100).length
})

const averageProgress = computed(() => {
  const sum = units.value.reduce((acc, u) => acc + u.percentage, 0)
  return units.value.length > 0 ? Math.round(sum / units.value.length) : 0
})

// Методы
const isUnitUnlocked = (unitId) => {
  // Требование: следующий по списку юнит открывается после
  // завершения 1-го спринта предыдущего юнита.
  const m = String(unitId || '').match(/unit(\d+)/i)
  const n = m ? Number(m[1]) : null
  if (!n || n <= 1) return true

  const prevId = `unit${n - 1}`
  const prevUnit = (units.value || []).find(u => u.unitId === prevId)
  if (!prevUnit) return false
  return (prevUnit.sprintsCompleted && prevUnit.sprintsCompleted > 0) || prevUnit.percentage === 100
}

const isUnitCompleted = (unitId) => {
  const unit = (units.value || []).find(u => u.unitId === unitId)
  return unit && unit.percentage === 100
}

const getUnitColor = (percentage) => {
  if (percentage >= 90) return 'success'
  if (percentage >= 60) return 'info'
  if (percentage >= 30) return 'warning'
  return 'danger'
}

const selectUnit = (unitId) => {
  if (!isUnitUnlocked(unitId)) {
    const list = units.value || []
    const idx = list.findIndex(u => u.unitId === unitId)
    const label = idx !== -1 ? (list[idx].number || (idx + 1)) : unitId
    alert(`Юнит ${label} заблокирован. Завершите хотя бы один спринт в предыдущем юните.`)
    return
  }
  emit('select-unit', unitId)
}
</script>

<style scoped>
.unit-selector-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 3rem;
}

.section-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.section-header h2 {
  font-size: 2rem;
  color: #333;
  margin: 0 0 0.5rem 0;
}

.subtitle {
  font-size: 1rem;
  color: #666;
  margin: 0;
}

/* Units Grid */
.units-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.unit-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: #f9f9f9;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.unit-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #42b883 0%, #35a372 100%);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s ease;
}

.unit-card:hover {
  border-color: #42b883;
  background: white;
  box-shadow: 0 4px 12px rgba(66, 184, 131, 0.15);
  transform: translateY(-2px);
}

.unit-card:hover::before {
  transform: scaleX(1);
}

.unit-card.unit-locked {
  cursor: not-allowed;
  opacity: 0.6;
  background: #f5f5f5;
}

.unit-card.unit-locked:hover {
  border-color: #e0e0e0;
  background: #f5f5f5;
  box-shadow: none;
  transform: none;
}

.unit-card.unit-active {
  border-color: #42b883;
  background: linear-gradient(135deg, #f0fdf4 0%, white 100%);
  box-shadow: 0 4px 12px rgba(66, 184, 131, 0.2);
}

.unit-card.unit-completed {
  border-color: #4caf50;
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, white 100%);
}

/* Status Badge */
.unit-status {
  position: absolute;
  top: 1rem;
  right: 1rem;
  font-size: 1.5rem;
}

.status-badge {
  opacity: 0.6;
}

.status-badge.active {
  opacity: 1;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/* Unit Info */
.unit-info {
  flex-grow: 1;
}

.unit-title {
  font-size: 1.1rem;
  color: #333;
  margin: 0 0 0.25rem 0;
  font-weight: 700;
}

.unit-name {
  font-size: 0.95rem;
  color: #666;
  margin: 0;
}

/* Unit Details */
.unit-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.unit-items {
  font-size: 0.85rem;
  color: #666;
  font-weight: 600;
}

.unit-progress-text {
  font-size: 0.8rem;
  color: #42b883;
  font-weight: 600;
}

/* Extra Info */
.unit-extra {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.extra-item {
  font-size: 0.85rem;
  color: #666;
}

/* Recommendation */
.recommendation {
  padding: 0.5rem;
  background: linear-gradient(135deg, #fff9c4 0%, #ffe082 100%);
  border-radius: 8px;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 600;
  color: #f57f17;
}

/* Units Stats */
.units-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
  background: #f9f9f9;
  border-radius: 10px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-weight: 600;
  color: #666;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #42b883;
}

@media (max-width: 768px) {
  .unit-selector-section {
    padding: 1.5rem;
  }

  .units-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1rem;
  }

  .unit-card {
    padding: 1.25rem;
    gap: 0.75rem;
  }

  .unit-title {
    font-size: 1rem;
  }

  .units-stats {
    grid-template-columns: 1fr;
  }
}

/* Состояния загрузки и ошибок */
.loading-container,
.error-container,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
  background: #f9f9f9;
  border-radius: 12px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #42b883;
  border-top: 4px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.retry-button {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.retry-button:hover {
  background-color: #35a372;
}

.error-container p {
  color: #d32f2f;
  margin-bottom: 1rem;
}

.empty-state p {
  color: #666;
  margin: 0.5rem 0;
}
</style>
