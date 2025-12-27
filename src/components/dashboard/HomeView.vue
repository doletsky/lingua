<template>
  <div class="home-view">
    <header class="app-header">
      <h1>🇵🇹 Португальский с Нуля</h1>
      <p class="tagline">15 минут в день — путь к свободному общению</p>
    </header>

    <div class="stats-cards">
      <div class="stat-card">
        <span class="stat-icon">🔥</span>
        <span class="stat-value">{{ progressStore.streakDays }}</span>
        <span class="stat-label">дней подряд</span>
      </div>
      
      <div class="stat-card">
        <span class="stat-icon">🎯</span>
        <span class="stat-value">{{ progressStore.totalSprints }}</span>
        <span class="stat-label">спринтов</span>
      </div>
      
      <div class="stat-card">
        <span class="stat-icon">📚</span>
        <span class="stat-value">{{ currentUnitProgress }}%</span>
        <span class="stat-label">текущий юнит</span>
      </div>
    </div>

    <div class="main-action">
      <button @click="startSprint" class="btn-start-sprint">
        <span class="btn-icon">▶️</span>
        <span>Начать спринт</span>
        <span class="btn-duration">15 минут</span>
      </button>
    </div>

    <UnitSelector 
      :current-unit="progressStore.currentUnit"
      @select-unit="changeUnit"
    />

    <ProgressDashboard />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProgressStore } from '@/stores/progressStore'
import { useMaterialsStore } from '@/stores/materialsStore'
import UnitSelector from './UnitSelector.vue'
import ProgressDashboard from './ProgressDashboard.vue'

const router = useRouter()
const progressStore = useProgressStore()
const materialsStore = useMaterialsStore()

const currentUnitProgress = computed(() => {
  if (!materialsStore.loaded) return 0
  const allItems = [
    ...materialsStore.vocabulary,
    ...materialsStore.grammar
  ]
  const stats = progressStore.getUnitStats(progressStore.currentUnit, allItems)
  return stats.percentage
})

onMounted(async () => {
  await materialsStore.loadAll()
  await progressStore.initDB()
})

const startSprint = () => {
  router.push('/sprint')
}

const changeUnit = async (unitId) => {
  // Преобразуем числовой ID в формат строки 'unitN'
  const unitString = typeof unitId === 'number' ? `unit${unitId}` : unitId
  await progressStore.setCurrentUnit(unitString)
}
</script>

<style scoped>
.home-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.app-header {
  text-align: center;
  margin-bottom: 3rem;
}

.app-header h1 {
  font-size: 2.5rem;
  color: #42b883;
  margin-bottom: 0.5rem;
}

.tagline {
  font-size: 1.1rem;
  color: #666;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.stat-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #42b883;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
}

.main-action {
  display: flex;
  justify-content: center;
  margin-bottom: 3rem;
}

.btn-start-sprint {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem 3rem;
  font-size: 1.3rem;
  background: linear-gradient(135deg, #42b883 0%, #35a372 100%);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(66, 184, 131, 0.3);
  transition: all 0.3s;
}

.btn-start-sprint:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(66, 184, 131, 0.4);
}

.btn-icon {
  font-size: 1.5rem;
}

.btn-duration {
  font-size: 0.9rem;
  opacity: 0.9;
}

@media (max-width: 768px) {
  .home-view {
    padding: 1rem;
  }
  
  .app-header h1 {
    font-size: 2rem;
  }
  
  .stats-cards {
    grid-template-columns: 1fr;
  }
}
</style>