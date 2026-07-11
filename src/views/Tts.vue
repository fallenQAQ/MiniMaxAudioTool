<template>
  <div class="tts-page">
    <!-- 页头 -->
    <div class="tts-page__head">
      <el-icon class="tts-page__icon"><Microphone /></el-icon>
      <h2 class="tts-page__title">语音合成</h2>
    </div>

    <!-- 未配置 API Key 引导 -->
    <el-card v-if="!hasKey" shadow="never" class="tts-card">
      <el-empty description="尚未配置 API Key，请先前往设置页面完成配置">
        <el-button type="primary" @click="goSettings">前往设置</el-button>
      </el-empty>
    </el-card>

    <template v-else>
      <!-- 表单区 -->
      <el-card shadow="never" class="tts-card">
        <template #header>
          <div class="tts-card__header">
            <el-icon><EditPen /></el-icon>
            <span>合成参数</span>
          </div>
        </template>

        <el-form :model="form" label-position="top" class="tts-form">
          <!-- 合成文本 -->
          <el-form-item label="合成文本">
            <el-input
              v-model="form.text"
              type="textarea"
              :rows="5"
              :maxlength="10000"
              show-word-limit
              resize="vertical"
              placeholder="请输入需要合成的文本（最多 10000 字符）"
            />
          </el-form-item>

          <el-row :gutter="16">
            <!-- 模型 -->
            <el-col :xs="24" :sm="12">
              <el-form-item label="模型 model">
                <el-select v-model="form.model" placeholder="选择模型">
                  <el-option
                    v-for="m in modelOptions"
                    :key="m.value"
                    :label="m.label"
                    :value="m.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <!-- 常用音色快捷选择 -->
            <el-col :xs="24" :sm="12">
              <el-form-item label="常用音色快捷选择">
                <el-select
                  v-model="quickVoice"
                  placeholder="选择常用系统音色"
                  clearable
                  filterable
                  @change="onQuickVoiceChange"
                >
                  <el-option
                    v-for="v in voiceOptions"
                    :key="v.value"
                    :label="v.label"
                    :value="v.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 音色 voice_id（可手填） -->
          <el-form-item label="音色 voice_id">
            <el-input
              v-model="form.voice_id"
              placeholder="可手填 voice_id，或在上方选择常用音色自动填入"
              clearable
            />
          </el-form-item>

          <el-row :gutter="16">
            <!-- 语速 -->
            <el-col :xs="24" :sm="8">
              <el-form-item>
                <template #label>语速 speed（{{ form.speed.toFixed(1) }}）</template>
                <el-slider v-model="form.speed" :min="0.5" :max="2" :step="0.1" />
              </el-form-item>
            </el-col>
            <!-- 音量 -->
            <el-col :xs="24" :sm="8">
              <el-form-item>
                <template #label>音量 vol（{{ form.vol.toFixed(1) }}）</template>
                <el-slider v-model="form.vol" :min="0" :max="10" :step="0.1" />
              </el-form-item>
            </el-col>
            <!-- 语调 -->
            <el-col :xs="24" :sm="8">
              <el-form-item>
                <template #label>语调 pitch（{{ form.pitch }}）</template>
                <el-slider v-model="form.pitch" :min="-12" :max="12" :step="1" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <!-- 情绪 -->
            <el-col :xs="24" :sm="8">
              <el-form-item label="情绪 emotion">
                <el-select v-model="form.emotion" placeholder="选择情绪">
                  <el-option
                    v-for="e in emotionOptions"
                    :key="e.value"
                    :label="e.label"
                    :value="e.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <!-- 音频格式 -->
            <el-col :xs="24" :sm="8">
              <el-form-item label="音频格式 format">
                <el-select v-model="form.format">
                  <el-option
                    v-for="f in formatOptions"
                    :key="f"
                    :label="f.toUpperCase()"
                    :value="f"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <!-- 采样率 -->
            <el-col :xs="24" :sm="8">
              <el-form-item label="采样率 sample_rate">
                <el-select v-model="form.sample_rate">
                  <el-option
                    v-for="s in sampleRateOptions"
                    :key="s"
                    :label="s + ' Hz'"
                    :value="s"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <!-- 比特率 -->
            <el-col :xs="24" :sm="8">
              <el-form-item label="比特率 bitrate">
                <el-select v-model="form.bitrate">
                  <el-option
                    v-for="b in bitrateOptions"
                    :key="b"
                    :label="b / 1000 + ' kbps'"
                    :value="b"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <!-- 声道 -->
            <el-col :xs="24" :sm="8">
              <el-form-item label="声道 channel">
                <el-radio-group v-model="form.channel">
                  <el-radio :value="1">单声道（1）</el-radio>
                  <el-radio :value="2">立体声（2）</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <!-- 流式开关 -->
            <el-col :xs="24" :sm="8">
              <el-form-item label="流式合成 stream">
                <el-switch
                  v-model="form.stream"
                  active-text="开启"
                  inactive-text="关闭"
                  :disabled="synthesizing"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 操作按钮 -->
          <el-form-item>
            <el-button
              type="primary"
              :loading="synthesizing"
              :disabled="synthesizing"
              :icon="VideoPlay"
              @click="handleSynthesize"
            >
              {{ form.stream ? '流式合成' : '合成语音' }}
            </el-button>
            <el-button
              v-if="synthesizing && form.stream"
              type="danger"
              :icon="VideoPause"
              @click="handleStop"
            >
              停止
            </el-button>
            <el-button :icon="RefreshLeft" :disabled="synthesizing" @click="handleReset">
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 结果区 -->
      <el-card shadow="never" class="tts-card">
        <template #header>
          <div class="tts-card__header">
            <el-icon><Headset /></el-icon>
            <span>合成结果</span>
          </div>
        </template>

        <!-- 空状态 -->
        <el-empty
          v-if="!result.hex && !synthesizing"
          description="尚未合成，请在上方填写参数后点击合成按钮"
        />

        <!-- 流式进度 -->
        <div v-if="synthesizing && form.stream" class="tts-progress">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>
            流式合成中… 已接收 {{ streamProgress.chunkCount }} 个分片，
            {{ formatBytes(streamProgress.byteCount) }}
          </span>
        </div>

        <!-- 结果内容 -->
        <div v-if="result.hex" class="tts-result">
          <!-- 播放器（传 hex + format，内部用 hexToObjectUrl 生成 URL 并管理生命周期） -->
          <div class="tts-result__player">
            <AudioPlayer :hex="result.hex" :format="result.format" :filename="result.filename" />
          </div>

          <!-- extra_info 额外信息 -->
          <el-descriptions
            v-if="result.extraInfo && Object.keys(result.extraInfo).length"
            title="额外信息 extra_info"
            :column="extraInfoColumn"
            border
            size="small"
            class="tts-result__info"
          >
            <el-descriptions-item label="音频时长">
              {{ formatDuration(result.extraInfo.audio_length) }}
              <span v-if="result.extraInfo.audio_length" class="tts-result__hint">
                （{{ result.extraInfo.audio_length }} ms）
              </span>
            </el-descriptions-item>
            <el-descriptions-item v-if="result.extraInfo.sample_rate" label="采样率">
              {{ result.extraInfo.sample_rate }} Hz
            </el-descriptions-item>
            <el-descriptions-item v-if="result.extraInfo.bitrate" label="比特率">
              {{ result.extraInfo.bitrate / 1000 }} kbps
            </el-descriptions-item>
            <el-descriptions-item v-if="result.extraInfo.audio_format" label="音频格式">
              {{ result.extraInfo.audio_format }}
            </el-descriptions-item>
            <el-descriptions-item v-if="result.extraInfo.channel" label="声道">
              {{ result.extraInfo.channel }}
            </el-descriptions-item>
            <el-descriptions-item v-if="result.extraInfo.word_size !== undefined" label="字符数">
              {{ result.extraInfo.word_size }}
            </el-descriptions-item>
          </el-descriptions>

          <!-- 下载按钮 -->
          <div class="tts-result__actions">
            <el-button type="primary" :icon="Download" @click="handleDownload">
              下载音频
            </el-button>
            <span
              v-if="result.extraInfo && result.extraInfo.audio_length"
              class="tts-result__hint"
            >
              时长 {{ formatDuration(result.extraInfo.audio_length) }}
            </span>
          </div>
        </div>
      </el-card>
    </template>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Microphone,
  EditPen,
  Headset,
  VideoPlay,
  VideoPause,
  RefreshLeft,
  Download,
  Loading
} from '@element-plus/icons-vue'
import { synthesize, synthesizeStream } from '@/api/modules/tts'
import { useApiKey } from '@/composables/useApiKey'
import AudioPlayer from '@/components/AudioPlayer.vue'
import { hexToBlob, downloadBlob, formatDuration, mimeFromFormat } from '@/utils/audio'

