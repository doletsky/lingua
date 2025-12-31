<template>
  <div class="sprint-history">
    <h3>История спринтов</h3>

    <div v-if="loading">Загрузка...</div>
    <div v-else-if="sprints.length === 0">Нет записей</div>

    <ul v-else class="history-list">
      <li v-for="s in sprints" :key="s.id" class="history-item">
        <div class="meta">
          <div class="title">{{ sprintLabel(s) }}</div>
          <div class="date">{{ formatDate(s.date) }}</div>
          <div class="stats">{{ s.stats.correctAnswers }} / {{ s.stats.totalExercises }} — {{ s.stats.accuracy }}%</div>
        </div>
        <div class="actions">
          <button @click="replay(s.id)" class="btn-replay">🔁 Повторить</button>
          <button @click="view(s.id)" class="btn-view">👀 Просмотреть</button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useProgressStore } from '@/stores/progressStore'
import { useRouter } from 'vue-router'

const progressStore = useProgressStore()
const router = useRouter()

const sprints = ref([])
const loading = ref(true)

const load = async () => {
  loading.value = true
  sprints.value = await progressStore.getAllSprintHistory(100)
  loading.value = false
}

onMounted(load)

const replay = (id) => {
  // Переходим на страницу спринта в режиме повторения
  router.push({ name: 'SprintReplay', params: { replayId: id } })
}

const view = (id) => {
  // Открыть просмотр сохранённого спринта (теория) в режиме просмотра — без таймера и без кнопки «Начать упражнения»
  router.push({ name: 'Sprint', query: { viewId: id, viewOnly: true } })
}

const formatDate = (d) => {
  try {
    const dt = new Date(d)
    return dt.toLocaleString()
  } catch (e) {
    return d
  }
}

const sprintLabel = (s) => {
  // Если в упражнении есть метаданные грамматики — показываем их
  const firstSnapshot = s.exerciseResults && s.exerciseResults[0] && s.exerciseResults[0].snapshot
  if (firstSnapshot && (firstSnapshot.grammarTitle || firstSnapshot.grammarId)) {
    if (firstSnapshot.grammarTitle) return `Спринт — ${firstSnapshot.grammarTitle}`
    return `Спринт — id:${firstSnapshot.grammarId}`
  }
  // Если есть метаданные текста — показываем их
  if (firstSnapshot && (firstSnapshot.textTitle || firstSnapshot.textId)) {
    if (firstSnapshot.textTitle) return `Текст — ${firstSnapshot.textTitle}`
    return `Текст — id:${firstSnapshot.textId}`
  }
  // fallback — короткий id
  if (s.id && s.id.startsWith('sprint_')) return `Спринт #${s.id.split('_')[1]}`
  return s.id || 'Спринт'
}
</script>

<style scoped>
.sprint-history {
  padding: 1rem;
}
.history-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.history-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  border-bottom: 1px solid #eee;
}
.meta { display:flex; gap:1rem; align-items:center }
.actions { display:flex; gap:0.5rem }
.btn-replay { background:#42b883; color:white; border:none; padding:0.5rem 0.75rem; border-radius:6px }
.btn-view { background:#6c757d; color:white; border:none; padding:0.5rem 0.75rem; border-radius:6px }
</style>