<template>
  <div class="lyrics-page">
    <!-- 页面标题 -->
    <div class="lyrics-page__head">
      <el-icon class="lyrics-page__icon"><EditPen /></el-icon>
      <h2 class="lyrics-page__title">歌词生成</h2>
    </div>

    <!-- 未配置 API Key 提示 -->
    <el-alert
      v-if="!hasKey"
      title="尚未配置 API Key，无法调用接口"
      type="warning"
      show-icon
      :closable="false"
      class="lyrics-page__alert"
    >
      <el-button type="primary" size="small" @click="goSettings">前往设置</el-button>
    </el-alert>

    <el-row :gutter="16">
      <!-- 左：表单 -->
      <el-col :xs="24" :md="12">
        <el-card shadow="never" class="lyrics-card">
          <template #header>
            <div class="lyrics-card__header">
              <el-icon><EditPen /></el-icon>
              <span>生成配置</span>
            </div>
          </template>

          <el-form label-position="top" :model="form">
            <!-- 模式切换 -->
            <el-form-item label="生成模式">
              <el-radio-group v-model="form.mode">
                <el-radio value="write_full_song">写完整歌曲</el-radio>
                <el-radio value="edit">编辑 / 续写</el-radio>
              </el-radio-group>
            </el-form-item>

            <!-- 提示词 -->
            <el-form-item label="提示词">
              <el-input
                v-model="form.prompt"
                type="textarea"
                :rows="4"
                :maxlength="2000"
                show-word-limit
                :placeholder="
                  form.mode === 'write_full_song'
                    ? '描述主题/风格，为空时将随机生成'
                    : '描述编辑方向或续写指令'
                "
              />
            </el-form-item>

            <!-- 现有歌词（仅 edit 模式） -->
            <el-form-item v-if="form.mode === 'edit'" label="现有歌词">
              <el-input
                v-model="form.lyrics"
                type="textarea"
                :rows="8"
                :maxlength="3500"
                show-word-limit
                placeholder="粘贴需要编辑或续写的现有歌词"
              />
            </el-form-item>

            <!-- 歌曲标题（可选） -->
            <el-form-item label="歌曲标题（可选）">
              <el-input
                v-model="form.title"
                placeholder="可留空，由模型自动命名"
                clearable
              />
            </el-form-item>

            <!-- 生成按钮 -->
            <el-form-item>
              <el-button
                type="primary"
                :icon="MagicStick"
                :loading="loading"
                :disabled="!hasKey"
                @click="handleGenerate"
              >
                生成歌词
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 右：结果 -->
      <el-col :xs="24" :md="12">
        <el-card shadow="never" class="lyrics-card">
          <template #header>
            <div class="lyrics-card__header">
              <el-icon><Document /></el-icon>
              <span>生成结果</span>
            </div>
          </template>

          <!-- 空状态 -->
          <el-empty v-if="!result" description="尚未生成歌词" />

          <!-- 结果内容 -->
          <div v-else class="lyrics-result">
            <!-- 歌曲标题 -->
            <div class="lyrics-result__field">
              <div class="lyrics-result__label">歌曲标题</div>
              <el-input :model-value="result.song_title || '（未命名）'" readonly>
                <template #prepend><el-icon><Star /></el-icon></template>
              </el-input>
            </div>

            <!-- 风格标签 -->
            <div class="lyrics-result__field">
              <div class="lyrics-result__label">风格标签</div>
              <div class="lyrics-result__tags">
                <el-tag
                  v-for="(tag, i) in styleTagList"
                  :key="i"
                  type="info"
                  effect="light"
                  class="lyrics-result__tag"
                >
                  {{ tag }}
                </el-tag>
                <span v-if="styleTagList.length === 0" class="lyrics-result__empty">（无）</span>
              </div>
            </div>

            <!-- 歌词正文 -->
            <div class="lyrics-result__field">
              <div class="lyrics-result__label">歌词</div>
              <el-input
                :model-value="result.lyrics || ''"
                type="textarea"
                :rows="14"
                readonly
                resize="vertical"
              />
            </div>

            <!-- 操作按钮 -->
            <div class="lyrics-result__actions">
              <el-button :icon="CopyDocument" @click="handleCopy">复制歌词</el-button>
              <el-button type="success" :icon="Headset" @click="handleGotoMusic">
                一键去音乐生成
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { ElMessage } from 'element-plus/es/components/message/index'
import {
  EditPen, MagicStick, Document, CopyDocument, Headset, Star
} from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { generate } from '@/api/modules/lyrics'
import { useApiKey } from '@/composables/useApiKey'
import { copyText } from '@/utils/clipboard'

