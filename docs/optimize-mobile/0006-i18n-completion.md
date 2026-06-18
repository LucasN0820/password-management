# 0006 · i18n 文案补全与硬编码清理

- **优先级**:🟡 中(中文用户体验)
- **类型**:体验 / 国际化
- **状态**:✅ 已完成(2026-06-18,待真机回归)
- **预估工作量**:S(0.5 天)

## 背景与问题
多处文案被**硬编码为英文**,中文用户切到中文时会「露馅」。部分对应的 i18n key 其实已经存在但没被使用。

确认的硬编码位置:
- 空状态:`'No passwords yet'` / `'No favorites yet'` 及副标题
  —— `apps/mobile/src/screens/password/render.tsx:190-200`
- 生成器强度标签:`'Weak'` / `'Medium'` / `'Strong'`(i18n 已有 `generator.weak/medium/strong`)
  —— `apps/mobile/src/screens/generator/index.tsx:106-109`
- 详情页字段标签:`USERNAME` / `PASSWORD` / `URL` / `NOTES`
  —— `apps/mobile/src/screens/password-detail/render.tsx`
- 复制提示:`` `${label} copied` ``、`'Username'` / `'Password'`
  —— `password-detail/render.tsx:68`、`238`、`289`
- `'Invalid URL'` —— `password-detail/render.tsx:325`
- ActionSheet 项:`'Edit'` / `'Share'` / `'Delete'` —— `password-detail/render.tsx:111-131`
- 表单字段标签(整组):`'TITLE'` / `'USERNAME'` / `'PASSWORD'` / `'URL'` / `'NOTES'` / `'CATEGORY'` 及 `'Uncategorized'` / `'New category…'`
  —— `apps/mobile/src/components/password-form/field-*.tsx`(其中 `field-category.tsx` 为 0005 新增)
- 增/改/删密码弹窗:`'Cancel'` / `'Save'` / `'Add Password'` / `'Edit Password'` / `'Saving...'`
  —— `apps/mobile/src/components/modal-add-password`、`modal-edit-password/render.tsx`

## 任务详情
- [x] 梳理上述硬编码字符串,补齐 `packages/i18n/src/locales/en.json` 与 `zh.json` 中缺失的 key。
- [x] 替换源码中的字面量为 `t('...')`。
- [ ] 复查 `home.*` / `shortcuts.*` 等 key:确认哪些移动端会用(配合 [0004](./0004-settings-screen.md) / [0008](./0008-password-health-dashboard.md)),清理无用项或补充使用。(未动:`home.*` / `shortcuts.*` 由 0004 / 0008 负责,本任务不清理避免冲突。)
- [x] 增加一个简单校验:zh / en 两份 JSON 的 key 集合一致(可写个脚本或测试)。

## 验收 / 测试标准
- [x] 切到中文,上述所有界面无残留英文硬编码。
- [x] zh.json 与 en.json key 一一对应,无缺漏。
- [x] 强度标签、空状态、详情页标签、复制 Toast 均随语言切换。

## 涉及文件
- `packages/i18n/src/locales/en.json`、`zh.json`
- `apps/mobile/src/screens/password/render.tsx`
- `apps/mobile/src/screens/generator/index.tsx`
- `apps/mobile/src/screens/password-detail/render.tsx`

## 依赖
- 无。可独立完成。与 [0004](./0004-settings-screen.md)(语言切换入口)协同体验更佳。

## 进度记录
- 2026-06-18:完成移动端硬编码清理与 i18n 补全。
  - 新增 namespace:`form.*`(表单字段标签 / 占位符 / `uncategorized` / `newCategory`)、`modal.*`(增改弹窗的 `cancel` / `save` / `saving` / `addPassword` / `editPassword` / `saveFailed` / `updateFailed`);并扩充 `passwords.*`(`share` / `copied` / `invalidUrl` / `noPasswordsYet` / `noFavoritesYet` / `emptySubtitle` / `emptyFavoritesSubtitle`)。`passwords.copied` 使用 `{{label}} copied` 插值。
  - 替换文件:`screens/password/render.tsx`(空状态标题/副标题)、`screens/generator/index.tsx`(强度标签复用已有 `generator.weak/medium/strong`)、`screens/password-detail/render.tsx`(字段标签 / 复制 Toast / `Username`/`Password` 参数 / `Invalid URL` / ActionSheet `Edit`/`Share`/`Delete`)、`components/password-form/field-*.tsx`(全部 6 个字段标签 + 占位符 + `Uncategorized`/`New category…`)、`components/modal-add-password/index.tsx`、`components/modal-edit-password/render.tsx`。
  - 详情页与表单字段标签复用 `form.*`(渲染为 Title/用户名 等),原大写 `USERNAME` 等仅靠 `letterSpacing` 视觉处理。
  - 新增 vitest 校验 `apps/mobile/src/lib/__tests__/i18n-parity.test.ts`,递归比对 en/zh key 集合一致(避免 Hermes 不支持的 `toSorted`,改用复制后 `.sort()`)。
  - 校验:`vitest`(mobile + i18n,35 通过)、`tsc --noEmit` 通过、`eslint`(改动文件)通过。
  - 未处理:`home.*` / `shortcuts.*` 复查清理交由 0004 / 0008,避免跨任务冲突。
