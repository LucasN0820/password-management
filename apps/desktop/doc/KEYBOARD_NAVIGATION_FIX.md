# 键盘导航修复

## 问题描述

用户在Search页面打开后，即使input有焦点，按上下箭头键也无法移动选中的密码项。

## 问题原因

1. **事件监听范围错误**: 原来的代码只在input元素上监听键盘事件
2. **默认行为冲突**: input元素默认会处理箭头键用于光标移动
3. **事件冒泡问题**: 键盘事件没有正确传播到导航处理逻辑

## 修复方案

### 1. 全局键盘事件监听

将键盘事件监听器从input元素移到document级别：

```typescript
// 修复前：只在input上监听
useEffect(() => {
  const input = inputRef.current
  if (input) {
    input.addEventListener('keydown', handleKeyDown)
    return () => input.removeEventListener('keydown', handleKeyDown)
  }
}, [handleKeyDown])

// 修复后：在document上监听
useEffect(() => {
  const handleGlobalKeyDown = (e: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(e.key)) {
      handleKeyDown(e)
    }
  }

  document.addEventListener('keydown', handleGlobalKeyDown)
  return () => document.removeEventListener('keydown', handleGlobalKeyDown)
}, [handleKeyDown])
```

### 2. 事件处理优化

确保只处理导航相关的键，避免干扰其他输入：

```typescript
const handleKeyDown = useCallback(
  (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault() // 阻止默认行为
        if (results.length > 0) {
          setSelectedIndex(prev => (prev + 1) % results.length)
        }
        break
      case 'ArrowUp':
        e.preventDefault() // 阻止默认行为
        if (results.length > 0) {
          setSelectedIndex(prev => (prev - 1 + results.length) % results.length)
        }
        break
      case 'Enter':
        e.preventDefault()
        if (results.length > 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex])
        }
        break
      case 'Escape':
        window.close()
        break
    }
  },
  [results, selectedIndex, handleSelect]
)
```

## 修复效果

### 1. 键盘导航正常工作

- ✅ 上下箭头键可以正确导航密码列表
- ✅ Enter键可以复制选中密码并关闭窗口
- ✅ Escape键可以关闭搜索窗口
- ✅ 无论焦点在哪里都能响应键盘操作

### 2. 用户体验改进

- **即时响应**: 打开搜索页面后立即可用键盘导航
- **视觉反馈**: 选中项有明显的背景高亮
- **边界安全**: 正确处理列表边界，避免越界错误

### 3. 兼容性保证

- **输入不受影响**: 仍然可以在input中正常输入搜索关键词
- **事件清理**: 组件卸载时正确移除事件监听器
- **性能优化**: 使用useCallback避免不必要的重渲染

## 测试验证

### 基本功能测试

1. **打开搜索页面**: 验证页面正常打开并显示所有密码
2. **键盘导航**: 按上下箭头键验证选中项移动
3. **边界测试**: 在第一项按上键，在最后一项按下键
4. **Enter操作**: 按Enter键验证密码复制和窗口关闭
5. **Escape操作**: 按Escape键验证窗口关闭

### 输入兼容性测试

1. **搜索输入**: 在input中输入关键词验证搜索功能
2. **导航+输入**: 输入过程中使用箭头键导航
3. **清空导航**: 清空输入后验证键盘导航

### 状态管理测试

1. **选中状态**: 验证选中项的视觉反馈
2. **索引重置**: 搜索结果变化时索引重置为0
3. **空结果处理**: 验证无结果时的键盘操作

## 技术细节

### 事件处理流程

1. 用户按下箭头键
2. document接收到keydown事件
3. handleGlobalKeyDown检查是否为导航键
4. 调用handleKeyDown处理具体逻辑
5. e.preventDefault()阻止默认行为
6. 更新selectedIndex状态
7. 组件重新渲染，显示新的选中状态

### 内存管理

- 使用useCallback缓存事件处理函数
- useEffect返回清理函数移除事件监听器
- 避免内存泄漏和重复监听

### 性能考虑

- 只监听必要的按键（4个导航键）
- 事件处理函数使用useCallback优化
- 合理的依赖数组设置

## 总结

通过将键盘事件监听器从input元素扩展到document级别，并正确处理事件默认行为，成功解决了键盘导航不工作的问题。现在用户可以在Search页面中使用完整的键盘导航功能，提供了更好的用户体验。
