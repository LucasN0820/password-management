# 0001 · 密码生成器改用加密安全随机数(CSPRNG)

- **优先级**:🔴 最高(安全硬伤 / Bug)
- **类型**:安全修复
- **状态**:⬜ 未开始
- **预估工作量**:S(0.5 天)

## 背景与问题
当前密码生成器使用 `Math.random()` 取字符:

```ts
// apps/mobile/src/screens/generator/index.tsx:72
pw = pw + chars.charAt(Math.floor(Math.random() * chars.length));
```

`Math.random()` **不是加密安全的**,其输出可被预测。对一个密码管理器而言,这意味着生成的密码存在被推断的风险,属于实打实的安全缺陷。

项目已依赖 `expo-crypto`(`getMobileRandomBytes` 已封装 `Crypto.getRandomBytesAsync`),应改用 CSPRNG,并避免「取模偏置(modulo bias)」。

## 任务详情
- [ ] 新增一个 CSPRNG 取字符的工具函数(建议放 `src/lib/secure-random.ts`,便于复用与单测)。
  - 使用 `expo-crypto` 的 `getRandomBytesAsync` 获取随机字节。
  - 用**拒绝采样(rejection sampling)**消除取模偏置:对字符集长度 N,丢弃 `>= floor(256 / N) * N` 的字节后再取模。
- [ ] 替换 `generator/index.tsx` 中 `generatePassword` 的循环逻辑。
  - 注意:`generatePassword` 当前是同步的;CSPRNG 取字节是异步的 → 将其改为 `async`,或一次性预取足够多的随机字节后同步消费。
- [ ] 保证至少包含每个被勾选字符类各一位(可选增强,提升强度并修复「全部勾选却可能缺类」的弱点)。
- [ ] 复用同一工具函数评估:`desktop` 端是否有同样问题(`apps/desktop` 生成器),如有可在本任务或拆分子任务一并修复。

## 验收 / 测试标准
- [ ] 单测:对工具函数运行 N 万次,统计字符分布无明显偏置(各字符频率在期望 ±合理误差内)。
- [ ] 单测:验证不会产生字符集外字符;长度、勾选项组合均正确。
- [ ] 手动:生成器页 UI 行为不变(按钮、强度条、保存仍工作),无可见卡顿。
- [ ] 代码中不再出现 `Math.random()` 用于密码材料。

## 涉及文件
- `apps/mobile/src/screens/generator/index.tsx`
- 新增 `apps/mobile/src/lib/secure-random.ts`(+ 对应测试)
- 复用参考:`apps/mobile/src/store/vaultKey.ts`(`getMobileRandomBytes`)

## 依赖
- 无。可独立完成与测试。

## 进度记录
- _(待填写:开始/完成时间、PR、备注)_
