import { createRouter, createWebHashHistory } from 'vue-router'

// 路由表：10 个路由，/ 重定向到 /tts
export const routes = [
  { path: '/', redirect: '/tts' },
  {
    path: '/tts',
    name: 'tts',
    component: () => import('@/views/Tts.vue'),
    meta: { title: '语音合成', icon: 'Microphone' }
  },
  {
    path: '/long-tts',
    name: 'long-tts',
    component: () => import('@/views/LongTts.vue'),
    meta: { title: '长文本语音', icon: 'Document' }
  },
  {
    path: '/voice-clone',
    name: 'voice-clone',
    component: () => import('@/views/VoiceClone.vue'),
    meta: { title: '语音克隆', icon: 'CopyDocument' }
  },
  {
    path: '/voice-design',
    name: 'voice-design',
    component: () => import('@/views/VoiceDesign.vue'),
    meta: { title: '语音设计', icon: 'MagicStick' }
  },
  {
    path: '/voice-mgmt',
    name: 'voice-mgmt',
    component: () => import('@/views/VoiceMgmt.vue'),
    meta: { title: '语音管理', icon: 'Collection' }
  },
  {
    path: '/music',
    name: 'music',
    component: () => import('@/views/Music.vue'),
    meta: { title: '音乐生成', icon: 'Headset' }
  },
  {
    path: '/cover',
    name: 'cover',
    component: () => import('@/views/Cover.vue'),
    meta: { title: '歌曲翻唱', icon: 'Microphone' }
  },
  {
    path: '/lyrics',
    name: 'lyrics',
    component: () => import('@/views/Lyrics.vue'),
    meta: { title: '歌词生成', icon: 'EditPen' }
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/Settings.vue'),
    meta: { title: '设置', icon: 'Setting' }
  }
]

const router = createRouter({
  // 使用 hash 模式，便于静态托管无需服务端配置
  history: createWebHashHistory(),
  routes
})

// 路由切换后同步浏览器标签标题
router.afterEach((to) => {
  document.title = to.meta?.title
    ? `${to.meta.title} · MiniMaxAudioTool`
    : 'MiniMaxAudioTool'
})

export default router
