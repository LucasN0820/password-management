# 0011 · 泄露检测(HIBP k-anonymity)

- **优先级**:🟢 低(功能,可选;需联网)
- **类型**:功能
- **状态**:✅ 已完成并验证(2026-06-19)
- **预估工作量**:S–M(1 天)

## 背景与问题
检测密码是否出现在已知泄露库中,是密码管理器的高价值能力。可用 **Have I Been Pwned「Pwned Passwords」range API + k-anonymity**:本地对密码做 SHA-1,只把哈希**前 5 位**发给服务端,返回该前缀下的所有后缀,本地比对——**不上传完整密码或哈希**,与本项目「隐私优先」定位基本契合。

## 任务详情
- [x] 实现 k-anonymity 查询:`SHA1(password)` → 取前 5 位请求 `range/{prefix}` → 本地匹配后缀,得到泄露次数。
- [x] 集成进 [0008 安全审计仪表盘](./0008-password-health-dashboard.md):新增「已泄露」分类与计数。
- [x] **默认关闭 + 明确告知**:开关以本特性自有的 SecureStore 键持久化(未改设置 store),以附加 `<Section>` 形式置于安全检查页(`screens/health`),并说明「仅发送哈希前 5 位」。
- [x] 失败/离线优雅降级,不阻塞其它功能(失败标记为 partial 并提供「重新检测」)。
- [x] 结果缓存:按 5 位前缀缓存 range 响应,相同前缀/相同密码不再重复请求。

## 验收 / 测试标准
- [x] 用已知被泄露密码(如 `password`,SHA1 `5BAA6…`)检测到 >0 次;用强随机密码检测为 0(单元测试覆盖)。
- [x] 单元测试断言请求 URL 仅含 5 位前缀,不含完整密码 / 完整哈希。
- [x] 功能默认关闭;离线/服务错误时不报错、不卡死(`{ failed: true }` 优雅降级)。

## 涉及文件
- 新增 `apps/mobile/src/features/breach-check/`
- 接入 `apps/mobile/src/screens/health/`(0008)
- 设置开关:`apps/mobile/src/screens/settings/`(0004)

## 依赖
- 依赖 [0004](./0004-settings-screen.md)(开关)与 [0008](./0008-password-health-dashboard.md)(展示宿主)更完整;核心查询逻辑可独立实现与测试。

## 进度记录
- 2026-06-18:实现 HIBP「Pwned Passwords」range API + k-anonymity 泄露检测。
  - 纯逻辑(可测,无原生/网络依赖):`features/breach-check/hibp.ts`(前缀/后缀切分、range 响应解析)、`lookup.ts`(按前缀缓存的单哈希查询,注入 `fetch`)、`scan.ts`(整库扫描 + 同密码去重)。
  - 原生封装:`client.ts` 经 `expo-crypto` `digestStringAsync` 计算 SHA-1(唯一引入原生模块处);`breach-check-store.ts`(zustand)持有开关、状态、结果与跨扫描的前缀缓存。
  - **默认关闭、仅 opt-in**:开关以本特性自有键 `password-management.breach-check.v1` 持久化于 `expo-secure-store`(未触碰设置 store/类型),UI 以附加 `<Section>` 加在 `screens/health/index.tsx`。
  - **隐私**:仅向 `api.pwnedpasswords.com/range/<前 5 位>` 发送 SHA-1 哈希的前 5 位十六进制,绝不发送完整密码或完整哈希(并带 `Add-Padding` 头);单元测试对此断言。
  - i18n:新增 `breach` 顶级命名空间(en/zh 键对齐,含 `count_one`/`count_other`)。
  - 校验:`vitest` 全绿(77 passed,新增 19 个 breach-check 用例);`tsc --noEmit` 通过;`eslint` 通过。
  - 2026-06-19 用户真机回归通过:默认关、开启后扫描、已泄露密码检出、离线优雅降级,仅发送 5 位哈希前缀均确认正常。**任务全部完成。**
