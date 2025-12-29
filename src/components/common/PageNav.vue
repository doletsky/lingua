<template>
  <div class="page-nav" v-if="!isHome">
    <button class="btn-link" @click="goHome">На главную</button>
    <button class="btn-link" v-if="showBack" @click="goBack">Назад</button>
    <button class="btn-link install-btn" v-if="isMobile && showInstall" @click="onInstallClick">Установить</button>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'

const route = useRoute()
const router = useRouter()

const isHome = computed(() => route.name === 'Home')
const showBack = computed(() => route.name !== 'Home')

const isMobile = computed(() => /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent))
const isIOS = computed(() => /iPhone|iPad|iPod/i.test(navigator.userAgent))

const showInstall = ref(false)
let deferredPrompt = null

function onInstallClick() {
  if (deferredPrompt) {
    deferredPrompt.prompt()
    deferredPrompt.userChoice.then(() => {
      deferredPrompt = null
      showInstall.value = false
    }).catch(() => {
      deferredPrompt = null
      showInstall.value = false
    })
    return
  }

  // iOS: show install instructions (programmatic install not supported)
  if (isIOS.value) {
    alert('Чтобы установить приложение на iOS: откройте меню «Поделиться» и выберите «На экран «Домой»».')
    return
  }
}

function checkInstalled() {
  const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches
  // iOS
  const iOSStandalone = navigator.standalone === true
  return isStandalone || iOSStandalone
}

function beforeInstallHandler(e) {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault()
  deferredPrompt = e
  if (!checkInstalled()) {
    showInstall.value = true
  }
}

function appInstalledHandler() {
  deferredPrompt = null
  showInstall.value = false
}

function goHome() {
  router.push({ name: 'Home' })
}

function goBack() {
  window.history.length > 1 ? router.back() : router.push({ name: 'Home' })
}

onMounted(() => {
  // show install button on mobile if supported
  window.addEventListener('beforeinstallprompt', beforeInstallHandler)
  window.addEventListener('appinstalled', appInstalledHandler)
  // if already installed, hide; otherwise for iOS show instructions button
  if (checkInstalled()) {
    showInstall.value = false
  } else if (isMobile.value && isIOS.value) {
    showInstall.value = true
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeinstallprompt', beforeInstallHandler)
  window.removeEventListener('appinstalled', appInstalledHandler)
})
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

.install-btn {
  margin-left: auto;
}

@media(min-width: 800px) {
  .install-btn { display: none; }
}
</style>