# 0001 · 密码生成器改用加密安全随机数(CSPRNG)

- **优先级**:🔴 最高(安全硬伤 / Bug)
- **类型**:安全修复
- **状态**:✅ 已完成(2026-06-17)
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
- [x] 新增 CSPRNG 工具函数 `src/lib/secure-random.ts`(纯函数 + 依赖注入,便于复用与单测)。
  - 通过注入的 `RandomBytesProvider` 取随机字节;App 侧注入 `expo-crypto` 支持的 `getMobileRandomBytes`。
  - 用**拒绝采样(rejection sampling)**消除取模偏置:`randomIndex` 丢弃 `>= floor(256 / N) * N` 的字节后再取模。
  - 字节按批(64B)缓存消费,减少 provider 调用次数。
- [x] 替换 `generator/index.tsx` 中 `generatePassword` 的循环逻辑,改为 `async` 调用 `generateSecurePassword`;`onPress` 用 `() => void generatePassword()` 避免悬空 Promise。
- [x] 保证至少包含每个被勾选字符类各一位,并用 Fisher–Yates(同样走 CSPRNG)打乱位置,避免「保证位」固定在开头。
- [x] `desktop` 端同样修复:`apps/desktop/src/routes/PasswordGenerator/index.tsx` 原 `Math.random()` 已替换为新增的 `apps/desktop/src/lib/secure-random.ts`(同构逻辑,**同步版**,默认 provider 用 WebCrypto `crypto.getRandomValues`),并保留其 `excludeSimilar` 选项。

## 验收 / 测试标准
- [x] 单测:数字字符集 2000×32 采样,各字符频率落在期望 ±15% 内(无明显偏置)。
- [x] 单测:拒绝采样正确性——构造字节 `[252, 7]`,验证偏置字节被跳过(结果为 `'7'` 而非 naïve 的 `'2'`)。
- [x] 单测:不产生字符集外字符;各长度(1/4/8/16/32/64)正确;勾选项组合正确;每个选中类至少一位;支持 async provider;未选任何类返回 `''`。共 **7 个用例全部通过**。
- [x] 类型检查 `tsc --noEmit` 通过;`eslint` 通过。
- [x] 代码中不再出现 `Math.random()` 用于密码材料(mobile **和** desktop)。
- [x] desktop 单测 8 个全部通过(含 `excludeSimilar` 排除 `i l 1 o 0`、长度 300 的 Fisher–Yates 多字节抽样、默认 WebCrypto provider)。
- [x] 手动:mobile + desktop 生成器页 UI 行为(按钮、强度条、保存)各实测确认无可见卡顿。(2026-06-17 用户验证通过)

## 涉及文件
**mobile**
- 新增 `apps/mobile/src/lib/secure-random.ts`(纯 CSPRNG 工具,async + 注入 provider)
- 新增 `apps/mobile/src/lib/__tests__/secure-random.test.ts`(7 个 vitest 用例)
- 改 `apps/mobile/src/screens/generator/index.tsx`(改用 `generateSecurePassword` + 注入 `getMobileRandomBytes`)
- 改 `apps/mobile/package.json`(新增 `"test": "vitest run"`)
- 复用参考:`apps/mobile/src/store/vaultKey.ts`(`getMobileRandomBytes`)

**desktop**
- 新增 `apps/desktop/src/lib/secure-random.ts`(同构工具,**同步版** + WebCrypto 默认 provider,内置 `excludeSimilar`)
- 新增 `apps/desktop/src/lib/__tests__/secure-random.test.ts`(8 个 vitest 用例)
- 改 `apps/desktop/src/routes/PasswordGenerator/index.tsx`(改用 `generateSecurePassword`)
- 改 `apps/desktop/package.json`(新增 `"test": "vitest run"`)

## 依赖
- 无。可独立完成与测试。

## 进度记录
- 2026-06-17 完成 mobile 实现 + 单测。
  - 工具设计为纯函数 + 依赖注入,避免在测试中引入 expo 原生模块,可直接在 Node/vitest 运行。
  - `randomIndex` 后续改为**多字节**抽样,length > 256 时 Fisher–Yates 也不会越界。
- 2026-06-17 完成 desktop 同类修复 + 单测(本次追加)。
  - desktop 为渲染进程,WebCrypto 可同步取随机数 → 工具做成同步版,生成器保持同步(挂载即生成)。
  - 复用同一套拒绝采样 + 至少一类 + Fisher–Yates 逻辑,并内置 `excludeSimilar`。
- 验证(两端均通过):
  - `vitest run apps/desktop/src/lib` → 8 passed;`vitest run apps/mobile/src/lib` → 7 passed。
  - 两端 `tsc --noEmit` 通过;两端 `eslint`(改动文件)通过。
  - 运行单测:仓库根 `node_modules/.bin/vitest run apps/<app>/src/lib`,或各包 `yarn test`(需先 `yarn install` 解析 vitest)。
- 2026-06-17 用户已手动验证 mobile + desktop 生成器,确认无问题。**任务全部完成。**
