<template>
  <div class="stub-view">
    <div class="stub-view__head">
      <el-icon v-if="icon" class="stub-view__icon"><component :is="icon" /></el-icon>
      <h2 class="stub-view__title">{{ title }}</h2>
    </div>
    <el-card shadow="never" class="stub-view__card">
      <el-empty :description="description">
        <template #image>
          <el-icon :size="64" color="#c0c4cc"><Loading /></el-icon>
        </template>
        <el-button v-if="showSettingsHint" type="primary" plain @click="goSettings">
          前往设置 API Key
        </el-button>
      </el-empty>
    </el-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Loading } from '@element-plus/icons-vue'
import { useSettingsStore } from '@/stores/settings'

const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '此功能开发中' },
  icon: { type: [Object, Function], default: null }
})

const router = useRouter()
const settings = useSettingsStore()
const showSettingsHint = computed(() => !settings.hasKey)

function goSettings() {
  router.push('/settings')
}
</script>

<style scoped>
.stub-view {
  max-width: 960px;
  margin: 0 auto;
}
.stub-view__head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}
.stub-view__icon {
  font-size: 24px;
  color: #4f46e5;
}
.stub-view__title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}
.stub-view__card {
  border-radius: 8px;
}
</style>
