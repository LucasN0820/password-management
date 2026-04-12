# Desktop 打包与发布流程

本文档说明 Password Volt 桌面端从源码到用户可安装包的完整构建链路，涵盖本地打包和 CI 自动发布两种场景。

---

## 目录

1. [构建链路总览](#构建链路总览)
2. [阶段一：Vite 构建](#阶段一vite-构建)
3. [阶段二：electron-builder 打包](#阶段二electron-builder-打包)
4. [阶段三：发布到 GitHub Releases](#阶段三发布到-github-releases)
5. [本地打包](#本地打包)
6. [CI 自动发布](#ci-自动发布)
7. [代码签名](#代码签名)
8. [关键配置文件索引](#关键配置文件索引)

---

## 构建链路总览

```
源码 (TypeScript + React)
  │
  ▼  Vite 构建 (vite build)
  ├── dist/              ← 渲染进程 (HTML/CSS/JS)
  ├── dist-electron/main.js     ← 主进程
  └── dist-electron/preload.js  ← 预加载脚本
  │
  ▼  electron-builder 打包
  ├── release/mac/       ← .dmg, .zip (macOS)
  ├── release/win-unpacked/ ← .exe installer (Windows)
  └── release/linux-unpacked/ ← .AppImage, .deb (Linux)
  │
  ▼  --publish always (CI 专用)
  └── GitHub Releases    ← 上传构建产物作为 Release Assets
```

整个链路可以简单理解为三个阶段：**Vite 编译** → **electron-builder 打包** → **发布上传**。

---

## 阶段一：Vite 构建

运行 `vite build` 时，Vite 通过 `vite-plugin-electron` 执行三次独立的构建：

| 构建目标 | 入口文件 | 输出目录 | 说明 |
|----------|---------|---------|------|
| 渲染进程 | `src/main.tsx` | `dist/` | React 应用，包含 HTML/CSS/JS |
| 主进程 | `electron/main.ts` | `dist-electron/main.js` | Electron 主进程，处理窗口管理、SQLite、IPC |
| 预加载脚本 | `electron/preload.ts` | `dist-electron/preload.js` | 桥接主进程与渲染进程的安全通道 |

关键配置（`vite.config.mts`）：

- `better-sqlite3` 被声明为 `external`，不会被 Vite 打包进 JS bundle，而是由 electron-builder 在打包阶段处理原生模块
- 渲染进程输出到 `dist/`，主进程和预加载脚本输出到 `dist-electron/`

---

## 阶段二：electron-builder 打包

electron-builder 读取 `electron-builder.yml` 配置，将 Vite 构建产物 + Electron 运行时 + 原生依赖打包为可安装的平台特定格式。

### 打包内容

`electron-builder.yml` 中的 `files` 字段决定了哪些文件被打入 asar 包：

```yaml
files:
  - dist/**/*            # 渲染进程产物
  - dist-electron/**/*   # 主进程 + 预加载脚本
  - "!node_modules/**/*" # 排除 node_modules（由 electron-builder 自行处理依赖）
```

### 原生模块处理

`better-sqlite3` 是一个包含 C++ 编译产物的原生 Node.js 模块，必须针对目标 Electron 版本和平台重新编译。electron-builder 通过 `npmRebuild: true` 自动完成这一步：

1. 检测 `dependencies` 中的原生模块
2. 下载或编译匹配 Electron v29.4.6 + 目标平台（darwin/win32/linux）+ 目标架构（x64/arm64）的预编译二进制
3. 将 `.node` 文件解包到 asar 外部（通过 `asarUnpack: ["**/*.node"]`），因为原生模块无法从 asar 包内加载

### 各平台输出

| 平台 | 格式 | 架构 | 产物命名 |
|------|------|------|---------|
| macOS | DMG, ZIP | x64, arm64 | `Password Volt-1.0.0-mac-{arch}.dmg` |
| Windows | NSIS 安装包 | x64, arm64 | `Password Volt-1.0.0-win-{arch}-setup.exe` |
| Linux | AppImage, DEB | x64 (AppImage 还支持 arm64) | `Password Volt-1.0.0-linux-{arch}.AppImage` |

所有产物输出到 `apps/desktop/release/` 目录。

---

## 阶段三：发布到 GitHub Releases

electron-builder 内置了发布功能，由 `electron-builder.yml` 中的 `publish` 配置驱动：

```yaml
publish:
  provider: github
  owner: LucasN0820
  repo: password-management
  releaseType: release
```

### 发布原理

当 `yarn dist:mac --publish always` 执行时：

1. **打包完成后**，electron-builder 检查 `publish` 配置，发现 provider 是 `github`
2. 通过环境变量 `GH_TOKEN` 获取 GitHub API 认证凭证
3. 调用 GitHub API，根据当前 git tag（如 `desktop-v1.0.0`）查找或创建对应的 Release
4. 将 `release/` 目录下的构建产物（.dmg, .exe, .AppImage 等）作为 Release Assets 上传

### `--publish` 参数

| 值 | 行为 |
|----|------|
| `always` | 无条件上传到 GitHub Releases |
| `onTag` | 仅当当前 commit 有 git tag 时上传 |
| `never` | 只打包，不上传 |
| 不传 | CI 环境默认等同于 `onTag`，本地默认 `never` |

### 多平台合并到同一 Release

CI 中 macOS / Windows / Linux 三个 job 并行执行，它们各自运行 `--publish always`，但都会上传到**同一个 Release**。electron-builder 通过 git tag 名匹配 Release：

```
macOS job   ──→ 查找 desktop-v1.0.0 Release ──→ 上传 .dmg, .zip
Windows job ──→ 查找 desktop-v1.0.0 Release ──→ 上传 .exe
Linux job   ──→ 查找 desktop-v1.0.0 Release ──→ 上传 .AppImage, .deb
```

第一个完成的 job 会创建 Release，后续 job 发现 Release 已存在则直接追加上传。

---

## 本地打包

### 前置条件

- Node.js 22
- Yarn 4.13.0（通过 Corepack）
- macOS 打包需要 macOS 系统（`iconutil` 仅 macOS 可用）
- Windows 打包需要 Windows 系统或 Wine
- Linux 打包需要 Linux 系统

### 命令

```bash
cd apps/desktop

# 仅构建，不打包（用于验证编译是否通过）
yarn build

# 测试打包（生成未压缩的目录，不生成安装包，速度快）
yarn pack

# 完整打包（当前平台）
yarn dist

# 指定平台打包
yarn dist:mac
yarn dist:win
yarn dist:linux
```

本地执行 `yarn dist` 默认不会上传到 GitHub Releases（`--publish` 默认为 `never`）。如果需要本地发布，手动加 `--publish always` 并确保 `GH_TOKEN` 环境变量已设置：

```bash
GH_TOKEN=ghp_xxxx yarn dist:mac --publish always
```

### 本地产物位置

```
apps/desktop/release/
  ├── mac/                    # macOS .app 目录
  ├── mac-arm64/              # macOS arm64 .app 目录
  ├── Password Volt-1.0.0-mac-x64.dmg
  ├── Password Volt-1.0.0-mac-arm64.dmg
  ├── ...
  └── builder-effective-config.yaml  # electron-builder 实际使用的合并配置
```

---

## CI 自动发布

### 触发方式

在 `.github/workflows/release-desktop.yml` 中定义了两种触发方式：

**1. 推送 git tag（推荐）**

```bash
# 确保 main 分支包含所有要发布的代码
git tag desktop-v1.0.0
git push origin desktop-v1.0.0
```

tag 名称必须匹配 `desktop-v*` 模式。

**2. 手动触发（workflow_dispatch）**

在 GitHub Actions 页面手动点击 "Run workflow"。

### CI 流程详解

```
推送 desktop-v1.0.0 tag
  │
  ▼  GitHub Actions 触发 release-desktop.yml
  │
  ├─ macOS job (macos-latest)
  │   ├── checkout + install deps
  │   ├── sips + iconutil 生成 .icns 图标
  │   └── yarn dist:mac --publish always → 上传 .dmg, .zip
  │
  ├─ Windows job (windows-latest)
  │   ├── checkout + install deps
  │   ├── magick 生成 .ico 图标
  │   └── yarn dist:win --publish always → 上传 .exe
  │
  └─ Linux job (ubuntu-latest)
      ├── checkout + install deps
      ├── apt install imagemagick → magick 生成多尺寸 PNG 图标
      └── yarn dist:linux --publish always → 上传 .AppImage, .deb
```

三个 job 使用 `fail-fast: false` 策略，即某个平台失败不会取消其他平台的构建。

### 图标生成

各平台要求不同的图标格式，从 `public/icon-512.png` 源文件生成：

| 平台 | 工具 | 输出 |
|------|------|------|
| macOS | `sips` + `iconutil`（系统自带） | `build/icon.icns` |
| Windows | `magick`（ImageMagick，runner 预装） | `build/icon.ico` |
| Linux | `magick`（需 apt 安装） | `build/icons/{16..512}x{16..512}.png` |

### 认证与权限

```yaml
permissions:
  contents: write  # 允许创建 Release 和上传 Assets

env:
  GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}  # GitHub 自动注入的临时 token
```

`GITHUB_TOKEN` 是 GitHub Actions 为每次运行自动生成的短期 token，具有当前仓库的读写权限，无需手动配置。

---

## 代码签名

当前构建**未启用代码签名**（没有配置签名证书 secrets），通过 `CSC_IDENTITY_AUTO_DISCOVERY=false` 跳过。

如需启用签名，在仓库 Settings → Secrets 中添加：

| Secret | 用途 |
|--------|------|
| `MAC_CERTS` | macOS 签名证书（.p12 文件 base64 编码） |
| `MAC_CERTS_PASSWORD` | .p12 证书密码 |
| `WIN_CERTS` | Windows 签名证书 |
| `WIN_CERTS_PASSWORD` | Windows 证书密码 |

CI 工作流会自动检测这些 secrets 是否存在，存在则启用对应平台的代码签名。

> 未签名的应用在 macOS 上会触发 Gatekeeper 警告，在 Windows 上会触发 SmartScreen 警告，但功能不受影响。

---

## 关键配置文件索引

| 文件 | 作用 |
|------|------|
| `apps/desktop/vite.config.mts` | Vite 构建配置，定义三个构建目标（渲染进程、主进程、预加载脚本） |
| `apps/desktop/electron-builder.yml` | electron-builder 配置，定义打包格式、图标、asar、原生模块、发布目标 |
| `apps/desktop/package.json` | 定义 `build`/`dist`/`pack` 等脚本命令 |
| `.github/workflows/release-desktop.yml` | CI 工作流，定义三平台并行构建 + 自动发布 |
| `apps/desktop/build/entitlements.mac.plist` | macOS 应用权限声明（hardened runtime） |
| `apps/desktop/public/icon-512.png` | 图标源文件，CI 中自动转换为各平台格式 |
