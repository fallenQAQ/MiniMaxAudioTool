<template>
  <div class="voice-mgmt-page">
    <!-- 顶部筛选区 -->
    <el-card shadow="never" class="filter-card">
      <div class="filter-bar">
        <div class="filter-item">
          <span class="filter-label">音色类型</span>
          <el-select v-model="voiceType" placeholder="请选择音色类型" class="filter-select">
            <el-option label="全部" value="all" />
            <el-option label="系统音色" value="system" />
            <el-option label="克隆音色" value="voice_cloning" />
            <el-option label="设计音色" value="voice_generation" />
          </el-select>
        </div>
        <el-button type="primary" :icon="Search" :loading="loading" @click="handleQuery">查询</el-button>
      </div>
    </el-card>

    <!-- 未配置 API Key 提示 -->
    <el-card v-if="!hasKey" shadow="never" class="empty-card">
      <el-empty description="尚未配置 API Key，无法查询音色列表">
        <el-button type="primary" plain @click="goSettings">前往设置</el-button>
      </el-empty>
    </el-card>

    <!-- 语音列表 -->
    <el-card v-else shadow="never" class="list-card">
      <el-collapse v-model="activeNames" class="voice-collapse">
        <!-- 设计音色 -->
        <el-collapse-item v-if="visiblePanels.voice_generation" name="voice_generation">
          <template #title>
            <div class="collapse-title">
              <el-icon class="collapse-title__icon"><MagicStick /></el-icon>
              <span class="collapse-title__text">设计音色</span>
              <el-tag size="small" type="info" effect="plain" round>{{ generationVoices.length }}</el-tag>
            </div>
          </template>
          <div class="table-wrap">
            <el-table :data="generationVoices" v-loading="loading" stripe size="default">
              <el-table-column prop="voice_id" label="Voice ID" min-width="200" show-overflow-tooltip />
              <el-table-column label="描述" min-width="240">
                <template #default="{ row }">{{ joinDesc(row.description) }}</template>
              </el-table-column>
              <el-table-column label="创建时间" min-width="170">
                <template #default="{ row }">{{ formatTime(row.created_time) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="180" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" :icon="CopyDocument" @click="copyId(row.voice_id)">复制ID</el-button>
                  <el-button link type="danger" :icon="Delete" @click="handleDelete('voice_generation', row.voice_id)">删除</el-button>
                </template>
              </el-table-column>
              <template #empty>
                <el-empty description="暂无设计音色" :image-size="72" />
              </template>
            </el-table>
          </div>
        </el-collapse-item>

        <!-- 克隆音色 -->
        <el-collapse-item v-if="visiblePanels.voice_cloning" name="voice_cloning">
          <template #title>
            <div class="collapse-title">
              <el-icon class="collapse-title__icon"><CopyDocument /></el-icon>
              <span class="collapse-title__text">克隆音色</span>
              <el-tag size="small" type="info" effect="plain" round>{{ cloningVoices.length }}</el-tag>
            </div>
          </template>
          <div class="table-wrap">
            <el-table :data="cloningVoices" v-loading="loading" stripe size="default">
              <el-table-column prop="voice_id" label="Voice ID" min-width="200" show-overflow-tooltip />
              <el-table-column label="描述" min-width="240">
                <template #default="{ row }">{{ joinDesc(row.description) }}</template>
              </el-table-column>
              <el-table-column label="创建时间" min-width="170">
                <template #default="{ row }">{{ formatTime(row.created_time) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="180" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" :icon="CopyDocument" @click="copyId(row.voice_id)">复制ID</el-button>
                  <el-button link type="danger" :icon="Delete" @click="handleDelete('voice_cloning', row.voice_id)">删除</el-button>
                </template>
              </el-table-column>
              <template #empty>
                <el-empty description="暂无克隆音色" :image-size="72" />
              </template>
            </el-table>
          </div>
        </el-collapse-item>

        <!-- 系统音色 -->
        <el-collapse-item v-if="visiblePanels.system" name="system">
          <template #title>
            <div class="collapse-title">
              <el-icon class="collapse-title__icon"><Microphone /></el-icon>
              <span class="collapse-title__text">系统音色</span>
              <el-tag size="small" type="info" effect="plain" round>{{ systemVoices.length }}</el-tag>
            </div>
          </template>
          <div class="table-wrap">
            <el-table :data="systemVoices" v-loading="loading" stripe size="default">
              <el-table-column prop="voice_id" label="Voice ID" min-width="200" show-overflow-tooltip />
              <el-table-column prop="voice_name" label="音色名称" min-width="140" show-overflow-tooltip />
              <el-table-column label="描述" min-width="240">
                <template #default="{ row }">{{ joinDesc(row.description) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="120" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" :icon="CopyDocument" @click="copyId(row.voice_id)">复制ID</el-button>
                </template>
              </el-table-column>
              <template #empty>
                <el-empty description="暂无系统音色" :image-size="72" />
              </template>
            </el-table>
          </div>
        </el-collapse-item>
      </el-collapse>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus/es/components/message/index'
