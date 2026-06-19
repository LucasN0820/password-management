# 0007 · 状态管理修复(重复加载 / store 重建 / 错误边界)

- **优先级**:🟡 中(健壮性)
- **类型**:健壮性 / Bug
- **状态**:⬜ 未开始
- **预估工作量**:S–M(0.5–1 天)

## 背景与问题
几处状态与数据流缺陷:

1. **重复加载数据**:`PasswordProvider` 已在挂载时 `loadPasswords()` + `loadCategories()`(`providers/PasswordProvider.tsx:9-10`),而 `Home` 又在自己的 useEffect 里再调一次 `loadPasswords()`(`routes/Home/index.tsx:40`),造成冗余请求。
2. **Password 页 store 每次重建**:`const store = useMemo(() => createStore(), [])`(`routes/Password/index.tsx:8`),组件重挂载时新建 store 实例,丢失既有 modal 状态。
3. **数据加载无错误处理 / 无 ErrorBoundary**:`PasswordProvider` 的加载失败会静默(无 catch),全仓未发现 `ErrorBoundary`。
4. **SpotlightSearch 混用 hook 与 getState**:`searchPasswords` 内用 `usePasswordStore.getState()` 取 `filteredPasswords`(`components/SpotlightSearch.tsx:24`),与 hook 订阅混用,读到的可能不是订阅快照。

## 任务详情
- [ ] 移除 `Home` 中重复的 `loadPasswords()`,统一由 `PasswordProvider` 负责首次加载;Home 仅消费数据。
- [ ] 修正 Password 页 store 生命周期:将 store 提升为模块单例,或确保 Provider 包裹层级稳定不随路由重挂,保留 modal 状态。
- [ ] `PasswordProvider` 加载加 try-catch 与失败态(至少记录 + 可重试);新增应用级 `ErrorBoundary` 包裹路由树,渲染期异常有兜底 UI。
- [ ] SpotlightSearch:统一从 hook 订阅获取数据,去除 `getState()` 混用;补齐 useEffect 依赖。

## 验收 / 测试标准
- [ ] 进入首页时 `loadPasswords` 仅触发一次(可加日志/断点核实)。
- [ ] 打开 Password 页弹窗后切换路由再返回,modal/选中态符合预期不丢失。
- [ ] 模拟加载失败:出现错误态而非白屏/静默;ErrorBoundary 捕获子树抛错并展示兜底。
- [ ] Spotlight 搜索结果与列表数据一致,输入即时更新无陈旧值;`tsc`/`eslint` 通过。

## 涉及文件
- 改 `apps/desktop/src/routes/Home/index.tsx`(移除重复加载)
- 改 `apps/desktop/src/routes/Password/index.tsx`、`Password/context.tsx`(store 生命周期)
- 改 `apps/desktop/src/providers/PasswordProvider.tsx`(错误处理),新增 `apps/desktop/src/components/ErrorBoundary.tsx` 并在 `App.tsx` 接入
- 改 `apps/desktop/src/components/SpotlightSearch.tsx`(去 getState、补依赖)

## 依赖
- 无强依赖。四个子项彼此独立,可分别提交与测试。
