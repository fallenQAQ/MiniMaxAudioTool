import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useRouter } from 'vue-router'

/**
 * API Key 校验组合式函数
 * 检查是否已配置 API Key，未配置时提供跳转设置页的方法
 */
export function useApiKey() {
  const settings = useSettingsStore()
  const router = useRouter()

  const hasKey = computed(() => settings.hasKey)

  function goSettings() {
    router.push('/settings')
  }

  return { hasKey, goSettings }
}
