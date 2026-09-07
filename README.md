# Password Vault

[中文](README.md) · [English](README.en.md)

<p align="center">
  <img src="docs/assets/vault-1.png" alt="Password Vault mobile app poster" width="48%" />
  <img src="docs/assets/vault-2.png" alt="Password Vault landing page poster" width="48%" />
</p>

> 本地优先、主密码保护的跨平台密码管理器 —— 一个密码，掌管所有数字凭据。

**官网（Landing）：https://www.vault.yoga**

Password Vault 是一个以 **本地优先** 为核心理念的密码管理应用：所有凭据都加密存储在设备本地的 SQLite 数据库中，由主密码与设备生物识别保护。项目以 **Turborepo Monorepo** 组织，包含移动端、桌面端与官网三个应用，并通过共享包复用数据层、UI、国际化与 AI 导入能力。

| 应用                            | 技术栈                  | 说明                           |
| ------------------------------- | ----------------------- | ------------------------------ |
| 📱 **Mobile** (`apps/mobile`)   | Expo · React Native     | iOS / Android 客户端           |
| 🖥️ **Desktop** (`apps/desktop`) | Electron · React · Vite | macOS / Windows / Linux 客户端 |
| 🌐 **Landing** (`apps/landing`) | Next.js                 | 产品官网与下载入口             |

