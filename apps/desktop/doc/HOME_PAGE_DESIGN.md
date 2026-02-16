# Home页面设计 - 参考Notion和shadcn/ui风格

## 设计理念

结合Notion的简洁优雅和shadcn/ui的现代设计语言，创建一个功能丰富、视觉美观的密码管理器首页。

## 设计特点

### 1. 视觉风格
- **渐变背景**: 使用柔和的渐变色营造现代感
- **毛玻璃效果**: 卡片使用半透明背景和模糊效果
- **圆角设计**: 大量使用圆角元素增加友好感
- **阴影层次**: 多层次阴影创造深度感

### 2. 布局结构
- **中心对齐**: 主要内容居中展示
- **网格系统**: 响应式网格布局
- **卡片分组**: 相关功能分组展示
- **留白设计**: 充足的间距提升可读性

## 功能模块

### 1. 品牌标识区
```typescript
<div className="text-center mb-16">
  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-6">
    <Key className="w-8 h-8 text-primary-foreground" />
  </div>
  <h1 className="text-4xl font-bold text-foreground mb-4 tracking-tight">
    密码管理器
  </h1>
  <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
    安全、简单、高效的密码管理解决方案
  </p>
</div>
```

**设计要点**:
- 圆形图标容器作为品牌标识
- 大标题使用紧凑的字距
- 副标题限制宽度保持可读性

### 2. 搜索栏
```typescript
<form onSubmit={handleSearch} className="relative">
  <div className="relative">
    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
    <Input
      type="text"
      placeholder="搜索密码、网站或标签..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="pl-12 pr-4 h-14 text-base bg-background/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all duration-200"
    />
  </div>
  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
    <kbd className="px-2 py-1 text-xs bg-muted rounded-md border border-border">⌘</kbd>
    <kbd className="px-2 py-1 text-xs bg-muted rounded-md border border-border">K</kbd>
  </div>
</form>
```

**设计要点**:
- 图标在输入框内部的左侧
- 毛玻璃背景效果
- 圆角和阴影增加层次感
- 键盘快捷键提示

### 3. 统计卡片
```typescript
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
  <Card className="bg-background/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">总密码数</CardTitle>
      <Lock className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-foreground">{totalPasswords}</div>
      <p className="text-xs text-muted-foreground mt-1">所有存储的密码</p>
    </CardContent>
  </Card>
</div>
```

**设计要点**:
- 三列响应式网格布局
- 毛玻璃卡片背景
- 悬停时的阴影变化
- 图标和数据的组合展示

### 4. 快速操作
```typescript
const quickActions = [
  {
    icon: Plus,
    title: '添加密码',
    description: '创建新的密码条目',
    action: () => navigate('/password')
  },
  {
    icon: Search,
    title: '快速搜索',
    description: '全局搜索密码',
    action: () => navigate('/search')
  },
  {
    icon: Shield,
    title: '安全检查',
    description: '检查弱密码',
    action: () => navigate('/password?filter=weak')
  },
  {
    icon: BarChart3,
    title: '统计分析',
    description: '查看密码统计',
    action: () => navigate('/password?filter=stats')
  }
]
```

**设计要点**:
- 四列网格布局（大屏）
- 图标+标题+描述的结构
- 悬停时的缩放效果
- 统一的交互反馈

### 5. 密码列表
```typescript
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
  {/* 最近添加 */}
  <div>
    <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
      <Lock className="w-5 h-5 text-primary" />
      最近添加
    </h3>
    <div className="space-y-3">
      {recentPasswords.map((password) => (
        <Card className="bg-background/60 backdrop-blur-sm border-0 shadow hover:shadow-md transition-all duration-200 cursor-pointer group">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                {password.icon ? (
                  <img src={password.icon} alt={password.title} className="w-6 h-6 object-cover rounded" />
                ) : (
                  <Lock className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground truncate">{password.title}</h4>
                <p className="text-sm text-muted-foreground truncate">{password.username || '无用户名'}</p>
              </div>
              {password.favorite === 1 && (
                <Zap className="w-4 h-4 text-yellow-500" />
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
</div>
```

