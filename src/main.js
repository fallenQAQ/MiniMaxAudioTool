import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { ElLoading } from 'element-plus/es/components/loading/index'
// 指令式 API（ElMessage / ElMessageBox / ElLoading）在脚本中显式调用，
// 模板解析器无法感知，需手动引入对应样式
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import 'element-plus/es/components/loading/style/css'

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

// 注册 ElLoading（提供 v-loading 指令与 ElLoading.service）
app.use(ElLoading)

// 模板中的 Element Plus 组件由 unplugin-vue-components 按需自动导入

app.mount('#app')
