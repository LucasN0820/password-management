# 0006 · i18n 文案补全与硬编码清理

- **优先级**:🟡 中(中文用户体验)
- **类型**:体验 / 国际化
- **状态**:⬜ 未开始
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
- [ ] 梳理上述硬编码字符串,补齐 `packages/i18n/src/locales/en.json` 与 `zh.json` 中缺失的 key。
- [ ] 替换源码中的字面量为 `t('...')`。
- [ ] 复查 `home.*` / `shortcuts.*` 等 key:确认哪些移动端会用(配合 [0004](./0004-settings-screen.md) / [0008](./0008-password-health-dashboard.md)),清理无用项或补充使用。
- [ ] 增加一个简单校验:zh / en 两份 JSON 的 key 集合一致(可写个脚本或测试)。

## 验收 / 测试标准
- [ ] 切到中文,上述所有界面无残留英文硬编码。
- [ ] zh.json 与 en.json key 一一对应,无缺漏。
- [ ] 强度标签、空状态、详情页标签、复制 Toast 均随语言切换。

## 涉及文件
- `packages/i18n/src/locales/en.json`、`zh.json`
- `apps/mobile/src/screens/password/render.tsx`
- `apps/mobile/src/screens/generator/index.tsx`
- `apps/mobile/src/screens/password-detail/render.tsx`

## 依赖
- 无。可独立完成。与 [0004](./0004-settings-screen.md)(语言切换入口)协同体验更佳。

## 进度记录
- _(待填写)_
