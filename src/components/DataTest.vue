<template>
  <div class="data-test">
    <h2>Проверка данных</h2>
    <div v-if="loading">Загрузка...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="success">
      <p>✅ Vocabulary: {{ vocabCount }} слов</p>
      <p>✅ Grammar: {{ grammarCount }} правил</p>
      <p>✅ Templates: {{ templatesCount }} шаблонов</p>
      <p>✅ Texts: {{ textsCount }} текстов</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const loading = ref(true)
const error = ref(null)
const vocabCount = ref(0)
const grammarCount = ref(0)
const templatesCount = ref(0)
const textsCount = ref(0)

onMounted(async () => {
  try {
    const [vocab, grammar, templates, texts] = await Promise.all([
      fetch('/data/vocabulary.json').then(r => r.json()),
      fetch('/data/grammar.json').then(r => r.json()),
      fetch('/data/templates.json').then(r => r.json()),
      fetch('/data/texts.json').then(r => r.json())
    ])
    
    vocabCount.value = vocab.vocabulary?.length || 0
    grammarCount.value = grammar.grammar?.length || 0
    templatesCount.value = templates.templates?.length || 0
    textsCount.value = texts.texts?.length || 0
    
    loading.value = false
  } catch (e) {
    error.value = `Ошибка загрузки: ${e.message}`
    loading.value = false
  }
})
</script>


<style scoped>
.data-test {
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto;
}
.error {
  color: red;
  padding: 1rem;
  background: #fee;
  border-radius: 8px;
}
.success {
  color: green;
}
</style>