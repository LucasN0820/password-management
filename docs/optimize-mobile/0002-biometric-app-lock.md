# 0002 · 生物识别应用锁与自动锁

- **优先级**:🔴 高(安全)
- **类型**:安全功能
- **状态**:⬜ 未开始
- **预估工作量**:M(1.5–2 天)

## 背景与问题
当前 App 启动后直接进入 tabs,**没有任何门禁**:

```tsx
// apps/mobile/src/screens/root/render.tsx —— 直接渲染 Stack/(tabs)
```

vault key 虽然存在 `expo-secure-store`,但只要手机处于解锁状态、App 被打开,**全部密码即明文可见**。`expo-local-authentication` 尚未进入依赖。对密码管理器来说,应用锁是最该有的能力。

## 任务详情
- [ ] 引入 `expo-local-authentication`,实现 Face ID / Touch ID / 设备 PIN 回退解锁。
- [ ] 新增「锁屏 Gate」组件,包裹在 `root` 之上;未通过认证时只显示锁屏,认证通过后才渲染 `(tabs)`。
- [ ] **后台自动锁**:监听 `AppState`,App 进入后台/超过可配置超时(默认如 1 分钟)后回到前台需重新认证。
  - 可参考 `features/model-download/download-provider.tsx` 已有的 AppState 处理范式。
- [ ] **首次解锁后再展示内容**:确保在认证完成前不渲染任何明文(包括从后台恢复的瞬间,避免「闪现」)。
- [ ] 解锁失败 / 不支持生物识别的设备:提供 PIN/密码回退或清晰提示。
- [ ] 配置项预留:`是否启用应用锁`、`自动锁超时`(本任务先用合理默认值,具体设置 UI 见 0004;两者解耦,本任务可独立交付默认行为)。

## 验收 / 测试标准
- [ ] 冷启动 App → 出现锁屏 → 生物识别通过 → 进入列表。
- [ ] 将 App 切到后台超过超时再返回 → 需重新认证;短暂切换(小于超时)→ 不打扰。
- [ ] 从后台恢复的过程中,密码列表/详情在认证前不可见(无闪现)。
- [ ] 模拟器/无生物识别设备:回退路径可用,不会被锁死。

## 涉及文件
- `apps/mobile/src/screens/root/`(包裹锁屏 Gate)
- 新增 `apps/mobile/src/features/app-lock/`(provider + 锁屏 UI + AppState hook)
- `apps/mobile/package.json`(新增 `expo-local-authentication`)
- 参考:`apps/mobile/src/features/model-download/download-provider.tsx`

## 依赖
- 无强依赖(自带默认超时)。**配置 UI** 由 [0004 设置页](./0004-settings-screen.md) 提供,可后置。

## 进度记录
- _(待填写)_
