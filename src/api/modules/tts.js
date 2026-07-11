import apiClient from '@/api/client'
import { streamRequest } from '@/api/stream'

/**
 * 同步语音合成（T2A V2）
 */

/**
 * 非流式语音合成
 * @param {object} payload
 * @param {string} payload.model 模型
 * @param {string} payload.text 文本
 * @param {boolean} [payload.stream] 是否流式
 * @param {object} [payload.voice_setting] { voice_id, speed, vol, pitch, emotion }
 * @param {object} [payload.audio_setting] { sample_rate, bitrate, format, channel }
 * @param {object} [payload.pronunciation_dict] 发音字典
 * @param {string} [payload.language_boost] 语种增强
 * @param {boolean} [payload.subtitle_enable] 字幕
 * @param {string} [payload.output_format] 输出格式
 * @returns {Promise<object>} response.data
 */
export async function synthesize(payload) {
  const resp = await apiClient.post('/v1/t2a_v2', payload)
  return resp.data
}

/**
 * 流式语音合成
 * @param {object} payload 同 synthesize（stream 字段会被强制设为 true）
 * @param {(chunk: object) => void} onChunk 每个数据块回调，chunk.data.audio(hex)、chunk.data.status(1进行中/2结束)
 * @param {AbortSignal} [signal]
 * @returns {Promise<string>} 拼接的完整 audio hex
 */
export async function synthesizeStream(payload, onChunk, signal) {
  return streamRequest('/v1/t2a_v2', payload, onChunk, signal)
}
