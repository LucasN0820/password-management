# 0002 · 生物识别应用锁与自动锁

- **优先级**:🔴 高(安全)
- **类型**:安全功能
- **状态**:✅ 已完成并验证(2026-06-17;设置 UI 待 0004)
- **预估工作量**:M(1.5–2 天)

## 背景与问题
当前 App 启动后直接进入 tabs,**没有任何门禁**:

```tsx
// apps/mobile/src/screens/root/render.tsx —— 直接渲染 Stack/(tabs)
```

vault key 虽然存在 `expo-secure-store`,但只要手机处于解锁状态、App 被打开,**全部密码即明文可见**。`expo-local-authentication` 尚未进入依赖。对密码管理器来说,应用锁是最该有的能力。

## 任务详情
- [x] 引入 `expo-local-authentication`(`~56.0.4`,已 `yarn install`),实现 Face ID / Touch ID + **设备密码(PIN/passcode)回退**(`disableDeviceFallback: false`)。
- [x] 新增「锁屏 Gate」`AppLockGate`,包裹在 `root` 的 `ThemeProvider` 内、`Render` 之上;锁定时叠加全屏 `LockScreen`,内容仍挂载于其下(解锁不重置导航栈)。
- [x] **后台自动锁**:`AppLockGate` 监听 `AppState`,进入后台记录时间戳,回前台超过 `autoLockMs`(默认 60s)才要求重新认证。与 `ModelDownloadProvider` 的 AppState 监听并存。
- [x] **避免闪现**:初始 `locked: true`、`ready: false`,支持检测完成前显示 `PrivacyCover`;进入后台立即盖上 `PrivacyCover`(同时遮挡 App 切换器快照)。
- [x] 解锁失败:`LockScreen` 显示 `appLock.failed` 文案 + 「解锁」按钮可重试;**不支持/未录入任何凭据的设备**:`getAuthSupport()` 返回 false → 开闸放行,绝不把用户锁死。
- [x] 配置项预留:store 暴露 `enabled` / `autoLockMs` + `setConfig()`(默认值在 `constants.ts`);具体设置 UI 见 [0004](./0004-settings-screen.md)。两者解耦,本任务以默认值独立交付。
- [x] iOS 权限:`app.config.ts` 注册 `expo-local-authentication` 插件并写入 `NSFaceIDUsageDescription`(`faceIDPermission`)。
- [x] i18n:新增 `appLock.*`(en/zh 均补齐,key 校验一致)。

## 验收 / 测试标准
- [x] 纯逻辑单测:`shouldLockOnLaunch` / `shouldRequireAuth`(grace 边界、null 时间戳、自定义超时)共 **6 个用例通过**。
- [x] `tsc --noEmit` 通过;`eslint`(app-lock + root)通过;en/zh key 一致。
- [x] 设备手动回归:① 冷启动 → 锁屏 → 生物识别 → 进入列表;② 后台超时返回需重认证、短暂切换不打扰;③ 恢复过程中无明文闪现;④ 模拟器/无凭据设备不被锁死。(2026-06-17 用户验证通过)

## 涉及文件
**新增 `apps/mobile/src/features/app-lock/`**
- `constants.ts` — `AppLockConfig` + 默认值(`DEFAULT_AUTO_LOCK_MS = 60_000`)
- `logic.ts` — 纯决策函数(`shouldLockOnLaunch` / `shouldRequireAuth`),可单测
- `auth.ts` — `expo-local-authentication` 封装(`getAuthSupport` / `authenticate`)
- `app-lock-store.ts` — Zustand 状态机(ready/supported/locked/covered/backgroundedAt + 动作)
- `lock-screen.tsx` — 全屏锁屏 UI(Face ID/指纹/密码 + 重试 + 失败提示)
- `privacy-cover.tsx` — 无按钮隐私遮罩(冷启动前 + 后台快照)
- `app-lock-gate.tsx` — 包裹组件 + `AppState` 接线
- `index.ts` — 对外导出
- `__tests__/logic.test.ts` — 6 个 vitest 用例

**改动**
- `apps/mobile/src/screens/root/index.tsx`(在 `ThemeProvider` 内用 `AppLockGate` 包裹 `Render`)
- `apps/mobile/package.json`(新增 `expo-local-authentication ~56.0.4`)
- `apps/mobile/app.config.ts`(注册插件 + Face ID 权限文案)
- `packages/i18n/src/locales/en.json`、`zh.json`(新增 `appLock.*`)

## 依赖
- 无强依赖(自带默认超时)。**配置 UI** 由 [0004 设置页](./0004-settings-screen.md) 提供,接 store 的 `setConfig` 即可。

## 进度记录
- 2026-06-17 完成实现 + 纯逻辑单测。
  - 设计:native 调用集中在 `auth.ts`,时序/决策抽到纯函数 `logic.ts`,可在 Node/vitest 验证而不引入原生模块。
  - 防闪现 + 隐私快照:`PrivacyCover`(`!ready` 与 `covered`)+ `LockScreen`(`locked`),内容常驻挂载、解锁不丢导航栈。
  - 安全兜底:无任何凭据的设备 `getAuthSupport()=false` → 开闸,避免锁死。
  - 验证:`vitest run apps/mobile/src` → 13 passed(含本任务 6 个);`tsc`/`eslint` 通过;en/zh key 一致。
- 2026-06-17 用户已真机/模拟器手动回归,确认锁屏、自动锁、防闪现、兜底均正常。**任务全部完成**(设置 UI 留待 0004 接入 `setConfig`)。
