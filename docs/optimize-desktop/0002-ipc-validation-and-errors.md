# 0002 · IPC 入参校验与统一错误处理

- **优先级**:🔴 高(安全)
- **类型**:安全加固
- **状态**:✅ 已完成
- **预估工作量**:M(1 天)

## 背景与问题

主进程 IPC 是渲染层与数据库/加密之间的信任边界,目前两个缺口:

1. **入参缺校验**:仅 `save-imported-passwords` 用了 zod(`electron/main.ts:542` `importPasswordsSchema.parse`);而 `add-password` / `add-passwords` / `update-password` / `delete-password` 等核心 CRUD 直接把入参落库,没有任何结构/类型校验。
2. **缺统一错误处理**:多数 handler 没有 try-catch,DB/加密异常会原样抛回 renderer,可能泄露文件路径、SQL、加密相关内部细节,且前端拿到的是不可控的错误形态。

## 任务详情

- [x] 为所有接收用户输入的 IPC handler 定义 zod schema 并 `parse`/`safeParse`:
  - `PasswordInput`(title/username/password/url/notes/category 等)统一 schema,`add-password`、`update-password`、`add-passwords`(数组)复用。
  - id 类入参(delete/get-by-id)校验为期望类型。
- [x] 用一个 `withIpcHandler(name, schema, fn)` 包装器统一处理:校验 → 执行 → try-catch。
  - 校验失败 / 执行异常:**本地记录完整错误**(不含明文密码),对前端返回**通用错误**形态(如 `{ success: false, code: 'VALIDATION_ERROR' | 'DB_ERROR' }`),不外泄内部细节。
- [ ] (可选,低优先)IPC 通道命名加命名空间前缀(如 `vault:get-passwords`)避免与第三方冲突;若改动需同步 `preload.ts` 与渲染层调用。

## 验收 / 测试标准

- [x] 单测:对每个 schema 喂合法/非法样本,校验非法被拒(缺字段、类型错误、超长)。
- [x] 单测:包装器在 fn 抛错时返回通用错误且不含敏感字段;在校验失败时不调用 fn。
- [x] 构造非法 IPC 调用(如 `add-password` 传缺字段对象),应被拒绝且不写库。
- [x] `tsc`/`eslint` 通过;现有正常流程(增删改查、导入)回归无变化。

## 完成记录

- 新增 `electron/ipc-schema.ts`,统一校验密码 CRUD、搜索、模型管理与导入相关 IPC 入参。
- 所有主进程 IPC handler 接入 `withIpcHandler`,校验和执行异常仅向 renderer 返回稳定错误码;本地错误日志会按实际入参脱敏密码、备注与 TOTP 密钥。
- `preload.ts` 将通用 IPC 错误转换为只含稳定错误码的受控异常,保持成功路径 API 类型和调用方式不变。
- 新增 6 个针对性单测;desktop 全量 35 个测试、TypeScript 检查及相关 ESLint 检查均通过。

## 涉及文件

- 改 `apps/desktop/electron/main.ts`(各 CRUD handler 接入 schema + 包装器)
- 新增 `apps/desktop/electron/ipc-schema.ts`(zod schema 定义)与 `withIpcHandler` 包装器(可单测)
- 复用参考:`electron/main.ts:542` 现有 `importPasswordsSchema`
- 如改通道名:同步 `apps/desktop/electron/preload.ts` 及调用方

## 依赖

- 无强依赖。与 [0001](./0001-clipboard-auto-clear.md) 同属主进程改动,可分别独立测试。
