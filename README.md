# MiniMaxAudioTool

> 本地运行的纯前端 Web 应用，集成 MiniMax 语音与音乐大模型能力，支持桌面 / 移动端 PWA 安装。无服务器、无后端，浏览器直连 MiniMax 开放平台 API。

## 项目简介

MiniMaxAudioTool 是一个基于 Vue 3 + Vite 的纯前端工具集，将 MiniMax 开放平台的语音合成、语音克隆、音乐生成等能力封装为友好的 Web 界面。所有 API Key 仅保存在浏览器本地（localStorage），应用本身不部署任何服务端，仅与 MiniMax 官方 API 交互。支持作为 PWA 安装到桌面 / 移动端主屏，壳页面可离线加载。

## 功能列表

应用共包含 9 大功能模块：

| # | 功能 | 路由 | 说明 |
|---|------|------|------|
| 1 | 语音合成 | `/tts` | 文本转语音，支持音色 / 语速 / 音量 / 音调调节 |
| 2 | 长文本语音 | `/long-tts` | 长文本异步合成，支持多并发与轮询查询 |
| 3 | 语音克隆 | `/voice-clone` | 上传音频复刻自定义音色 |
| 4 | 语音设计 | `/voice-design` | 通过文本描述生成自定义音色 |
| 5 | 语音管理 | `/voice-mgmt` | 管理已创建的自定义音色 |
| 6 | 音乐生成 | `/music` | 根据主题 / 歌词生成原创音乐 |
| 7 | 歌曲翻唱 | `/cover` | 上传音频生成翻唱版本 |
| 8 | 歌词生成 | `/lyrics` | AI 辅助歌词创作 |
| 9 | 设置 | `/settings` | 配置 API Key 与基础地址 |

## 快速开始

### 环境要求

- **Node.js 18+**（推荐 20 LTS）
- npm（随 Node.js 安装）

### 安装

```bash
npm install
```

### 启动开发服务器

```bash
# 方式一：直接启动
npm run dev

# 方式二：一键脚本（Windows PowerShell，自动检查环境与依赖）
powershell -ExecutionPolicy Bypass -File .\run.ps1

# 方式三：Linux / macOS
bash run.sh
```

启动后访问 http://localhost:5173

> Windows 环境下若直接执行 `npm` 因 PowerShell 执行策略失败，请改用 `npm.cmd` 或通过上述脚本启动。

### 构建生产版本

```bash
npm run build      # 输出到 dist/，含 PWA Service Worker
npm run preview    # 本地预览生产构建
```

`dist/` 为纯静态产物，可托管于任意静态文件服务（Nginx、Vercel、Netlify、GitHub Pages 等），无需服务端运行时。

## API Key 获取与配置