import { ElMessageBox } from 'element-plus/es/components/message-box/index'
import { Search, Microphone, CopyDocument, MagicStick, Delete } from '@element-plus/icons-vue'
import { getVoices, deleteVoice } from '@/api'
import { useApiKey } from '@/composables/useApiKey'
import { copyText } from '@/utils/clipboard'

// API Key 校验：未配置时引导跳转设置页
const { hasKey, goSettings } = useApiKey()

// 顶部筛选条件
const voiceType = ref('all')
// 查询/删除时的加载状态
const loading = ref(false)
// 三组语音数据
const systemVoices = ref([])
const cloningVoices = ref([])
const generationVoices = ref([])
// 默认展开全部折叠面板
const activeNames = ref(['voice_generation', 'voice_cloning', 'system'])

// 按筛选类型控制面板可见性：查询"系统音色"等单一类型时隐藏无关面板
const visiblePanels = computed(() => {
  const t = voiceType.value
  return {
    voice_generation: t === 'all' || t === 'voice_generation',
    voice_cloning: t === 'all' || t === 'voice_cloning',
    system: t === 'all' || t === 'system'
  }
})

// 将 description 数组拼接为可读字符串
function joinDesc(desc) {
  if (!Array.isArray(desc) || desc.length === 0) return '—'
  return desc.join('；')
}

// 格式化创建时间（兼容秒级/毫秒级时间戳与字符串）
function formatTime(t) {
  if (!t && t !== 0) return '—'
  if (typeof t === 'number') {
    const ms = t > 1e12 ? t : t * 1000
    const d = new Date(ms)
    if (!isNaN(d.getTime())) {
      return d.toLocaleString('zh-CN', { hour12: false })
    }
  }
  return String(t)
}

// 查询语音列表
async function handleQuery() {
  if (!hasKey.value) {
    ElMessage.warning('请先配置 API Key')
    return
  }
  loading.value = true
  try {
    const data = await getVoices(voiceType.value)
    // 接口按 system_voice / voice_cloning / voice_generation 三组返回
    systemVoices.value = data.system_voice || []
    cloningVoices.value = data.voice_cloning || []
    generationVoices.value = data.voice_generation || []
  } catch (err) {
    ElMessage.error(err?.message || '查询语音列表失败')
    systemVoices.value = []
    cloningVoices.value = []
    generationVoices.value = []
  } finally {
    loading.value = false
  }
}

// 复制 voice_id 到剪贴板（工具函数内含非安全上下文降级方案）
async function copyId(voiceId) {
  await copyText(voiceId, '已复制 Voice ID')
}

// 删除音色（仅克隆音色 / 设计音色）
async function handleDelete(type, voiceId) {
  // 二次确认
  try {
    await ElMessageBox.confirm(
      `确定要删除该音色吗？\nVoice ID：${voiceId}`,
      '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
  } catch (_) {
    return // 用户取消
  }
  loading.value = true
  try {
    await deleteVoice(type, voiceId)
    ElMessage.success('删除成功')
    // 删除成功后重新查询刷新列表
    await handleQuery()
  } catch (err) {
    ElMessage.error(err?.message || '删除失败')
  } finally {
    loading.value = false
  }
}

// 进入页面若已配置 API Key 则自动查询一次
onMounted(() => {
  if (hasKey.value) handleQuery()
})
</script>

<style scoped>
.voice-mgmt-page {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 顶部筛选区 */
.filter-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.filter-label {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}
.filter-select {
  width: 200px;
}

/* 空状态卡片 */
.empty-card {
  border-radius: 8px;
}

/* 列表卡片 */
.list-card {
  border-radius: 8px;
}
.voice-collapse {
  border: none;
}
.voice-collapse :deep(.el-collapse-item__header) {
  font-weight: 600;
  font-size: 15px;
}
.voice-collapse :deep(.el-collapse-item__wrap) {
  border-bottom: 1px solid #ebeef5;
}
.voice-collapse :deep(.el-collapse-item:last-child .el-collapse-item__wrap) {
  border-bottom: none;
}

/* 折叠面板标题 */
.collapse-title {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.collapse-title__icon {
  color: #4f46e5;
  font-size: 16px;
}
.collapse-title__text {
  color: #303133;
}

/* 表格容器：移动端横向滚动 */
.table-wrap {
  width: 100%;
  overflow-x: auto;
}

/* 响应式：窄屏适配 */
@media (max-width: 768px) {
  .filter-select {
    width: 150px;
  }
  .filter-bar {
    gap: 8px;
  }
}
</style>
