# 0011 · 交互体验打磨(toast / 真实统计 / a11y)

- **优先级**:🟢 较低(体验)
- **类型**:体验 / 可访问性
- **状态**:✅ 已完成
- **预估工作量**:S(0.5 天)

## 背景与问题

若干体验与可访问性小问题:

1. **用 `alert()` 提示**:图标过大时 `alert('Icon file must be under 5MB')`(`AddPasswordModal.tsx:33`、`EditPasswordModal.tsx:55`),体验割裂。项目已有 toast(`@repo/ui/primitives/toaster`,见 `App.tsx:3`,Settings/Onboard 已用)。
2. **首页假统计**:`routes/Home/index.tsx:116` 用 `Math.round(totalPasswords * 0.85)` 作为「强密码数」,是写死的假数据,与 `t('home.strongPasswords')` 标签不符。
3. **可访问性细节**:复选框缺 `aria-label`(`AddPasswordModal.tsx` 等);detail 底部快捷键提示为静态硬编码(与 [0008](./0008-i18n-completion.md) 协同翻译)。

## 任务详情

- [x] 两处 `alert` 改为 `toast({ variant: 'destructive', ... })`,文案走 i18n。
- [x] 首页强密码统计接**真实密码强度计算**(复用 [0006](./0006-form-and-util-dedup.md) 抽出的 `password-strength`),按实际数据统计;无法计算时不展示误导数字。
- [x] 补关键控件 `aria-label`/`htmlFor` 关联;快捷键提示文案纳入 i18n。

## 验收 / 测试标准

- [ ] 触发图标过大场景出现 toast 而非系统 alert;文案中/英正确。
- [x] 首页「强密码」数随真实数据变化(构造强/弱样本核实),非固定 85%。
- [x] 复选框等控件有可读 aria 名称;`tsc`/`eslint` 通过。
- [ ] 手动:Add/Edit 校验提示、首页统计、键盘可达性走查。

## 涉及文件

- 改 `apps/desktop/src/components/AddPasswordModal.tsx`、`EditPasswordModal.tsx`(toast + aria)
- 改 `apps/desktop/src/routes/Home/index.tsx`(真实统计)
- 改 `apps/desktop/src/routes/Password/detail.tsx`(快捷键提示翻译)
- 复用:`@repo/ui/primitives/toaster`、`lib/password-strength.ts`([0006](./0006-form-and-util-dedup.md))

## 依赖

- 真实统计依赖 [0006](./0006-form-and-util-dedup.md) 的 `password-strength` 抽取(若先做 0006 可直接复用);其余子项独立。

## 完成记录

- 复用 0006 的共享 `PasswordForm`,图标超限统一显示 destructive toast；标题、说明、表单标签、占位符及控件 aria 名称均补齐中英文资源，Add/Edit 无重复实现。
- `password-strength` 新增强密码判定与统计纯函数，沿用生成器 `>= 60` 的“强”分级；首页直接按实际密码数据计算，不再使用固定 85%。
- 密码详情的删除和显隐按钮补充可读 aria 名称，底部导航/复制/关闭提示改用现有 i18n 键；保留现有暖色视觉、排版和动效。
- 新增强弱混合样本统计与中英文 UX 文案测试，共 9 项定向测试通过；desktop TypeScript 和相关 ESLint 通过。键盘可达性手工走查未执行，因此手动验收项未勾选。
