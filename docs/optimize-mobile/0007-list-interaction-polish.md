# 0007 · 列表与交互打磨(删除撤销 / 排序 / 搜索修复 / favicon)

- **优先级**:🟡 中(体验)
- **类型**:体验 / 交互
- **状态**:⬜ 未开始
- **预估工作量**:M(1–1.5 天)

## 背景与问题
列表页若干交互细节可显著提升体验,且彼此独立、可分别合入。

1. **删除无撤销**:删了就没了,误删无法挽回。
2. **搜索框对每个按键 `.trim()`**,导致**查询中间无法输入空格**。
   - `apps/mobile/src/screens/password/render.tsx:274` → `onChangeText={text => setSearchQuery(text.trim())}`
3. **无排序选项**:无法按名称 / 创建时间 / 最近更新排序(`created_at` / `updated_at` 字段已存在)。
4. **favicon 未自动获取**:`icon` 字段存在,但仅在用户手填时才有图;列表/详情多为首字母占位。

## 任务详情
### 7.1 删除撤销
- [ ] 删除后弹 Snackbar/Toast「已删除 · 撤销」,N 秒内可恢复。
- [ ] 实现:软删除缓冲(延迟真正落库),或先暂存被删记录、撤销时 re-insert。

### 7.2 搜索修复
- [ ] 改为输入时不 trim、仅在查询逻辑里 trim(保留中间空格的输入能力)。

### 7.3 排序
- [ ] 列表加排序入口(名称 A→Z / 最近创建 / 最近更新),持久化用户选择(可接 0004 settings store)。

### 7.4 favicon 自动获取(可独立)
- [ ] 有 URL 时按域名拉取站点图标(如 Google favicon 服务或解析 `/favicon.ico`),缓存到 `icon` 字段或本地缓存。
- [ ] 失败回退到现有首字母占位(`getDomainIcon`)。
- [ ] 注意隐私定位:favicon 拉取会产生网络请求,建议在设置中可关闭,默认行为需明确。

## 验收 / 测试标准
- [ ] 删除后出现「撤销」,点击可恢复;超时后真正删除。
- [ ] 搜索可输入含空格的查询且能命中。
- [ ] 切换排序方式,列表顺序正确并在重启后保留。
- [ ] 有 URL 的条目能显示站点图标,无 URL / 拉取失败回退首字母。

## 涉及文件
- `apps/mobile/src/screens/password/render.tsx`
- `apps/mobile/src/components/password-item/index.tsx`
- `apps/mobile/src/store/passwordStore.ts` / `packages/db/src/store.ts`(排序 / 软删除)
- (favicon)新增 `apps/mobile/src/lib/favicon.ts`

## 依赖
- 无强依赖;排序/favicon 的开关可接 [0004](./0004-settings-screen.md)。四个子项可分别独立测试。

## 进度记录
- _(待填写)_
