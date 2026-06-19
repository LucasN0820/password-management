# 0012 · 生成器增强(排除相似 / 口令模式 / 历史)

- **优先级**:🟢 低(体验增强)
- **类型**:体验
- **状态**:✅ 已完成并验证(2026-06-19)
- **预估工作量**:M(1 天)

## 背景与问题
生成器可用,但缺少几项常见增强能力:

1. **「排除相似字符」开关 i18n key 已存在但未实现**:`generator.excludeSimilar`(`l, 1, O, 0`)在 `en.json:47` 有,但 `generator/index.tsx` 只有四个字符类开关,无该项。
2. **无 passphrase / 易记口令模式**(如 `correct-horse-battery-staple` 风格)。
3. **无生成历史**(无法找回上一次生成但未保存的密码)。

## 任务详情
- [x] **排除相似字符**:新增开关,启用时从字符集剔除易混淆字符(`i l 1 I | o O 0`,见 `SIMILAR_CHARS`);接已有 i18n key。空池(剔除后为空的字符类)会自动跳过。
- [x] **口令模式(passphrase)**:内置 256 词词库(`wordlist.ts`),按可配置词数(3–10)/分隔符(`- . 空格 _`)/大小写(全小写/首字母/全大写)生成;顶部分段切换「随机字符 / 口令」两种模式。
  - 取词复用 [0001](./0001-generator-csprng.md) 的 `secure-random`:导出 `createRandomIndex`(基于既有 rejection-sampling 字节流),`generatePassphrase` 以注入的 index-provider 取词,**不使用 `Math.random`**。
- [x] **生成历史**:会话内存保留最近 5 条(去重),可快速复制(走 `copySensitive`)/保存;页面卸载时清空当前值与历史,符合敏感数据生命周期。
- [x] 强度评估改为基于熵估算(`passwordEntropyBits` / `passphraseEntropyBits` / `strengthFromEntropy`),口令模式按 `词数·log2(词库大小)` 计算;展示「X bits of entropy」,文案走 i18n。

## 验收 / 测试标准
- [x] 开启「排除相似」后,生成结果不含被排除字符(单元测试覆盖 300 字符样本)。
- [x] 口令模式产出符合配置(词数/分隔符/大小写),且用 CSPRNG(注入式 index-provider 单测 + 均匀分布测试)。
- [x] 历史可查看/复制/保存,离开页面后清空(`useEffect` 卸载清理)。
- [x] 全部新增文案在中/英下 key 对齐(i18n parity 测试通过)。

## 涉及文件
- `apps/mobile/src/screens/generator/index.tsx`
- 复用:`apps/mobile/src/lib/secure-random.ts`(0001)、`copySensitive`(0003)
- 新增词库:`apps/mobile/src/lib/wordlist.ts`
- i18n:`packages/i18n/src/locales/*`

## 依赖
- 强依赖 [0001](./0001-generator-csprng.md)(CSPRNG 工具);复制功能建议接 [0003](./0003-sensitive-data-exposure.md)。

## 进度记录
- 2026-06-18:实现完成。
  - `secure-random.ts`:`generateSecurePassword` 新增 `excludeSimilar` 选项(空池自动跳过);导出 `SIMILAR_CHARS` / `stripSimilar`、`createRandomIndex`(复用既有 rejection-sampling 字节流,不重复造轮子)、`generatePassphrase`、`passwordEntropyBits` / `passphraseEntropyBits` / `strengthFromEntropy` / `poolSizeFor`。既有导出保持不变。
  - 新增 `wordlist.ts`:256 个 4 字母常用词(全小写、无重复),每词约 8 bit 熵(4 词≈32 bit,6 词≈48 bit)。
  - `screens/generator/index.tsx`:重写为「随机字符 / 口令」双模式;新增排除相似开关、口令词数 stepper、分隔符/大小写分段控件、会话历史卡片(复制/清除,卸载清理)、基于熵的强度条与 bits 展示。触控目标 ≥44pt,补充 accessibility 标签。
  - i18n:`generator` 命名空间新增 17 个 key(en/zh 对齐);未触碰其他命名空间。
  - 纯逻辑单测:`__tests__/generator-enhancements.test.ts`(15 例,注入随机源,确定性,无原生依赖)。
  - 验证:`vitest run apps/mobile/src` 73 passed;`tsc --noEmit` 通过;`eslint`(含 `--fix`)通过。
  - 2026-06-19 用户真机回归通过:排除相似、口令模式(词数/分隔符/大小写)、熵显示、历史复制均正常。**任务全部完成。**