const router = useRouter()
const { hasKey, goSettings } = useApiKey()

// 表单状态
const form = reactive({
  mode: 'write_full_song', // 生成模式：write_full_song | edit
  prompt: '', // 提示词
  lyrics: '', // 现有歌词（edit 模式）
  title: '' // 歌曲标题（可选）
})

// 加载状态
const loading = ref(false)

// 生成结果
const result = ref(null)

// 风格标签列表：兼容数组或逗号分隔字符串
const styleTagList = computed(() => {
  if (!result.value || !result.value.style_tags) return []
  const tags = result.value.style_tags
  if (Array.isArray(tags)) {
    return tags.map((t) => String(t).trim()).filter(Boolean)
  }
  if (typeof tags === 'string') {
    return tags.split(/[,，]/).map((t) => t.trim()).filter(Boolean)
  }
  return []
})

/**
 * 生成歌词
 */
async function handleGenerate() {
  // API Key 校验
  if (!hasKey.value) {
    ElMessage.error('请先配置 API Key')
    goSettings()
    return
  }

  // edit 模式必须提供现有歌词
  if (form.mode === 'edit' && !form.lyrics.trim()) {
    ElMessage.error('编辑模式下请提供现有歌词')
    return
  }

  loading.value = true
  try {
    // 组装请求参数
    const payload = {
      mode: form.mode,
      prompt: form.prompt
    }
    if (form.mode === 'edit') {
      payload.lyrics = form.lyrics
    }
    if (form.title && form.title.trim()) {
      payload.title = form.title.trim()
    }

    const data = await generate(payload)
    result.value = data
    ElMessage.success('歌词生成成功')
  } catch (err) {
    ElMessage.error(err?.message || '歌词生成失败，请重试')
  } finally {
    loading.value = false
  }
}

/**
 * 复制歌词到剪贴板
 */
async function handleCopy() {
  if (!result.value || !result.value.lyrics) {
    ElMessage.warning('暂无歌词可复制')
    return
  }
  await copyText(result.value.lyrics, '歌词已复制到剪贴板')
}

/**
 * 跳转到音乐生成页，并通过 sessionStorage 预填歌词
 */
function handleGotoMusic() {
  if (!result.value || !result.value.lyrics) {
    ElMessage.warning('暂无歌词可带入')
    return
  }
  sessionStorage.setItem('minimax_prefill_lyrics', result.value.lyrics)
  router.push('/music')
}
</script>

<style scoped>
.lyrics-page {
  max-width: 1200px;
  margin: 0 auto;
}
.lyrics-page__head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}
.lyrics-page__icon {
  font-size: 24px;
  color: #4f46e5;
}
.lyrics-page__title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}
.lyrics-page__alert {
  margin-bottom: 16px;
}
.lyrics-card {
  border-radius: 8px;
}
.lyrics-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}
.lyrics-result {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.lyrics-result__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.lyrics-result__label {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
}
.lyrics-result__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.lyrics-result__tag {
  border-radius: 4px;
}
.lyrics-result__empty {
  font-size: 12px;
  color: #909399;
}
.lyrics-result__actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 4px;
}

/* 移动端：左右栏堆叠时增加垂直间距 */
@media (max-width: 768px) {
  .lyrics-page :deep(.el-col + .el-col) {
    margin-top: 16px;
  }
}
</style>
