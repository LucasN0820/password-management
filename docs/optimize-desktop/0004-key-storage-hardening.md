# 0004 — 密钥存储加固（vault key 完整性 / AI 服务密钥加密）

- **优先级**: 🟠 较高（安全）
- **类型**: 安全加固
- **状态**: ✅ 已完成
- **预估工作量**: M（1 天）

## 背景与问题

两处密钥存储不够稳健：

1. **vault key 缺完整性与降级**（`electron/vault-key.ts`）：原实现经
   `safeStorage.encryptString()` 加密后存为 JSON，但没有 HMAC、版本字段或明确的
   安全存储不可用分支。
2. **AI 服务密钥明文**（`electron/settings.ts`）：
   `AI_IMPORT_SERVICE_SECRET` 曾从 `process.env` / `.env` /
   `desktop-env.json` 以明文加载，打包时还会写进长期存在的 JSON 资源。

## 任务详情

- [x] vault key：
  - [x] 存储结构加入 `version` 字段与 **HMAC-SHA256** 完整性校验；HMAC
        密钥由 `safeStorage` 保护的随机材料派生，读取时先验 HMAC 再解密 vault
        key，失败时给出明确错误。
  - [x] `safeStorage.isEncryptionAvailable()` 为 false 时不写入明文，以可读、
        可识别的错误安全阻止继续；上层数据库初始化会捕获并报告该错误。
  - [x] 解密时不缓存明文密钥；完整性材料及派生密钥均用可清零的 `Buffer`
        保存，并在 `finally` 中立即清零。
- [x] AI 服务密钥：
  - [x] 首次运行时把环境变量（开发模式也支持 `.env`）中的 seed 立即通过
        `safeStorage` 加密，写入用户数据目录；后续运行时只解密读取。打包配置不再
        写入或读取明文 `AI_IMPORT_SERVICE_SECRET`。
  - [x] 密钥存储告警使用固定脱敏文案，不打印 URL、secret 或损坏的密文。

## 验收 / 测试标准

- [x] 单测：篡改 vault key 密文/HMAC 后读取被拒；完整性校验生效；版本字段可
      解析，未知版本明确拒绝。
- [x] 单测/模拟：`safeStorage` 不可用时进入安全降级分支并给出提示，不产生未
      捕获异常或明文回退。
- [x] grep 确认相关日志不含明文 secret/vault key；针对性 TypeScript 检查通过。
      全仓库 ESLint 已执行，但当前仍被其他并发任务文件及既有测试规则错误阻塞；
      本任务未将这些无关错误标为已修复。
- [x] 自动化模拟首次启动生成 key、二次启动读取解锁，以及 AI secret 首次加密
      落盘、二次读取；10 个针对性测试全部通过。

## 涉及文件

- 改 `apps/desktop/electron/vault-key.ts`（version + HMAC + 降级 + 内存清理 +
  legacy 迁移）
- 改 `apps/desktop/electron/settings.ts`（AI secret 加密存储 + 日志脱敏）
- 改 `apps/desktop/scripts/build.js`（禁止打包明文 AI secret）
- 新增 `apps/desktop/electron/__tests__/vault-key.test.ts`
- 新增 `apps/desktop/electron/__tests__/settings.test.ts`
- 新增 `apps/desktop/vitest.config.mts`

## 依赖

无强依赖。属于敏感数据安全收敛，与
[0001](./0001-clipboard-auto-clear.md) / [0002](./0002-ipc-validation-and-errors.md)
互补。
