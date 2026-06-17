# 0003 · 敏感数据暴露收敛(剪贴板 / 分享 / 防截屏)

- **优先级**:🔴 高(安全)
- **类型**:安全加固
- **状态**:⬜ 未开始
- **预估工作量**:M(1 天)

## 背景与问题
三处明文/长期暴露的风险点:

1. **剪贴板永不清除**:复制密码后一直留在剪贴板,其它 App 可读。
   - `apps/mobile/src/screens/password-detail/render.tsx`(`handleCopy`)
   - `apps/mobile/src/screens/password/render.tsx`(ActionSheet 复制)
   - `apps/mobile/src/screens/generator/index.tsx`(`copyToClipboard`)
2. **分享是明文密码**:`password-detail/render.tsx:121` 直接把 `Password: <明文>` 交给系统 Share Sheet。
3. **无防截屏 / 后台快照遮罩**:详情页显示密码时可被截屏,iOS 应用切换器会留快照。

## 任务详情
### 3.1 剪贴板自动清除
- [ ] 封装统一的 `copySensitive(text)`:复制后启动定时器(默认 ~30s)自动清空剪贴板。
  - 仅当剪贴板内容仍是该敏感值时才清空(避免误删用户后续复制的内容)。
  - iOS 14+ 复制提示可接受;可在 Toast 文案提示「将在 N 秒后清除」。
- [ ] 替换上述三处复制调用为 `copySensitive`。

### 3.2 安全分享
- [ ] 分享默认**不含密码**;或弹二次确认后才包含,文案明确警示。
- [ ] 评估是否保留该功能(密码管理器通常不鼓励明文分享)。

### 3.3 防截屏 / 后台遮罩(可作为子项,可独立合入)
- [ ] Android:详情页/解锁页设置 `FLAG_SECURE`(`expo-screen-capture` 的 `preventScreenCaptureAsync`)。
- [ ] iOS:进入后台时对敏感屏幕加遮罩,避免应用切换器快照泄露。

## 验收 / 测试标准
- [ ] 复制密码 → N 秒后读取剪贴板为空;期间若用户复制了别的内容则不被清空。
- [ ] 分享流程默认不出现明文密码,或有明确二次确认。
- [ ] (Android)在密码详情页尝试截屏被阻止 / 截图为黑屏。
- [ ] 切后台再看应用切换器,敏感内容被遮挡。

## 涉及文件
- 新增 `apps/mobile/src/lib/clipboard.ts`(`copySensitive`)
- `apps/mobile/src/screens/password-detail/render.tsx`
- `apps/mobile/src/screens/password/render.tsx`
- `apps/mobile/src/screens/generator/index.tsx`
- (防截屏)`expo-screen-capture` + 相关屏幕

## 依赖
- 无强依赖。**剪贴板清除时长** 可在 [0004 设置页](./0004-settings-screen.md) 暴露为可配置(本任务先用默认值)。

## 进度记录
- _(待填写)_
