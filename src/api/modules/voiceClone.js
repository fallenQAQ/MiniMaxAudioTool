import apiClient from '@/api/client'

/**
 * 语音克隆
 */

/**
 * 语音克隆
 * @param {object} payload
 * @param {number} payload.file_id 已上传的音频文件 id
 * @param {string} payload.voice_id 自定义 voice_id
 * @param {object} [payload.clone_prompt] { prompt_audio, prompt_text }
 * @param {string} [payload.text] 试听文本
 * @param {string} [payload.model] 试听模型
 * @param {string} [payload.language_boost] 语种增强
 * @param {boolean} [payload.need_noise_reduction] 降噪
 * @param {boolean} [payload.need_volume_normalization] 音量归一
 * @returns {Promise<{demo_audio: string, extra_info: object, base_resp: object}>}
 */
export async function clone(payload) {
  const resp = await apiClient.post('/v1/voice_clone', payload)
  return resp.data
}
