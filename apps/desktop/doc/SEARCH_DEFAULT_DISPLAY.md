# Search页面默认显示所有密码

## 修改内容

### 1. 渲染条件优化
**之前**: 只有在有查询时才显示结果
```typescript
{query && (
  // 搜索结果渲染
)}
```

**现在**: 没有查询时也显示所有密码
```typescript
{(query || results.length > 0) && (
  // 搜索结果渲染
)}
```

### 2. 空状态提示优化
**之前**: 固定显示"未找到匹配的密码"
```typescript
<p>未找到匹配的密码</p>
```

**现在**: 根据状态显示不同提示
```typescript
<p>{query ? '未找到匹配的密码' : '暂无密码记录'}</p>
```

### 3. 状态信息增强
**之前**: 只显示操作提示
```typescript
<span>↑↓ 导航</span>
<span>Enter 复制密码</span>
```

**现在**: 显示密码数量
```typescript
<span>↑↓ 导航</span>
<span>Enter 复制密码</span>
{results.length > 0 && (
  <span>{results.length} 个密码</span>
)}
```

## 用户体验改进

### 1. 初始状态
- 打开Search页面时立即显示所有密码
- 用户可以看到完整的密码列表
- 无需输入即可浏览和选择

### 2. 搜索体验
- 输入查询时实时过滤结果
- 清空查询时恢复显示所有密码
- 平滑的过渡体验

### 3. 状态反馈
- 清楚显示当前密码数量
- 区分"无结果"和"无记录"状态
- 提供准确的状态信息

## 技术实现细节

### 搜索逻辑
```typescript
const searchPasswords = useCallback(async (searchQuery: string) => {
  if (!searchQuery.trim()) {
    setResults(passwords)  // 显示所有密码
    return
  }
  
  // 执行搜索
  const searchResults = await window.electronAPI.searchPasswords(searchQuery)
  setResults(searchResults)
}, [passwords])
```

### 初始化逻辑
```typescript
useEffect(() => {
  searchPasswords('')  // 初始加载所有密码
  inputRef.current?.focus()
}, [searchPasswords])
```

### 响应式更新
```typescript
useEffect(() => {
  searchPasswords(query)  // 查询变化时更新结果
}, [query, searchPasswords])
```

## 使用场景

### 1. 快速浏览
- 用户打开Search页面查看所有密码
- 使用键盘导航浏览密码列表
- 快速找到需要的密码

### 2. 搜索过滤
- 输入关键词缩小搜索范围
- 实时看到过滤结果
- 清空查询恢复完整列表

### 3. 密码管理
- 查看密码总数统计
- 了解密码库的整体情况
- 便于密码管理和整理

## 优势

1. **更好的发现性**: 用户可以看到所有可用密码
2. **更快的操作**: 无需输入即可浏览
3. **更清晰的状态**: 准确的状态反馈
4. **更流畅的体验**: 平滑的搜索过渡

## 测试要点

1. **初始加载**: 验证打开时显示所有密码
2. **搜索过滤**: 验证输入查询时的过滤效果
3. **清空查询**: 验证清空时恢复所有密码
4. **空状态**: 验证无密码时的提示信息
5. **数量显示**: 验证密码数量的正确显示
