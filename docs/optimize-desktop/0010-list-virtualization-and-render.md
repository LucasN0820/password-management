# 0010 · 列表虚拟化与渲染优化

- **优先级**:🟢 较低(性能)
- **类型**:性能
- **状态**:✅ 已完成
- **预估工作量**:S–M(0.5–1 天)

## 背景与问题

1. **长列表未虚拟化**:`routes/Password/list.tsx` 的密码列表与 `routes/Onboard/index.tsx` 的候选(candidates)列表都是全量渲染;数据量大(数百+)时 DOM 过多、滚动卡顿。Onboard 每条候选还带复杂表单,代价更高。
2. **渲染期重复创建对象**:`routes/Home/index.tsx` 的 Framer Motion `containerVariants`/`itemVariants` 与快捷操作内联 action 对象每次渲染重建,造成无谓的引用变化。

## 任务详情

- [x] 引入虚拟列表(如 `@tanstack/react-virtual` 或 `react-window`)改造密码列表;数据量小时仍可走普通渲染,设阈值切换。
- [x] Onboard 候选列表:虚拟化或分页;高频 `updateCandidate` 用 `useDeferredValue`/`useTransition` 降低渲染压力。
- [x] Home:把动画 variants、静态 action 配置提到组件外(模块常量)或 `useMemo`;列表项回调用 `useCallback`/`memo`,减少重渲染。

## 验收 / 测试标准

- [ ] 大数据量(密码 1k+、候选 200+)下滚动与输入流畅,渲染节点数显著下降(React DevTools/性能面板核实)。
- [ ] 虚拟化后键盘上下导航、选中、复制等交互不回退。
- [x] `tsc`/`eslint` 通过。
- [ ] 手动确认视觉/动画无明显回退。
- [ ] 手动:小数据量与大数据量两种场景走查。

## 涉及文件

- 改 `apps/desktop/src/routes/Password/list.tsx`、`routes/Onboard/index.tsx`
- 改 `apps/desktop/src/routes/Home/index.tsx`(variants/action 外提、memo)
- 可能新增依赖:`@tanstack/react-virtual`

## 依赖

- 无强依赖。与 [0009](./0009-search-performance.md) 同为列表性能,可前后衔接但独立测试。
