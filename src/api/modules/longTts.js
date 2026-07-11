import apiClient from '@/api/client'

/**
 * 异步长文本语音合成（T2A Async V2）
 */

/**
 * 创建异步长文本语音任务
 * @param {object} payload
 * @param {string} payload.model 模型
 * @param {string} [payload.text] 文本（与 text_file_id 二选一）
 * @param {string} [payload.text_file_id] 文本文件 id
 * @param {object} [payload.voice_setting] { voice_id, speed, vol, pitch, emotion }
 * @param {object} [payload.audio_setting] { audio_sample_rate, bitrate, format, channel }
 * @param {object} [payload.pronunciation_dict] 发音字典
 * @param {string} [payload.language_boost] 语种增强
 * @returns {Promise<{task_id: string, file_id: string, usage_characters: number}>}
 */
export async function createTask(payload) {
  const resp = await apiClient.post('/v1/t2a_async_v2', payload)
  return resp.data
}

/**
 * 查询异步长文本语音任务
 * @param {string} taskId
 * @returns {Promise<{status: 'Processing'|'Success'|'Failed'|'Expired', file_id: string}>}
 */
export async function queryTask(taskId) {
  const resp = await apiClient.get('/v1/query/t2a_async_query_v2', {
    params: { task_id: taskId }
  })
  return resp.data
}
