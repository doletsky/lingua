<template>
  <div class="unit-sprints">
    <header class="unit-header">
      <h2>📚 Спринты — {{ unitId }}</h2>
      <p v-if="unitInfo">{{ unitInfo.name }}</p>
    </header>

    <div v-if="loading" class="loading">Загрузка...</div>

    <div v-else-if="grammars.length === 0" class="empty">Грамматика не найдена для этого юнита</div>

    <div v-else class="sprints-grid">
      <div v-for="g in grammars" :key="g.id" class="grammar-card">
        <div class="card-header">
          <h3 class="grammar-title">{{ g.title }}</h3>
          <div class="meta">
            <span v-if="statsByGrammar[g.id]">⏱️ {{ statsByGrammar[g.id].timesPracticed }}×</span>
            <span v-if="statsByGrammar[g.id]">📊 {{ statsByGrammar[g.id].lastAccuracy || '—' }}%</span>
          </div>
        </div>
        <p class="grammar-desc" v-if="g.excerpt">{{ g.excerpt }}</p>

        <div class="card-actions">
          <button @click="startGrammarSprint(g.id)" class="btn-start">▶️ Начать спринт</button>
          <button @click="viewGrammar(g.id)" class="btn-view">👀 Просмотр</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMaterialsStore } from '@/stores/materialsStore'
import { useProgressStore } from '@/stores/progressStore'

const route = useRoute()
const router = useRouter()
const materialsStore = useMaterialsStore()
const progressStore = useProgressStore()

// reactive computed unitId used in template
const unitId = computed(() => {
  const p = route.params.unitId
  if (p && typeof p === 'string') return p
  const cu = progressStore.currentUnit
  return typeof cu === 'string' ? cu : (cu && cu.value) ? cu.value : String(cu)
})

const loading = ref(true)
const grammars = ref([])
const unitInfo = ref(null)
const statsByGrammar = ref({})

const load = async () => {
  loading.value = true
  try {
    await materialsStore.loadAll()

    const unit = unitId.value

    // get grammar list for unit (safe calls with fallback)
    let list = []
    try {
      const getter = materialsStore.getGrammarByUnit
      if (getter && typeof getter.value === 'function') {
        list = getter.value(unit) || []
      } else {
        // fallback to direct filter
        list = (materialsStore.grammar || []).filter(g => g.unit === unit)
      }
    } catch (e) {
      console.warn('[UnitSprints] Ошибка при получении грамматик через getter:', e)
      list = (materialsStore.grammar || []).filter(g => g.unit === unit)
    }

    grammars.value = list
    unitInfo.value = { name: `Юнит ${String(unit).replace('unit','')}` }

    // collect stats from sprint history
    const history = await progressStore.getSprintHistoryByUnit(unit)

    const map = {}
    for (const g of grammars.value) {
      const related = history.filter(s => s.exerciseResults && s.exerciseResults.some(er => er.snapshot && er.snapshot.grammarId === g.id))

      // Группируем повторы одного и того же набора упражнений в один уникальный спринт
      const groupsMap = new Map()
      for (const sp of related) {
        const signature = (sp.exerciseResults || []).map(er => {
          const snap = er.snapshot || {}
          if (Array.isArray(snap.itemIds) && snap.itemIds.length > 0) return snap.itemIds.join(',')
          if (snap.itemId !== undefined && snap.itemId !== null) return String(snap.itemId)
          if (er.itemId !== undefined && er.itemId !== null) return String(er.itemId)
          return String(er.exerciseId || '')
        }).filter(Boolean).sort().join('|')

        const key = `${signature}::${g.id}`
        if (!groupsMap.has(key)) groupsMap.set(key, [])
        groupsMap.get(key).push(sp)
      }

      const groups = Array.from(groupsMap.values())
      const timesPracticed = groups.length

      // Для каждой уникальной группы возьмём лучшую точность (если были повторы), затем усредним
      const bestPerGroup = groups.map(gr => Math.max(...gr.map(s => (s.stats && typeof s.stats.accuracy === 'number') ? s.stats.accuracy : 0)))
      const avgBest = bestPerGroup.length > 0 ? Math.round(bestPerGroup.reduce((a, b) => a + b, 0) / bestPerGroup.length) : null

      map[g.id] = {
        timesPracticed,
        lastAccuracy: avgBest
      }
    }

    statsByGrammar.value = map
  } catch (err) {
    console.error('[UnitSprints] Ошибка загрузки страницы спринтов юнита:', err)
  } finally {
    loading.value = false
  }
}

onMounted(load)

const startGrammarSprint = async (grammarId) => {
  // ensure current unit is set
  await progressStore.setCurrentUnit(unitId.value)
  // navigate to sprint, passing grammarId as query
  try {
    await router.push({ name: 'Sprint', query: { grammarId } })
  } catch (e) {
    console.error('[UnitSprints] Navigation error:', e)
  }
}

const viewGrammar = async (grammarId) => {
  // Показать теорию выбранной грамматики в режиме просмотра: установить текущий юнит и перейти на страницу спринта с query={grammarId, viewOnly}
  try {
    await progressStore.setCurrentUnit(unitId.value)
    await router.push({ name: 'Sprint', query: { grammarId, viewOnly: true } })
  } catch (e) {
    console.error('[UnitSprints] Navigation error on viewGrammar:', e)
  }
}
</script>

<style scoped>
.unit-sprints { max-width:1100px; margin:0 auto; padding:1rem }
.unit-header { text-align:center; margin-bottom:1rem }
.sprints-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:1rem }
.grammar-card { background:white; padding:1rem; border-radius:10px; border:1px solid #e8e8e8 }
.card-header { display:flex; justify-content:space-between; align-items:center }
.grammar-title { margin:0; font-size:1.1rem }
.meta { font-size:0.9rem; color:#666; display:flex; gap:0.5rem }
.grammar-desc { color:#444; margin:0.5rem 0 }
.card-actions { display:flex; gap:0.5rem; margin-top:0.75rem }
.btn-start { background:#42b883; color:white; border:none; padding:0.5rem 0.75rem; border-radius:6px }
.btn-view { background:#6c757d; color:white; border:none; padding:0.5rem 0.75rem; border-radius:6px }
</style>