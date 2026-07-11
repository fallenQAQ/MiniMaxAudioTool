import apiClient from '@/api/client'
import { streamRequest } from '@/api/stream'

/**
 * 音乐生成
 */

/**
 * 非流式音乐生成
 * @param {object} payload
 * @param {string} payload.model music-2.6 / music-2.6-free / music-cover / music-cover-free
 * @param {string} [payload.prompt] 提示词
 * @param {string} [payload.lyrics] 歌词
 * @param {boolean} [payload.stream] 流式
 * @param {string} [payload.output_format] 输出格式
 * @param {object} [payload.audio_setting] { sample_rate, bitrate, format }
 * @param {boolean} [payload.is_instrumental] 纯音乐
 * @param {boolean} [payload.lyrics_optimizer] 歌词优化
 * @param {string} [payload.audio_url] 翻唱源音频 url
 * @param {string} [payload.audio_base64] 翻唱源音频 base64
 * @param {string} [payload.cover_feature_id] 翻唱特征 id
 * @returns {Promise<{data: {audio: string, status: number}, extra_info: object}>}
 */
export async function generate(payload) {
  // 音乐生成耗时较长，单独设置 180s 超时（覆盖全局 60s）
  const resp = await apiClient.post('/v1/music_generation', payload, { timeout: 180000 })
  return resp.data
}

/**
 * 流式音乐生成
 * @param {object} payload 同 generate（stream 字段会被强制设为 true）
 * @param {(chunk: object) => void} onChunk
 * @param {AbortSignal} [signal]
 * @returns {Promise<string>} 拼接的完整 audio hex
 */
export async function generateStream(payload, onChunk, signal) {
  return streamRequest('/v1/music_generation', payload, onChunk, signal)
}
