import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { useMaterialsStore } from '@/stores/materialsStore'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
// Сохраняем экземпляр стора для отладки в окне (после регистрации Pinia)
window.__debugMaterialsStore = useMaterialsStore()
app.use(router)
app.mount('#app')