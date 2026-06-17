# 0012 · 生成器增强(排除相似 / 口令模式 / 历史)

- **优先级**:🟢 低(体验增强)
- **类型**:体验
- **状态**:⬜ 未开始
- **预估工作量**:M(1 天)

## 背景与问题
生成器可用,但缺少几项常见增强能力:

1. **「排除相似字符」开关 i18n key 已存在但未实现**:`generator.excludeSimilar`(`l, 1, O, 0`)在 `en.json:47` 有,但 `generator/index.tsx` 只有四个字符类开关,无该项。
2. **无 passphrase / 易记口令模式**(如 `correct-horse-battery-staple` 风格)。
3. **无生成历史**(无法找回上一次生成但未保存的密码)。

## 任务详情
- [ ] **排除相似字符**:新增开关,启用时从字符集剔除易混淆字符(`l 1 I | O 0` 等);接已有 i18n key。
- [ ] **口令模式(passphrase)**:内置词库,按可配置词数/分隔符/大小写生成;切换「随机字符 / 口令」两种模式。
  - 取词必须用 CSPRNG(复用 [0001](./0001-generator-csprng.md) 的 `secure-random`)。
- [ ] **生成历史**:本地保留最近 N 条(仅会话内存或加密短期存储),可快速复制/保存,注意敏感数据生命周期(配合 0003)。
- [ ] 强度评估与口令模式适配(熵估算),文案走 i18n。

## 验收 / 测试标准
- [ ] 开启「排除相似」后,生成结果不含被排除字符。
- [ ] 口令模式产出符合配置(词数/分隔符/大小写),且用 CSPRNG。
- [ ] 历史可查看/复制/保存,离开页面后按设计清理。
- [ ] 全部新增文案在中/英下正常。

## 涉及文件
- `apps/mobile/src/screens/generator/index.tsx`
- 复用:`apps/mobile/src/lib/secure-random.ts`(0001)、`copySensitive`(0003)
- 新增词库:`apps/mobile/src/lib/wordlist.ts`
- i18n:`packages/i18n/src/locales/*`

## 依赖
- 强依赖 [0001](./0001-generator-csprng.md)(CSPRNG 工具);复制功能建议接 [0003](./0003-sensitive-data-exposure.md)。

## 进度记录
- _(待填写)_
