<template>
  <div class="progress-dashboard">
    <div class="dashboard-header">
      <h2>📊 Статистика</h2>
    </div>

    <!-- Общие статистика -->
    <div class="stats-section">
      <h3>Всего</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-icon">🎯</span>
          <div>
            <p class="stat-title">Спринтов пройдено</p>
            <p class="stat-value">{{ totalStats.totalSprints }}</p>
          </div>
        </div>

        <div class="stat-item">
          <span class="stat-icon">✅</span>
          <div>
            <p class="stat-title">Упражнений решено</p>
            <p class="stat-value">{{ totalStats.totalExercises }}</p>
          </div>
        </div>

        <div class="stat-item">
          <span class="stat-icon">🔥</span>
          <div>
            <p class="stat-title">Дней подряд</p>
            <p class="stat-value">{{ totalStats.streakDays }}</p>
          </div>
        </div>

        <div class="stat-item">
          <span class="stat-icon">📈</span>
          <div>
            <p class="stat-title">Общая точность</p>
            <p class="stat-value">{{ totalStats.accuracy }}%</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Прогресс по типам упражнений -->
    <div class="stats-section">
      <h3>По типам упражнений</h3>
      <div class="exercise-types">
        <div 
          v-for="(type, key) in exerciseTypesStats" 
          :key="key"
          class="exercise-type-stat"
        >
          <div class="type-header">
            <span class="type-name">{{ type.label }}</span>
            <span class="type-count">{{ type.correct }} / {{ type.total }}</span>
          </div>
          <ProgressBar 
            :current="type.correct"
            :total="type.total"
            :color="getTypeColor(type.accuracy)"
            :show-percentage="false"
          />
          <span class="type-percentage">{{ type.accuracy }}%</span>
        </div>
      </div>
    </div>

    <!-- Прогресс по юнитам -->
    <div class="stats-section">
      <h3>По юнитам</h3>
      <div class="units-progress">
        <div 
          v-for="(unitStat, index) in unitsStats" 
          :key="index"
          class="unit-stat"
        >
          <div class="unit-header">
            <span class="unit-number">Юнит {{ index + 1 }}</span>
            <span class="unit-items">{{ unitStat.items }} слов</span>
          </div>
          <ProgressBar 
            :current="unitStat.learned"
            :total="unitStat.items"
            :color="getUnitColor(unitStat.percentage)"
            :show-percentage="false"
          />
          <span class="unit-percentage">{{ unitStat.percentage }}%</span>
        </div>
      </div>
    </div>

    <!-- График активности (недельная) -->
    <div class="stats-section">
      <h3>Активность за неделю</h3>
      <div class="activity-chart">
        <div 
          v-for="(day, index) in weekActivity" 
          :key="index"
          class="activity-bar"
          :title="`${day.label}: ${day.sprints} спринтов`"
        >
          <div 
            class="bar"
            :style="{ height: (day.sprints / maxActivityValue) * 100 + '%' }"
          ></div>
          <span class="day-label">{{ day.label }}</span>
        </div>
      </div>
    </div>

    <!-- Медали и достижения -->
    <div class="stats-section">
      <h3>🏆 Достижения</h3>
      <div class="achievements">
        <div 
          v-for="achievement in achievements" 
          :key="achievement.id"
          class="achievement"
          :class="{ unlocked: achievement.unlocked }"
          :title="achievement.description"
        >
          <span class="achievement-icon">{{ achievement.icon }}</span>
          <span class="achievement-name">{{ achievement.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useProgressStore } from '@/stores/progressStore'
import ProgressBar from '../common/ProgressBar.vue'

const progressStore = useProgressStore()

// Временные данные (будут подставляться из store)
const totalStats = computed(() => ({
  totalSprints: progressStore.totalSprints || 0,
  totalExercises: progressStore.totalExercises || 0,
  streakDays: progressStore.streakDays || 0,
  accuracy: progressStore.overallAccuracy || 0
}))

const exerciseTypesStats = computed(() => ({
  multiple_choice: {
    label: '👁️ Выбор ответа',
    total: progressStore.exerciseStats?.multipleChoice?.total || 0,
    correct: progressStore.exerciseStats?.multipleChoice?.correct || 0,
    get accuracy() {
      return this.total > 0 ? Math.round((this.correct / this.total) * 100) : 0
    }
  },
  fill_blank: {
    label: '✏️ Заполнить пропуск',
    total: progressStore.exerciseStats?.fillBlank?.total || 0,
    correct: progressStore.exerciseStats?.fillBlank?.correct || 0,
    get accuracy() {
      return this.total > 0 ? Math.round((this.correct / this.total) * 100) : 0
    }
  },
  translation: {
    label: '🌐 Перевод',
    total: progressStore.exerciseStats?.translation?.total || 0,
    correct: progressStore.exerciseStats?.translation?.correct || 0,
    get accuracy() {
      return this.total > 0 ? Math.round((this.correct / this.total) * 100) : 0
    }
  },
  matching: {
    label: '🔗 Сопоставление',
    total: progressStore.exerciseStats?.matching?.total || 0,
    correct: progressStore.exerciseStats?.matching?.correct || 0,
    get accuracy() {
      return this.total > 0 ? Math.round((this.correct / this.total) * 100) : 0
    }
  },
  transform: {
    label: '⚙️ Трансформация',
    total: progressStore.exerciseStats?.transform?.total || 0,
    correct: progressStore.exerciseStats?.transform?.correct || 0,
    get accuracy() {
      return this.total > 0 ? Math.round((this.correct / this.total) * 100) : 0
    }
  }
}))

const unitsStats = computed(() => {
  if (!progressStore.unitsProgress) return []
  return progressStore.unitsProgress.map(unit => ({
    items: unit.totalItems || 0,
    learned: unit.learnedItems || 0,
    get percentage() {
      return this.items > 0 ? Math.round((this.learned / this.items) * 100) : 0
    }
  }))
})

const weekActivity = computed(() => {
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
  if (!progressStore.weekActivity) {
    return [] // Возвращаем пустой массив вместо случайных данных
  }
  return progressStore.weekActivity.map((sprints, index) => ({
    label: days[index],
    sprints
  }))
})

const maxActivityValue = computed(() => {
  return Math.max(...weekActivity.value.map(d => d.sprints), 1)
})

const achievements = computed(() => [
  {
    id: 'first_sprint',
    name: 'Первый старт',
    icon: '🚀',
    description: 'Завершить первый спринт',
    unlocked: totalStats.value.totalSprints >= 1
  },
  {
    id: 'week_warrior',
    name: 'Воин недели',
    icon: '⚔️',
    description: 'Пройти 7 спринтов за неделю',
    unlocked: totalStats.value.totalSprints >= 7
  },
  {
    id: 'month_master',
    name: 'Мастер месяца',
    icon: '👑',
    description: 'Пройти 30 спринтов за месяц',
    unlocked: totalStats.value.totalSprints >= 30
  },
  {
    id: 'perfect_accuracy',
    name: 'Идеальная точность',
    icon: '💯',
    description: 'Получить 100% в спринте',
    unlocked: totalStats.value.accuracy === 100
  },
  {
    id: 'streak_week',
    name: 'Неделя подряд',
    icon: '🔥',
    description: 'Заниматься 7 дней подряд',
    unlocked: totalStats.value.streakDays >= 7
  },
  {
    id: 'vocabulary_master',
    name: 'Словарный запас',
    icon: '📚',
    description: 'Выучить 100 слов',
    unlocked: totalStats.value.totalExercises >= 100
  }
])

const getTypeColor = (accuracy) => {
  if (accuracy >= 80) return 'success'
  if (accuracy >= 60) return 'info'
  if (accuracy >= 40) return 'warning'
  return 'danger'
}

const getUnitColor = (percentage) => {
  if (percentage >= 80) return 'success'
  if (percentage >= 50) return 'info'
  if (percentage >= 25) return 'warning'
  return 'danger'
}

onMounted(async () => {
  // loadStats() не нужен - данные загружаются в progressStore.initDB() и loadProgress()
  // и обновляются через saveSprintStats()
})
</script>

<style scoped>
.progress-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
}

