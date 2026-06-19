# 0001 · 剪贴板敏感数据自动清除

- **优先级**:🔴 最高(安全硬伤)
- **类型**:安全修复
- **状态**:⬜ 未开始
- **预估工作量**:S(0.5 天)

## 背景与问题
复制密码后**剪贴板永不清除**,内容长期留存,其它 App 甚至剪贴板历史可读到明文。当前所有复制路径都只写入、不清理:

```ts
// apps/desktop/electron/preload.ts:80
copyToClipboard: (text: string): Promise<void> => {
  clipboard.writeText(text);            // 只写,无清除
  return Promise.resolve();
}
```

渲染层多处直接复制也无清除:
- `src/routes/Password/detail.tsx:36`(`navigator.clipboard.writeText` 复制用户名/密码)
- `src/routes/PasswordGenerator/index.tsx:97`(复制生成的密码)
- `src/components/SpotlightSearch.tsx:56`(选中条目复制)

移动端已在 [optimize-mobile/0003](../optimize-mobile/0003-sensitive-data-exposure.md) 用 `copySensitive` 解决,桌面端应对齐。

## 任务详情
- [ ] 在主进程统一收口复制能力:`preload.ts` 的 `copyToClipboard` 复制后启动定时器(默认 30s),到期**先比对 `clipboard.readText()` 仍等于该值再清空**,避免误清用户后续复制的新内容。
  - 新复制时取消上一个定时器(`cancelScheduledClear`),避免旧定时器误清新值。
  - 暴露可配置时长(默认常量 `DEFAULT_CLIPBOARD_CLEAR_MS = 30_000`),为后续设置页接入留接口。
- [ ] 渲染层统一改走该能力(经 `window.electronAPI.copyToClipboard`),移除散落的 `navigator.clipboard.writeText` 裸调用:detail / generator / spotlight 三处。
  - 抽一个 `useCopyToClipboard` hook 收口「复制 + 复制态反馈(已复制 1.5s)」,与 [0006](./0006-form-and-util-dedup.md) 配合。
- [ ] 用户名等低敏感字段可保留普通复制,但建议同样走统一入口,行为一致。

## 验收 / 测试标准
- [ ] 单测(纯函数 `shouldClearClipboard`):仅当剪贴板仍是该敏感值时返回 true;时长 <=0 不清。
- [ ] 单测:复制即写入;到期清空;期间复制他物不被清;新复制取消旧定时器。
- [ ] `tsc --noEmit` 通过;`eslint`(改动文件)通过。
- [ ] 手动:复制密码约 30s 后剪贴板被清;期间手动复制其它文本不受影响;detail/generator/spotlight 三处行为一致。

## 涉及文件
- 改 `apps/desktop/electron/preload.ts`(`copyToClipboard` 增加定时清除 + 比对 + 取消逻辑)
- 新增 `apps/desktop/src/lib/clipboard.ts` 或纯规则函数(便于单测 `shouldClearClipboard`)
- 改 `apps/desktop/src/routes/Password/detail.tsx`、`PasswordGenerator/index.tsx`、`components/SpotlightSearch.tsx`(统一走 `copyToClipboard`)
- 参考:`apps/mobile/src/lib/clipboard.ts`(同构实现)

## 依赖
- 无。可独立完成与测试。复制态反馈 hook 与 [0006](./0006-form-and-util-dedup.md) 可合并实现,但不互相阻塞。
