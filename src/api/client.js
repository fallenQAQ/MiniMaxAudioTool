import axios from 'axios'
import { useSettingsStore } from '@/stores/settings'

/**
 * MiniMax 接口错误码 → 中文消息映射表
 * 依据 minimax-docs/api-reference/errorcode.md
 */
const ERROR_MESSAGE_MAP = {
  1000: '请求超限或超时，请稍后重试',
  1001: '请求超限或超时，请稍后重试',
  1002: '请求超限或超时，请稍后重试',
  1004: 'API Key 鉴权失败，请检查设置',
  1008: '账户余额不足',
  1026: '内容涉敏，请调整输入',
  1027: '内容涉敏，请调整输入',
  1039: 'Token限制或非法字符过多',
  1042: 'Token限制或非法字符过多',
  1043: 'ASR 相似度检查失败，请检查音频与文本',
  2013: '请求参数错误，请检查输入',
  2037: '音频时长需 10 秒至 5 分钟',
  2038: '需完成账户认证才能使用克隆功能',
  2039: 'voice_id 已存在，请更换',
  2048: '示例音频需小于 8 秒',
  2049: 'API Key 无效'
}

/**
 * 业务错误异常
 */
export class MiniMaxApiError extends Error {
  constructor(message, statusCode, raw) {
    super(message)
    this.name = 'MiniMaxApiError'
    this.statusCode = statusCode
    this.raw = raw
  }
}

/**
 * 根据错误码获取中文消息
 */
export function getErrorMessage(statusCode) {
  return ERROR_MESSAGE_MAP[statusCode] || `请求失败（错误码 ${statusCode}）`
}

/**
 * 创建并配置 Axios 实例
 */
const apiClient = axios.create({
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器：动态注入 baseURL、Authorization、Content-Type
apiClient.interceptors.request.use(
  (config) => {
    // 运行时从 settings store 动态读取
    const settings = useSettingsStore()
    config.baseURL = settings.baseUrl

    // 注入鉴权头（若已配置 API Key）
    if (settings.apiKey) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${settings.apiKey}`
    }

    // FormData 请求交由浏览器自动设置 Content-Type（含 boundary），不覆盖
    const isFormData =
      typeof FormData !== 'undefined' && config.data instanceof FormData
    if (!isFormData) {
      config.headers = config.headers || {}
      config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json'
    } else if (config.headers && config.headers['Content-Type']) {
      // 显式移除手动设置的 Content-Type，避免破坏 boundary
      delete config.headers['Content-Type']
    }

    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器：统一解析 MiniMax 业务错误（base_resp.status_code !== 0）
apiClient.interceptors.response.use(
  (response) => {
    const data = response.data
    // 流式响应（ReadableStream / Blob）或非标准结构直接放行
    if (data && typeof data === 'object' && 'base_resp' in data) {
      const baseResp = data.base_resp || {}
      const statusCode = baseResp.status_code
      if (statusCode !== undefined && statusCode !== 0) {
        const message = baseResp.status_msg || getErrorMessage(statusCode)
        return Promise.reject(new MiniMaxApiError(message, statusCode, data))
      }
    }
    return response
  },
  (error) => {
    // HTTP 层错误
    if (error.response) {
      const { status, data } = error.response
      // 尝试解析业务错误
      if (data && data.base_resp && data.base_resp.status_code !== undefined) {
        const statusCode = data.base_resp.status_code
        const message = data.base_resp.status_msg || getErrorMessage(statusCode)
        return Promise.reject(new MiniMaxApiError(message, statusCode, data))
      }
      const httpMessage = `请求失败（HTTP ${status}）`
      return Promise.reject(new MiniMaxApiError(httpMessage, status, data))
    }
    if (error.request) {
      return Promise.reject(new MiniMaxApiError('网络异常或请求超时，请检查连接', -1, null))
    }
    return Promise.reject(error instanceof MiniMaxApiError ? error : new MiniMaxApiError(error.message || '未知错误', -1, null))
  }
)

export default apiClient
