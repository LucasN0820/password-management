# 密码管理应用

一个现代化的跨平台密码管理应用，支持安全存储、生成和管理密码。

## 🚀 项目简介

这是一个基于 React 技术栈开发的跨平台密码管理应用，提供简洁直观的用户界面和强大的密码管理功能。应用支持深色/浅色主题切换，提供乐观更新体验，并采用现代化的设计语言。项目包含移动端（React Native）和桌面端（Electron + React）两个版本。

## 🛠️ 技术栈

### 移动端 (React Native)

#### 前端框架

- **React Native** - 跨平台移动应用开发框架
- **TypeScript** - 类型安全的 JavaScript 超集
- **Expo** - React Native 开发平台和工具链

#### 路由与导航

- **Expo Router** - 基于文件系统的路由
- **React Navigation** - 原生导航体验

#### 状态管理

- **Zustand** - 轻量级状态管理库
- **TanStack Query** - 服务器状态管理和数据获取

#### UI 组件与样式

- **BNA UI** - UI 组件库
- **Lucide React Native** - 图标库
- **NativeWind** - React Native 的 TailwindCSS 实现

#### 数据存储

- **SQLite** - 本地数据库存储
- **Expo SecureStore** - 安全存储敏感信息

### 桌面端 (Electron + React)

#### 前端框架

- **Electron** - 跨平台桌面应用框架
- **React 18** - 用户界面库
- **TypeScript** - 类型安全的 JavaScript 超集
- **Vite** - 现代化构建工具

#### 路由与导航

- **React Router v7** - 客户端路由库

#### 状态管理

- **Zustand** - 轻量级状态管理库

#### UI 组件与样式

- **Radix UI** - 无样式、可访问的 UI 原语
- **Framer Motion** - 动画库
- **Lucide React** - 图标库
- **shadcn/ui** - 基于 Radix UI 的组件库

#### 数据存储

- **better-sqlite3** - 高性能 SQLite 数据库
- **Electron 原生存储 API** - 安全数据存储

### 开发工具

- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化
- **TypeScript** - 静态类型检查
- **TailwindCSS** - 原子化 CSS 框架

## 📱 核心功能

### 密码管理

- ✅ 密码安全存储
- ✅ 密码生成器（可配置长度和字符类型）
- ✅ 密码强度评估
- ✅ 密码分类和搜索

### 用户体验

- ✅ 深色/浅色主题切换
- ✅ 乐观更新（即时 UI 反馈）
- ✅ 离线优先设计
- ✅ 原生手势和动画

### 安全特性

- ✅ 本地加密存储
- ✅ 主密码保护
- ✅ 自动锁定机制
- ✅ 安全剪贴板操作

## 🏗️ 项目结构

```
password-management/
├── apps/
│   ├── mobile/                 # React Native 移动应用
│   │   ├── src/
│   │   │   ├── components/     # 可复用组件
│   │   │   ├── screens/       # 页面组件
│   │   │   ├── store/         # 状态管理
│   │   │   └── hooks/         # 自定义 Hooks
│   └── desktop/               # Electron + React 桌面应用
│       ├── src/
│       │   ├── components/     # 可复用组件
│       │   ├── pages/         # 页面组件
│       │   ├── store/         # 状态管理
│       │   └── lib/           # 工具库
├── packages/                  # 共享包
└── docs/                     # 项目文档
```

## 🎨 设计原则

- **移动优先** - 专为移动设备优化交互体验
- **简洁直观** - 清晰的信息层次和操作流程
- **安全可靠** - 多层安全保护用户数据
- **性能优先** - 流畅的动画和快速的响应

## 🚀 快速开始

### 环境要求

- Node.js 18+
- Expo CLI
- iOS/Android 开发环境
- Yarn v4.13.0

### 安装依赖

```bash
yarn install
```

### 启动开发服务器

#### 移动端

```bash
cd apps/mobile
yarn dev
```

#### 桌面端

```bash
cd apps/desktop
yarn dev
```

### 构建与发布

#### 移动端 (Expo EAS)

