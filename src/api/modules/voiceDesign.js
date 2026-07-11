import apiClient from '@/api/client'

/**
 * 语音设计
 */

/**
 * 语音设计
 * @param {object} payload
 * @param {string} payload.prompt 语音描述
 * @param {string} payload.preview_text 试听文本
 * @param {string} [payload.voice_id] 自定义 voice_id（可选）
 * @returns {Promise<{voice_id: string, trial_audio: string}>} trial_audio 为 hex 编码
 */
export async function design(payload) {
  const resp = await apiClient.post('/v1/voice_design', payload)
  return resp.data
}
