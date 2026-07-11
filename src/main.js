import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'
import { useSettingsStore } from './stores/settings'

const app = createApp(App)

// 注册 Pinia
const pinia = createPinia()
app.use(pinia)

// 初始化 settings store（自动从 localStorage 读取）
useSettingsStore()

// 注册路由
app.use(router)

// 注册 Element Plus
app.use(ElementPlus)

// 注册 Element Plus 图标（全局组件）
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')
