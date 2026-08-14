import { ref, onMounted, onBeforeUnmount } from 'vue'

// 响应式视口宽度：供模板按窗口尺寸切换布局（如 el-descriptions 列数）
// SSR 安全：无 window 环境时回退到桌面默认宽度
export function useViewport() {
  const width = ref(typeof window !== 'undefined' ? window.innerWidth : 1280)

  function onResize() {
    width.value = window.innerWidth
  }

  onMounted(() => window.addEventListener('resize', onResize))
  onBeforeUnmount(() => window.removeEventListener('resize', onResize))

  return { width }
}
