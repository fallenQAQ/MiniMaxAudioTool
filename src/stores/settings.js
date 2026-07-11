import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// localStorage 存储键
const STORAGE_KEY = 'minimax_audio_tool_settings'

// 可选基础地址
export const BASE_URLS = {
  primary: 'https://api.minimaxi.com',
  beijing: 'https://api-bj.minimaxi.com'
}

/**
 * 设置 Store
 * 管理 API Key 与基础地址，持久化到 localStorage
 */
export const useSettingsStore = defineStore('settings', () => {
  // 状态
  const apiKey = ref('')
  const baseUrl = ref(BASE_URLS.primary)

  // getter：是否已配置 API Key
  const hasKey = computed(() => Boolean(apiKey.value && apiKey.value.trim()))

  /**
   * 从 localStorage 读取设置
   */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const data = JSON.parse(raw)
      if (typeof data.apiKey === 'string') apiKey.value = data.apiKey
      if (typeof data.baseUrl === 'string' && data.baseUrl) baseUrl.value = data.baseUrl
    } catch (e) {
      // 解析失败时忽略，保持默认值
      console.warn('[settings] 读取本地设置失败：', e)
    }
  }

  /**
   * 保存设置到 localStorage
   * @param {string} key
   * @param {string} url
   */
  function save(key, url) {
    apiKey.value = key || ''
    if (url) baseUrl.value = url
    const data = JSON.stringify({ apiKey: apiKey.value, baseUrl: baseUrl.value })
    localStorage.setItem(STORAGE_KEY, data)
  }

  /**
   * 清除设置
   */
  function clear() {
    apiKey.value = ''
    baseUrl.value = BASE_URLS.primary
    localStorage.removeItem(STORAGE_KEY)
  }

  // store 初始化时自动 load
  load()

  return {
    apiKey,
    baseUrl,
    hasKey,
    load,
    save,
    clear
  }
})
