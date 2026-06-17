# 0004 · 设置页(主题 / 语言 / 安全选项入口)

- **优先级**:🟠 中高(基础设施,多个任务的配置宿主)
- **类型**:功能 / 基础设施
- **状态**:✅ 已完成(2026-06-17,待真机回归)
- **预估工作量**:M(1–1.5 天)

## 背景与问题
当前移动端**没有设置页**。已有但未暴露给用户的能力:
- 主题明暗切换:`apps/mobile/src/hooks/useModeToggle.tsx` 已存在,无入口。
- 语言切换:`@repo/i18n`(中/英)已支持,无入口。
- 安全相关开关(应用锁开关、自动锁超时、剪贴板清除时长)目前只能用默认值。

i18n 中 `home.*`、`shortcuts.*` 等 key 也基本未被移动端使用。

## 设计规范(遵循 mobile-design skill)
- 已读 `SKILL.md` / `mobile-color-system.md` / `mobile-typography.md`。
- 触控目标:分段控件每段 `minHeight 44`、行高 `minHeight 56`(≥44pt 规范)。
- 颜色:复用既有 `Colors` 明暗双套语义色(无新增低对比灰);深色不使用纯白文字。
- 排版:正文 ≥16、副文 ≥13、分组标题 12(uppercase 字距);未低于 11。
- 短内容用 `ScrollView`(非长列表,未触犯「长列表禁用 ScrollView」)。
- 无纯手势操作:全部为按钮 / Switch;均带 `accessibilityRole` / `accessibilityState` / `accessibilityLabel`。

## 任务详情
- [x] 入口:在「My Vault」头部新增齿轮图标(`Settings`),`router.push('/settings')`;新增路由 `src/app/settings.tsx`(返回箭头 + 标题),注册进 root `Stack`。
- [x] 新增设置页 `src/screens/settings/index.tsx`,分组展示:
  - **外观**:主题分段(跟随系统 / 浅色 / 深色)——经 settings store 调 `Appearance.setColorScheme`。
  - **语言**:跟随系统 / 中文 / English——经 store 调 `@repo/i18n` 的 `changeLanguage`,并持久化。
  - **安全**:应用锁开关(对接 [0002](./0002-biometric-app-lock.md) `setConfig`)、自动锁超时分段(立即/30s/1m/5m)、剪贴板清除分段(15s/30s/60s/从不,对接 [0003](./0003-sensitive-data-exposure.md) `setClipboardClearMs`)。
  - **关于**:版本号(`expo-constants`)、隐私说明。
- [x] 轻量 settings store(Zustand)+ `SecureStore` 持久化(单 key JSON);`SettingsProvider` 启动时 `hydrate` 并在就绪前 gate(避免主题闪现),其后 `I18nProvider` 读取已水合的语言偏好。
- [x] 所有新文案走 i18n,新增 `settings.*`(en/zh 各 21 个 key,校验一致)。

## 验收 / 测试标准
- [x] 纯逻辑单测(`logic.test.ts`,7 个):持久化合并/容错(非法枚举、负数回退)、主题→`Appearance` 取值映射、语言偏好解析。
- [x] `tsc`/`eslint` 通过;en/zh key 一致;全量 `vitest run apps/mobile/src` → 26 passed。
- [ ] 真机回归:① 切主题即时生效且重启保留;② 切语言即时生效且重启保留;③ 改自动锁超时/剪贴板时长后 0002/0003 行为随之变化;④ 浅/深 × 中/英 四组合显示正常。

## 涉及文件
**新增 `apps/mobile/src/features/settings/`**
- `types.ts`(`ThemeMode`/`LanguagePreference`/`Settings` + 默认值 + 选项常量;从纯常量模块取默认值以保持可测)
- `logic.ts`(纯函数:`mergeStoredSettings`/`appearanceColorScheme`/`resolveInitialLanguage`)
- `storage.ts`(`SecureStore` 读写,单 key `password-management.settings.v1`)
- `settings-store.ts`(Zustand:state + `hydrate` + 各 setter,负责副作用)
- `settings-provider.tsx`(启动水合 + gate)
- `device-language.ts`(设备语言探测,provider/screen 共用)
- `index.ts`、`__tests__/logic.test.ts`(7 个用例)

**新增其他**
- `apps/mobile/src/screens/settings/index.tsx`(UI:`Segmented` / `Section` / `Row`)
- `apps/mobile/src/app/settings.tsx`(路由)
- `apps/mobile/src/lib/clipboard-config.ts`(抽出 `DEFAULT_CLIPBOARD_CLEAR_MS` 纯常量,解耦原生依赖以可测)

**改动**
- `apps/mobile/src/screens/root/index.tsx`(插入 `SettingsProvider` 于 `I18nProvider` 之上)
- `apps/mobile/src/screens/root/render.tsx`(注册 `settings` 路由)
- `apps/mobile/src/providers/i18n.tsx`(读取已水合的语言偏好,否则回退设备语言)
- `apps/mobile/src/screens/password/render.tsx`(头部齿轮入口)
- `apps/mobile/src/lib/clipboard.ts`(默认常量改为从 `clipboard-config` 引入并 re-export)
- `packages/i18n/src/locales/en.json`、`zh.json`(新增 `settings.*`)

## 依赖
- 无前置。本任务已把 [0002](./0002-biometric-app-lock.md)(应用锁开关 / 自动锁超时)与 [0003](./0003-sensitive-data-exposure.md)(剪贴板清除时长)的配置化**正式接上**,三者形成闭环。

## 进度记录
- 2026-06-17 完成实现 + 纯逻辑单测。
  - 主题:`Appearance.setColorScheme`(系统=`'unspecified'`),全局 `useColorScheme` 自动重渲染。
  - 语言:store 持久化 + `changeLanguage`;`SettingsProvider` 先水合并 gate,`I18nProvider` 读取偏好,避免双重应用与主题闪现。
  - 安全:开关/超时/剪贴板时长经 store 调 0002/0003 暴露的接口,改完即时生效并持久化。
  - 可测性:把跨原生模块的默认值抽到 `clipboard-config.ts`,`types/logic` 仅依赖纯相对路径模块,vitest 可直接跑。
  - 设计:遵循 mobile-design skill(≥44 触控、语义色、≥16 正文、可访问性标签、短内容用 ScrollView)。
  - 验证:`vitest run apps/mobile/src` → 26 passed;`tsc`/`eslint` 通过;en/zh key 一致。
- 待办:真机回归(主题/语言切换与持久化、与 0002/0003 联动、四组合显示)。
- 备注:`useModeToggle.tsx` 现已被 settings store 的主题流程取代(未删除,留作兼容)。
