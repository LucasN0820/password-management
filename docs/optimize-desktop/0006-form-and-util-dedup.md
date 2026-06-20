# 0006 · 表单组件去重与工具函数抽取

- **优先级**:🟡 中(重构 / 可维护性)
- **类型**:重构
- **状态**:✅ 已完成
- **预估工作量**:M(1 天)

## 背景与问题

存在多处明显重复,增加维护成本与不一致风险:

1. **Add/Edit 密码弹窗高度重复**:`src/components/AddPasswordModal.tsx` 与 `EditPasswordModal.tsx` 在表单字段、图标上传、样式上重复 >60%,且各自用 `alert('Icon file must be under 5MB')`(`AddPasswordModal.tsx:33`、`EditPasswordModal.tsx:55`)。
2. **工具函数重复**:`formatBytes` 在 `routes/Settings/index.tsx` 与 `routes/Onboard/index.tsx` 各实现一遍。
3. **逻辑内联**:复制+复制态反馈逻辑散落多处;密码强度计算 `calculateStrength` 内联在 `PasswordGenerator/index.tsx`。

## 任务详情

- [x] 抽出共享 `PasswordForm` 组件,承载字段 + 图标上传 + 校验;Add/Edit 仅传入初始值与保存回调。
- [x] 抽 `apps/desktop/src/lib/format.ts`(`formatBytes` 等),Settings/Onboard 改为引用。
- [x] 抽 `apps/desktop/src/lib/password-strength.ts`(`calculateStrength` 纯函数,可单测),生成器引用。
- [x] 抽 `useCopyToClipboard` hook(复制 + 1.5s 复制态反馈),与 [0001](./0001-clipboard-auto-clear.md) 的统一复制入口配合,供 detail/generator/spotlight 复用。
- [x] 图标过大改用 toast(已有 `@repo/ui/primitives/toaster`,见 `App.tsx:3`),与 [0011](./0011-ux-polish.md) 一致(也可在此一并处理)。

## 验收 / 测试标准

- [x] 单测:`formatBytes` 边界(0 / KB / MB / GB);`calculateStrength` 对弱/中/强样本评分稳定。
- [ ] Add/Edit 弹窗行为与改造前一致(新增、编辑、图标上传、校验提示)。
- [x] 重复实现已删除(grep 仅剩一处定义);`tsc`/`eslint` 通过。
- [ ] 手动:新增/编辑密码、生成器强度条、各处复制反馈正常。

## 涉及文件

- 新增 `apps/desktop/src/components/PasswordForm.tsx`
- 新增 `apps/desktop/src/lib/format.ts`、`apps/desktop/src/lib/password-strength.ts`、`apps/desktop/src/hooks/useCopyToClipboard.ts`
- 改 `apps/desktop/src/components/AddPasswordModal.tsx`、`EditPasswordModal.tsx`
- 改 `apps/desktop/src/routes/Settings/index.tsx`、`Onboard/index.tsx`、`PasswordGenerator/index.tsx`、`Password/detail.tsx`

## 依赖

- 与 [0001](./0001-clipboard-auto-clear.md) 的复制入口、[0011](./0011-ux-polish.md) 的 toast 有协同点,但可独立完成与测试。

## 完成记录

- 新增共享 `PasswordForm`,集中表单字段、HTML 校验、图标预览/上传/移除和关闭动画；Add/Edit 弹窗仅保留初始值及保存参数适配，视觉样式保持不变并补充 dialog/按钮可访问性标记。
- 5 MB 图标限制从阻塞式 `alert` 改为现有设计系统 toast。
- `formatBytes` 已统一供 Settings 与包含 0010 虚拟化候选列表改动的 Onboard 使用；`calculateStrength` 已抽为生成器使用的纯函数。
- 直接复用 0001 的 `useCopyToClipboard`,detail、generator、spotlight 均走统一 Electron 复制入口和 1.5 秒反馈。
- 新增 12 项工具函数单测；desktop 全量 60 项测试、TypeScript 检查、相关 ESLint 及重复定义 grep 均通过。新增/编辑和复制反馈的手工验收未执行，因此对应验收项保持未勾选。
