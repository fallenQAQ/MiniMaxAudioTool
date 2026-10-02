<template>
  <div class="long-tts-page">
    <!-- 页面标题 -->
    <div class="page-head">
      <el-icon class="page-head__icon"><Document /></el-icon>
      <div class="page-head__text">
        <h2 class="page-head__title">长文本语音合成</h2>
        <p class="page-head__sub">异步 T2A V2 接口，支持大段文本或 txt/zip 文件输入，任务异步处理完成后可下载与播放</p>
      </div>
    </div>

    <!-- API Key 缺失提示 -->
    <el-alert
      v-if="!hasKey"
      type="warning"
      show-icon
      :closable="false"
      title="尚未配置 API Key"
      class="key-alert"
    >
      <template #default>
        <div class="key-alert__body">
          <span>使用长文本语音功能前，请先配置 MiniMax API Key。</span>
          <el-button type="primary" size="small" @click="goSettings">前往设置</el-button>
        </div>
      </template>
    </el-alert>

    <div class="long-tts-grid">
      <!-- ============ 表单区 ============ -->
      <el-card shadow="never" class="form-card">
        <template #header>
          <div class="card-header">
            <el-icon><EditPen /></el-icon>
            <span>任务配置</span>
          </div>
        </template>

        <el-form :model="form" label-width="110px" label-position="right" class="tts-form">
          <!-- 输入模式切换 -->
          <el-form-item label="输入模式">
            <el-radio-group v-model="form.inputMode">
              <el-radio value="text">文本输入</el-radio>
              <el-radio value="file">文件输入</el-radio>
            </el-radio-group>
          </el-form-item>

          <!-- 文本输入 -->
          <el-form-item v-if="form.inputMode === 'text'" label="文本内容">
            <el-input
              v-model="form.text"
              type="textarea"
              :rows="10"
              maxlength="50000"
              show-word-limit
              placeholder="请输入需要合成的文本内容，最多 50000 字符"
              resize="vertical"
            />
          </el-form-item>

          <!-- 文件输入 -->
          <el-form-item v-else label="文本文件">
            <div class="file-input">
              <el-upload
                action="#"
                :http-request="handleUpload"
                :show-file-list="false"
                :limit="1"
                accept=".txt,.zip"
                :disabled="uploading"
              >
                <el-button :icon="UploadFilled" :loading="uploading">选择 txt / zip 文件</el-button>
              </el-upload>
              <div class="file-input__tip">仅支持 .txt 或 .zip 文件，上传后用于异步合成。</div>

              <!-- 已上传文件展示 -->
              <div v-if="uploadedFile.id" class="file-input__item">
                <el-icon><Document /></el-icon>
                <span class="file-input__name">{{ uploadedFile.name }}</span>
                <el-tag size="small" type="success">已上传</el-tag>
                <el-button
                  link
                  type="danger"
                  :icon="Delete"
                  @click="handleRemoveFile"
                >移除</el-button>
              </div>
            </div>
          </el-form-item>

          <!-- 模型 -->
          <el-form-item label="模型">
            <el-select v-model="form.model" placeholder="请选择模型" class="full-width">
              <el-option
                v-for="m in modelOptions"
                :key="m.value"
                :label="m.label"
                :value="m.value"
              />
            </el-select>
          </el-form-item>

          <!-- voice_setting -->
          <el-divider content-position="left">voice_setting 音色设置</el-divider>

          <el-form-item label="voice_id">
            <el-input
              v-model="form.voice_setting.voice_id"
              placeholder="请输入音色 ID（必填）"
              clearable
            />
            <div class="field-tip">音色唯一标识，可从「音色管理」获取或使用系统内置音色。</div>
          </el-form-item>

          <el-form-item>
            <template #label>语速 speed<span class="val">{{ form.voice_setting.speed }}</span></template>
            <el-slider
              v-model="form.voice_setting.speed"
              :min="0.5"
              :max="2"
              :step="0.1"
              :show-tooltip="false"
            />
          </el-form-item>

          <el-form-item>
            <template #label>音量 vol<span class="val">{{ form.voice_setting.vol }}</span></template>
            <el-slider
              v-model="form.voice_setting.vol"
              :min="0"
              :max="10"
              :step="1"
              :show-tooltip="false"
            />
          </el-form-item>

          <el-form-item>
            <template #label>音调 pitch<span class="val">{{ form.voice_setting.pitch }}</span></template>
            <el-slider
              v-model="form.voice_setting.pitch"
              :min="-12"
              :max="12"
              :step="1"
              :show-tooltip="false"
            />
          </el-form-item>

          <el-form-item label="emotion">
            <el-select v-model="form.voice_setting.emotion" class="full-width">
              <el-option
                v-for="e in emotionOptions"
                :key="e.value"
                :label="e.label"
                :value="e.value"
              />
            </el-select>
          </el-form-item>

          <!-- audio_setting -->
          <el-divider content-position="left">audio_setting 音频设置</el-divider>

          <el-form-item label="采样率">
            <el-select v-model="form.audio_setting.audio_sample_rate" class="full-width">
              <el-option
                v-for="r in sampleRateOptions"
                :key="r"
                :label="`${r} Hz`"
                :value="r"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="比特率">
            <el-select v-model="form.audio_setting.bitrate" class="full-width">
              <el-option
                v-for="b in bitrateOptions"
                :key="b"
                :label="`${b / 1000} kbps`"
                :value="b"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="音频格式">
            <el-select v-model="form.audio_setting.format" class="full-width">
              <el-option
                v-for="f in formatOptions"
                :key="f"
                :label="f.toUpperCase()"
                :value="f"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="声道">
            <el-radio-group v-model="form.audio_setting.channel">
              <el-radio :value="1">单声道（1）</el-radio>
              <el-radio :value="2">立体声（2）</el-radio>
            </el-radio-group>
          </el-form-item>

          <!-- language_boost -->
          <el-divider content-position="left">language_boost 语种增强</el-divider>
          <el-form-item label="语种增强">
            <el-select v-model="form.language_boost" class="full-width" placeholder="不设置">
              <el-option
                v-for="l in languageBoostOptions"
                :key="l.value"
                :label="l.label"
                :value="l.value"
              />
            </el-select>
            <div class="field-tip">选择「不设置」则不会向接口传递 language_boost 字段。</div>
          </el-form-item>

          <!-- 提交按钮 -->
          <el-form-item>
            <el-button
              type="primary"
              :icon="Promotion"
              :loading="submitting"
              @click="handleSubmit"
            >提交任务</el-button>
            <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- ============ 任务状态区 ============ -->
      <el-card shadow="never" class="status-card">
        <template #header>
          <div class="card-header">
            <el-icon><DataLine /></el-icon>
            <span>任务状态</span>
            <el-tag v-if="polling" size="small" type="primary" effect="plain" class="header-tag">
              <el-icon class="is-loading"><Loading /></el-icon>
              轮询中
            </el-tag>
          </div>
        </template>

        <!-- 空状态 -->
        <el-empty v-if="!taskInfo.id" description="暂无任务，提交后将在此展示处理进度与结果">
          <template #image>
            <el-icon :size="56" color="#c0c4cc"><Files /></el-icon>
          </template>
        </el-empty>

        <template v-else>
          <!-- 流程步骤 -->
          <el-steps :active="stepActive" align-center finish-status="success" class="status-steps">
            <el-step title="提交任务" />
            <el-step title="处理中" />
            <el-step title="获取结果" />
            <el-step title="完成" />
          </el-steps>

          <!-- 任务详情 -->
          <el-descriptions :column="1" border size="small" class="status-desc">
            <el-descriptions-item label="任务 ID">
              <span class="mono">{{ taskInfo.id }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="当前状态">
              <el-tag :type="statusType" effect="light">{{ taskInfo.status || '—' }}</el-tag>
              <span v-if="stopped && taskInfo.status === 'Processing'" class="status-hint">（已停止轮询）</span>
            </el-descriptions-item>
            <el-descriptions-item label="已等待时间">{{ elapsedText }}</el-descriptions-item>
            <el-descriptions-item label="字符用量">
              {{ taskInfo.usage_characters ? taskInfo.usage_characters.toLocaleString() : '—' }}
            </el-descriptions-item>
          </el-descriptions>

          <!-- 操作按钮 -->
          <div class="status-actions">
            <el-button
              v-if="polling"
              type="danger"
              plain
              :icon="VideoPause"
              @click="stopPolling"
            >停止轮询</el-button>
            <el-button
              v-if="!polling && taskInfo.status === 'Processing'"
              type="primary"
              plain
              :icon="VideoPlay"
              @click="resumePolling"
            >继续轮询</el-button>
            <el-button :icon="Close" @click="clearTask">清空任务</el-button>
          </div>

          <!-- 失败/过期提示 -->
          <el-alert
            v-if="taskInfo.status === 'Failed' || taskInfo.status === 'Expired'"
            :type="taskInfo.status === 'Failed' ? 'error' : 'warning'"
            show-icon
            :closable="false"
            :title="taskInfo.status === 'Failed' ? '任务处理失败' : '任务已过期'"
            class="status-alert"
          >
            <template #default>
              任务状态为 {{ taskInfo.status }}，请检查参数后重新提交。
            </template>
          </el-alert>

          <!-- 成功结果 -->
          <div v-if="taskInfo.status === 'Success'" class="result-area">
            <el-alert
              type="success"
              show-icon
              :closable="false"
              title="合成成功"
              class="status-alert"
            >
              <template #default>
                音频已生成，下载链接 9 小时内有效，请及时保存。
              </template>
            </el-alert>

            <div v-if="resultLoading" class="result-loading">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span>正在获取下载链接...</span>
            </div>

            <template v-if="resultUrl">
              <div class="result-link">
                <el-link
                  :href="resultUrl"
                  type="primary"
                  :underline="false"
                  target="_blank"
                  rel="noopener"
                >
                  <el-icon><Download /></el-icon>
                  点击下载音频文件
                </el-link>
              </div>

              <div class="result-player">
                <div class="result-player__label">在线试听：</div>
                <AudioPlayer
                  :src="resultUrl"
                  :filename="resultFilename"
                  :format="form.audio_setting.format"
                />
              </div>
            </template>
          </div>
        </template>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus/es/components/message/index'
import { ElLoading } from 'element-plus/es/components/loading/index'
import {
  Document, EditPen, UploadFilled, Delete, Promotion, RefreshLeft,
  DataLine, Loading, Files, VideoPause, VideoPlay, Close, Download
} from '@element-plus/icons-vue'
import { useApiKey } from '@/composables/useApiKey'
import { createTask, queryTask } from '@/api/modules/longTts'
import { upload, retrieve } from '@/api/modules/file'
import AudioPlayer from '@/components/AudioPlayer.vue'
import { formatDuration } from '@/utils/audio'
import {
  SPEECH_MODELS, EMOTIONS, AUDIO_FORMATS, SAMPLE_RATES, BITRATES, LANGUAGES
} from '@/constants'

// API Key 校验
const { hasKey, goSettings } = useApiKey()

// ====== 选项常量 ======
const modelOptions = SPEECH_MODELS
const emotionOptions = EMOTIONS
const formatOptions = AUDIO_FORMATS
const sampleRateOptions = SAMPLE_RATES
const bitrateOptions = BITRATES
// 语种增强（首项"不设置"表示不传递该字段）
const languageBoostOptions = [{ label: '不设置', value: '' }, ...LANGUAGES]

// ====== 表单状态 ======
const form = reactive({
  inputMode: 'text',
  text: '',
  model: 'speech-2.8-hd',
  voice_setting: {
    voice_id: '',
    speed: 1,
    vol: 5,
    pitch: 0,
    emotion: 'auto'
  },
  audio_setting: {
    audio_sample_rate: 32000,
    bitrate: 128000,
    format: 'mp3',
    channel: 1
  },
  language_boost: ''
})

// ====== 文件上传状态 ======
const uploading = ref(false)
const uploadedFile = ref({ id: '', name: '' })

// ====== 提交与任务状态 ======
const submitting = ref(false)
const resultLoading = ref(false)

const taskInfo = reactive({
  id: '',
  status: '',
  usage_characters: 0
})

// ====== 轮询相关 ======
const polling = ref(false)
const stopped = ref(false)
let pollTimer = null
let elapsedTimer = null
const elapsedMs = ref(0)
let startTime = 0

// ====== 结果 ======
const resultUrl = ref('')
const resultFilename = ref('long-tts-audio.mp3')

// ====== 计算属性 ======

// 已等待时间格式化为 mm:ss（复用 utils 中的 formatDuration）
const elapsedText = computed(() => formatDuration(elapsedMs.value))

// 步骤条当前激活项
const stepActive = computed(() => {
  if (!taskInfo.id) return 0
  if (taskInfo.status === 'Processing') return 1
  if (taskInfo.status === 'Success' && !resultUrl.value) return 2
  if (taskInfo.status === 'Success' && resultUrl.value) return 3
  // Failed / Expired 停在处理中步骤
  return 1
})

// 状态标签类型
const statusType = computed(() => {
  switch (taskInfo.status) {
    case 'Success': return 'success'
    case 'Failed': return 'danger'
    case 'Expired': return 'warning'
    case 'Processing': return 'primary'
    default: return 'info'
  }
})

// ====== 文件上传 ======

// ElUpload 自定义上传请求
async function handleUpload(options) {
  if (!hasKey.value) {
    ElMessage.warning('请先配置 API Key')
    goSettings()
    return
  }
  const file = options.file
  // 校验扩展名
  const ext = (file.name.split('.').pop() || '').toLowerCase()
  if (!['txt', 'zip'].includes(ext)) {
    ElMessage.error('仅支持 .txt 或 .zip 文件')
    return
  }

  uploading.value = true
  try {
    const resp = await upload(file, 't2a_async_input')
    // resp.file.file_id 为上传后的文件标识
    uploadedFile.value = {
      id: resp.file.file_id,
      name: file.name
    }
    ElMessage.success('文件上传成功')
  } catch (e) {
    ElMessage.error('文件上传失败：' + (e?.message || e))
  } finally {
    uploading.value = false
  }
}

// 移除已上传文件
function handleRemoveFile() {
  uploadedFile.value = { id: '', name: '' }
}

// ====== 提交任务 ======

async function handleSubmit() {
  // API Key 校验
  if (!hasKey.value) {
    ElMessage.warning('请先配置 API Key')
    goSettings()
    return
  }

  // 输入校验
  if (form.inputMode === 'text') {
    if (!form.text.trim()) {
      ElMessage.error('请输入文本内容')
      return
    }
  } else {
    if (!uploadedFile.value.id) {
      ElMessage.error('请先上传文本文件')
      return
    }
  }
  if (!form.voice_setting.voice_id.trim()) {
    ElMessage.error('请填写 voice_id')
    return
  }

  // 构造请求 payload
  const voiceSetting = { ...form.voice_setting }
  // emotion 为 auto 时不传该字段（与 Tts.vue 保持一致）
  if (voiceSetting.emotion === 'auto') {
    delete voiceSetting.emotion
  }
  const payload = {
    model: form.model,
    voice_setting: voiceSetting,
    audio_setting: { ...form.audio_setting }
  }
  // language_boost 仅在选择了具体值时传递
  if (form.language_boost) {
    payload.language_boost = form.language_boost
  }
  // 文本 / 文件二选一
  if (form.inputMode === 'text') {
    payload.text = form.text
  } else {
    payload.text_file_id = uploadedFile.value.id
  }

  // 清空上次任务状态
  clearTask(true)

  submitting.value = true
  const loading = ElLoading.service({
    text: '正在提交任务...',
    background: 'rgba(255, 255, 255, 0.6)'
  })
  try {
    const resp = await createTask(payload)
    taskInfo.id = resp.task_id
    taskInfo.usage_characters = resp.usage_characters || 0
    taskInfo.status = 'Processing'
    ElMessage.success('任务已提交，开始处理')
    // 开始轮询
    startPolling()
  } catch (e) {
    ElMessage.error('提交任务失败：' + (e?.message || e))
  } finally {
    submitting.value = false
    loading.close()
  }
}

// ====== 轮询任务 ======

function startPolling() {
  polling.value = true
  stopped.value = false
  startTime = Date.now()
  elapsedMs.value = 0

  // 已等待时间计时器（每秒更新）
  elapsedTimer = setInterval(() => {
    elapsedMs.value = Date.now() - startTime
  }, 1000)

  // 立即查询一次，之后每 3 秒轮询
  pollOnce()
  pollTimer = setInterval(pollOnce, 3000)
}

// 继续轮询（手动停止后恢复）
function resumePolling() {
  // 以当前已等待时间为基准继续计时
  startTime = Date.now() - elapsedMs.value
  polling.value = true
  stopped.value = false
  elapsedTimer = setInterval(() => {
    elapsedMs.value = Date.now() - startTime
  }, 1000)
  pollOnce()
  pollTimer = setInterval(pollOnce, 3000)
}

async function pollOnce() {
  if (!taskInfo.id) return
  try {
    const resp = await queryTask(taskInfo.id)
    taskInfo.status = resp.status

    if (resp.status === 'Success') {
      stopPolling()
      // 获取下载链接
      await fetchResult(resp.file_id)
    } else if (resp.status === 'Failed' || resp.status === 'Expired') {
      stopPolling()
      ElMessage.error(resp.status === 'Failed' ? '任务处理失败' : '任务已过期')
    }
    // Processing 状态继续轮询
  } catch (e) {
    // 查询异常不中断轮询，等待下一次重试
    console.warn('[longTts] 查询任务失败：', e)
  }
}

function stopPolling() {
  polling.value = false
  stopped.value = true
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  if (elapsedTimer) {
    clearInterval(elapsedTimer)
    elapsedTimer = null
  }
}

// 获取合成结果下载链接
async function fetchResult(fileId) {
  resultLoading.value = true
  try {
    const resp = await retrieve(fileId)
    resultUrl.value = resp.file.download_url
    // 根据所选格式生成文件名
    const ext = form.audio_setting.format || 'mp3'
    resultFilename.value = `long-tts-${taskInfo.id}.${ext}`
    ElMessage.success('音频已就绪，可下载或试听')
  } catch (e) {
    ElMessage.error('获取音频下载链接失败：' + (e?.message || e))
  } finally {
    resultLoading.value = false
  }
}

// ====== 重置 / 清空 ======

// 清空任务状态（silent=true 时不提示）
function clearTask(silent = false) {
  stopPolling()
  stopped.value = false
  taskInfo.id = ''
  taskInfo.status = ''
  taskInfo.usage_characters = 0
  resultUrl.value = ''
  resultLoading.value = false
  elapsedMs.value = 0
  if (!silent) {
    ElMessage.info('已清空任务')
  }
}

// 重置整个表单与任务
function handleReset() {
  clearTask(true)
  form.text = ''
  form.inputMode = 'text'
  uploadedFile.value = { id: '', name: '' }
  ElMessage.info('已重置表单')
}

// 组件卸载时清理定时器
onBeforeUnmount(() => {
  stopPolling()
})
</script>

<style scoped>
.long-tts-page {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 页面标题 */
.page-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.page-head__icon {
  font-size: 28px;
  color: #4f46e5;
  margin-top: 2px;
}
.page-head__title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}
.page-head__sub {
  margin: 4px 0 0;
  font-size: 13px;
  color: #909399;
  line-height: 1.5;
}

/* API Key 提示 */
.key-alert__body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

/* 网格布局：表单 + 状态 */
.long-tts-grid {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 16px;
  align-items: start;
}
@media (max-width: 992px) {
  .long-tts-grid {
    grid-template-columns: 1fr;
  }
}

/* 卡片头部 */
.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}
.header-tag {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* 表单 */
.tts-form :deep(.el-divider__text) {
  font-weight: 600;
  color: #4f46e5;
}
.full-width {
  width: 100%;
}
.field-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
  margin-top: 4px;
}
/* slider 值显示在 label 中 */
.val {
  display: inline-block;
  margin-left: 6px;
  padding: 0 6px;
  min-width: 32px;
  text-align: center;
  font-size: 12px;
  color: #4f46e5;
  background: #eef2ff;
  border-radius: 4px;
}

/* 文件输入 */
.file-input {
  width: 100%;
}
.file-input__tip {
  font-size: 12px;
  color: #909399;
  margin-top: 6px;
}
.file-input__item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}
.file-input__name {
  flex: 1;
  font-size: 13px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 状态区 */
.status-steps {
  margin-bottom: 20px;
}
.status-desc {
  margin-bottom: 16px;
}
.mono {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  word-break: break-all;
}
.status-hint {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
}

.status-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.status-alert {
  margin-bottom: 16px;
}

/* 结果区 */
.result-area {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.result-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #909399;
  font-size: 13px;
  padding: 8px 0;
}
.result-link {
  padding: 10px 12px;
  background: #f0f9eb;
  border-radius: 6px;
  border: 1px solid #e1f3d8;
}
.result-player {
  padding-top: 4px;
}
.result-player__label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}
</style>
