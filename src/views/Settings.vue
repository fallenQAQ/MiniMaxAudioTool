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
import { ElMessage } from 'element-plus/es/components/message/index'
import { ElMessageBox } from 'element-plus/es/components/message-box/index'
import { Setting, Check, Delete, View, Hide, InfoFilled } from '@element-plus/icons-vue'
import { useSettingsStore } from '@/stores/settings'
import { SPEECH_MODEL_DOCS, MUSIC_MODEL_DOCS } from '@/constants'

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

// 模型说明（共享常量）
const speechModels = SPEECH_MODEL_DOCS
const musicModels = MUSIC_MODEL_DOCS

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