// API Key 校验：未配置时显示引导
const { hasKey, goSettings } = useApiKey()

// 模型选项
const modelOptions = [
  { value: 'speech-2.8-hd', label: 'speech-2.8-hd（最新 HD）' },
  { value: 'speech-2.8-turbo', label: 'speech-2.8-turbo（最新 Turbo）' },
  { value: 'speech-2.6-hd', label: 'speech-2.6-hd' },
  { value: 'speech-2.6-turbo', label: 'speech-2.6-turbo' },
  { value: 'speech-02-hd', label: 'speech-02-hd' },
  { value: 'speech-02-turbo', label: 'speech-02-turbo' }
]

// 常用系统音色（选中后自动填入 voice_id 输入框）
const voiceOptions = [
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

// 情绪选项（auto 时不传 emotion 字段）
const emotionOptions = [
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

// 音频格式 / 采样率 / 比特率选项
const formatOptions = ['mp3', 'pcm', 'flac', 'wav']
const sampleRateOptions = [8000, 16000, 22050, 24000, 32000, 44100]
const bitrateOptions = [32000, 64000, 128000, 256000]

// 表单默认值
const defaultForm = () => ({
  text: '',
  model: 'speech-2.6-hd',
  voice_id: 'male-qn-qingse',
  speed: 1,
  vol: 1,
  pitch: 0,
  emotion: 'auto',
  format: 'mp3',
  sample_rate: 32000,
  bitrate: 128000,
  channel: 1,
  stream: false
})
const form = reactive(defaultForm())
const quickVoice = ref('')

// 合成状态与结果
const synthesizing = ref(false)
const result = reactive({
  hex: '',           // 完整音频 hex
  format: 'mp3',     // 音频格式（用于推断 MIME）
  filename: 'tts.mp3',
  extraInfo: null    // extra_info（含 audio_length 等）
})
// 流式进度
const streamProgress = reactive({ chunkCount: 0, byteCount: 0 })
let abortController = null

// extra_info 描述列表列数：桌面 2 列，移动 1 列（监听 resize 响应式更新）
const winWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1280)
const extraInfoColumn = computed(() => (winWidth.value < 768 ? 1 : 2))
function onResize() {
  winWidth.value = window.innerWidth
}

// 常用音色选中 → 填入 voice_id
function onQuickVoiceChange(val) {
  if (val) form.voice_id = val
}

// 构造请求 payload
function buildPayload() {
  const voiceSetting = {
    voice_id: form.voice_id,
    speed: form.speed,
    vol: form.vol,
    pitch: form.pitch
  }
  // emotion 为 auto 时不传该字段
  if (form.emotion !== 'auto') {
    voiceSetting.emotion = form.emotion
  }
  return {
    model: form.model,
    text: form.text,
    stream: form.stream,
    voice_setting: voiceSetting,
    audio_setting: {
      sample_rate: form.sample_rate,
      bitrate: form.bitrate,
      format: form.format,
      channel: form.channel
    },
    output_format: 'hex'
  }
}

// 合成（非流式 / 流式）
async function handleSynthesize() {
  // 基础校验
  if (!form.text || !form.text.trim()) {
    ElMessage.warning('请输入合成文本')
    return
  }
  if (!form.voice_id || !form.voice_id.trim()) {
    ElMessage.warning('请输入或选择音色 voice_id')
    return
  }

  // 清空旧结果
  result.hex = ''
  result.extraInfo = null
  result.format = form.format
  result.filename = `tts_${Date.now()}.${form.format}`
  streamProgress.chunkCount = 0
  streamProgress.byteCount = 0

  const payload = buildPayload()
  synthesizing.value = true

  try {
    if (form.stream) {
      // 流式合成：通过 onChunk 累计进度，结束后用完整 hex 生成播放
      abortController = new AbortController()
      let streamExtra = null
      const fullHex = await synthesizeStream(
        payload,
        (chunk) => {
          streamProgress.chunkCount++
          const piece = chunk?.data?.audio || ''
          streamProgress.byteCount += Math.floor(piece.length / 2)
          // 最后一个 chunk 通常携带 extra_info
          if (chunk?.extra_info) streamExtra = chunk.extra_info
        },
        abortController.signal
      )
      result.hex = fullHex || ''
      result.extraInfo = streamExtra || null
      if (!result.hex) {
        ElMessage.warning('未收到音频数据')
      } else {
        ElMessage.success('流式合成完成')
      }
    } else {
      // 非流式合成：resp.data.audio 为 hex，resp.extra_info 为额外信息
      const resp = await synthesize(payload)
      const hex = resp?.data?.audio || ''
      result.hex = hex
      result.extraInfo = resp?.extra_info || null
      if (!hex) {
        ElMessage.warning('未收到音频数据')
      } else {
        ElMessage.success('合成成功')
      }
    }
  } catch (err) {
    // 用户主动中断
    if (err?.name === 'AbortError' || /abort/i.test(err?.message || '')) {
      ElMessage.info('已停止合成')
    } else {
      // 业务错误（client 已抛出中文消息）
      ElMessage.error(err?.message || '合成失败，请重试')
    }
  } finally {
    synthesizing.value = false
    abortController = null
  }
}

// 停止流式合成
function handleStop() {
  if (abortController) abortController.abort()
}

// 重置表单
function handleReset() {
  Object.assign(form, defaultForm())
  quickVoice.value = ''
}

// 下载音频
function handleDownload() {
  if (!result.hex) return
  const blob = hexToBlob(result.hex, mimeFromFormat(result.format))
  downloadBlob(blob, result.filename)
}

// 字节格式化
function formatBytes(n) {
  if (!n) return '0 B'
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  return (n / 1024 / 1024).toFixed(2) + ' MB'
}

// 挂载时监听窗口尺寸，卸载时中断未完成的流式请求并移除监听
onMounted(() => {
  window.addEventListener('resize', onResize)
})
onBeforeUnmount(() => {
  if (abortController) abortController.abort()
  window.removeEventListener('resize', onResize)
})
</script>

<style scoped>
.tts-page {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.tts-page__head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}
.tts-page__icon {
  font-size: 24px;
  color: #4f46e5;
}
.tts-page__title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}
.tts-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}
/* 让 select / slider 在 form-item 中占满宽度 */
.tts-form :deep(.el-select),
.tts-form :deep(.el-slider) {
  width: 100%;
}
/* radio-group 在窄屏可换行 */
.tts-form :deep(.el-radio-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  height: 32px;
}
.tts-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #409eff;
  padding: 8px 0;
  font-size: 14px;
}
.tts-result {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.tts-result__player {
  padding: 4px 0;
}
.tts-result__info {
  margin-top: 4px;
}
.tts-result__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.tts-result__hint {
  font-size: 12px;
  color: #909399;
}
/* 移动端适配 */
@media (max-width: 768px) {
  .tts-page {
    padding: 0 4px;
  }
}
</style>
