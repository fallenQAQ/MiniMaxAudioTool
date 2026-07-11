import apiClient from '@/api/client'

/**
 * 歌曲翻唱前处理
 */

/**
 * 翻唱前处理
 * @param {object} payload
 * @param {string} payload.model 固定 'music-cover'
 * @param {string} [payload.audio_url] 源音频 url
 * @param {string} [payload.audio_base64] 源音频 base64
 * @returns {Promise<{cover_feature_id: string, formatted_lyrics: string, structure_result: object, audio_duration: number}>}
 */
export async function preprocess(payload) {
  const resp = await apiClient.post('/v1/music_cover_preprocess', payload)
  return resp.data
}
