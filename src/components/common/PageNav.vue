<template>
  <div class="page-nav" v-if="!isHome">
    <button class="btn-link" @click="goHome">На главную</button>
    <button class="btn-link" v-if="showBack" @click="goBack">Назад</button>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const router = useRouter()

const isHome = computed(() => route.name === 'Home')
const showBack = computed(() => route.name !== 'Home')

function goHome() {
  router.push({ name: 'Home' })
}

function goBack() {
  window.history.length > 1 ? router.back() : router.push({ name: 'Home' })
}
</script>

<style scoped>
.page-nav {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}

.btn-link {
  background: none;
  border: 1px solid #d0d0d0;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  color: #333;
  font-weight: 600;
}

.btn-link:hover {
  background: #f2f2f2;
}
</style>