移动端使用 [EAS Build](https://docs.expo.dev/build/introduction/) 进行云端构建和发布。

##### 构建配置

项目在 `apps/mobile/eas.json` 中定义了以下构建 Profile：

| Profile | 用途 | 分发方式 |
|---------|------|---------|
| `development` | 开发客户端，用于本地调试 | 内部分发 (internal) |
| `development-simulator` | iOS 模拟器专用开发客户端 | 内部分发 |
| `preview` | 内部测试版本 | 内部分发 |
| `production` | 正式发布版本（版本号自动递增） | 应用商店 |

##### 本地开发构建

```bash
cd apps/mobile

# 生成原生项目文件（首次或原生依赖变更时需要）
yarn prebuild

# 在本地设备/模拟器运行
yarn ios       # iOS
yarn android   # Android
```

##### EAS 云端构建与提交

```bash
cd apps/mobile

# 生产构建并自动提交到应用商店
yarn eas:ios       # iOS 构建 + 提交到 App Store
yarn eas:android   # Android 构建 + 提交到 Google Play (internal track)
```

以上命令会执行 `eas build --profile production --auto-submit --non-interactive --no-wait`，即：
- 使用 `production` Profile 构建
- 构建完成后自动提交到对应应用商店
- 非交互模式运行（适用于 CI 环境）
- 不等待构建完成即返回（可在 [Expo Dashboard](https://expo.dev) 查看构建状态）

##### 手动 EAS 构建（自定义 Profile）

```bash
cd apps/mobile

# 开发版本
eas build --platform ios --profile development
eas build --platform android --profile development

# 内部预览版本
eas build --platform ios --profile preview
eas build --platform android --profile preview
```

#### 桌面端 (Electron Builder)

桌面端使用 [electron-builder](https://www.electron.build/) 进行打包，支持 macOS、Windows 和 Linux 三个平台。

##### 构建配置

打包配置定义在 `apps/desktop/electron-builder.yml`：

| 平台 | 输出格式 | 架构 |
|------|---------|------|
| macOS | DMG + ZIP | x64, arm64 |
| Windows | NSIS 安装程序 | x64, arm64 |
| Linux | AppImage + .deb | x64, arm64 |

构建产物输出到 `apps/desktop/release/` 目录。

##### 本地打包

```bash
cd apps/desktop

# 构建但不打包（生成 dist 目录用于调试）
yarn pack

# 构建并打包当前平台
yarn dist

# 指定平台打包
yarn dist:mac     # macOS (DMG + ZIP)
yarn dist:win     # Windows (NSIS 安装程序)
yarn dist:linux   # Linux (AppImage + .deb)
```

##### CI/CD 自动发布 (GitHub Actions)

桌面端通过 GitHub Actions 工作流 (`.github/workflows/release-desktop.yml`) 实现自动构建和发布。

**触发方式：**

1. **Git Tag 触发** — 推送 `desktop-v*` 格式的 tag：
   ```bash
   git tag desktop-v1.0.0
   git push origin desktop-v1.0.0
   ```
2. **手动触发** — 在 GitHub Actions 页面使用 `workflow_dispatch`

**CI 流程：**

1. 在 macOS、Windows、Linux 三个平台上并行构建
2. 自动生成各平台所需的图标文件（从 `public/icon-512.png` 转换）
3. 执行 `yarn dist:${platform} --publish always` 构建并发布
4. 构建产物自动发布到 [GitHub Releases](https://github.com/LucasN0820/password-management/releases)

**代码签名（可选）：**

如需对发布包进行签名，在 GitHub 仓库 Secrets 中配置以下变量：

| Secret | 用途 |
|--------|------|
| `CSC_LINK` | macOS 签名证书 (base64) |
| `CSC_KEY_PASSWORD` | macOS 证书密码 |
| `WIN_CSC_LINK` | Windows 签名证书 (base64) |
| `WIN_CSC_KEY_PASSWORD` | Windows 证书密码 |

##### 自动更新

桌面端内置了基于 GitHub Releases 的自动更新机制。发布新版本后，已安装的应用会自动检测并提示用户更新。

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目。

---

_使用 ❤️ 和 TypeScript 构建_
