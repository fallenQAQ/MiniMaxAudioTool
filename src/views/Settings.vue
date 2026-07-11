<template>
  <div class="settings-page">
    <el-card shadow="never" class="settings-card">
      <template #header>
        <div class="settings-card__header">
          <el-icon><Setting /></el-icon>
          <span>应用设置</span>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" label-position="right">
        <el-form-item label="API Key" prop="apiKey">
          <el-input
            v-model="form.apiKey"
            :type="showKey ? 'text' : 'password'"
            placeholder="请输入 MiniMax API Key"
            clearable
          >
            <template #append>
              <el-button :icon="showKey ? Hide : View" @click="showKey = !showKey" />
            </template>
          </el-input>
          <div class="settings-tip">API Key 用于所有 MiniMax 接口的鉴权，仅保存在浏览器本地。</div>
        </el-form-item>

        <el-form-item label="基础地址" prop="baseUrl">
          <el-radio-group v-model="form.baseUrl">
            <el-radio value="https://api.minimaxi.com">默认（api.minimaxi.com）</el-radio>
            <el-radio value="https://api-bj.minimaxi.com">北京备用（api-bj.minimaxi.com）</el-radio>
          </el-radio-group>
          <div class="settings-tip">如默认线路不稳定可切换北京备用地址。</div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :icon="Check" @click="handleSave">保存</el-button>
          <el-button :icon="Delete" @click="handleClear">清除</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="settings-card">
      <template #header>
        <div class="settings-card__header">
          <el-icon><InfoFilled /></el-icon>
          <span>模型说明</span>
        </div>
      </template>

      <h4 class="settings-subtitle">语音模型</h4>
      <el-descriptions :column="1" border size="small">
        <el-descriptions-item v-for="m in speechModels" :key="m.name" :label="m.name">
          {{ m.desc }}
        </el-descriptions-item>
      </el-descriptions>

      <h4 class="settings-subtitle" style="margin-top:20px">音乐模型</h4>
      <el-descriptions :column="1" border size="small">
        <el-descriptions-item v-for="m in musicModels" :key="m.name" :label="m.name">
          {{ m.desc }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Setting, Check, Delete, View, Hide, InfoFilled } from '@element-plus/icons-vue'
import { useSettingsStore } from '@/stores/settings'

const settings = useSettingsStore()
const formRef = ref(null)
const showKey = ref(false)

const form = reactive({
  apiKey: '',
  baseUrl: 'https://api.minimaxi.com'
})

const rules = {
  apiKey: [{ required: true, message: '请输入 API Key', trigger: 'blur' }]
}

// 语音模型说明
const speechModels = [
  { name: 'speech-2.8-hd', desc: '最新 HD 模型，情绪渲染融合语气词，重塑自然听感' },
  { name: 'speech-2.8-turbo', desc: '最新 Turbo 模型，极致生成速度，更自然逼真的音频效果' },
  { name: 'speech-2.6-hd', desc: 'HD 模型，韵律表现出色，极致音质与韵律表现，生成更快更自然' },
  { name: 'speech-2.6-turbo', desc: 'Turbo 模型，音质优异，超低时延，响应更灵敏' },
  { name: 'speech-02-hd', desc: '拥有出色的韵律、稳定性和复刻相似度，音质表现突出' },
  { name: 'speech-02-turbo', desc: '拥有出色的韵律和稳定性，小语种能力加强，性能表现出色' }
]

// 音乐模型说明
const musicModels = [
  { name: 'music-2.6', desc: '音乐生成主模型，支持歌词、风格提示，可生成带人声或纯音乐' },
  { name: 'music-2.6-free', desc: '音乐生成免费版，能力与 music-2.6 接近，适合体验试用' },
  { name: 'music-cover', desc: '歌曲翻唱模型，配合 music_cover_preprocess 生成的 cover_feature_id 使用' },
  { name: 'music-cover-free', desc: '歌曲翻唱免费版，能力与 music-cover 接近' }
]

onMounted(() => {
  // 从 store 加载到表单
  form.apiKey = settings.apiKey || ''
  form.baseUrl = settings.baseUrl || 'https://api.minimaxi.com'
})

async function handleSave() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch (_) {
    return
  }
  if (!form.apiKey || !form.apiKey.trim()) {
    ElMessage.warning('请先填写 API Key')
    return
  }
  settings.save(form.apiKey.trim(), form.baseUrl)
  ElMessage.success('设置已保存')
}

async function handleClear() {
  try {
    await ElMessageBox.confirm('确定要清除已保存的设置吗？', '提示', {
      type: 'warning',
      confirmButtonText: '清除',
      cancelButtonText: '取消'
    })
  } catch (_) {
    return
  }
  settings.clear()
  form.apiKey = ''
  form.baseUrl = 'https://api.minimaxi.com'
  ElMessage.success('设置已清除')
}
</script>

<style scoped>
.settings-page {
  max-width: 760px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.settings-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}
.settings-subtitle {
  margin: 0 0 10px;
  color: #303133;
  font-size: 14px;
}
.settings-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
  margin-top: 4px;
}
</style>
