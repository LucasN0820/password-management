# 0003 · 敏感数据暴露收敛(剪贴板 / 分享 / 防截屏)

- **优先级**:🔴 高(安全)
- **类型**:安全加固
- **状态**:✅ 已完成并验证(2026-06-18)
- **预估工作量**:M(1 天)

## 背景与问题
三处明文/长期暴露的风险点:

1. **剪贴板永不清除**:复制密码后一直留在剪贴板,其它 App 可读。
   - `apps/mobile/src/screens/password-detail/render.tsx`(`handleCopy`)
   - `apps/mobile/src/screens/password/render.tsx`(ActionSheet 复制)
   - `apps/mobile/src/screens/generator/index.tsx`(`copyToClipboard`)
2. **分享是明文密码**:`password-detail/render.tsx:121` 直接把 `Password: <明文>` 交给系统 Share Sheet。
3. **无防截屏 / 后台快照遮罩**:详情页显示密码时可被截屏,iOS 应用切换器会留快照。

## 任务详情
### 3.1 剪贴板自动清除
- [x] 新增 `src/lib/clipboard.ts` 的 `copySensitive(text, { clearAfterMs? })`:复制后定时(默认 30s)自动清空。
  - 清空前用 `getStringAsync` 比对,**仅当剪贴板仍是该敏感值时才清空**(`shouldClearClipboard` 纯函数)。
  - 复制新密码会 `cancelScheduledClear` 取消上一个定时器,避免误清新值。
  - 暴露 `setClipboardClearMs`(供 0004 设置页注入时长)与 `DEFAULT_CLIPBOARD_CLEAR_MS`。
- [x] 三处复制改为 `copySensitive`:`generator`(生成密码)、`password/render`(ActionSheet 复制密码)、`password-detail`(密码卡片复制)。用户名复制保持普通 `Clipboard`(敏感度低)。

### 3.2 安全分享
- [x] `password-detail` 的分享改为**二次确认 Alert**:取消 / **不含密码分享**(默认,只含标题+用户名+URL)/ **包含密码**(destructive,明确警示)。不再静默泄露明文。
- [x] 文案走 i18n 新增 `share.*`(en/zh 均补齐)。

### 3.3 防截屏 / 后台遮罩
- [x] 新增 `src/hooks/useSecureScreen.ts`,基于 `expo-screen-capture` 的 `preventScreenCaptureAsync/allowScreenCaptureAsync`(带 key),挂载即开、卸载即关。
- [x] 应用于 `password-detail`(可显密码)与 `generator`(展示生成密码)。Android 即 `FLAG_SECURE`(阻止截屏 + 隐藏最近任务快照)。
- [x] iOS 应用切换器快照:已由 [0002](./0002-biometric-app-lock.md) 的 `PrivacyCover`(进后台即盖)覆盖,本任务不重复处理。

## 验收 / 测试标准
- [x] 单测(`clipboard.test.ts`,6 个):复制即写入;到期清空;用户后续复制的内容不被清;新密码取消旧定时器;`clearAfterMs<=0` 不清。
- [x] 单测覆盖 `shouldClearClipboard` 纯规则。
- [x] `tsc`/`eslint` 通过;en/zh key 一致;全量 `vitest run apps/mobile/src` → 19 passed。
- [x] 真机回归(2026-06-18 用户验证通过):① 复制密码后约 30s 剪贴板被清、期间复制他物不受影响;② 分享出现三选一确认、默认不含密码;③ Android 详情页/生成器截屏被阻止;④ 切后台应用切换器看不到明文。

## 涉及文件
**新增**
- `apps/mobile/src/lib/clipboard.ts`(`copySensitive` / `shouldClearClipboard` / `cancelScheduledClear` / `setClipboardClearMs`)
- `apps/mobile/src/lib/__tests__/clipboard.test.ts`(6 个 vitest 用例,mock `expo-clipboard` + 假定时器)
- `apps/mobile/src/hooks/useSecureScreen.ts`(防截屏 hook)

**改动**
- `apps/mobile/src/screens/password-detail/render.tsx`(密码复制 `copySensitive`、分享二次确认、`useSecureScreen`、接入 `useTranslation`)
- `apps/mobile/src/screens/password/render.tsx`(ActionSheet 复制密码 → `copySensitive`)
- `apps/mobile/src/screens/generator/index.tsx`(复制 → `copySensitive`、`useSecureScreen`)
- `apps/mobile/package.json`(新增 `expo-screen-capture ~56.0.4`)
- `packages/i18n/src/locales/en.json`、`zh.json`(新增 `share.*`)

## 依赖
- 无强依赖。**剪贴板清除时长** 与 **是否启用防截屏** 可在 [0004 设置页](./0004-settings-screen.md) 暴露:剪贴板调 `setClipboardClearMs`,本任务已留接口。

## 进度记录
- 2026-06-17 完成实现 + 单测。
  - 剪贴板:定时清除 + 「仍是同一秘密才清」+ 新复制取消旧定时器;纯规则 `shouldClearClipboard` 单测覆盖。
  - 分享:由静默明文改为三选一确认(默认不含密码)。
  - 防截屏:`expo-screen-capture`(已 `yarn install`,落在 `apps/mobile/node_modules`),Android `FLAG_SECURE`;iOS 快照复用 0002 遮罩。
  - 验证:`vitest run apps/mobile/src` → 19 passed;`tsc`/`eslint` 通过;en/zh key 一致。
- 待办:真机回归(剪贴板原生交互、分享 Sheet、Android 截屏阻止)。
