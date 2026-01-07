<template>
  <div class="home-view">
    <header class="app-header">
      <h1>🇵🇹 Португальский с Нуля</h1>
      <p class="tagline">15 минут в день — путь к свободному общению</p>
    </header>

    <div class="main-action">
      <div class="last-info" v-if="lastCompletedGrammarTitle">
        <p v-if="lastCompletedGrammarTitle">✅ Последний пройденный: <strong>{{ lastCompletedGrammarTitle }}</strong></p>
      </div>
      <button v-if="showUpdateButton" class="update-btn" @click="updateApp">🔄 Обновить приложение</button>
    </div>

    <UnitSelector 
      :current-unit="progressStore.currentUnit"
      @select-unit="changeUnit"
    />

    <ProgressDashboard :compact="true" />
  </div>
</template>

<script setup>
import { ref, onMounted as vueOnMounted } from 'vue'

// Показываем кнопку только если есть обновление
const showUpdateButton = ref(false)
const updating = ref(false)
let registration = null

const checkForUpdate = async () => {
  if ('serviceWorker' in navigator) {
    registration = await navigator.serviceWorker.getRegistration()
    if (registration && registration.waiting) {
      showUpdateButton.value = true
    } else {
      showUpdateButton.value = false
    }
  }
}

const updateApp = async () => {
  updating.value = true
  if (registration && registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    window.location.reload()
  } else {
    await checkForUpdate()
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      window.location.reload()
    }
  }
  updating.value = false
}

// Следим за обновлениями Service Worker
vueOnMounted(() => {
  checkForUpdate()
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      showUpdateButton.value = false
    })
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'NEW_VERSION_AVAILABLE') {
        showUpdateButton.value = true
      }
    })
    setInterval(checkForUpdate, 10000) // Проверяем каждые 10 секунд
  }
})
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProgressStore } from '@/stores/progressStore'
import { useMaterialsStore } from '@/stores/materialsStore'
import UnitSelector from './UnitSelector.vue'
import ProgressDashboard from './ProgressDashboard.vue'

const router = useRouter()
const progressStore = useProgressStore()
const materialsStore = useMaterialsStore()

// Показываем заголовки последней и следующей грамматики для текущего юнита
const lastCompletedGrammarTitle = computed(() => {
  // Защита: ждём загрузки материалов и DB и проверяем наличие функции
  if (!materialsStore.loaded) return null
  if (typeof progressStore.getLastCompletedGrammar !== 'function') return null

  const lastId = progressStore.getLastCompletedGrammar(progressStore.currentUnit)
  if (!lastId) return null

  // Безопасный доступ к getGrammarById (может быть computed ref или обычная функция)
  try {
    const getter = materialsStore.getGrammarById
    if (getter && typeof getter.value === 'function') {
      const g = getter.value(lastId)
      return g ? g.title : null
    }
    // fallback - ищем в массиве grammar
    const fallback = (materialsStore.grammar || []).find(g => String(g.id) === String(lastId))
    return fallback ? fallback.title : null
  } catch (e) {
    console.warn('Ошибка при получении grammar by id:', e)
    return null
  }
})



onMounted(async () => {
  await materialsStore.loadAll()
  await progressStore.initDB()
})

const changeUnit = async (unitId) => {
  // Преобразуем числовой ID в формат строки 'unitN'
  const unitString = typeof unitId === 'number' ? `unit${unitId}` : unitId
  await progressStore.setCurrentUnit(unitString)
  // Перейти на страницу спринтов выбранного юнита
  router.push({ name: 'UnitSprints', params: { unitId: unitString } })
}

const openStats = () => {
  router.push({ name: 'Stats' })
}
</script>

<style scoped>

.update-btn {
  margin-left: 1.5rem;
  padding: 0.5rem 1.2rem;
  font-size: 1rem;
  background: #42b883;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}
.update-btn:hover {
  background: #36996b;
}
.home-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.app-header {
  text-align: center;
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

.main-action {
  display: flex;
  justify-content: center;
  margin-bottom: 3rem;
}



.btn-icon {
  font-size: 1.5rem;
}

.btn-duration {
  font-size: 0.9rem;
  opacity: 0.9;
}


  
.app-header h1 {
  font-size: 2rem;
}


</style>