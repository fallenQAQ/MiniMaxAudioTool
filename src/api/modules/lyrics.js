import apiClient from '@/api/client'

/**
 * 歌词生成
 */

/**
 * 歌词生成
 * @param {object} payload
 * @param {'write_full_song'|'edit'} payload.mode 模式
 * @param {string} [payload.prompt] 提示词
 * @param {string} [payload.lyrics] 待编辑歌词（edit 模式）
 * @param {string} [payload.title] 标题
 * @returns {Promise<{song_title: string, style_tags: array, lyrics: string}>}
 */
export async function generate(payload) {
  const resp = await apiClient.post('/v1/lyrics_generation', payload)
  return resp.data
}
