<template>
  <div class="app-shell">
    <!-- 顶部标题栏 -->
    <header class="app-header">
      <div class="app-header__brand">
        <img src="./assets/logo.svg" alt="logo" class="app-header__logo" />
        <span class="app-header__title">MiniMaxAudioTool</span>
      </div>
      <div class="app-header__spacer" />
      <el-tag v-if="!settings.hasKey" type="warning" size="small" effect="light" class="app-header__warn">
        未配置 API Key
      </el-tag>
      <el-button text @click="router.push('/settings')">
        <el-icon><Setting /></el-icon>
        <span class="app-header__setting-text">设置</span>
      </el-button>
    </header>

    <div class="app-body">
      <!-- 桌面端左侧导航 -->
      <aside class="app-sidebar">
        <el-menu
          :default-active="activeMenu"
          :router="true"
          class="app-sidebar__menu"
        >
          <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
            <el-icon><component :is="iconMap[item.meta.icon]" /></el-icon>
            <span>{{ item.meta.title }}</span>
          </el-menu-item>
        </el-menu>
      </aside>

      <!-- 主内容区 -->
      <main class="app-main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>

    <!-- 移动端底部导航 -->
    <nav class="app-bottomnav">
      <router-link
        v-for="item in bottomItems"
        :key="item.path"
        :to="item.path"
        class="app-bottomnav__item"
        :class="{ 'is-active': activeMenu === item.path }"
      >
        <el-icon><component :is="iconMap[item.meta.icon]" /></el-icon>
        <span>{{ item.meta.title }}</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Microphone, Document, CopyDocument, MagicStick, Collection,
  Headset, EditPen, Setting, Menu as MenuIcon
} from '@element-plus/icons-vue'
import { useSettingsStore } from '@/stores/settings'

const route = useRoute()
const router = useRouter()
const settings = useSettingsStore()

// 路由菜单项（不含重定向）
const menuItems = [
  { path: '/tts', meta: { title: '语音合成', icon: 'Microphone' } },
  { path: '/long-tts', meta: { title: '长文本语音', icon: 'Document' } },
  { path: '/voice-clone', meta: { title: '语音克隆', icon: 'CopyDocument' } },
  { path: '/voice-design', meta: { title: '语音设计', icon: 'MagicStick' } },
  { path: '/voice-mgmt', meta: { title: '语音管理', icon: 'Collection' } },
  { path: '/music', meta: { title: '音乐生成', icon: 'Headset' } },
  { path: '/cover', meta: { title: '歌曲翻唱', icon: 'Microphone' } },
  { path: '/lyrics', meta: { title: '歌词生成', icon: 'EditPen' } },
  { path: '/settings', meta: { title: '设置', icon: 'Setting' } }
]

// 移动端底部导航：8 个功能页 + 设置（共 9 个，移动端滚动）
const bottomItems = menuItems

// 图标名 → 组件映射
const iconMap = {
  Microphone, Document, CopyDocument, MagicStick, Collection,
  Headset, EditPen, Setting, MenuIcon
}

const activeMenu = computed(() => route.path)
</script>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f5f7fa;
}

/* 顶部栏 */
.app-header {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 16px;
  background: linear-gradient(90deg, #4f46e5, #7c3aed);
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
}
.app-header__brand {
  display: flex;
  align-items: center;
  gap: 8px;
}
.app-header__logo {
  width: 28px;
  height: 28px;
}
.app-header__title {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.5px;
}
.app-header__spacer {
  flex: 1;
}
.app-header__warn {
  margin-right: 8px;
}
.app-header__setting-text {
  margin-left: 4px;
}
.app-header :deep(.el-button) {
  color: #fff;
}

/* 主体 */
.app-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 桌面侧边栏 */
.app-sidebar {
  width: 200px;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  overflow-y: auto;
  flex-shrink: 0;
}
.app-sidebar__menu {
  border-right: none;
}

/* 主内容 */
.app-main {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

/* 移动端底部导航默认隐藏 */
.app-bottomnav {
  display: none;
}

/* 响应式：窄屏隐藏侧边栏，显示底部导航 */
@media (max-width: 768px) {
  .app-sidebar {
    display: none;
  }
  .app-header__title {
    font-size: 16px;
  }
  .app-main {
    padding: 12px;
    padding-bottom: 64px;
  }
  .app-bottomnav {
    display: flex;
    overflow-x: auto;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 56px;
    background: #fff;
    border-top: 1px solid #e4e7ed;
    z-index: 100;
    -webkit-overflow-scrolling: touch;
  }
  .app-bottomnav__item {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 64px;
    padding: 4px 8px;
    color: #606266;
    font-size: 11px;
    text-decoration: none;
    gap: 2px;
  }
  .app-bottomnav__item.is-active {
    color: #4f46e5;
  }
  .app-bottomnav__item .el-icon {
    font-size: 18px;
  }
}

/* 路由切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
