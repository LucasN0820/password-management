# 0004 · 设置页(主题 / 语言 / 安全选项入口)

- **优先级**:🟠 中高(基础设施,多个任务的配置宿主)
- **类型**:功能 / 基础设施
- **状态**:⬜ 未开始
- **预估工作量**:M(1–1.5 天)

## 背景与问题
当前移动端**没有设置页**。已有但未暴露给用户的能力:
- 主题明暗切换:`apps/mobile/src/hooks/useModeToggle.tsx` 已存在,无入口。
- 语言切换:`@repo/i18n`(中/英)已支持,无入口。
- 安全相关开关(应用锁开关、自动锁超时、剪贴板清除时长)目前只能用默认值。

i18n 中 `home.*`、`shortcuts.*` 等 key 也基本未被移动端使用。

## 任务详情
- [ ] 新增设置入口(方案二选一,建议在「My Vault」头部加齿轮图标,或新增第三个 Tab)。
- [ ] 新增设置页 `src/screens/settings/`,分组展示:
  - **外观**:主题(跟随系统 / 浅色 / 深色)——接 `useModeToggle` / `theme.tsx`。
  - **语言**:中文 / English——接 `@repo/i18n`,切换后持久化(`expo-secure-store` 或 AsyncStorage)。
  - **安全**:应用锁开关 + 自动锁超时(对接 [0002](./0002-biometric-app-lock.md))、剪贴板清除时长(对接 [0003](./0003-sensitive-data-exposure.md))。
  - **关于**:版本号(`expo-constants`)、隐私说明。
- [ ] 设置项持久化与全局读取:建立一个轻量 settings store(Zustand),供 0002/0003 读取配置值。
- [ ] 所有文案走 i18n(与 [0006](./0006-i18n-completion.md) 协同)。

## 验收 / 测试标准
- [ ] 切换主题即时生效并重启后保留。
- [ ] 切换语言即时生效并重启后保留。
- [ ] 修改自动锁超时 / 剪贴板时长后,0002 / 0003 的行为随之改变。
- [ ] 页面在浅/深色、中/英下显示正常。

## 涉及文件
- 新增 `apps/mobile/src/screens/settings/`
- 新增 `apps/mobile/src/store/settings.ts`(或 `features/settings/`)
- `apps/mobile/src/app/`(新增路由 / Tab)
- 参考:`apps/mobile/src/hooks/useModeToggle.tsx`、`src/providers/theme.tsx`、`src/providers/i18n.tsx`

## 依赖
- 无前置;但 [0002](./0002-biometric-app-lock.md)、[0003](./0003-sensitive-data-exposure.md) 的「可配置化」依赖本任务提供的 settings store。可先交付默认值,再在此接管。

## 进度记录
- _(待填写)_
