# 0005 · 分类(Category)UI

- **优先级**:🟠 中高(性价比最高:后端已现成)
- **类型**:功能
- **状态**:✅ 已完成(2026-06-18,待真机回归)
- **预估工作量**:M(1 天)

## 背景与问题
数据层与 store **已完整支持分类**,但移动端 UI 完全没暴露:
- Schema 有字段:`packages/db/src/schema.ts` → `category`(默认 `'all'`)+ 索引 `idx_passwords_category`。
- Store 已有:`selectedCategory`、`setSelectedCategory`、`categories`、`loadCategories`、`applyFilters`(按分类过滤)——见 `packages/db/src/store.ts`。
- 但 `apps/mobile/src/screens/password/render.tsx` 只有写死的 `all` / `favorites` 两个分段,未用到分类。

也就是说,加分类筛选/管理几乎是「免费」的——后端逻辑都在。

## 任务详情
- [x] 列表页用**横向可滚动 chips** 替换原写死的 `all`/`favorites` 分段:`all` / `favorites` / 各自定义分类。分类从已加载的 `passwords` 派生(始终与增删改同步,无需额外 DB 调用)。
- [x] 选择分类调 store 的 `setSelectedCategory`,**统一复用 store 的 `applyFilters`**;列表直接渲染 `filteredPasswords`,删除了原先的本地 `activeTab` + 本地过滤(过滤逻辑收口到一处)。
- [x] 新增 `FieldCategory`(`password-form`):已有分类 chips(含「Uncategorized」)+ 自由文本输入新建;写入 `category`,提交时 `normalizeCategoryInput` 去空白(空→`all`)。
- [x] 空/默认回退:未分类即 `all`;若当前选中的自定义分类消失(最后一条被删/改类)自动回退 `all`,旧数据不受影响。
- [x] 列表项展示轻量分类标签(`isCustomCategory` 时显示小 pill)。
- [x] 把分类纯逻辑抽到 `src/lib/categories.ts`(`deriveCategories`/`isCustomCategory`/`normalizeCategoryInput`),render 与表单共用、去重,并可单测。

## 验收 / 测试标准
- [x] 纯逻辑单测(`categories.test.ts`,7 个):派生(去重/排序/排除虚拟分类与空值)、`isCustomCategory`、输入归一。
- [x] `tsc`/`eslint` 通过;全量 `vitest run apps/mobile/src` → 33 passed。
- [ ] 真机回归:① 新建/编辑可指定分类,列表按分类正确过滤;② chips 与 `all`/`favorites` 切换无冲突;③ 既有无分类数据归入 `all` 正常;④ 编辑分类后持久化、刷新保留;⑤ 列表项分类标签显示正常。

## 涉及文件
**新增**
- `apps/mobile/src/lib/categories.ts`(纯逻辑:派生/判定/归一)
- `apps/mobile/src/lib/__tests__/categories.test.ts`(7 个 vitest 用例)
- `apps/mobile/src/components/password-form/field-category.tsx`(分类选择字段)

**改动**
- `apps/mobile/src/screens/password/render.tsx`(chips 筛选 + 改用 store `selectedCategory`/`applyFilters`,移除本地 tab)
- `apps/mobile/src/components/password-form/index.tsx`(挂载 `FieldCategory` + 提交归一 category)
- `apps/mobile/src/components/password-item/index.tsx`(列表项分类标签)

**复用**:`packages/db/src/store.ts`(`selectedCategory`/`setSelectedCategory`/`applyFilters`)、`packages/db/src/database.ts`、`packages/db/src/encryption.ts`(`getCategories` 透传,本任务实际改为从 `passwords` 派生,避免刷新时序问题)。

## 依赖
- 无。后端能力已具备,独立完成。

## 进度记录
- 2026-06-18 完成实现 + 纯逻辑单测。
  - 决策:分类 chips 从已加载 `passwords` 派生而非调用 `getCategories`/`loadCategories`,天然随增删改同步,省一次 DB 往返、规避 `updatePassword` 不刷新分类列表的时序问题。
  - 过滤收口:删除 render 的本地 `activeTab`,统一走 store 的 `selectedCategory` + `applyFilters`;搜索时仍由 `searchPasswords` 接管。
  - 纯逻辑抽到 `lib/categories.ts`,render/表单/列表项共用,vitest 直接可测。
  - 验证:`vitest run apps/mobile/src` → 33 passed;`tsc`/`eslint` 通过。
- 待办:真机回归(增删改分类、过滤、标签、持久化)。
- 备注:`FieldCategory` 的「CATEGORY / Uncategorized / New category…」与既有表单字段一样为硬编码英文,留待 [0006](./0006-i18n-completion.md) 统一 i18n(已在该任务记一笔)。
