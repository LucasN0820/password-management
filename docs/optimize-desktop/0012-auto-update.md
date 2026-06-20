# 0012 · 应用内自动更新(electron-updater)

- **优先级**:🟢 较低(体验 / 发布)
- **类型**:发布 / 体验
- **状态**:⬜ 未开始
- **预估工作量**:M(1–1.5 天)

## 背景与问题

桌面端 README 此前声称“内置自动更新”,但代码里**并未实现**。当前仅在 `electron-builder.yml` 配置了 `publish: github`(决定产物发布到哪里、并在构建时生成 `latest*.yml` 更新元数据),缺少:

1. `electron-updater` / `electron-log` 依赖;
2. 主进程里的更新检测 / 下载 / 安装逻辑;
3. 渲染层的更新提示 UI 与设置页手动入口。

实际现状:产物会发布到 [GitHub Releases](https://github.com/LucasN0820/password-management/releases),但已安装的应用**不会**自动检测/提示更新,用户需手动下载新版。本任务补齐这套机制。

### 关键约束(决定实现方式)

1. **同仓库混合 tag**:本仓库 Releases 同时含 `desktop-v*`(桌面)与 `mobile-v*`(移动)两类发布(见 `.github/workflows/release-mobile.yml` / `release-desktop.yml`)。electron-updater 默认 GitHub provider 只取“最新一个 Release”,若最新是 `mobile-v*`(无桌面 `latest.yml`),更新检查会失败或误判。**因此不能直接用默认 GitHub provider**,需自行解析最新 `desktop-v*` Release 并用 generic feed 指向其资源目录。
2. **`latest*.yml` 已会被发布**:`release-desktop.yml` 产物上传步骤已包含 `-name 'latest*.yml'`(第 243 行),`--publish never`(第 146 行)只是禁止 electron-builder 自行上传、不影响本地生成 yml。**CI 基本无需改动**。
3. **版本号需手动对齐**:更新触发条件是 Release 中 `latest.yml` 的 version(= 构建时 `apps/desktop/package.json` 的 `version`)高于运行中应用版本。当前 `version: 1.1.0`。**发版前必须先 bump `package.json` version**,否则即使打了更高 tag 也不会触发更新。

### 交互决策(已确认)

- **更新 UX**:提示后**手动下载**(启动静默检查 → 发现新版弹提示 → 用户点“下载” → 进度 → 完成后“重启安装”)。
- **检查时机**:**启动时自动检查一次 + 设置页“检查更新”手动按钮**。

## 任务详情

- [ ] 依赖:`apps/desktop/package.json` 新增 `electron-updater@^6`、`electron-log@^5`(对应 Electron 29.4.6 / electron-builder 24.12.0)。
- [ ] 新增 `apps/desktop/electron/auto-updater.ts`:
  - dev 短路:`!app.isPackaged` 时不启用(electron-updater 未打包会抛错),设置页手动检查返回“仅打包后可用”。
  - 解析最新 desktop Release(绕开 mobile tag):调 GitHub API `GET /repos/LucasN0820/password-management/releases`(公开仓库,带 `User-Agent`),过滤 `tag_name` 以 `desktop-v` 开头、非 draft/prerelease,按 semver 取最高得 `<tag>`;`autoUpdater.setFeedURL({ provider: 'generic', url: '.../releases/download/<tag>' })`。找不到则广播 `not-available` 安全退出。
  - 配置:`autoDownload = false`、`autoInstallOnAppQuit = true`、`logger = electron-log`。
  - 事件 → 统一频道 `auto-update-status` 广播(复用 `webContents.send` 范式):`checking` / `available` / `not-available` / `downloading`(percent…)/ `downloaded` / `error`。
  - IPC(经 `registerIpcHandler` + `noInputSchema`):`auto-update:check`、`auto-update:download`、`auto-update:quit-and-install`。
- [ ] 接线 `apps/desktop/electron/main.ts`:`app.whenReady()` 内 `createWindow()` 之后调 `setupAutoUpdater(() => mainWindow)`;IPC 区注册 `registerAutoUpdaterIpc()`。
- [ ] preload `apps/desktop/electron/preload.ts`:仿 `onLocalImportModelDownloadProgress` 暴露 `onAutoUpdateStatus`、`checkForUpdates`、`downloadUpdate`、`quitAndInstallUpdate`,并补 `Window.electronAPI` 类型。
- [ ] 渲染层 UI:
  - 新增 `apps/desktop/src/components/UpdateNotifier.tsx`:订阅状态;`available` 弹提示含「下载」、`downloading` 显进度、`downloaded` 含「重启安装」;文案走 i18n;在 `src/App.tsx` 挂载(邻 `<Toaster />`)。
  - `src/routes/Settings/index.tsx`:新增「检查更新」按钮 → `checkForUpdates()`,toast 反馈“已是最新 / 发现新版 / 仅打包后可用”。
- [ ] i18n:`@repo/i18n` en/zh 新增 `update.*` 文案(available / download / downloading / downloaded / restartToInstall / upToDate / checking / checkForUpdates / error / devOnly)。
- [ ] 文档:更新 `README.md` 修正“自动更新”描述,并在发版步骤补充“先 bump `package.json` version”。

## 验收 / 测试标准

- [ ] `cd apps/desktop && yarn tsc && yarn build` 通过;根 `yarn lint` 通过。
- [ ] dev(`yarn dev`)下不报错;设置页「检查更新」提示“仅打包后可用”。
- [ ] `yarn dist:<platform>` 后 `apps/desktop/release/` 生成安装包与 `latest*.yml`。
- [ ] 端到端:安装低版本(如 `1.0.0`)→ 发布更高 `desktop-v1.2.0` Release → 启动旧版应用出现「发现新版本」→「下载」见进度 →「重启安装」后版本升级。
- [ ] 混合 tag 回归:仓库中 `mobile-v*` 为“最新 Release”时,桌面仍能正确解析到最新 `desktop-v*`(约束 1 生效)。

## 涉及文件

- 改 `apps/desktop/package.json`(加 `electron-updater`、`electron-log`)
- 新增 `apps/desktop/electron/auto-updater.ts`
- 改 `apps/desktop/electron/main.ts`(`whenReady` 接线 + 注册 IPC)
- 改 `apps/desktop/electron/preload.ts`(暴露 4 个更新 API + 类型)
- 新增 `apps/desktop/src/components/UpdateNotifier.tsx`
- 改 `apps/desktop/src/App.tsx`(挂载 `<UpdateNotifier />`)
- 改 `apps/desktop/src/routes/Settings/index.tsx`(检查更新按钮)
- 改 `@repo/i18n` en/zh 资源(`update.*` 文案,与 [0008](./0008-i18n-completion.md) 协同)
- 改根 `README.md`(修正描述 + 发版步骤)
- 复用:`@repo/ui/primitives/toaster`、`@repo/i18n`、`registerIpcHandler`(`electron/ipc-schema.ts`)、`webContents.send` 进度范式

## 依赖

- 无强依赖。i18n 文案与 [0008](./0008-i18n-completion.md) 体系一致。
- CI:`release-desktop.yml` 已上传 `latest*.yml`(第 243 行),无需改动;但发版流程需先 bump `package.json` version(已写入文档)。

## 完成记录

- (未完成)