> 安装包通过 [GitHub Releases](https://github.com/LucasN0820/password-management/releases) 分发，官网亦提供各平台下载链接。

---

## ✨ 具体功能

两端共享相同的加密数据层与核心理念，并各自针对平台特性做了优化。

### 📱 Mobile（Expo / React Native）

**密码管理**

- 密码增删改查，删除支持撤销（Undo Snackbar）
- 收藏 / 星标、实时搜索、分类筛选、多维度排序（名称 / 创建时间 / 更新时间）、下拉刷新
- 详情页一键复制用户名 / 密码 / 网址 / TOTP，可选展示网站 Favicon

**密码生成器**

- 随机密码模式：长度 4–64，可控大小写 / 数字 / 符号、排除易混淆字符
- 口令短语（Passphrase）模式：词数、分隔符、大小写策略可配
- 实时熵值 / 强度评估，会话内生成历史，一键保存到保险库

**两步验证（TOTP）**

- 内置 TOTP 验证码（RFC 6238），实时刷新 + 倒计时环
- 摄像头扫描 `otpauth://` 二维码录入密钥，一键复制验证码

**安全审计**

- 健康看板：弱密码 / 重复密码 / 过期密码检测，点击即可跳转修复
- 数据泄露检查（可选开启）：对接 Have I Been Pwned，展示泄露次数

**导入与备份**

- AI 导入：基于本地 LLM（`llama.rn`）解析 CSV / PDF / 图片，候选项预览后批量导入；支持多模型按需下载
- 加密备份 / 恢复（PBKDF2 口令保护），CSV 导出

**安全与隐私**

- 应用锁：Face ID / Touch ID / 设备 PIN，支持自动锁定（30s / 1m / 5m）
- 后台隐私遮罩、敏感页面截图防护、剪贴板自动清除（智能擦除）

**个性化**

- 主题（跟随系统 / 浅色 / 深色），多语言（简体中文 / 英文 / 跟随系统）

### 🖥️ Desktop（Electron / React）

**仪表盘与管理**

- 首页概览：密码总数、收藏数、强密码数、最近添加，附快捷操作入口
- 双栏式密码列表 + 详情，增删改查、复制反馈、显示 / 隐藏密码、收藏

**快速访问**

- 全局 Spotlight 快速搜索（`Ctrl/Cmd + Shift + P` 唤起悬浮窗），键盘上下导航、回车即复制
- 内置快捷键：`Ctrl+N` 新建、`Ctrl+G` 生成器、`Esc` 关闭浮层

**密码生成器**

- 长度与字符集可配，实时强度指示，可直接保存到保险库

**AI 导入**

- 支持 CSV / PDF / DOCX / Markdown / TXT，本地 LLaMA 或远程服务双模式
- 模型库管理：下载进度与 ETA、设为默认、打开模型目录、移除模型
- 导入候选可逐条预览、编辑、勾选后批量保存

**体验与安全**

- 多语言（中 / 英），大列表虚拟化渲染优化
- 内容安全策略（CSP）、IPC 校验、剪贴板自动清除
- 基于 GitHub Releases 的自动更新

---

## 🏗️ 技术架构

### Monorepo 结构

由 **Turborepo** 编排，**Yarn 4.13.0**（Corepack）管理 workspaces：

```
password-management/
├── apps/
│   ├── mobile/        # Expo + React Native 移动端
│   ├── desktop/       # Electron + React + Vite 桌面端
│   └── landing/       # Next.js 官网
├── packages/
│   ├── db/            # @repo/db —— 加密 SQLite 数据层
│   ├── ui/            # @repo/ui —— 共享 UI 组件
│   ├── i18n/          # @repo/i18n —— 国际化
│   └── ai-import-core/# @repo/ai-import-core —— AI 文档导入核心
└── config/
    ├── metadata/      # @repo/metadata —— 应用元数据（名称 / 包名）
    ├── eslint/        # @repo/eslint-config —— 共享 ESLint 配置
    └── ts/            # @repo/ts-config —— 共享 TypeScript 配置
```

### 共享包

| 包                                        | 作用                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------- |
| `@repo/db`                                | 基于 Drizzle ORM 的加密 SQLite 数据层（`@noble/ciphers`），统一两端表结构与状态 |
| `@repo/ui`                                | Radix UI 原语 + Tailwind 工具 + 共享 Hooks 的组件库                             |
| `@repo/i18n`                              | 基于 i18next / react-i18next 的多语言能力（中 / 英）                            |
| `@repo/ai-import-core`                    | AI 文档解析与候选提取核心（Zod 校验，Vitest 测试）                              |
| `@repo/metadata`                          | 共享应用名 / Slug / 包名（`Password Vault` · `com.lucas.vault`）                |
| `@repo/eslint-config` · `@repo/ts-config` | 共享 ESLint（eslint-config-sheriff）与 TypeScript（strict）配置                 |

### 各端技术栈

| 维度 | Mobile                                  | Desktop                                           | Landing               |
| ---- | --------------------------------------- | ------------------------------------------------- | --------------------- |
| 框架 | Expo · React Native 0.85                | Electron 29 · React 18 · Vite                     | Next.js 16 · React 19 |
| 路由 | Expo Router（文件路由）                 | React Router v7                                   | App Router            |
| 状态 | Zustand · TanStack Query                | Zustand                                           | —                     |
| UI   | NativeWind · Lucide · Reanimated        | TailwindCSS 4 · shadcn/ui · Radix · Framer Motion | TailwindCSS 4         |
| 数据 | `expo-sqlite`（SQLCipher）· SecureStore | `better-sqlite3`（经 IPC）                        | —                     |
| AI   | `llama.rn`（设备端推理）                | 本地 LLaMA / 远程服务                             | —                     |

### 关键设计

- **数据层**：两端共用 `@repo/db` 定义的 `passwords` 表结构；移动端经 `expo-sqlite`，桌面端经 `better-sqlite3` 并通过 Electron IPC 暴露给渲染进程。
- **状态管理**：两端均使用 Zustand store（`src/store/passwordStore.ts`），接口一致。
- **Electron 三进程**：`electron/main.ts`（SQLite、IPC、全局快捷键）→ `electron/preload.ts`（上下文隔离的 `electronAPI` 桥）→ `src/`（React 渲染进程）。
- **路径别名**：两端均以 `@/*` 映射 `src/*`。

### 开发命令

| 命令          | 作用                     |
| ------------- | ------------------------ |
| `yarn dev`    | 以 Turbo 启动所有应用    |
| `yarn build`  | 构建所有包               |
| `yarn lint`   | 全仓 ESLint              |
| `yarn tsc`    | 全仓 TypeScript 类型检查 |
| `yarn format` | Prettier 格式化          |

单独启动：

```bash
cd apps/desktop && yarn dev   # Vite + Electron（端口 5173）
cd apps/mobile  && yarn dev   # Expo（端口 8081）
cd apps/landing && yarn dev   # Next.js（端口 3001）
```

> 环境要求：Node.js 22 · Yarn 4.13.0（Corepack）· 移动端需 iOS / Android 开发环境。CI 使用 `yarn install --immutable`。

---

## 🚀 发版方式

### 📱 Mobile（EAS Build）

移动端使用 [EAS Build](https://docs.expo.dev/build/introduction/) 云端构建与提交，配置见 `apps/mobile/eas.json`。

**构建 Profile**

| Profile                 | 用途                       | 分发     |
| ----------------------- | -------------------------- | -------- |
| `development`           | 开发客户端，本地调试       | 内部分发 |
| `development-simulator` | iOS 模拟器开发客户端       | 内部分发 |
| `preview`               | 内部测试版本               | 内部分发 |
| `production`            | 正式发布（版本号自动递增） | 应用商店 |

**自动发布**：推送 `mobile-v*` tag 触发 `.github/workflows/release-mobile.yml`（亦可在 Actions 页手动 `workflow_dispatch`），流程为 Node 22 + Yarn 4 → 用 `EXPO_TOKEN` 鉴权 → 以 `production` Profile 构建 Android APK → 创建 GitHub Release 并附带 APK。

```bash
git tag mobile-v1.0.0
git push origin mobile-v1.0.0
```

**本地 / 手动命令**

```bash
cd apps/mobile

yarn prebuild          # 生成原生工程（首次或原生依赖变更）
yarn ios | yarn android # 本地设备 / 模拟器运行

yarn eas:ios           # production 构建 + 自动提交 App Store
yarn eas:android       # production 构建 + 自动提交 Google Play（internal）
```

> 所需 Secret：`EXPO_TOKEN`。

### 🖥️ Desktop（electron-builder）

桌面端使用 [electron-builder](https://www.electron.build/) 打包，配置见 `apps/desktop/electron-builder.yml`（`appId: com.lucasni.password-desktop`）。

**打包目标**

| 平台    | 格式            | 架构                       |
| ------- | --------------- | -------------------------- |
| macOS   | DMG + ZIP       | x64 · arm64                |
| Windows | NSIS 安装包     | x64 · arm64                |
| Linux   | AppImage + .deb | x64 · arm64（.deb 仅 x64） |

**自动发布**：推送 `desktop-v*` tag 触发 `.github/workflows/release-desktop.yml`（亦可手动 `workflow_dispatch`），在 macOS / Windows / Linux 三平台并行构建（自动生成各平台图标）→ 产物（含 `latest*.yml` 更新元数据）发布到 [GitHub Releases](https://github.com/LucasN0820/password-management/releases)。

```bash
# 1. 先提升版本号（自动更新依据 package.json 的 version 判断是否有新版）
#    编辑 apps/desktop/package.json 的 "version"，例如 1.1.0 → 1.2.0
# 2. 打 tag 并推送（tag 版本需与 package.json 对齐）
git tag desktop-v1.2.0
git push origin desktop-v1.2.0
```

> ⚠️ 仅打 tag 不够：electron-updater 比较的是 `latest.yml` 里的 `version`（即构建时 `package.json` 的 `version`）与运行中应用的版本，发版前务必先 bump 版本号，否则旧版本不会收到更新。

**应用内自动更新**：已实现，基于 electron-updater。应用启动时自动检查一次（设置页亦有「检查更新」按钮）；发现新版会提示用户，**手动点击下载**，下载完成后提示「重启并安装」。由于本仓库同时发布 `desktop-v*` 与 `mobile-v*` 两类 Release，更新逻辑会先经 GitHub API 解析出最新的 `desktop-v*` 发布，再以 generic feed 指向其资源目录，避免被移动端发布干扰（详见 `apps/desktop/electron/auto-updater.ts`）。

**本地命令**

```bash
cd apps/desktop

yarn pack          # 仅构建不打包（dir 模式，便于调试）
yarn dist          # 构建并打包当前平台
yarn dist:mac      # macOS（DMG + ZIP）
yarn dist:win      # Windows（NSIS）
yarn dist:linux    # Linux（AppImage + .deb）
```

**代码签名（可选）**：在仓库 Secrets 配置后启用。

| Secret                             | 用途                   |
| ---------------------------------- | ---------------------- |
| `MAC_CERTS` · `MAC_CERTS_PASSWORD` | macOS 签名证书与密码   |
| `WIN_CERTS` · `WIN_CERTS_PASSWORD` | Windows 签名证书与密码 |

> AI 导入相关配置（`AI_IMPORT_*`）可经环境变量在构建时注入。

### 🌐 Landing（Next.js → Vercel）

官网为 Next.js 应用，部署在 **Vercel**（集成 Vercel Analytics 与 Speed Insights），随 `main` 分支推送自动部署，线上地址 https://www.vault.yoga。`/download/[target]` 路由会从 GitHub Releases 拉取最新安装包。

---

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 与 Pull Request 改进本项目。

---

_使用 ❤️ 与 TypeScript 构建_