1. **获取 Key**：前往 [MiniMax 开放平台](https://platform.minimaxi.com) 注册账号，在控制台创建 API Key。
2. **配置 Key**：启动应用后进入「设置」页，填入 API Key 并保存。Key 仅保存在当前浏览器的 localStorage 中，不会上传到任何服务器。
3. **基础地址**：设置页可切换默认基础地址与北京备用基础地址，以适配网络环境。

## CORS 说明

本应用为纯前端，浏览器直接请求 MiniMax API。

- **开发模式**：Vite 已配置 `/minimax` 前缀的开发代理（转发到 `https://api.minimaxi.com`）作为 CORS 兜底，开发调试无需额外配置。
- **生产模式**：浏览器直连 MiniMax 官方 API。若所用浏览器 / 区域遇到 CORS 限制，可自行部署一层反向代理（如 Nginx）转发请求，并在「设置」页将基础地址指向代理地址。

## 各功能使用简述

### 1. 语音合成（TTS）
输入文本（最长 10000 字）选择音色即可合成语音，支持调节语速（0.5–2.0）、音量（0–10）、音调（-12–+12），结果可直接试听与下载。

### 2. 长文本语音（Long TTS）
适用于超长文本（最长 50000 字）的异步合成任务。提交后系统轮询查询进度，完成后返回音频下载链接，**下载链接 9 小时内有效**，请及时保存。

### 3. 语音克隆（Voice Clone）
上传待克隆音频（时长 10 秒 – 5 分钟，≤ 20MB，支持 mp3/m4a/wav），可选上传示例音频（< 8 秒）提升效果。**使用克隆功能需完成账户个人 / 企业认证**。复刻生成的音色 **7 天内需在语音合成中正式调用一次以永久保留**，否则将被删除。自定义音色 ID 命名规则：长度 8–256，首字符为英文字母，仅允许数字 / 字母 / `-` / `_`，末位不可为 `-` 或 `_`。

### 4. 语音设计（Voice Design）
通过文本描述（最长 500 字）自动生成自定义音色。生成的音色同样遵循 **7 天内需正式调用一次以永久保留** 的规则。

### 5. 语音管理（Voice Mgmt）
集中查看与管理已创建的自定义音色（克隆 / 设计），可查看音色 ID、创建时间等信息，便于在语音合成中引用。

### 6. 音乐生成（Music）
根据主题（最长 2000 字）与歌词（最长 3500 字）生成原创音乐，返回带有时长等元信息的音频文件，支持试听与下载。

### 7. 歌曲翻唱（Cover）
上传原唱音频（支持 mp3/wav/flac/m4a/aac/ogg，单文件 ≤ 50MB，**音频时长需 6 秒 – 6 分钟**），提取特征后生成翻唱。**特征 ID 有效期 24 小时**，需尽快用于生成步骤。标题最长 300 字，歌词最长 1000 字。

### 8. 歌词生成（Lyrics）
AI 辅助歌词创作，输入主题（最长 2000 字）与已有歌词片段（最长 3500 字），生成续写歌词。

### 9. 设置（Settings）
配置 API Key、切换基础地址（默认 / 北京备用），所有配置仅保存在浏览器本地。

## PWA 安装说明

本应用已配置 PWA（渐进式 Web 应用）：

- **桌面端**：在 Chrome / Edge 等浏览器地址栏右侧点击「安装」图标，即可将应用安装到桌面，以独立窗口运行。
- **移动端**：在浏览器菜单中选择「添加到主屏幕」，即可像原生 App 一样启动。
- **离线能力**：安装后应用壳页面与静态资源由 Service Worker 预缓存，断网仍可加载应用界面（API 数据请求需联网）。

> PWA 缓存策略说明：MiniMax API 请求一律使用 `NetworkOnly`，**绝不缓存**任何带鉴权 Key 的 API 响应，仅缓存本地静态资源，避免鉴权失败与数据陈旧问题。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3（Composition API） |
| 构建工具 | Vite 5 |
| 路由 | Vue Router 4（hash 模式，便于静态托管） |
| 状态管理 | Pinia |
| HTTP 客户端 | Axios |
| UI 组件库 | Element Plus |
| PWA | vite-plugin-pwa（Workbox） |

## 目录结构

```
MiniMaxAudioTool/
├── public/                 # 静态资源（PWA 图标等）
│   ├── icon.svg
│   ├── pwa-192.png
│   ├── pwa-512.png
│   ├── pwa-maskable-192.png
│   └── pwa-maskable-512.png
├── src/
│   ├── api/                # API 封装（client.js 客户端、index.js 接口、stream.js 流式）
│   ├── components/         # 公共组件（AudioPlayer 播放器、StubView 占位）
│   ├── composables/        # 组合式函数（useApiKey 管理 API Key）
│   ├── router/             # 路由配置（index.js）
│   ├── stores/             # Pinia 状态（settings.js 设置 store）
│   ├── utils/              # 工具函数（audio.js 音频处理）
│   ├── views/              # 页面视图（9 个功能页）
│   │   ├── Tts.vue
│   │   ├── LongTts.vue
│   │   ├── VoiceClone.vue
│   │   ├── VoiceDesign.vue
│   │   ├── VoiceMgmt.vue
│   │   ├── Music.vue
│   │   ├── Cover.vue
│   │   ├── Lyrics.vue
│   │   └── Settings.vue
│   ├── App.vue             # 根组件
│   └── main.js             # 应用入口
├── index.html
├── vite.config.js          # Vite + PWA + 开发代理配置
├── package.json
├── run.ps1                 # Windows 一键启动脚本
└── run.sh                  # Linux/macOS 一键启动脚本
```

## 注意事项

- **API Key 安全**：Key 仅保存在当前浏览器 localStorage，不会上传服务器；更换浏览器需重新配置；请勿在公共设备上保存 Key。
- **账户认证**：使用语音克隆功能需先在 MiniMax 开放平台完成个人 / 企业认证。
- **音色保留规则**：复刻 / 设计生成的自定义音色 **7 天内需在语音合成中正式调用一次**方可永久保留，否则将被系统删除。
- **异步任务链接**：长文本语音等异步任务生成的音频 **下载链接 9 小时内有效**，请及时下载保存。
- **翻唱特征有效期**：歌曲翻唱提取的特征 ID **24 小时内有效**，需尽快用于生成步骤。
- **CORS / 网络**：纯前端直连 MiniMax API，部分地区或浏览器可能遇到 CORS 限制，可自建反向代理解决。
- **PWA 更新**：应用配置为 `autoUpdate`，新版本发布后 Service Worker 会自动更新；如遇缓存问题可强制刷新或清除站点数据。

## 许可证

本项目仅供学习与个人使用。MiniMax API 的使用需遵守 [MiniMax 开放平台](https://platform.minimaxi.com) 相关服务条款。
