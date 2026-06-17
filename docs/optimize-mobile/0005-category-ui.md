# 0005 · 分类(Category)UI

- **优先级**:🟠 中高(性价比最高:后端已现成)
- **类型**:功能
- **状态**:⬜ 未开始
- **预估工作量**:M(1 天)

## 背景与问题
数据层与 store **已完整支持分类**,但移动端 UI 完全没暴露:
- Schema 有字段:`packages/db/src/schema.ts` → `category`(默认 `'all'`)+ 索引 `idx_passwords_category`。
- Store 已有:`selectedCategory`、`setSelectedCategory`、`categories`、`loadCategories`、`applyFilters`(按分类过滤)——见 `packages/db/src/store.ts`。
- 但 `apps/mobile/src/screens/password/render.tsx` 只有写死的 `all` / `favorites` 两个分段,未用到分类。

也就是说,加分类筛选/管理几乎是「免费」的——后端逻辑都在。

## 任务详情
- [ ] 列表页增加分类筛选 UI(横向可滚动的 chips,或分段下拉),数据来自 `loadCategories()` / store 的 `categories`。
- [ ] 选择分类时调用 `setSelectedCategory`,复用 store 现成的 `applyFilters`(注意与现有 `all`/`favorites` 本地 tab 的关系,统一到一处过滤逻辑)。
- [ ] 新增/编辑密码表单加入「分类」选择(可选已有分类或新建),写入 `category` 字段。
  - 涉及 `src/components/password-form/`(目前字段:title/username/password/url/notes,无 category)。
- [ ] 空/默认分类回退到 `all`,保证旧数据不受影响。
- [ ] 列表项可选展示分类标签(轻量)。

## 验收 / 测试标准
- [ ] 新建密码时可指定分类;列表按分类正确过滤。
- [ ] 分类 chips 与 `all` / `favorites` 切换逻辑一致、无冲突。
- [ ] 既有(无分类)数据归入 `all`,显示正常。
- [ ] 编辑分类后持久化、刷新后保留。

## 涉及文件
- `apps/mobile/src/screens/password/render.tsx`(筛选 UI)
- `apps/mobile/src/screens/password/context.tsx`、`tab-view-container.tsx`(过滤逻辑收口)
- `apps/mobile/src/components/password-form/*`(表单加 category 字段)
- 复用:`packages/db/src/store.ts`、`packages/db/src/database.ts`(`getCategories`)

## 依赖
- 无。后端能力已具备,可独立完成与测试。

## 进度记录
- _(待填写)_
