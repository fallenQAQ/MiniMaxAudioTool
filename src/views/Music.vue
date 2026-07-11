<template>
  <div class="music-page">
    <!-- 表单区 -->
    <el-card shadow="never" class="music-card">
      <template #header>
        <div class="music-card__header">
          <el-icon><Headset /></el-icon>
          <span>音乐生成</span>
          <el-tag size="small" type="info" effect="plain" class="music-card__tag">
            POST /v1/music_generation
          </el-tag>
        </div>
      </template>

      <!-- 未配置 API Key 提示 -->
      <el-alert
        v-if="!hasKey"
        title="尚未配置 API Key"
        type="warning"
        show-icon
        :closable="false"
        class="music-alert"
      >
        <template #default>
          音乐生成需要鉴权，请先前往
          <el-link type="primary" :underline="false" @click="goSettings">设置页</el-link>
          配置 API Key。
        </template>
      </el-alert>

      <el-form :model="form" label-width="110px" label-position="right">
        <!-- 模型 / 流式 -->
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12">
            <el-form-item label="模型">
              <el-select v-model="form.model" class="music-full">
                <el-option
                  v-for="opt in modelOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="流式生成">
              <el-switch v-model="form.stream" />
              <span class="music-hint">开启后边生成边接收，可看到实时进度</span>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 歌曲描述 -->
        <el-form-item label="歌曲描述">
          <el-input
            v-model="form.prompt"
            type="textarea"
            :rows="3"
            :maxlength="2000"
            show-word-limit
            placeholder="描述歌曲风格、情绪、场景等，例如：轻快的流行曲风，阳光明媚的夏日海滩氛围"
          />
          <div class="music-hint">纯音乐时必填；建议填写以获得更贴合预期的效果</div>
        </el-form-item>

        <!-- 纯音乐 / 歌词优化 -->
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12">
            <el-form-item label="纯音乐">
              <el-switch v-model="form.is_instrumental" />
              <span class="music-hint">开启后生成无人声纯音乐</span>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="歌词优化">
              <el-switch
                v-model="form.lyrics_optimizer"
                :disabled="form.is_instrumental"
              />
              <span class="music-hint">歌词为空时按描述自动生成</span>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 歌词 -->
        <el-form-item label="歌词">
          <el-input
            v-model="form.lyrics"
            type="textarea"
            :rows="8"
            :maxlength="3500"
            show-word-limit
            placeholder="用换行分隔不同段落，可使用结构标签，例如：&#10;[Verse]&#10;...&#10;[Chorus]&#10;..."
          />
          <div class="music-hint">
            支持结构标签：<el-text type="info" size="small">[Verse] / [Chorus] / [Bridge] / [Outro]</el-text>
            等；非纯音乐且未开启歌词优化时必填
          </div>
        </el-form-item>

        <!-- 音频设置 -->
        <el-divider content-position="left">音频设置</el-divider>
        <el-row :gutter="16">
          <el-col :xs="24" :sm="8">
            <el-form-item label="格式">
              <el-select v-model="form.format" class="music-full">
                <el-option
                  v-for="opt in formatOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="采样率">
              <el-select v-model="form.sample_rate" class="music-full">
                <el-option
                  v-for="opt in sampleRateOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="比特率">
              <el-select v-model="form.bitrate" class="music-full">
                <el-option
                  v-for="opt in bitrateOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 操作按钮 -->
        <el-form-item>
          <el-button
            type="primary"
            :icon="Headset"
            :loading="loading"
            :disabled="streaming"
            @click="handleGenerate"
          >
            {{ streaming ? '生成中…' : '生成音乐' }}
          </el-button>
          <el-button
            v-if="streaming"
            type="danger"
            :icon="VideoPause"
            plain
            @click="handleStop"
          >
            停止
          </el-button>
          <el-button :icon="RefreshLeft" :disabled="loading || streaming" @click="handleReset">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 结果区 -->
    <el-card shadow="never" class="music-card">
      <template #header>
        <div class="music-card__header">
          <el-icon><Headset /></el-icon>
          <span>生成结果</span>
        </div>
      </template>

      <!-- 流式进度 -->
      <div v-if="streaming" class="music-streaming">
        <el-alert
          type="info"
          show-icon
          :closable="false"
          class="music-alert"
        >
          <template #title>
            流式生成中… 已接收 {{ receivedKb }} KB
            <span v-if="streamStatus !== null">（状态：{{ streamStatus === 2 ? '完成' : streamStatus === 1 ? '生成中' : streamStatus }}）</span>
          </template>
        </el-alert>
        <el-progress :percentage="100" :show-text="false" striped striped-flow />
      </div>

      <!-- 空状态 -->
      <el-empty
        v-if="!audioHex && !streaming"
        description="暂无生成结果，填写参数后点击“生成音乐”"
      />

      <!-- 音频播放 -->
      <div v-if="audioHex" class="music-result__player">
        <AudioPlayer
          :hex="audioHex"
          :format="form.format"
          :filename="downloadFilename"
        />
      </div>

      <!-- extra_info -->
      <el-descriptions
        v-if="audioHex && extraInfoItems.length"
        title="附加信息"
        :column="2"
        border
        size="small"
        class="music-result__info"
      >
        <el-descriptions-item
          v-for="item in extraInfoItems"
          :key="item.key"
          :label="item.label"
        >
          {{ item.value }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 下载 -->
      <div v-if="audioHex" class="music-result__actions">
        <el-button type="primary" :icon="Download" @click="handleDownload">
          下载音频
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Headset,
  Download,
  VideoPause,
  RefreshLeft
} from '@element-plus/icons-vue'
import { useApiKey } from '@/composables/useApiKey'
import { generate, generateStream } from '@/api/modules/music'
import { hexToBlob, downloadBlob, formatDuration } from '@/utils/audio'
import AudioPlayer from '@/components/AudioPlayer.vue'

