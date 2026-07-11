/**
 * 音频相关工具函数
 */

/**
 * hex 字符串 → Uint8Array
 * @param {string} hex
 * @returns {Uint8Array}
 */
export function hexToBytes(hex) {
  const clean = (hex || '').replace(/^0x/i, '').replace(/\s+/g, '')
  const out = new Uint8Array(Math.floor(clean.length / 2))
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}

/**
 * hex 字符串 → Blob
 * @param {string} hex
 * @param {string} [mimeType='audio/mp3']
 * @returns {Blob}
 */
export function hexToBlob(hex, mimeType = 'audio/mp3') {
  return new Blob([hexToBytes(hex)], { type: mimeType })
}

/**
 * hex 字符串 → ObjectURL
 * @param {string} hex
 * @param {string} [mimeType='audio/mp3']
 * @returns {string} objectUrl
 */
export function hexToObjectUrl(hex, mimeType = 'audio/mp3') {
  return URL.createObjectURL(hexToBlob(hex, mimeType))
}

/**
 * File → Promise<string>（纯 base64，不含 data: 前缀）
 * @param {File|Blob} file
 * @returns {Promise<string>}
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result || ''
      const idx = result.indexOf(',')
      resolve(idx >= 0 ? result.substring(idx + 1) : result)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/**
 * 触发 Blob 下载
 * @param {Blob} blob
 * @param {string} filename
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  try {
    downloadUrl(url, filename)
  } finally {
    // 延迟释放，确保下载已开始
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}

/**
 * 触发 URL 下载
 * @param {string} url
 * @param {string} filename
 */
export function downloadUrl(url, filename) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

/**
 * 毫秒 → mm:ss
 * @param {number} ms
 * @returns {string}
 */
export function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(Number(ms) || 0) / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/**
 * 根据 MiniMax 音频格式（mp3/pcm/wav/flac）推断 MIME
 * @param {string} format
 * @returns {string}
 */
export function mimeFromFormat(format) {
  const f = String(format || 'mp3').toLowerCase()
  if (f === 'wav') return 'audio/wav'
  if (f === 'flac') return 'audio/flac'
  if (f === 'pcm') return 'audio/pcm'
  return 'audio/mp3'
}
