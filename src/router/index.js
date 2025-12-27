import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../components/dashboard/HomeView.vue'
import SprintView from '../components/sprint/SprintView.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },
  {
    path: '/sprint',
    name: 'Sprint',
    component: SprintView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router