// API Key 校验
const { hasKey, goSettings } = useApiKey()

// 表单状态
const form = reactive({
  model: 'music-2.6',
  prompt: '',
  lyrics: '',
  is_instrumental: false,
  lyrics_optimizer: false,
  format: 'mp3',
  sample_rate: 32000,
  bitrate: 128000,
  stream: false
})

// 下拉选项
const modelOptions = [
  { label: 'music-2.6（标准版）', value: 'music-2.6' },
  { label: 'music-2.6-free（免费版）', value: 'music-2.6-free' }
]
const formatOptions = [
  { label: 'MP3', value: 'mp3' },
  { label: 'WAV', value: 'wav' },
  { label: 'PCM', value: 'pcm' }
]
const sampleRateOptions = [16000, 24000, 32000, 44100].map((v) => ({
  label: `${v} Hz`,
  value: v
}))
const bitrateOptions = [32000, 64000, 128000, 256000].map((v) => ({
  label: `${v / 1000} kbps`,
  value: v
}))

// 运行时状态
const loading = ref(false)
const streaming = ref(false)
// 生成的音频 hex（AudioPlayer 内部会通过 hexToObjectUrl 转为可播放的 objectURL）
const audioHex = ref('')
// 接口返回的 extra_info（音乐时长等）
const extraInfo = ref(null)
// 流式累计的 hex 片段
const streamedHex = ref('')
// 流式状态码（1=生成中，2=完成）
const streamStatus = ref(null)
// 流式中断控制器
let abortController = null

// 已接收字节数（KB），用于流式进度展示
const receivedKb = computed(() => {
  // hex 字符串每 2 个字符表示 1 字节
  const bytes = Math.floor((streamedHex.value || '').length / 2)
  return (bytes / 1024).toFixed(2)
})

// 下载文件名
const downloadFilename = computed(() => {
  const ts = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const stamp =
    `${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}` +
    `-${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}`
  return `music-${stamp}.${form.format}`
})

// extra_info 字段中文标签映射
const EXTRA_LABELS = {
  music_duration: '音乐时长',
  audio_length: '音频长度',
  audio_format: '音频格式',
  sample_rate: '采样率',
  bitrate: '比特率',
  model: '模型',
  usage: '用量'
}

// extra_info 转为描述项列表
const extraInfoItems = computed(() => {
  const info = extraInfo.value
  if (!info || typeof info !== 'object') return []
  const entries = Array.isArray(info)
    ? info.map((v, i) => [i, v])
    : Object.entries(info)
  return entries.map(([k, v]) => {
    let display
    if (k === 'music_duration' && typeof v === 'number') {
      // 时长以毫秒存储，格式化为 mm:ss
      display = `${formatDuration(v)}（${v} ms）`
    } else if (typeof v === 'object' && v !== null) {
      display = JSON.stringify(v)
    } else {
      display = String(v)
    }
    return {
      key: String(k),
      label: EXTRA_LABELS[k] || String(k),
      value: display
    }
  })
})

// onMounted：检查从歌词页跳转预填的歌词
onMounted(() => {
  const prefill = sessionStorage.getItem('minimax_prefill_lyrics')
  if (prefill) {
    form.lyrics = prefill
    sessionStorage.removeItem('minimax_prefill_lyrics')
  }
})

