import { useSettingsStore } from '@/stores/settings'
import { MiniMaxApiError, getErrorMessage } from './client'

/**
 * 流式请求辅助：用原生 fetch 读取 ReadableStream，按行解析 JSON chunk
 *
 * @param {string} path 接口路径，如 /v1/t2a_v2
 * @param {object} payload 请求体
 * @param {(chunk: object) => void} onChunk 每个 JSON chunk 的回调
 * @param {AbortSignal} [signal] 可选的中断信号
 * @returns {Promise<string>} 拼接后的完整 audio hex
 */
export async function streamRequest(path, payload, onChunk, signal) {
  const settings = useSettingsStore()
  const url = `${settings.baseUrl}${path}`

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
      Accept: 'application/json, text/event-stream'
    },
    body: JSON.stringify({ ...payload, stream: true }),
    signal
  })

  if (!resp.ok) {
    let raw = null
    try {
      raw = await resp.json()
    } catch (_) {
      // 非 JSON 响应
    }
    if (raw && raw.base_resp && raw.base_resp.status_code !== undefined) {
      const statusCode = raw.base_resp.status_code
      throw new MiniMaxApiError(raw.base_resp.status_msg || getErrorMessage(statusCode), statusCode, raw)
    }
    throw new MiniMaxApiError(`请求失败（HTTP ${resp.status}）`, resp.status, raw)
  }

  if (!resp.body) {
    throw new MiniMaxApiError('当前环境不支持流式响应', -1, null)
  }

  const reader = resp.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let fullAudio = ''

  const handleLine = (line) => {
    const trimmed = line.trim()
    if (!trimmed) return
    let text = trimmed
    // 兼容 SSE：去掉 data: 前缀
    if (text.startsWith('data:')) {
      text = text.slice(5).trim()
    }
    if (!text || text === '[DONE]') return
    try {
      const chunk = JSON.parse(text)
      // 检查业务错误
      if (chunk.base_resp && chunk.base_resp.status_code !== undefined && chunk.base_resp.status_code !== 0) {
        const statusCode = chunk.base_resp.status_code
        throw new MiniMaxApiError(chunk.base_resp.status_msg || getErrorMessage(statusCode), statusCode, chunk)
      }
      if (chunk.data && chunk.data.audio) {
        fullAudio += chunk.data.audio
      }
      if (typeof onChunk === 'function') onChunk(chunk)
    } catch (e) {
      if (e instanceof MiniMaxApiError) throw e
      // 无法解析的行（如 SSE 注释、keep-alive、非 JSON 文本），直接跳过
      // 不完整的数据会自然留在 buffer 末尾，由循环结束后逻辑处理
    }
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let idx
    while ((idx = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 1)
      handleLine(line)
    }
  }
  // 处理剩余
  if (buffer.trim()) {
    handleLine(buffer)
  }

  return fullAudio
}
