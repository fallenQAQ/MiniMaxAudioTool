<template>
  <div class="cover-page">
    <!-- 步骤指示器 -->
    <el-steps :active="activeStep" finish-status="success" align-center class="cover-steps">
      <el-step title="翻唱前处理" description="上传参考音频，提取翻唱特征" />
      <el-step title="生成翻唱" description="设置风格与歌词，生成翻唱音频" />
    </el-steps>

    <!-- 未配置 API Key 提示 -->
    <el-alert
      v-if="!hasKey"
      title="未检测到 API Key"
      type="warning"
      show-icon
      :closable="false"
      class="cover-alert"
    >
      <template #default>
        使用翻唱功能前请先配置 API Key。
        <el-button type="primary" link @click="goSettings">前往设置</el-button>
      </template>
    </el-alert>

    <!-- 步骤一：翻唱前处理 -->
    <el-card shadow="never" class="cover-card">
      <template #header>
        <div class="cover-card__header">
          <el-icon><Microphone /></el-icon>
          <span>步骤一 · 翻唱前处理</span>
        </div>
      </template>

      <el-form label-width="130px" label-position="right">
        <el-form-item label="参考音频">
          <div class="upload-wrapper">
            <el-upload
              ref="uploadRef"
              :auto-upload="false"
              :limit="1"
              :on-change="handleFileChange"
              :on-remove="handleFileRemove"
              :on-exceed="handleExceed"
              accept=".mp3,.wav,.flac,.m4a,.aac,.ogg"
              :file-list="fileList"
            >
              <el-button type="primary" :icon="UploadFilled" :disabled="!hasKey">
                选择参考音频
              </el-button>
              <template #tip>
                <div class="upload-tip">
                  支持 mp3 / wav / flac / m4a / aac / ogg 格式，单文件 ≤ 50MB；音频时长需 6 秒至 6 分钟。
                </div>
              </template>
            </el-upload>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="preprocessLoading"
            :disabled="!selectedFile || !hasKey"
            @click="handlePreprocess"
          >
            开始预处理
          </el-button>
          <el-button v-if="preprocessDone" :icon="RefreshLeft" @click="resetPreprocess">
            重置
          </el-button>
        </el-form-item>

        <!-- 预处理结果 -->
        <template v-if="preprocessResult">
          <el-divider content-position="left">预处理结果</el-divider>

          <el-form-item label="cover_feature_id">
            <div class="feature-id-row">
              <el-input :model-value="preprocessResult.cover_feature_id" readonly>
                <template #append>
                  <el-button :icon="CopyDocument" @click="copyFeatureId" />
                </template>
              </el-input>
            </div>
            <div class="field-tip">该特征 ID 有效期 24 小时，请尽快用于步骤二生成翻唱。</div>
          </el-form-item>

          <el-form-item label="音频时长">
            <el-tag type="info">
              {{ formatDuration(preprocessResult.audio_duration * 1000) }}
              <span class="tag-raw">（{{ preprocessResult.audio_duration }} 秒）</span>
            </el-tag>
          </el-form-item>

          <el-form-item label="结构信息">
            <el-collapse>
              <el-collapse-item title="查看 structure_result（JSON）">
                <pre class="json-preview">{{ structureJsonText }}</pre>
              </el-collapse-item>
            </el-collapse>
          </el-form-item>
        </template>
      </el-form>
    </el-card>

    <!-- 步骤二：生成翻唱 -->
    <el-card shadow="never" class="cover-card">
      <template #header>
        <div class="cover-card__header">
          <el-icon><Headset /></el-icon>
          <span>步骤二 · 生成翻唱</span>
          <el-tag v-if="preprocessDone" type="success" size="small" effect="plain">已就绪</el-tag>
          <el-tag v-else type="info" size="small" effect="plain">请先完成步骤一</el-tag>
        </div>
      </template>

      <el-form label-width="130px" label-position="right">
        <el-form-item label="模型">
          <el-select v-model="genForm.model" :disabled="!preprocessDone" class="model-select">
            <el-option
              v-for="m in modelOptions"
              :key="m.value"
              :label="m.label"
              :value="m.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="翻唱风格">
          <el-input
            v-model="genForm.prompt"
            type="textarea"
            :rows="3"
            maxlength="300"
            show-word-limit
            placeholder="描述目标翻唱风格，例如：用温柔女声翻唱，加入钢琴伴奏，节奏放缓"
            :disabled="!preprocessDone"
          />
          <div class="field-tip">必填，10 - 300 字符。</div>
        </el-form-item>

        <el-form-item label="歌词">
          <el-input
            v-model="genForm.lyrics"
            type="textarea"
            :rows="8"
            maxlength="1000"
            show-word-limit
            placeholder="歌词内容（默认填入预处理返回的格式化歌词，可编辑）"
            :disabled="!preprocessDone"
          />
          <div class="field-tip">10 - 1000 字符，可基于预处理返回的歌词编辑。</div>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="generateLoading"
            :disabled="!preprocessDone || !hasKey"
            @click="handleGenerate"
          >
            生成翻唱
          </el-button>
        </el-form-item>

        <!-- 生成结果 -->
        <template v-if="audioHex">
          <el-divider content-position="left">生成结果</el-divider>

          <el-form-item label="音频播放">
            <!-- AudioPlayer 内部通过 hexToObjectUrl 将 hex 转为可播放/下载的 objectURL -->
            <AudioPlayer :hex="audioHex" format="mp3" filename="cover.mp3" />
          </el-form-item>

          <el-form-item v-if="extraInfo" label="附加信息">
            <el-descriptions :column="descColumn" border size="small">
              <el-descriptions-item label="音频时长">
                {{ extraInfo.music_duration != null ? formatDuration(extraInfo.music_duration) : '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="使用模型">
                {{ genForm.model }}
              </el-descriptions-item>
            </el-descriptions>
            <el-collapse class="extra-collapse">
              <el-collapse-item title="查看完整 extra_info（JSON）">
                <pre class="json-preview">{{ extraInfoJsonText }}</pre>
              </el-collapse-item>
            </el-collapse>
          </el-form-item>
        </template>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus/es/components/message/index'
import {
  Microphone,
  Headset,
  UploadFilled,
  CopyDocument,
  RefreshLeft
} from '@element-plus/icons-vue'
import AudioPlayer from '@/components/AudioPlayer.vue'
import { preprocess } from '@/api/modules/cover'
import { generate } from '@/api/modules/music'
import { fileToBase64, formatDuration } from '@/utils/audio'
import { copyText } from '@/utils/clipboard'
import { useApiKey } from '@/composables/useApiKey'
import { useViewport } from '@/composables/useViewport'
import { COVER_MODELS } from '@/constants'

// API Key 校验
const { hasKey, goSettings } = useApiKey()

// 附加信息描述列表列数：桌面 2 列，移动 1 列
const { width: winWidth } = useViewport()
const descColumn = computed(() => (winWidth.value < 768 ? 1 : 2))

// 当前激活步骤（0=步骤一，1=步骤二）
const activeStep = ref(0)

// 翻唱模型选项（共享常量）
const modelOptions = COVER_MODELS

// ============================ 步骤一：翻唱前处理 ============================
const uploadRef = ref(null)
const fileList = ref([])
const selectedFile = ref(null)
const preprocessLoading = ref(false)
const preprocessResult = ref(null)

// 文件大小上限：50MB
const MAX_SIZE = 50 * 1024 * 1024

// 预处理是否完成（拿到 cover_feature_id 即视为成功）
const preprocessDone = computed(
  () => Boolean(preprocessResult.value && preprocessResult.value.cover_feature_id)
)

// structure_result 格式化展示
const structureJsonText = computed(() => {
  const s = preprocessResult.value?.structure_result
  if (s == null || s === '') return '-'
  try {
    return typeof s === 'string' ? JSON.stringify(JSON.parse(s), null, 2) : JSON.stringify(s, null, 2)
  } catch (_) {
    return String(s)
  }
})

/**
 * 文件选择变化处理：校验大小并记录选中文件
 */
function handleFileChange(file, files) {
  // 校验大小
  if (file.size > MAX_SIZE) {
    ElMessage.warning(`文件 ${file.name} 超过 50MB，请选择更小的音频文件`)
    // 清空上传组件中的超限文件
    fileList.value = []
    selectedFile.value = null
    uploadRef.value?.clearFiles()
    return
  }
  fileList.value = files
  selectedFile.value = file.raw
}

/**
 * 移除文件处理
 */
function handleFileRemove(_file, files) {
  fileList.value = files
  selectedFile.value = files.length ? files[0].raw : null
  // 移除参考音频后清除已有预处理结果
  preprocessResult.value = null
  activeStep.value = 0
}

/**
 * 超出数量限制
 */
function handleExceed() {
  ElMessage.warning('只能上传一个参考音频，请先移除当前文件')
}

/**
 * 执行翻唱前处理
 */
async function handlePreprocess() {
  if (!hasKey.value) {
    ElMessage.error('请先配置 API Key')
    return
  }
  if (!selectedFile.value) {
    ElMessage.warning('请先选择参考音频')
    return
  }

  preprocessLoading.value = true
  try {
    // 文件转 base64（纯 base64，不含 data: 前缀）
    const base64 = await fileToBase64(selectedFile.value)
    // 调用翻唱前处理接口
    const data = await preprocess({
      model: 'music-cover',
      audio_base64: base64
    })
    if (!data || !data.cover_feature_id) {
      ElMessage.error('预处理返回数据异常，未获取到 cover_feature_id')
      return
    }
    preprocessResult.value = data
    // 将格式化歌词填入步骤二歌词编辑框
    if (data.formatted_lyrics) {
      genForm.lyrics = data.formatted_lyrics
    }
    activeStep.value = 1
    ElMessage.success('预处理完成')
  } catch (err) {
    ElMessage.error(err?.message || '预处理失败，请重试')
  } finally {
    preprocessLoading.value = false
  }
}

/**
 * 复制 cover_feature_id 到剪贴板
 */
async function copyFeatureId() {
  const id = preprocessResult.value?.cover_feature_id
  if (!id) return
  await copyText(id, '已复制 cover_feature_id')
}

/**
 * 重置预处理状态
 */
function resetPreprocess() {
  preprocessResult.value = null
  fileList.value = []
  selectedFile.value = null
  genForm.lyrics = ''
  activeStep.value = 0
  uploadRef.value?.clearFiles()
}

// ============================ 步骤二：生成翻唱 ============================
const genForm = reactive({
  model: 'music-cover',
  prompt: '',
  lyrics: ''
})
const generateLoading = ref(false)
const audioHex = ref('')
const extraInfo = ref(null)

// extra_info 完整 JSON 展示
const extraInfoJsonText = computed(() => {
  if (!extraInfo.value) return '-'
  try {
    return JSON.stringify(extraInfo.value, null, 2)
  } catch (_) {
    return String(extraInfo.value)
  }
})

/**
 * 执行翻唱生成
 */
async function handleGenerate() {
  if (!hasKey.value) {
    ElMessage.error('请先配置 API Key')
    return
  }
  if (!preprocessDone.value) {
    ElMessage.warning('请先完成步骤一预处理')
    return
  }

  // 校验翻唱风格描述
  const prompt = genForm.prompt.trim()
  if (prompt.length < 10 || prompt.length > 300) {
    ElMessage.error('翻唱风格描述需 10 - 300 字符')
    return
  }
  // 校验歌词
  const lyrics = genForm.lyrics.trim()
  if (lyrics.length < 10 || lyrics.length > 1000) {
    ElMessage.error('歌词需 10 - 1000 字符')
    return
  }

  generateLoading.value = true
  try {
    // 调用音乐生成接口（翻唱模式）
    const result = await generate({
      model: genForm.model,
      prompt,
      lyrics,
      cover_feature_id: preprocessResult.value.cover_feature_id,
      output_format: 'hex'
    })
    // result 结构: { data: { audio: '<hex>', status: 2 }, extra_info: { ... } }
    const hex = result?.data?.audio
    if (!hex) {
      ElMessage.error('未获取到音频数据')
      return
    }
    // AudioPlayer 接收 hex 后内部调用 hexToObjectUrl 转为可播放/下载的 objectURL
    audioHex.value = hex
    extraInfo.value = result?.extra_info || null
    ElMessage.success('翻唱生成完成')
  } catch (err) {
    ElMessage.error(err?.message || '生成失败，请重试')
  } finally {
    generateLoading.value = false
  }
}
</script>

<style scoped>
.cover-page {
  max-width: 860px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.cover-steps {
  margin-bottom: 4px;
}
.cover-alert {
  margin-bottom: 0;
}
.cover-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}
.upload-wrapper {
  width: 100%;
}
/* 模型下拉：桌面限宽 280px，窄屏自动收缩占满 */
.model-select {
  width: 100%;
  max-width: 280px;
}
.upload-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
  margin-top: 6px;
}
.field-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
  margin-top: 4px;
}
.feature-id-row {
  width: 100%;
}
.tag-raw {
  font-size: 12px;
  opacity: 0.7;
  margin-left: 4px;
}
.extra-collapse {
  margin-top: 8px;
}
.json-preview {
  background: #f5f7fa;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 12px;
  margin: 0;
  font-size: 12px;
  color: #303133;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 320px;
  overflow: auto;
}
/* 移动端表单 label 顶部化与步骤条描述隐藏由 App.vue 全局规则处理 */
</style>
