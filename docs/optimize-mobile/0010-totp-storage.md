# 0010 · TOTP / 两步验证码存储

- **优先级**:🟢 中低(功能)
- **类型**:功能
- **状态**:⬜ 未开始
- **预估工作量**:M(1.5–2 天)

## 背景与问题
现代密码管理器的标配:为条目保存 TOTP 种子并实时生成 6 位验证码(RFC 6238)。当前未支持。`expo-crypto` 已在依赖,具备实现 HMAC-SHA1/SHA256 的基础。

## 任务详情
- [ ] 扩展数据模型:`passwords` 增加可选字段 `totp_secret`(加密存储,复用 `createEncryptedAdapter` 的加密路径)。
  - 需在 `packages/db/src/schema.ts` 加列并生成迁移(`drizzle` + `migrations.generated.ts`)。
- [ ] 实现 TOTP 生成:Base32 解码 + HMAC + 动态截断,默认 30s 周期、6 位。
- [ ] 详情页展示当前验证码 + 倒计时圆环(已有 `components/circular-progress`),一键复制(走 0003 的 `copySensitive`)。
- [ ] 录入方式:手动输入种子;(可选)扫描 `otpauth://` 二维码(`expo-camera`)。
- [ ] AI 导入 / 备份导入导出同步支持该字段(配合 0009)。

## 验收 / 测试标准
- [ ] 用已知种子与标准测试向量比对,生成的验证码与 Google Authenticator 一致。
- [ ] 倒计时与刷新准确(30s 周期边界正确)。
- [ ] 迁移在已有库上平滑升级,旧数据不受影响。
- [ ] 种子在库中为加密态(非明文)。

## 涉及文件
- `packages/db/src/schema.ts`、`migrations.generated.ts`、`types.ts`
- 新增 `apps/mobile/src/lib/totp.ts`
- `apps/mobile/src/screens/password-detail/render.tsx`、`components/password-form/*`
- 复用:`apps/mobile/src/components/circular-progress/`

## 依赖
- 复制功能建议在 [0003](./0003-sensitive-data-exposure.md) 之后(用 `copySensitive`)。涉及 DB 迁移,需与 desktop 协调 schema 一致。

## 进度记录
- _(待填写)_
