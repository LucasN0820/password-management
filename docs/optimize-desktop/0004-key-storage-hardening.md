# 0004 · 密钥存储加固(vault key 完整性 / AI 服务密钥加密)

- **优先级**:🟠 较高(安全)
- **类型**:安全加固
- **状态**:⬜ 未开始
- **预估工作量**:M(1 天)

## 背景与问题
两处密钥存储不够稳健:

1. **vault key 缺完整性与降级**(`electron/vault-key.ts:17-38`):用 `safeStorage.encryptString()` 加密后存为 JSON 文件,但
   - 无 HMAC/完整性校验,密文被篡改无法察觉;
   - 无版本字段,日后无法平滑做密钥轮换;
   - `safeStorage` 不可用时直接抛异常,无明确降级/提示。
2. **AI 服务密钥明文**(`electron/settings.ts:97-126`):`AI_IMPORT_SERVICE_SECRET` 从 `process.env` / `.env` / `desktop-env.json` 以**明文**加载,可能进入日志或进程信息。

## 任务详情
- [ ] vault key:
  - [ ] 存储结构加入 `version` 字段与 **HMAC-SHA256** 完整性校验(密钥派生自 `safeStorage` 保护的材料);读取时先验 HMAC 再解密,失败给出明确错误。
  - [ ] `safeStorage.isEncryptionAvailable()` 为 false 时,**不抛裸异常**:给出可读提示并安全降级(如阻止继续而非静默存明文)。
  - [ ] 解密得到的明文密钥使用后尽快从内存清理(置空/不长期持有)。
- [ ] AI 服务密钥:
  - [ ] 改用 `safeStorage` 加密后落盘,运行时解密读取;不再以明文 JSON 长期存放。
  - [ ] 全链路日志对 URL/secret **脱敏**(打码或省略),确保不打印明文。

## 验收 / 测试标准
- [ ] 单测:篡改 vault key 密文/HMAC 后读取被拒(完整性校验生效);版本字段可解析。
- [ ] 单测/模拟:`safeStorage` 不可用时走降级分支并给出提示,不抛未捕获异常。
- [ ] grep 全仓确认日志无明文 secret/vault key;`tsc`/`eslint` 通过。
- [ ] 手动:首次启动生成 key、二次启动正确读取解锁;AI 导入仍可用。

## 涉及文件
- 改 `apps/desktop/electron/vault-key.ts`(version + HMAC + 降级 + 内存清理)
- 改 `apps/desktop/electron/settings.ts`(AI secret 加密存储 + 日志脱敏)
- 视需要新增 `apps/desktop/electron/__tests__/vault-key.test.ts`

## 依赖
- 无强依赖。属敏感数据安全收敛,与 [0001](./0001-clipboard-auto-clear.md)/[0002](./0002-ipc-validation-and-errors.md) 互补。
