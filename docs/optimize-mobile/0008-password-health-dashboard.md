# 0008 · 密码安全审计仪表盘

- **优先级**:🟢 中低(功能)
- **类型**:功能
- **状态**:✅ 已完成(2026-06-18,待真机回归)
- **预估工作量**:M(1.5 天)

## 背景与问题
桌面端 i18n 已有「强密码统计 / 仪表盘」概念(`home.totalPasswords` / `home.strongPasswords` 等),但移动端没有任何安全总览。可借此**复活未被使用的 home 仪表盘文案**,给用户一个「保险箱健康度」入口。

数据已具备:`updated_at` / `created_at` 可判断「久未更新」;明文可在内存中比较以判断「弱 / 重复」。

## 任务详情
- [x] 新增「安全总览 / 健康度」页面或卡片,统计:
  - **弱密码**:长度不足 / 字符多样性低(抽成共享强度评估函数 `password-strength.ts`)。
  - **重复使用**:同一明文密码被多个条目使用。
  - **过期 / 久未更新**:`updated_at` 超过阈值(默认 1 年)。
  - 总数、收藏数、问题总数等基础统计。
- [x] 每类给出问题清单,点击可跳转到对应条目(`/password/[id]`)处理。
- [x] 计算在本地完成,不联网(纯函数 `auditVault`);仅在页面挂载时按需计算,避免长时间持有明文。
- [x] 文案接入 i18n(新增独立 `health.*` 命名空间,en/zh 双语对齐)。

## 验收 / 测试标准
- [x] 构造测试数据:含弱密码、重复密码、过期密码 → 各分类计数正确(vitest 13 例,含 5000 条大库冒烟)。
- [x] 点击问题项能定位到对应密码(`router.push('/password/[id]')`)。
- [x] 大量数据(数百/数千条)下计算无明显卡顿(O(n) Map 分组,无嵌套扫描)。

## 涉及文件
- 新增 `apps/mobile/src/screens/health/`(或 home dashboard)
- 抽取共享强度评估:`apps/mobile/src/lib/password-strength.ts`(与 0001 / generator 复用)
- 复用 store:`apps/mobile/src/store/passwordStore.ts`
- i18n:`packages/i18n/src/locales/*`

## 依赖
- 建议在 [0001](./0001-generator-csprng.md) 抽出的强度函数之后做(复用);无强阻塞。

## 进度记录
- 2026-06-18:实现完成。
  - 新增纯函数模块 `apps/mobile/src/lib/password-strength.ts`:`scorePassword` / `classifyStrength` / `isWeak`(0-6 分,弱 0-2、中 3-4、强 5-6),以及 `auditVault`(弱 / 重复 / 久未更新 + 总数,O(n) Map 分组,可注入 `now` / `staleMs` 便于测试)。配套 `__tests__/password-strength.test.ts`(13 例,含 5000 条大库冒烟)。
  - 新增页面 `apps/mobile/src/screens/health/index.tsx`:三张汇总卡(总数 / 收藏 / 问题数)+ 弱 / 重复 / 久未更新分类清单;空库与全清空态有专属占位;条目点击跳转 `/password/[id]`;含本地计算隐私说明。`useMemo` 仅在 `passwords` 变化时重算。
  - 路由 `apps/mobile/src/app/health.tsx`(镜像 `settings.tsx`),并在 `screens/root/render.tsx` 注册 `<Stack.Screen name="health" />`。
  - 入口:设置页(`screens/settings/index.tsx`)顶部新增「安全检查」可点击行,导航至 `/health`。
  - i18n:en/zh 各新增独立 `health.*` 命名空间(20 个 key,完全对齐),未触碰其它命名空间。
  - 阈值与定义:弱 = 强度评分 ≤ 2;重复 = 同一非空明文密码被 ≥2 个条目使用;久未更新 = `updated_at` 距今 > 1 年(无法解析的时间戳视为「不过期」以免误报;兼容 SQLite `CURRENT_TIMESTAMP` 空格分隔的 UTC 格式)。
  - 校验:`vitest run apps/mobile/src` 46/46 通过;`tsc --noEmit` 无错;改动文件 `eslint` 无错。
  - 备注:generator 仍保留其内联 `getStrength`(避免冲突),后续可改为复用本模块。
