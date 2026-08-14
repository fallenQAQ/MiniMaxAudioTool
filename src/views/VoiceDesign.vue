<template>
  <div class="voice-design-page">
    <el-row :gutter="16">
      <!-- 左侧：设计表单 -->
      <el-col :xs="24" :md="12">
        <el-card shadow="never" class="vd-card">
          <template #header>
            <div class="vd-card__header">
              <el-icon><MagicStick /></el-icon>
              <span>语音设计</span>
            </div>
          </template>

          <!-- 保留提示 -->
          <el-alert
            type="warning"
            :closable="false"
            show-icon
            title="该音色 7 天内需在语音合成中正式调用一次以永久保留，否则将被删除"
            class="vd-alert"
          />

          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-position="top"
            @submit.prevent
          >
            <el-form-item label="音色描述" prop="prompt">
              <el-input
                v-model="form.prompt"
                type="textarea"
                :rows="5"
                placeholder="例如：讲述悬疑故事的播音员，声音低沉富有磁性，语速时快时慢，营造紧张神秘的氛围"
              />
            </el-form-item>

            <el-form-item label="试听文本" prop="preview_text">
              <el-input
                v-model="form.preview_text"
                type="textarea"
                :rows="4"
                placeholder="请输入用于试听的文本内容"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="自定义 voice_id（可选）" prop="voice_id">
              <el-input
                v-model="form.voice_id"
                placeholder="留空则由系统自动生成"
                clearable
              />
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                :icon="MagicStick"
                :loading="loading"
                :disabled="loading"
                @click="handleSubmit"
              >
                {{ loading ? '生成中...' : '生成音色' }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 右侧：生成结果 -->
      <el-col :xs="24" :md="12">
        <el-card shadow="never" class="vd-card">
          <template #header>
            <div class="vd-card__header">
              <el-icon><Headset /></el-icon>
              <span>生成结果</span>
            </div>
          </template>

          <!-- 空状态 -->
          <el-empty v-if="!result" description="尚未生成音色" />

          <!-- 结果展示 -->
          <div v-else class="vd-result">
            <el-form label-position="top">
              <el-form-item label="音色 ID（voice_id）">
                <el-input :model-value="result.voice_id" readonly>
                  <template #append>
                    <el-button :icon="CopyDocument" @click="handleCopy" />
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item label="试听音频">
                <AudioPlayer :src="audioUrl" filename="voice-design-trial.mp3" />
              </el-form-item>
            </el-form>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus/es/components/message/index'
import { MagicStick, Headset, CopyDocument } from '@element-plus/icons-vue'
import { design } from '@/api/modules/voiceDesign'
import { useApiKey } from '@/composables/useApiKey'
import { hexToObjectUrl } from '@/utils/audio'
import { copyText } from '@/utils/clipboard'
import AudioPlayer from '@/components/AudioPlayer.vue'

// API Key 校验
const { hasKey } = useApiKey()

const formRef = ref(null)
const loading = ref(false)
const result = ref(null)
const audioUrl = ref('')

// 表单数据
const form = reactive({
  prompt: '',
  preview_text: '',
  voice_id: ''
})

// 校验规则
const rules = {
  prompt: [{ required: true, message: '请输入音色描述', trigger: 'blur' }],
  preview_text: [{ required: true, message: '请输入试听文本', trigger: 'blur' }]
}

// 释放已有的 objectURL
function revokeAudioUrl() {
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value)
    audioUrl.value = ''
  }
}

// 复制 voice_id 到剪贴板
async function handleCopy() {
  if (!result.value || !result.value.voice_id) return
  await copyText(result.value.voice_id, '音色 ID 已复制到剪贴板')
}

// 提交语音设计
async function handleSubmit() {
  // API Key 校验
  if (!hasKey.value) {
    ElMessage.error('请先在设置页配置 API Key')
    return
  }

  // 表单校验
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch (_) {
    return
  }

  // 禁用重复提交
  if (loading.value) return
  loading.value = true

  try {
    // 组装参数（voice_id 留空则不传，由系统自动生成）
    const payload = {
      prompt: form.prompt.trim(),
      preview_text: form.preview_text.trim()
    }
    if (form.voice_id && form.voice_id.trim()) {
      payload.voice_id = form.voice_id.trim()
    }

    const data = await design(payload)
    result.value = data

    // 释放旧 URL，生成新的试听音频 URL
    revokeAudioUrl()
    if (data.trial_audio) {
      audioUrl.value = hexToObjectUrl(data.trial_audio, 'audio/mp3')
    }

    ElMessage.success('音色生成成功')
  } catch (err) {
    ElMessage.error(err?.message || '语音设计失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 组件卸载时释放 objectURL，避免内存泄漏
onBeforeUnmount(() => {
  revokeAudioUrl()
})
</script>

<style scoped>
.voice-design-page {
  max-width: 1200px;
  margin: 0 auto;
}
.vd-card {
  height: 100%;
}
.vd-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}
.vd-alert {
  margin-bottom: 16px;
}
.vd-result {
  display: flex;
  flex-direction: column;
}
</style>
