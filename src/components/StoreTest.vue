<template>
  <div class="store-test">
    <h2>Тест Stores</h2>
    
    <button @click="testLoad">Загрузить данные</button>
    <button @click="testProgress">Тест прогресса</button>
    
    <div v-if="materialsStore.loaded">
      <p>✅ Данные загружены</p>
      <p>Словарь unit1: {{ unit1Vocab.length }} слов</p>
      <p>Грамматика unit1: {{ unit1Grammar.length }} правил</p>
    </div>

    <div v-if="progressStore.totalSprints > 0">
      <p>Всего спринтов: {{ progressStore.totalSprints }}</p>
      <p>Стрик: {{ progressStore.streakDays }} дней</p>
    </div>
  </div>
</template>

<script setup>
import { useMaterialsStore } from '../stores/materialsStore'
import { useProgressStore } from '../stores/progressStore'
import { computed } from 'vue'

const materialsStore = useMaterialsStore()
const progressStore = useProgressStore()

const unit1Vocab = computed(() => 
  materialsStore.getVocabularyByUnit('unit1')
)

const unit1Grammar = computed(() => 
  materialsStore.getGrammarByUnit('unit1')
)

const testLoad = async () => {
  await materialsStore.loadAll()
  await progressStore.initDB()
}

const testProgress = async () => {
  await progressStore.saveItemProgress('v1', true)
  await progressStore.saveSprintStats()
}
</script>