// 组件卸载时若仍在流式请求，中断并清理
onBeforeUnmount(() => {
  if (abortController) {
    try {
      abortController.abort()
    } catch (_) {
      /* 忽略 */
    }
    abortController = null
  }
})

/**
 * 构造请求 payload
 */
function buildPayload() {
  return {
    model: form.model,
    prompt: form.prompt,
    lyrics: form.lyrics,
    is_instrumental: form.is_instrumental,
    lyrics_optimizer: form.lyrics_optimizer,
    audio_setting: {
      format: form.format,
      sample_rate: form.sample_rate,
      bitrate: form.bitrate
    },
    stream: form.stream,
    output_format: 'hex'
  }
}

/**
 * 表单校验
 * @returns {boolean} 是否通过
 */
function validate() {
  // 纯音乐时 prompt 必填
  if (form.is_instrumental && !form.prompt.trim()) {
    ElMessage.warning('纯音乐需填写歌曲描述')
    return false
  }
  // 非纯音乐且未开启歌词优化时 lyrics 必填
  if (
    !form.is_instrumental &&
    !form.lyrics_optimizer &&
    !form.lyrics.trim()
  ) {
    ElMessage.warning('非纯音乐需填写歌词，或开启“歌词优化”自动生成')
    return false
  }
  return true
}

/**
 * 流式 chunk 回调：累加 hex 片段、记录状态与 extra_info
 */
function onChunk(chunk) {
  if (chunk && chunk.data) {
    if (chunk.data.audio) {
      streamedHex.value += chunk.data.audio
    }
    if (typeof chunk.data.status !== 'undefined') {
      streamStatus.value = chunk.data.status
    }
  }
  // extra_info 通常在最终 chunk 携带
  if (chunk && chunk.extra_info) {
    extraInfo.value = chunk.extra_info
  }
}

/**
 * 生成音乐（非流式 / 流式）
 */
async function handleGenerate() {
  // API Key 检查
  if (!hasKey.value) {
    ElMessage.warning('请先配置 API Key')
    goSettings()
    return
  }
  // 表单校验
  if (!validate()) return

  // 重置上次结果
  audioHex.value = ''
  extraInfo.value = null
  streamedHex.value = ''
  streamStatus.value = null

  loading.value = true
  const payload = buildPayload()

  try {
    if (form.stream) {
      // 流式生成
      streaming.value = true
      abortController = new AbortController()
      // generateStream 会在内部将 stream 强制为 true，并返回拼接的完整 hex
      const fullHex = await generateStream(
        payload,
        onChunk,
        abortController.signal
      )
      // status===2 表示完成，播放完整音频
      audioHex.value = fullHex || streamedHex.value
    } else {
      // 非流式生成
      const res = await generate(payload)
      // res = { data: { audio, status }, extra_info }
      audioHex.value = res?.data?.audio || ''
      extraInfo.value = res?.extra_info || null
    }
    if (!audioHex.value) {
      ElMessage.warning('未收到音频数据')
    }
  } catch (e) {
    // 用户主动中断
    if (e && (e.name === 'AbortError' || e.code === 20)) {
      ElMessage.info('已停止生成')
    } else {
      ElMessage.error(e?.message || '音乐生成失败')
    }
  } finally {
    loading.value = false
    streaming.value = false
    abortController = null
  }
}

/**
 * 停止流式生成
 */
function handleStop() {
  if (abortController) {
    abortController.abort()
  }
}

/**
 * 下载音频（独立下载入口，AudioPlayer 内置的下载按钮亦可使用）
 */
function handleDownload() {
  if (!audioHex.value) return
  const blob = hexToBlob(audioHex.value, `audio/${form.format}`)
  downloadBlob(blob, downloadFilename.value)
}

/**
 * 重置表单与结果
 */
function handleReset() {
  form.model = 'music-2.6'
  form.prompt = ''
  form.lyrics = ''
  form.is_instrumental = false
  form.lyrics_optimizer = false
  form.format = 'mp3'
  form.sample_rate = 32000
  form.bitrate = 128000
  form.stream = false
  audioHex.value = ''
  extraInfo.value = null
  streamedHex.value = ''
  streamStatus.value = null
}
</script>

<style scoped>
.music-page {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.music-card {
  border-radius: 8px;
}
.music-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}
.music-card__tag {
  margin-left: auto;
  font-weight: 400;
}
.music-full {
  width: 100%;
}
.music-hint {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}
.music-alert {
  margin-bottom: 16px;
}
.music-streaming {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}
.music-result__player {
  margin-bottom: 16px;
}
.music-result__info {
  margin-bottom: 16px;
}
.music-result__actions {
  display: flex;
  gap: 12px;
}
</style>
