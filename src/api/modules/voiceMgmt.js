import apiClient from '@/api/client'

/**
 * 语音管理
 */

/**
 * 获取语音列表
 * @param {'system'|'voice_cloning'|'voice_generation'|'all'} voice_type
 * @returns {Promise<{system_voice: array, voice_cloning: array, voice_generation: array}>}
 */
export async function getVoices(voice_type) {
  const resp = await apiClient.post('/v1/get_voice', { voice_type })
  return resp.data
}

/**
 * 删除语音
 * @param {'voice_cloning'|'voice_generation'} voice_type
 * @param {string} voice_id
 * @returns {Promise<{voice_id: string}>}
 */
export async function deleteVoice(voice_type, voice_id) {
  const resp = await apiClient.post('/v1/delete_voice', { voice_type, voice_id })
  return resp.data
}
