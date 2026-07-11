import apiClient from '@/api/client'

/**
 * 文件管理
 */

/**
 * 上传文件
 * @param {File|Blob} file 二进制文件
 * @param {'voice_clone'|'prompt_audio'|'t2a_async_input'} purpose 用途
 * @returns {Promise<{file: {file_id: string, [k: string]: any}}>}
 */
export async function upload(file, purpose) {
  const form = new FormData()
  form.append('purpose', purpose)
  form.append('file', file)
  const resp = await apiClient.post('/v1/files/upload', form)
  return resp.data
}

/**
 * 查询文件信息
 * @param {string} fileId
 * @returns {Promise<{file: {download_url: string, [k: string]: any}}>}
 */
export async function retrieve(fileId) {
  const resp = await apiClient.get('/v1/files/retrieve', {
    params: { file_id: fileId }
  })
  return resp.data
}
