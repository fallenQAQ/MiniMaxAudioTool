<template>
  <div class="audio-player">
    <audio
      v-if="audioSrc"
      ref="audioRef"
      :src="audioSrc"
      controls
      class="audio-player__audio"
    />
    <el-button
      v-if="audioSrc"
      type="primary"
      :icon="Download"
      size="small"
      @click="handleDownload"
    >
      下载
    </el-button>
  </div>
</template>

<script setup>
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { Download } from '@element-plus/icons-vue'
import { hexToObjectUrl, hexToBlob, downloadBlob, downloadUrl, mimeFromFormat } from '@/utils/audio'

const props = defineProps({
  // 已有的 objectURL（优先使用）
  src: { type: String, default: '' },
  // hex 编码的音频（与 src 二选一）
  hex: { type: String, default: '' },
  // 音频格式 mp3/wav/flac/pcm，用于推断 MIME
  format: { type: String, default: 'mp3' },
  // 下载文件名
  filename: { type: String, default: 'audio.mp3' }
})

const audioRef = ref(null)
// 由 hex 生成的 objectURL（需在卸载时释放）
const internalUrl = ref('')

const audioSrc = computed(() => props.src || internalUrl.value)

// 当 hex 变化时生成 objectURL
watch(
  () => props.hex,
  (val) => {
    // 释放旧的
    if (internalUrl.value) {
      URL.revokeObjectURL(internalUrl.value)
      internalUrl.value = ''
    }
    if (val) {
      internalUrl.value = hexToObjectUrl(val, mimeFromFormat(props.format))
    }
  },
  { immediate: true }
)

// 当传入 src 变化时，清理内部 url
watch(
  () => props.src,
  (val) => {
    if (val && internalUrl.value) {
      URL.revokeObjectURL(internalUrl.value)
      internalUrl.value = ''
    }
  }
)

function handleDownload() {
  if (props.src) {
    downloadUrl(props.src, props.filename)
    return
  }
  if (props.hex) {
    const blob = hexToBlob(props.hex, mimeFromFormat(props.format))
    downloadBlob(blob, props.filename)
  }
}

onBeforeUnmount(() => {
  if (internalUrl.value) {
    URL.revokeObjectURL(internalUrl.value)
  }
})
</script>

<style scoped>
.audio-player {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.audio-player__audio {
  width: 100%;
  max-width: 420px;
  height: 40px;
}
</style>
