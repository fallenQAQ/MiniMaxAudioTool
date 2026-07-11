// API 模块统一导出
export * as tts from './modules/tts'
export * as longTts from './modules/longTts'
export * as file from './modules/file'
export * as voiceClone from './modules/voiceClone'
export * as voiceDesign from './modules/voiceDesign'
export * as voiceMgmt from './modules/voiceMgmt'
export * as music from './modules/music'
export * as cover from './modules/cover'
export * as lyrics from './modules/lyrics'

// 直接命名导出各模块函数（便于按需引入）
export { synthesize, synthesizeStream } from './modules/tts'
export { createTask, queryTask } from './modules/longTts'
export { upload, retrieve } from './modules/file'
export { clone } from './modules/voiceClone'
export { design } from './modules/voiceDesign'
export { getVoices, deleteVoice } from './modules/voiceMgmt'
export { generate, generateStream } from './modules/music'
export { preprocess } from './modules/cover'
export { generate as generateLyrics } from './modules/lyrics'

export { default as apiClient } from './client'
export { MiniMaxApiError, getErrorMessage } from './client'
