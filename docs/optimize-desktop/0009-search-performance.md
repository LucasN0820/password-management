# 0009 · 搜索性能(debounce / 解密搜索收敛)

- **优先级**:🟢 较低(性能)
- **类型**:性能 / 安全(内存暴露)
- **状态**:⬜ 未开始
- **预估工作量**:S–M(0.5–1 天)

## 背景与问题
1. **搜索无 debounce**:`routes/Password/list.tsx` 输入框即时触发搜索,每次按键都跑一遍匹配;密码量大时频繁计算。
2. **内存全量解密搜索**:搜索需把密码解密到内存再匹配(逻辑在共享包 `packages/db`),既增加明文在内存的暴露面,也带来性能开销。

## 任务详情
- [ ] 搜索输入加 debounce(200–300ms),减少高频触发;输入清空时立即复位。
- [ ] 收敛解密搜索:
  - 优先在**非敏感字段**(title/username/url 等已可明文索引的字段)上匹配,避免为搜索解密 password 字段;
  - 若必须解密,限制一次解密/扫描的记录数(分批/上限),并在匹配后尽快释放中间明文变量;
  - 评估在 `packages/db` 加轻量索引或缓存匹配结果。
- [ ] 注意改动落在共享包时**同步评估 mobile 影响**,保持两端行为一致。

## 验收 / 测试标准
- [ ] 单测:debounce 行为(连续输入只触发最后一次);搜索结果正确性不回退。
- [ ] 大数据量(如 1k 条)下输入流畅,无明显卡顿。
- [ ] 若改 `packages/db`:mobile + desktop 搜索均回归通过;`tsc`/`eslint` 通过。
- [ ] 手动:中/英关键字、用户名、URL 搜索结果正确。

## 涉及文件
- 改 `apps/desktop/src/routes/Password/list.tsx`(debounce)
- 视方案改 `packages/db/src/*`(解密搜索收敛,影响 mobile)
- 可新增 `apps/desktop/src/lib/useDebouncedValue.ts`

## 依赖
- 解密搜索收敛若动 `packages/db`,需与 mobile 一并回归。debounce 部分可独立先做。
