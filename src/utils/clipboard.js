import { ElMessage } from 'element-plus/es/components/message/index'

/**
 * 复制文本到剪贴板（含非安全上下文的降级方案）
 * @param {string} text 要复制的文本
 * @param {string} [successMsg] 成功提示文案
 * @returns {Promise<boolean>} 是否复制成功
 */
export async function copyText(text, successMsg = '已复制到剪贴板') {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    ElMessage.success(successMsg)
    return true
  } catch (e) {
    ElMessage.error('复制失败，请手动复制')
    return false
  }
}
