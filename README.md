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
- Yarn v1.22.22

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

### 构建应用

#### 移动端

```bash
cd apps/mobile

# iOS
yarn build:ios

# Android
yarn build:android
```

#### 桌面端

```bash
cd apps/desktop
yarn build
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目。

---

_使用 ❤️ 和 TypeScript 构建_
