# 0007 · 列表与交互打磨(删除撤销 / 排序 / 搜索修复 / favicon)

- **优先级**:🟡 中(体验)
- **类型**:体验 / 交互
- **状态**:✅ 已完成(2026-06-18,待真机回归)
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
- [x] 新增 `features/undo-delete/`:`useDeleteWithUndo`(删除前 `findPassword` 留存整条记录,再删)+ 根部挂载的 `UndoDeleteSnackbar`(底部「已删除 X · 撤销」,5s 内点「撤销」即 `addPassword` 重插)。两处删除弹窗(列表 + 详情)统一改用它。
- [x] 实现方式:先删后存,撤销时 re-insert(新 id,内容一致)。

### 7.2 搜索修复
- [x] 列表搜索框去掉输入时 `.trim()`(`onChangeText={setSearchQuery}`),可正常输入含空格查询。

### 7.3 排序
- [x] 排序入口(名称 A→Z / 最近创建 / 最近更新),经 ActionSheet 选择;偏好持久化进 **settings store**(`sortBy`,接 0004);纯排序逻辑 `lib/sort-passwords.ts`(Hermes 安全,无 `toSorted`)。

### 7.4 favicon 自动获取
- [x] `lib/favicon.ts` 纯函数按域名生成图标 URL(Google favicon 服务);列表项 + 详情页 hero 在开启时用 favicon,`onError` 回退首字母占位。
- [x] 隐私:**默认关闭**,在设置「列表」分区提供开关(`fetchFavicons`),文案标注需联网。

### UI 调整(用户反馈)
- [x] 排序按钮移到列表筛选行右侧、无背景;搜索按钮移到排序左侧、无背景,搜索框展开在筛选行下方。
- [x] 头部仅保留 AI Import + 设置两个图标(顺序:AI Import 在左、设置在右),均**去背景**;AI Import 图标改为 `Sparkles`(AI 星标)。

## 验收 / 测试标准
- [x] 纯逻辑单测:`favicon`(5)+ `sort-passwords`(5)+ settings 合并(含 `sortBy`/`fetchFavicons`)。全量 `vitest run apps/mobile/src` → 58 passed。
- [x] `tsc`/`eslint` 通过;en/zh i18n key 一致(新增 `list.*` 9 个)。
- [ ] 真机回归:① 删除后出现「撤销」可恢复、超时真正删除;② 搜索可输入含空格并命中;③ 切换排序顺序正确且重启保留;④ 开启 favicon 后有 URL 条目显示站点图标、失败回退首字母。

## 涉及文件
- `apps/mobile/src/screens/password/render.tsx`
- `apps/mobile/src/components/password-item/index.tsx`
- `apps/mobile/src/store/passwordStore.ts` / `packages/db/src/store.ts`(排序 / 软删除)
- (favicon)新增 `apps/mobile/src/lib/favicon.ts`

## 依赖
- 无强依赖;排序/favicon 的开关可接 [0004](./0004-settings-screen.md)。四个子项可分别独立测试。

## 进度记录
- 2026-06-18 完成实现 + 纯逻辑单测。
  - 四个子项 + 用户的 UI 调整(排序/搜索移至筛选行右侧并去背景、搜索框下移、头部图标去背景与重排、AI Import 换 `Sparkles`)。
  - 排序/favicon 偏好接入 0004 的 settings store(`sortBy` / `fetchFavicons`),持久化 + 校验。
  - Hermes 安全:`sort-passwords` 用 `[...].sort` + `eslint-disable`,无 `toSorted`。
  - 验证:`vitest run apps/mobile/src` → 58 passed;`tsc`/`eslint` 通过;en/zh key 一致。
- 待办:真机回归(撤销、搜索空格、排序持久化、favicon 开关)。
