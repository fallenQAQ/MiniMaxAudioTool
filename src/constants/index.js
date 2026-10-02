/**
 * 全局共享常量：模型、音色、情绪、音频参数、语种等选项
 * 供各视图与设置页复用，避免多处重复定义导致不一致
 */

// ===== 语音合成模型 =====
export const SPEECH_MODELS = [
  { value: 'speech-2.8-hd', label: 'speech-2.8-hd（最新 HD）' },
  { value: 'speech-2.8-turbo', label: 'speech-2.8-turbo（最新 Turbo）' },
  { value: 'speech-2.6-hd', label: 'speech-2.6-hd' },
  { value: 'speech-2.6-turbo', label: 'speech-2.6-turbo' },
  { value: 'speech-02-hd', label: 'speech-02-hd' },
  { value: 'speech-02-turbo', label: 'speech-02-turbo' }
]

// 纯模型名数组（克隆试听等只需字符串的场景）
export const SPEECH_MODEL_VALUES = SPEECH_MODELS.map((m) => m.value)

// ===== 音乐生成模型 =====
export const MUSIC_MODELS = [
  { value: 'music-3.0', label: 'music-3.0（最新推荐）' },
  { value: 'music-3.0-free', label: 'music-3.0-free（免费版）' },
  { value: 'music-2.6', label: 'music-2.6' },
  { value: 'music-2.6-free', label: 'music-2.6-free（免费版）' }
]

// ===== 歌曲翻唱模型 =====
export const COVER_MODELS = [
  { value: 'music-cover', label: 'music-cover（标准版）' },
  { value: 'music-cover-free', label: 'music-cover-free（免费版）' }
]

// ===== 情绪（voice_setting.emotion，auto 表示不传递）=====
export const EMOTIONS = [
  { value: 'auto', label: 'auto 不指定' },
  { value: 'happy', label: 'happy 开心' },
  { value: 'sad', label: 'sad 悲伤' },
  { value: 'angry', label: 'angry 愤怒' },
  { value: 'fearful', label: 'fearful 恐惧' },
  { value: 'disgusted', label: 'disgusted 厌恶' },
  { value: 'surprised', label: 'surprised 惊讶' },
  { value: 'calm', label: 'calm 平静' },
  { value: 'fluent', label: 'fluent 流畅' },
  { value: 'whisper', label: 'whisper 轻声' }
]

// ===== 音频参数（语音合成 / 长文本）=====
export const AUDIO_FORMATS = ['mp3', 'pcm', 'flac', 'wav']
export const SAMPLE_RATES = [8000, 16000, 22050, 24000, 32000, 44100]
export const BITRATES = [32000, 64000, 128000, 256000]

// 音乐生成仅支持部分格式与采样率
export const MUSIC_FORMATS = ['mp3', 'wav', 'pcm']
export const MUSIC_SAMPLE_RATES = [16000, 24000, 32000, 44100]

// ===== 语种增强（language_boost 可选值全集）=====
export const LANGUAGES = [
  { value: 'auto', label: 'auto 自动' },
  { value: 'Chinese', label: 'Chinese 中文' },
  { value: 'English', label: 'English 英语' },
  { value: 'Japanese', label: 'Japanese 日语' },
  { value: 'Korean', label: 'Korean 韩语' },
  { value: 'French', label: 'French 法语' },
  { value: 'Spanish', label: 'Spanish 西班牙语' },
  { value: 'German', label: 'German 德语' },
  { value: 'Portuguese', label: 'Portuguese 葡萄牙语' },
  { value: 'Russian', label: 'Russian 俄语' },
  { value: 'Arabic', label: 'Arabic 阿拉伯语' },
  { value: 'Italian', label: 'Italian 意大利语' },
  { value: 'Hindi', label: 'Hindi 印地语' },
  { value: 'Vietnamese', label: 'Vietnamese 越南语' },
  { value: 'Indonesian', label: 'Indonesian 印尼语' },
  { value: 'Thai', label: 'Thai 泰语' },
  { value: 'Malay', label: 'Malay 马来语' }
]

// ===== 常用系统音色（语音合成快捷选择）=====
export const QUICK_VOICES = [
  { value: 'male-qn-qingse', label: 'male-qn-qingse 青涩男声' },
  { value: 'male-qn-jingying', label: 'male-qn-jingying 精英男声' },
  { value: 'male-qn-badao', label: 'male-qn-badao 霸道男声' },
  { value: 'male-qn-daxuesheng', label: 'male-qn-daxuesheng 大学生男声' },
  { value: 'female-shaonv', label: 'female-shaonv 少女女声' },
  { value: 'female-yujie', label: 'female-yujie 御姐女声' },
  { value: 'female-chengshu', label: 'female-chengshu 成熟女声' },
  { value: 'female-tianmei', label: 'female-tianmei 甜美女声' },
  { value: 'female-wenrou', label: 'female-wenrou 温柔女声' },
  { value: 'audiobook_male_1', label: 'audiobook_male_1 有声书男声1' },
  { value: 'audiobook_female_1', label: 'audiobook_female_1 有声书女声1' },
  { value: 'English_Graceful_Lady', label: 'English_Graceful_Lady 优雅英文女声' },
  { value: 'English_Gentle_Seminar', label: 'English_Gentle_Seminar 温文英文男声' }
]

// ===== 模型说明（设置页展示）=====
export const SPEECH_MODEL_DOCS = [
  { name: 'speech-2.8-hd', desc: '最新 HD 模型，情绪渲染融合语气词，重塑自然听感' },
  { name: 'speech-2.8-turbo', desc: '最新 Turbo 模型，极致生成速度，更自然逼真的音频效果' },
  { name: 'speech-2.6-hd', desc: 'HD 模型，韵律表现出色，极致音质与韵律表现，生成更快更自然' },
  { name: 'speech-2.6-turbo', desc: 'Turbo 模型，音质优异，超低时延，响应更灵敏' },
  { name: 'speech-02-hd', desc: '拥有出色的韵律、稳定性和复刻相似度，音质表现突出' },
  { name: 'speech-02-turbo', desc: '拥有出色的韵律和稳定性，小语种能力加强，性能表现出色' }
]

export const MUSIC_MODEL_DOCS = [
  { name: 'music-3.0', desc: '最新音乐生成主模型，官方推荐，支持歌词、风格提示与纯音乐' },
  { name: 'music-3.0-free', desc: '最新音乐生成免费版（限频 3 RPM），适合体验试用' },
  { name: 'music-2.6', desc: '上一代音乐生成主模型，支持歌词、风格提示，可生成带人声或纯音乐' },
  { name: 'music-2.6-free', desc: '上一代音乐生成免费版（限频 3 RPM），能力与 music-2.6 接近' },
  { name: 'music-cover', desc: '歌曲翻唱模型，配合 music_cover_preprocess 生成的 cover_feature_id 使用' },
  { name: 'music-cover-free', desc: '歌曲翻唱免费版，能力与 music-cover 接近' }
]
