# 0008 · i18n 文案补全与硬编码清理

- **优先级**:🟡 中(体验)
- **类型**:体验 / 一致性
- **状态**:⬜ 未开始
- **预估工作量**:M(0.5–1 天,量大但机械)

## 背景与问题
多处英文文案硬编码,未走 `@repo/i18n` 的 `t()`,切换语言时不生效。已知点位(非穷举):

- `src/components/AppSidebar.tsx`:`'AI Import'`、`'Settings'` 等导航项
- `src/routes/Home/index.tsx`:`'Vault'`、快捷操作 `'AI Import'`/`'Settings'`
- `src/routes/Password/list.tsx`:`'Passwords'`、`'No passwords found'`、`'No username'`
- `src/routes/Password/detail.tsx`:删除确认文案、底部快捷键提示(`↑↓ Navigate / ↵ Copy / Esc Close`)
- `src/components/AddPasswordModal.tsx` / `EditPasswordModal.tsx`:标题 `'New Password'` / `'Edit Password'`、`'Icon file must be under 5MB'`
- `src/routes/PasswordGenerator/index.tsx`:`'Generator'`
- `src/routes/Settings/index.tsx`:`'Settings'`
- `src/routes/Onboard/index.tsx`:整页多处("AI Onboard MVP"、"Choose Files"、"Start AI Import" 等)

## 任务详情
- [ ] 全量扫描 `apps/desktop/src` 中的硬编码英文 UI 文案(JSX 文本、按钮/占位/title/aria),逐一替换为 `t('...')`。
- [ ] 在 `packages/i18n` 补齐对应 key 的 **en 与 zh** 翻译,保持两端 key 一致。
- [ ] 复用现有命名空间(`nav.*`、`password.*`、`home.*` 等),新增 key 命名风格统一。
- [ ] 快捷键提示、确认对话框等动态文案也纳入翻译。

## 验收 / 测试标准
- [ ] grep `apps/desktop/src` 不再有明显的硬编码英文 UI 文案(导航/标题/按钮/占位)。
- [ ] en / zh 两份 locale key 集合一致(无缺漏);切换语言后上述页面全部跟随变化。
- [ ] `tsc`/`eslint` 通过;无缺失 key 的运行时告警。
- [ ] 手动:中/英切换走查 sidebar、Home、Password 列表/详情、生成器、设置、Onboard。

## 涉及文件
- 改 `apps/desktop/src` 上述各组件/路由文件
- 改 `packages/i18n/src/locales/en.json`、`zh.json`(补 key)
- 参考:[optimize-mobile/0006](../optimize-mobile/0006-i18n-completion.md)(移动端同类任务)

## 依赖
- 无。机械但独立,建议与 [0006](./0006-form-and-util-dedup.md) 合并 modal 后再做,可少改一遍重复文案(非硬依赖)。
