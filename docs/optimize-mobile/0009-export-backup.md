# 0009 · 加密备份导出与 CSV 导出

- **优先级**:🟢 中低(功能 / 容灾)
- **类型**:功能
- **状态**:✅ 已完成(2026-06-18,待真机回归)
- **预估工作量**:M(1.5 天)

## 背景与问题
项目有完整的 **AI 导入**能力,却**没有导出 / 备份**,数据迁移与容灾缺位。换机、卸载即丢失。应提供:
1. **加密备份导出**(推荐):导出受密码保护的加密文件,可再导入。
2. **标准 CSV 导出**(明文,带强警示):用于迁移到其它密码管理器。

## 任务详情
### 9.1 加密备份导出 / 导入
- [x] 设计备份文件格式:沿用 `@repo/db` 的 AES-256-GCM 信封,用用户口令派生密钥加密整库(`.pmbak`,带 magic + version + KDF 元数据)。
- [x] 导出:`expo-file-system/legacy` 写临时文件 + 系统分享(`react-native` `Share`)。
- [x] 导入:`expo-document-picker` 选择备份文件 → 输入口令 → 校验解密 → 合并入库(复用现有 `addPasswords`)。
- [x] 合并策略:去重(按 title+username+url,大小写/空白归一),返回新增 / 跳过计数并提示。

### 9.2 CSV 导出(明文)
- [x] 导出标准列(title,username,password,url,notes)的 CSV(RFC 4180 引号转义,CRLF)。
- [x] 强制二次确认 `Alert` + 明确警示「文件未加密」。
- [x] 与 0003 一致:导出后提示删除临时文件(`deleteExportedFile`)。

## 验收 / 测试标准
- [x] 加密备份导出 → 导入还原,payload 往返一致(单测覆盖)。
- [x] 错误口令导入被正确拒绝(AES-GCM 认证失败 → `BAD_PASSPHRASE`,单测覆盖)。
- [x] CSV 序列化 / 解析往返一致,列顺序无关(单测覆盖);可被自家 AI 导入读取。
- [x] 导入合并去重(库内 + 同次导入)不产生重复(单测覆盖)。
- [ ] 真机回归:导出加密备份 → 卸载重装 / 换机 → 导入还原(待验证)。

## 涉及文件
- 新增 `apps/mobile/src/features/backup/`(导出/导入逻辑)
- 复用:`packages/db/src/encryption.ts`、`apps/mobile/src/store/passwordStore.ts`(`addPasswords`)
- `expo-file-system` / `expo-document-picker`(已在依赖)

## 依赖
- 与 AI 导入(`@repo/ai-import-core`)共享合并/归一逻辑,可复用 `normalize`。无强阻塞。

## 进度记录
- 2026-06-18:实现加密备份导出/导入与 CSV 导出。
  - 纯逻辑模块位于 `apps/mobile/src/features/backup/`(`csv` / `merge` / `envelope` / `passphrase` / `entry`),全部 vitest 覆盖(依赖注入 crypto/随机,无需原生模块)。
  - **KDF**:Expo 无 PBKDF2/scrypt 原语,采用「随机 16 字节盐 + 迭代 SHA-256」拉伸口令(默认 100k 轮);SHA-256 输出 32 字节正好作为 AES-256 密钥。已在 `envelope.ts` 注释说明其强度权衡。
  - **备份格式**:`.pmbak` JSON——`{ magic:'pmgmt.backup', version:1, kdf:{name,salt,iterations}, payload }`,`payload` 复用 `@repo/db` `encryptSecret` 的 AES-256-GCM 信封;导入用 GCM 认证失败判定错误口令。
  - **合并**:按 (title+username+url) 归一指纹去重,既去库内重复也去同次导入重复,首条优先;现有记录不被修改。
  - UI:新增 `screens/backup` + `app/backup.tsx` 路由,在设置页「备份与导出」Section 进入;CSV 导出前强制明文警示 `Alert`,导出后提示删除临时文件。
  - i18n:新增 `backup` 命名空间(en/zh 键对齐,parity 测试通过)。
  - 验证:`vitest run apps/mobile/src` 81 passed;`tsc --noEmit` 通过;eslint 通过。未使用 Hermes 缺失的数组方法。
