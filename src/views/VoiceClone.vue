<template>
  <div class="voice-clone-page">
    <!-- 页头 -->
    <div class="page-head">
      <el-icon class="page-head__icon"><CopyDocument /></el-icon>
      <h2 class="page-head__title">语音克隆</h2>
    </div>

    <!-- 提示信息 -->
    <el-alert
      class="vc-alert"
      title="复刻音色 7 天内需在语音合成中正式调用一次以永久保留"
      type="warning"
      :closable="false"
      show-icon
    />
    <el-alert
      class="vc-alert"
      title="使用克隆功能需完成账户个人/企业认证"
      type="info"
      :closable="false"
      show-icon
    />

    <!-- API Key 未配置提示 -->
    <el-alert
      v-if="!hasKey"
      class="vc-alert"
      type="error"
      show-icon
      :closable="false"
    >
      <template #title>
        <div class="vc-keyalert">
          <span>尚未配置 API Key，无法调用接口</span>
          <el-button type="primary" size="small" @click="goSettings">前往设置</el-button>
        </div>
      </template>
    </el-alert>

    <!-- 步骤条 -->
    <el-steps :active="activeStep" align-center finish-status="success" class="vc-steps">
      <el-step title="上传待克隆音频" description="10秒 - 5分钟" />
      <el-step title="上传示例音频（可选）" description="小于 8 秒" />
      <el-step title="克隆配置" description="voice_id 与试听" />
    </el-steps>

    <!-- 步骤 1：上传待克隆音频 -->
    <el-card shadow="never" class="vc-card">
      <template #header>
        <div class="vc-card__head">
          <el-tag type="primary" size="small" effect="dark">步骤 1</el-tag>
          <span class="vc-card__title">上传待克隆音频</span>
          <span class="vc-card__hint">时长需 10 秒至 5 分钟，大小 ≤ 20MB</span>
        </div>
      </template>

      <el-upload
        drag
        accept=".mp3,.m4a,.wav"
        :show-file-list="false"
        :before-upload="beforeCloneUpload"
        :http-request="handleCloneUpload"
        :disabled="!hasKey || uploadingClone"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">将音频拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">支持 mp3 / m4a / wav，大小不超过 20MB，时长 10 秒至 5 分钟</div>
        </template>
      </el-upload>

      <!-- 上传中提示 -->
      <div v-if="uploadingClone" class="vc-uploading">上传中...</div>

      <!-- 已上传文件展示 -->
      <div v-if="cloneFileName" class="vc-file">
        <el-icon class="vc-file__icon"><Document /></el-icon>
        <span class="vc-file__name" :title="cloneFileName">{{ cloneFileName }}</span>
        <el-tag type="success" size="small">已上传</el-tag>
        <el-button text type="danger" :icon="Delete" @click="clearCloneFile">移除</el-button>
      </div>
    </el-card>

    <!-- 步骤 2：示例音频（可选） -->
    <el-card shadow="never" class="vc-card">
      <template #header>
        <div class="vc-card__head">
          <el-tag type="info" size="small" effect="dark">步骤 2（可选）</el-tag>
          <span class="vc-card__title">上传示例音频</span>
          <span class="vc-card__hint">时长需小于 8 秒，大小 ≤ 20MB</span>
        </div>
      </template>

      <el-upload
        drag
        accept=".mp3,.m4a,.wav"
        :show-file-list="false"
        :before-upload="beforePromptUpload"
        :http-request="handlePromptUpload"
        :disabled="!hasKey || uploadingPrompt"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">将示例音频拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">用于提升克隆效果，时长小于 8 秒，大小不超过 20MB</div>
        </template>
      </el-upload>

      <div v-if="uploadingPrompt" class="vc-uploading">上传中...</div>

      <div v-if="promptFileName" class="vc-file">
        <el-icon class="vc-file__icon"><Document /></el-icon>
        <span class="vc-file__name" :title="promptFileName">{{ promptFileName }}</span>
        <el-tag type="success" size="small">已上传</el-tag>
        <el-button text type="danger" :icon="Delete" @click="clearPromptFile">移除</el-button>
      </div>

      <el-form label-width="120px" label-position="right" class="vc-form">
        <el-form-item label="示例音频文本">
          <el-input
            v-model="promptText"
            placeholder="示例音频对应的文本，句末需标点（如：今天天气真不错。）"
            clearable
          />
          <div class="vc-field-tip">与示例音频内容一致，句末需以标点结尾</div>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 步骤 3：克隆配置 -->
    <el-card shadow="never" class="vc-card">
      <template #header>
        <div class="vc-card__head">
          <el-tag type="warning" size="small" effect="dark">步骤 3</el-tag>
          <span class="vc-card__title">克隆配置</span>
        </div>
      </template>

      <el-form label-width="120px" label-position="right" class="vc-form">
        <el-form-item label="voice_id" required>
          <el-input
            v-model="voiceId"
            placeholder="自定义音色 ID，如 my-voice-01"
            clearable
            @blur="touchedVoiceId = true"
            @input="touchedVoiceId = true"
          />
          <div v-if="voiceIdError" class="vc-field-error">{{ voiceIdError }}</div>
          <div v-else class="vc-field-tip">长度 8-256，首字符为英文字母，仅允许数字/字母/-/_，末位不可为 - 或 _</div>
        </el-form-item>

        <el-form-item label="试听文本">
          <el-input
            v-model="text"
            type="textarea"
            :rows="3"
            maxlength="1000"
            show-word-limit
            placeholder="可选，填写后可生成试听音频"
          />
          <div class="vc-field-tip">可选，不超过 1000 字符；填写后需选择试听模型</div>
        </el-form-item>

        <el-form-item label="试听模型">
          <el-select v-model="model" placeholder="请选择试听模型" clearable>
            <el-option v-for="m in modelOptions" :key="m" :label="m" :value="m" />
          </el-select>
          <div class="vc-field-tip">填写试听文本时需选择模型</div>
        </el-form-item>

        <el-form-item label="语种增强">
          <el-select v-model="languageBoost" placeholder="不指定" clearable>
            <el-option
              v-for="l in languageOptions"
              :key="l.value"
              :label="l.label"
              :value="l.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="降噪">
          <el-switch v-model="needNoiseReduction" />
        </el-form-item>

        <el-form-item label="音量归一">
          <el-switch v-model="needVolumeNormalization" />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="submitting"
            :disabled="!hasKey"
            :icon="CopyDocument"
            @click="handleSubmit"
          >开始克隆</el-button>
          <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 结果 -->
    <el-card v-if="demoAudio || extraInfo" shadow="never" class="vc-card">
      <template #header>
        <div class="vc-card__head">
          <el-icon class="vc-card__icon"><Promotion /></el-icon>
          <span class="vc-card__title">克隆结果</span>
        </div>
      </template>

      <div v-if="demoAudio" class="vc-result-block">
        <div class="vc-result-label">试听音频：</div>
        <AudioPlayer :src="demoAudio" filename="voice_clone_demo.mp3" />
      </div>

      <div v-if="extraInfo" class="vc-result-block">
        <div class="vc-result-label">附加信息：</div>
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item
            v-for="(val, key) in extraInfo"
            :key="key"
            :label="String(key)"
          >{{ formatValue(val) }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus/es/components/message/index'
import {
  CopyDocument, UploadFilled, Document, Delete, RefreshLeft, Promotion
} from '@element-plus/icons-vue'
import { upload } from '@/api/modules/file'
import { clone } from '@/api/modules/voiceClone'
import AudioPlayer from '@/components/AudioPlayer.vue'
import { useApiKey } from '@/composables/useApiKey'
import { SPEECH_MODEL_VALUES, LANGUAGES } from '@/constants'

// API Key 校验
const { hasKey, goSettings } = useApiKey()

// 文件大小上限 20MB
const SIZE_LIMIT = 20 * 1024 * 1024

// ===== 步骤 1：待克隆音频 =====
const uploadingClone = ref(false)
const cloneFileId = ref('')
const cloneFileName = ref('')

// ===== 步骤 2：示例音频（可选） =====
const uploadingPrompt = ref(false)
const promptAudioFileId = ref('')
const promptFileName = ref('')
const promptText = ref('')

// ===== 步骤 3：克隆配置 =====
const voiceId = ref('')
const touchedVoiceId = ref(false)
const text = ref('')
const model = ref('')
const languageBoost = ref('')
const needNoiseReduction = ref(false)
const needVolumeNormalization = ref(false)

// ===== 结果 =====
const submitting = ref(false)
const demoAudio = ref('')
const extraInfo = ref(null)

// 试听模型选项
const modelOptions = SPEECH_MODEL_VALUES

// 语种增强选项（共享常量全集）
const languageOptions = LANGUAGES

/**
 * voice_id 校验规则：
 * 长度 8-256，首字符必须英文字母，仅允许数字/字母/-/_，末位不可为 - 或 _
 */
function validateVoiceId(val) {
  if (!val) return '请输入 voice_id'
  if (val.length < 8 || val.length > 256) return '长度需在 8-256 之间'
  if (!/^[A-Za-z]/.test(val)) return '首字符必须为英文字母'
  if (!/^[A-Za-z0-9_-]+$/.test(val)) return '仅允许数字、字母、-、_'
  if (val.endsWith('-') || val.endsWith('_')) return '末位不可为 - 或 _'
  return ''
}

// voice_id 实时校验错误信息（输入或失焦后触发）
const voiceIdError = computed(() => {
  if (!touchedVoiceId.value && !voiceId.value) return ''
  return validateVoiceId(voiceId.value)
})

// 步骤条进度
const activeStep = computed(() => {
  if (!cloneFileId.value) return 0
  if (demoAudio.value) return 3
  return 1
})

// 上传前校验文件大小
function beforeCloneUpload(file) {
  if (file.size > SIZE_LIMIT) {
    ElMessage.warning('文件大小不能超过 20MB')
    return false
  }
  return true
}

function beforePromptUpload(file) {
  if (file.size > SIZE_LIMIT) {
    ElMessage.warning('文件大小不能超过 20MB')
    return false
  }
  return true
}

// 自定义上传：待克隆音频
async function handleCloneUpload(option) {
  const { file } = option
  uploadingClone.value = true
  try {
    const resp = await upload(file, 'voice_clone')
    cloneFileId.value = resp?.file?.file_id || ''
    cloneFileName.value = file.name
    ElMessage.success('待克隆音频上传成功')
    option.onSuccess(resp)
  } catch (e) {
    ElMessage.error(e?.message || '待克隆音频上传失败')
    option.onError(e)
  } finally {
    uploadingClone.value = false
  }
}

// 自定义上传：示例音频
async function handlePromptUpload(option) {
  const { file } = option
  uploadingPrompt.value = true
  try {
    const resp = await upload(file, 'prompt_audio')
    promptAudioFileId.value = resp?.file?.file_id || ''
    promptFileName.value = file.name
    ElMessage.success('示例音频上传成功')
    option.onSuccess(resp)
  } catch (e) {
    ElMessage.error(e?.message || '示例音频上传失败')
    option.onError(e)
  } finally {
    uploadingPrompt.value = false
  }
}

// 移除已上传文件
function clearCloneFile() {
  cloneFileId.value = ''
  cloneFileName.value = ''
}

function clearPromptFile() {
  promptAudioFileId.value = ''
  promptFileName.value = ''
}

// 提交克隆
async function handleSubmit() {
  // API Key 检查
  if (!hasKey.value) {
    ElMessage.warning('请先配置 API Key')
    goSettings()
    return
  }
  // 必填校验
  if (!cloneFileId.value) {
    ElMessage.warning('请先上传待克隆音频')
    return
  }
  touchedVoiceId.value = true
  if (voiceIdError.value) {
    ElMessage.warning('请修正 voice_id')
    return
  }
  // 填写试听文本时需选择模型
  if (text.value && !model.value) {
    ElMessage.warning('填写试听文本时需选择试听模型')
    return
  }
  // 上传了示例音频则需填写对应文本
  if (promptAudioFileId.value && !promptText.value.trim()) {
    ElMessage.warning('请填写示例音频对应的文本')
    return
  }

  // 组装请求参数
  const payload = {
    file_id: cloneFileId.value,
    voice_id: voiceId.value,
    need_noise_reduction: needNoiseReduction.value,
    need_volume_normalization: needVolumeNormalization.value
  }
  // 示例音频（可选）
  if (promptAudioFileId.value) {
    payload.clone_prompt = {
      prompt_audio: promptAudioFileId.value,
      prompt_text: promptText.value
    }
  }
  // 试听文本与模型（可选）
  if (text.value) {
    payload.text = text.value
    if (model.value) payload.model = model.value
  }
  // 语种增强（可选）
  if (languageBoost.value) {
    payload.language_boost = languageBoost.value
  }

  submitting.value = true
  try {
    const result = await clone(payload)
    demoAudio.value = result?.demo_audio || ''
    extraInfo.value = result?.extra_info || null
    ElMessage.success('语音克隆成功')
  } catch (e) {
    ElMessage.error(e?.message || '语音克隆失败')
  } finally {
    submitting.value = false
  }
}

// 重置全部状态
function handleReset() {
  cloneFileId.value = ''
  cloneFileName.value = ''
  promptAudioFileId.value = ''
  promptFileName.value = ''
  promptText.value = ''
  voiceId.value = ''
  touchedVoiceId.value = false
  text.value = ''
  model.value = ''
  languageBoost.value = ''
  needNoiseReduction.value = false
  needVolumeNormalization.value = false
  demoAudio.value = ''
  extraInfo.value = null
}

// 格式化 extra_info 值用于展示
function formatValue(val) {
  if (val === null || val === undefined) return '-'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}
</script>

<style scoped>
.voice-clone-page {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 页头 */
.page-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}
.page-head__icon {
  font-size: 24px;
  color: #4f46e5;
}
.page-head__title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

/* 提示条 */
.vc-alert {
  margin: 0;
}
.vc-keyalert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

/* 步骤条 */
.vc-steps {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

/* 卡片 */
.vc-card {
  border-radius: 8px;
}
.vc-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.vc-card__title {
  font-weight: 600;
  color: #303133;
}
.vc-card__hint {
  font-size: 12px;
  color: #909399;
}
.vc-card__icon {
  color: #4f46e5;
}

/* 上传区限制高度 */
.vc-card :deep(.el-upload-dragger) {
  width: 100%;
  padding: 20px;
}
.vc-card :deep(.el-upload) {
  width: 100%;
}
.vc-uploading {
  margin-top: 8px;
  font-size: 12px;
  color: #4f46e5;
}

/* 已上传文件展示 */
.vc-file {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 6px;
}
.vc-file__icon {
  color: #67c23a;
}
.vc-file__name {
  flex: 1;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 表单 */
.vc-form {
  margin-top: 8px;
}
.vc-field-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
  margin-top: 4px;
}
.vc-field-error {
  font-size: 12px;
  color: #f56c6c;
  line-height: 1.4;
  margin-top: 4px;
}

/* 结果区 */
.vc-result-block {
  margin-bottom: 16px;
}
.vc-result-block:last-child {
  margin-bottom: 0;
}
.vc-result-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
  font-weight: 600;
}

/* 移动端适配：label 顶部化与步骤条描述隐藏由 App.vue 全局规则处理 */
@media (max-width: 768px) {
  .vc-keyalert {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
