<template>
  <div class="progress-container">
    <div v-if="label" class="progress-label">
      <span class="label-text">{{ label }}</span>
      <span class="progress-text">{{ current }} / {{ total }}</span>
    </div>
    
    <div class="progress-bar-wrapper">
      <div class="progress-bar">
        <div 
          class="progress-fill"
          :style="{ width: percentage + '%' }"
          :class="progressClass"
        ></div>
      </div>
    </div>
    
    <div v-if="showPercentage" class="percentage-text">
      {{ percentage }}%
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  current: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  label: {
    type: String,
    default: ''
  },
  showPercentage: {
    type: Boolean,
    default: true
  },
  color: {
    type: String,
    default: 'success', // 'success', 'warning', 'danger', 'info'
    validator: (value) => ['success', 'warning', 'danger', 'info'].includes(value)
  }
})

const percentage = computed(() => {
  if (props.total === 0) return 0
  return Math.round((props.current / props.total) * 100)
})

const progressClass = computed(() => {
  return `progress-${props.color}`
})
</script>

<style scoped>
.progress-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: #666;
}

.label-text {
  font-weight: 600;
}

.progress-bar-wrapper {
  width: 100%;
  height: 24px;
}

.progress-bar {
  width: 100%;
  height: 100%;
  background: #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 0.5rem;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
}

.progress-success {
  background: linear-gradient(90deg, #42b883 0%, #35a372 100%);
}

.progress-warning {
  background: linear-gradient(90deg, #ff9800 0%, #f57c00 100%);
}

.progress-danger {
  background: linear-gradient(90deg, #f44336 0%, #d32f2f 100%);
}

.progress-info {
  background: linear-gradient(90deg, #2196f3 0%, #1976d2 100%);
}

.percentage-text {
  text-align: right;
  font-size: 0.85rem;
  color: #666;
  font-weight: 600;
}

@media (max-width: 768px) {
  .progress-bar-wrapper {
    height: 20px;
  }
  
  .progress-fill {
    font-size: 0.65rem;
    padding-right: 0.35rem;
  }
}
</style>