**设计要点**:
- 两列布局（大屏）
- 自定义图标优先显示
- 收藏标识
- 悬停交互效果

### 6. 键盘快捷键
```typescript
<Card className="bg-background/60 backdrop-blur-sm border-0 shadow-lg max-w-md mx-auto">
  <CardHeader>
    <CardTitle className="flex items-center justify-center gap-2">
      <Command className="w-4 h-4" />
      键盘快捷键
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-3">
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">全局搜索</span>
      <div className="flex items-center gap-1">
        <kbd className="px-2 py-1 text-xs bg-muted rounded border">⌘</kbd>
        <kbd className="px-2 py-1 text-xs bg-muted rounded border">⇧</kbd>
        <kbd className="px-2 py-1 text-xs bg-muted rounded border">P</kbd>
      </div>
    </div>
  </CardContent>
</Card>
```

**设计要点**:
- 键盘样式的快捷键显示
- 居中对齐的卡片
- 清晰的键位组合展示

## 技术实现

### 1. 状态管理
```typescript
const [searchQuery, setSearchQuery] = useState('')
const { passwords, categories, loadPasswords } = usePasswordStore()
const navigate = useNavigate()

// 数据计算
const recentPasswords = passwords.slice(0, 6)
const favoritePasswords = passwords.filter(p => p.favorite === 1).slice(0, 4)
const totalPasswords = passwords.length
const totalCategories = categories.length
```

### 2. 交互处理
```typescript
const handleSearch = (e: React.FormEvent) => {
  e.preventDefault()
  if (searchQuery.trim()) {
    navigate(`/password?search=${encodeURIComponent(searchQuery.trim())}`)
  }
}
```

### 3. 响应式设计
- **移动端**: 单列布局
- **平板端**: 两列布局
- **桌面端**: 三列/四列布局
- **大屏**: 最大宽度限制

## 设计系统

### 1. 颜色方案
- **主色**: 使用CSS变量定义的primary色
- **背景**: 渐变色从浅到深
- **卡片**: 半透明背景 + 模糊效果
- **文本**: 前景色和次要文本色

### 2. 间距系统
- **容器**: 12px顶部padding
- **卡片**: 24px间距
- **内部**: 16px padding
- **元素**: 8-12px间距

### 3. 圆角系统
- **小元素**: 8px圆角
- **卡片**: 12px圆角
- **大元素**: 16px圆角
- **特大**: 24px圆角

### 4. 阴影系统
- **卡片**: 默认shadow-lg
- **悬停**: shadow-xl
- **按钮**: shadow-md
- **输入框**: 自定义阴影

## 动画效果

### 1. 过渡动画
```css
transition-all duration-200  /* 基础过渡 */
transition-all duration-300  /* 卡片悬停 */
```

### 2. 悬停效果
- **卡片**: 阴影加深 + 轻微缩放
- **按钮**: 背景色变化
- **链接**: 下划线出现

### 3. 焦点效果
- **输入框**: 环形光圈
- **按钮**: 轮廓高亮
- **卡片**: 边框高亮

## 可访问性

### 1. 语义化HTML
- 使用正确的标题层级
- 表单元素正确标记
- 按钮使用button元素

### 2. 键盘导航
- 所有交互元素可通过Tab访问
- 焦点指示器清晰可见
- 快捷键支持

### 3. 屏幕阅读器
- 图标有alt文本
- 表单元素有标签
- 状态变化有通知

## 性能优化

### 1. 图片处理
- 自定义图标使用object-cover
- 懒加载大量图片
- 图标尺寸优化

### 2. 渲染优化
- 使用useCallback缓存函数
- 合理的依赖数组
- 避免不必要的重渲染

### 3. 响应式性能
- CSS Grid布局
- 媒体查询优化
- 移动端优先设计

## 总结

这个Home页面设计成功融合了Notion的简洁美学和shadcn/ui的现代设计语言，创造了一个功能丰富、视觉美观、交互流畅的密码管理器首页。通过渐变背景、毛玻璃效果、圆角设计和响应式布局，提供了专业且友好的用户体验。
