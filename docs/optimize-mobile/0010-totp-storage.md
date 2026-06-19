# 0010 · TOTP / 两步验证码存储

- **优先级**:🟢 中低(功能)
- **类型**:功能
- **状态**:✅ 已完成(2026-06-18,待真机回归)
- **预估工作量**:M(1.5–2 天)

## 背景与问题
现代密码管理器的标配:为条目保存 TOTP 种子并实时生成 6 位验证码(RFC 6238)。当前未支持。`expo-crypto` 已在依赖,具备实现 HMAC-SHA1/SHA256 的基础。

## 任务详情
- [x] 扩展数据模型:`passwords` 增加可选字段 `totp_secret`(加密存储,复用 `createEncryptedAdapter` 的加密路径)。
  - 在 `packages/db/src/schema.ts` 加列;迁移采用 drizzle bundle 新增条目 `m0002`(`ALTER TABLE passwords ADD totp_secret text`)+ `repairLegacyPasswordsTable` 防御式 `ADD COLUMN`(对齐 `icon` 既有先例),两端 `expo-sqlite` / `better-sqlite3` 平滑升级。
- [x] 实现 TOTP 生成:Base32 解码 + 纯 JS HMAC-SHA1 + 动态截断,默认 30s 周期、6 位(`apps/mobile/src/lib/totp.ts`,无原生依赖、Hermes 安全:仅用 `Uint8Array`/`DataView`,不使用 `BigInt`)。
- [x] 详情页展示当前验证码 + 倒计时圆环(复用 `components/circular-progress`),一键复制(走 0003 的 `copySensitive`)。
- [x] 录入方式:手动输入种子(表单新增 `FieldTotp`,Base32 校验)。
- [x] **二维码扫描录入(本次补充)**:用相机扫网站绑定两步验证时给的二维码,自动解析出密钥填入表单。
  - **做法**:
    1. 纯解析逻辑放 `lib/totp.ts`:`parseOtpauthUri(uri)` 解析 `otpauth://totp/<label>?secret=...&issuer=...&period=...&digits=...`,取出 `secret`(并顺带解析 issuer/period/digits);`extractTotpSecret(scanned)` 兼容两种二维码内容——标准 `otpauth://` URI 或「裸 Base32 密钥」。均为纯函数、加单测(含畸形输入、非 totp scheme、缺 secret、非法 Base32)。
    2. 相机:新增依赖 `expo-camera`,组件 `components/totp-scanner/` 用 `CameraView` + `barcodeScannerSettings={{ barcodeTypes:['qr'] }}` + `onBarcodeScanned`;`useCameraPermissions` 处理授权(未授权显示「允许使用相机」引导,拒绝可重试);扫到后 `extractTotpSecret` 解析,成功回填、失败提示「无效二维码」并允许继续扫。
    3. 入口:`FieldTotp` 在密钥输入框旁加「扫描二维码」按钮,打开全屏扫码 Modal,结果经 Controller 的 `onChange` 写入 `totpSecret`。
    4. 配置:`app.config.ts` 注册 `expo-camera` 插件并写入 `NSCameraUsageDescription`(`cameraPermission`)。
  - **取舍**:仍只存 `secret`(Base32),period/digits/algorithm 用默认(30s / 6 位 / SHA-1),覆盖绝大多数站点;非默认参数暂不持久化(需扩 schema,后续再说)。一次扫描只触发一次(防抖)。
- [~] AI 导入 / 备份导入导出同步:DB/类型层已支持该字段(默认 `null`);AI 导入暂不抽取 TOTP 种子,备份导出由 0009 负责对齐。

## 验收 / 测试标准
- [x] 用已知种子与标准测试向量比对(RFC 6238 Appendix B SHA-1 6/8 位向量 + RFC 4226 Appendix D HOTP),生成的验证码与 Google Authenticator 一致。
- [x] 倒计时与刷新准确(30s 周期边界:t=0→30、t=1→29、t=29→1、t=30→30,均有单测覆盖)。
- [x] 迁移在已有库上平滑升级,旧数据不受影响(防御式 `ADD COLUMN` + drizzle 迁移条目双保险)。
- [x] 种子在库中为加密态(非明文):`encryption.ts` 的加/解密与 legacy 重加密路径已纳入 `totp_secret`。

## 涉及文件
- `packages/db/src/schema.ts`、`migrations.generated.ts`、`types.ts`
- 新增 `apps/mobile/src/lib/totp.ts`
- `apps/mobile/src/screens/password-detail/render.tsx`、`components/password-form/*`
- 复用:`apps/mobile/src/components/circular-progress/`

## 依赖
- 复制功能建议在 [0003](./0003-sensitive-data-exposure.md) 之后(用 `copySensitive`)。涉及 DB 迁移,需与 desktop 协调 schema 一致。

## 进度记录
- 2026-06-18:完成 TOTP 存储与展示。
  - **数据层**:`schema.ts` 新增可空 `totp_secret`;`migrations.generated.ts` 新增 drizzle 条目 `m0002`(`ALTER TABLE passwords ADD totp_secret text`),同时在 `database.ts#repairLegacyPasswordsTable` 加入防御式 `ADD COLUMN`(对齐 `icon` 先例),确保已迁移库与 legacy 库在 `expo-sqlite`/`better-sqlite3` 上均平滑升级。
  - **加密**:`encryption.ts` 将 `totp_secret` 纳入 `createEncryptedAdapter` 的加/解密及 legacy 明文重加密路径,库中为加密态。
  - **迁移取舍**:优先采用真实 drizzle 迁移条目;由于本 worktree 不便重跑 drizzle-kit 生成 bundle,手写 `m0002` 条目并辅以防御式 ALTER,二者叠加幂等。
  - **TOTP 算法**:`apps/mobile/src/lib/totp.ts` 为纯实现(Base32 解码 + 内联 HMAC-SHA1 + 动态截断)。未依赖 `@noble/hashes`(其仅为 `@repo/db` 的传递依赖、未在 mobile 直接声明),内联以避免提升风险;全程 `Uint8Array`/`DataView`,无 `BigInt`,Hermes 安全。
  - **测试**:`__tests__/totp.test.ts` 覆盖 RFC 6238(SHA-1,6/8 位)与 RFC 4226 HOTP 测试向量、Base32 解码、周期边界,共 23 例全绿。
  - **UI**:详情页新增 `components/totp-card`(每秒刷新、倒计时圆环、≥44pt 复制按钮、`copySensitive`);表单新增 `field-totp`(Base32 校验,错误经 i18n)。i18n 新增 `totp` 命名空间(en/zh 键对齐)。
  - **校验**:`packages/db`、`apps/mobile`、`apps/desktop` 三处 `tsc --noEmit` 全绿;`vitest` 93 例全绿;改动文件 eslint 通过。desktop 侧因共享 `PasswordInput` 类型变更,对 4 处构造点补 `totp_secret: null`(additive)。
  - **待办**:`otpauth://` 二维码扫描、备份导入导出对该字段的端到端同步(随 0009),以及真机回归。
