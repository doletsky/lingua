<template>
  <div class="stats-page">
    <ProgressDashboard />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import ProgressDashboard from '@/components/dashboard/ProgressDashboard.vue'

const router = useRouter()
const goHome = () => router.push({ name: 'Home' })
</script>

<style scoped>
.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto 1rem;
}

.btn-back {
  padding: 0.5rem 0.8rem;
  background: white;
  color: #42b883;
  border: 2px solid #42b883;
  border-radius: 8px;
  cursor: pointer;
}
</style>
