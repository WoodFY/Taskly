import './styles/global.less'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'

import App from './App.vue'
import router from './router'
import enUS from './locales/en-US.json'
import zhCN from './locales/zh-CN.json'

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('locale') ?? 'zh-CN',
  fallbackLocale: 'en-US',
  messages: { 'en-US': enUS, 'zh-CN': zhCN }
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)

app.mount('#app')
