import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../components/dashboard/HomeView.vue'
import SprintView from '../components/sprint/SprintView.vue'
import SprintHistoryList from '../components/sprint/SprintHistoryList.vue'

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
  },
  {
    path: '/unit/:unitId/sprints',
    name: 'UnitSprints',
    component: () => import('../components/dashboard/UnitSprints.vue'),
    props: true
  },
  {
    path: '/sprint/replay/:replayId',
    name: 'SprintReplay',
    component: SprintView,
    props: true
  },
  {
    path: '/sprint/history',
    name: 'SprintHistory',
    component: SprintHistoryList
  },
  {
    path: '/stats',
    name: 'Stats',
    component: () => import('../views/StatsView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router