.dashboard-header {
  margin-bottom: 2rem;
}

.dashboard-header h2 {
  font-size: 2rem;
  color: #333;
  margin: 0;
}

.stats-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stats-section h3 {
  font-size: 1.3rem;
  color: #333;
  margin: 0 0 1.5rem 0;
  border-bottom: 2px solid #42b883;
  padding-bottom: 0.75rem;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
}

.stat-item {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background: #f9f9f9;
  border-radius: 10px;
  border-left: 4px solid #42b883;
}

.stat-icon {
  font-size: 2rem;
}

.stat-title {
  font-size: 0.85rem;
  color: #666;
  margin: 0 0 0.5rem 0;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #42b883;
  margin: 0;
}

/* Exercise Types */
.exercise-types {
  display: grid;
  gap: 1.5rem;
}

.exercise-type-stat {
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 10px;
}

.type-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.type-name {
  color: #333;
}

.type-count {
  color: #666;
  font-size: 0.9rem;
}

.type-percentage {
  display: inline-block;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #42b883;
  font-weight: 600;
}

/* Units Progress */
.units-progress {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.unit-stat {
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 10px;
}

.unit-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.unit-number {
  color: #333;
}

.unit-items {
  color: #666;
  font-size: 0.9rem;
}

.unit-percentage {
  display: inline-block;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #42b883;
  font-weight: 600;
}

/* Activity Chart */
.activity-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 200px;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 10px;
  gap: 0.75rem;
}

.activity-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  gap: 0.5rem;
}

.bar {
  width: 100%;
  background: linear-gradient(180deg, #42b883 0%, #35a372 100%);
  border-radius: 8px 8px 0 0;
  min-height: 4px;
  transition: all 0.3s;
  cursor: pointer;
}

.bar:hover {
  opacity: 0.8;
  filter: brightness(1.1);
}

.day-label {
  font-size: 0.85rem;
  color: #666;
  font-weight: 600;
}

/* Achievements */
.achievements {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1rem;
}

.achievement {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 10px;
  border: 2px solid #ddd;
  opacity: 0.5;
  transition: all 0.3s;
  cursor: pointer;
}

.achievement.unlocked {
  opacity: 1;
  border-color: #42b883;
  background: linear-gradient(135deg, #f0fdf4 0%, #f9f9f9 100%);
  transform: scale(1.05);
}

.achievement-icon {
  font-size: 2.5rem;
}

.achievement-name {
  font-size: 0.9rem;
  color: #333;
  text-align: center;
  font-weight: 600;
}

@media (max-width: 768px) {
  .progress-dashboard {
    padding: 1rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .units-progress {
    grid-template-columns: 1fr;
  }

  .achievements {
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  }

  .activity-chart {
    height: 150px;
  }
}
</style>
