import { Image,Star, Upload, X } from 'lucide-react'
import { useRef,useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { Password } from '../App'

interface AddPasswordModalProps {
  onClose: () => void
  onSave: (data: Omit<Password, 'id' | 'created_at' | 'updated_at'>) => void
  existingCategories: string[]
}

export function AddPasswordModal({ onClose, onSave, existingCategories }: AddPasswordModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    username: '',
    password: '',
    url: '',
    notes: '',
    category: 'all',
    favorite: 0,
    icon: ''
  })
  const [newCategory, setNewCategory] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleIconUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('图标文件大小不能超过5MB')

        return
      }

      const reader = new FileReader()

      reader.onload = (e) => {
        const dataUrl = e.target?.result as string

        setFormData({ ...formData, icon: dataUrl })
      }
      reader.readAsDataURL(file)
    }
  }

  const removeIcon = () => {
    setFormData({ ...formData, icon: '' })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }


  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 250)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const category = showNewCategory && newCategory ? newCategory : formData.category
    const data = { ...formData, category }

    onSave(data)
    onClose()
  }

  return (
    <div className={cn(
      "fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50",
      isClosing ? "animate-out fade-out duration-250" : "animate-in fade-in duration-250"
    )}>
      <Card className={cn(
        "w-full max-w-md mx-4",
        isClosing ? "animate-out slide-out-to-bottom-4 duration-250" : "animate-in slide-in-from-bottom-4 duration-250"
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg">新建密码</CardTitle>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label>图标</Label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/30">
                  {formData.icon ? (
                    <img
                      src={formData.icon}
                      alt="图标预览"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Image className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleIconUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    上传图标
                  </Button>
                  {formData.icon && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeIcon}
                    >
                      移除
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                支持 JPG、PNG、GIF 格式，文件大小不超过 5MB
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">标题 *</Label>
              <Input
                required
                id="title"
                value={formData.title}
                placeholder="例如：GitHub"
                onChange={(e) => { setFormData({ ...formData, title: e.target.value }); }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                value={formData.username}
                placeholder="用户名或邮箱"
                onChange={(e) => { setFormData({ ...formData, username: e.target.value }); }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">密码 *</Label>
              <Input
                required
                id="password"
                type="password"
                value={formData.password}
                placeholder="输入密码"
                onChange={(e) => { setFormData({ ...formData, password: e.target.value }); }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">网站地址</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                placeholder="https://..."
                onChange={(e) => { setFormData({ ...formData, url: e.target.value }); }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">分类</Label>
              {showNewCategory ? (
                <Input
                  autoFocus
                  id="category"
                  value={newCategory}
                  placeholder="输入新分类名称"
                  onChange={(e) => { setNewCategory(e.target.value); }}
                />
              ) : (
                <select
                  id="category"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  value={formData.category}
                  onChange={(e) => {
                    if (e.target.value === 'new') {
                      setShowNewCategory(true)
                    } else {
                      setFormData({ ...formData, category: e.target.value })
                    }
                  }}
                >
                  <option value="all">全部</option>
                  {existingCategories.filter(c => c !== 'all').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="new">+ 新建分类</option>
                </select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">备注</Label>
              <textarea
                id="notes"
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 resize-none"
                value={formData.notes}
                placeholder="添加备注信息..."
                rows={3}
                onChange={(e) => { setFormData({ ...formData, notes: e.target.value }); }}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="favorite"
                checked={formData.favorite === 1}
                className="h-4 w-4 rounded border border-primary text-primary focus:ring-2 focus:ring-ring"
                onChange={(e) => { setFormData({ ...formData, favorite: e.target.checked ? 1 : 0 }); }}
              />
              <Label htmlFor="favorite" className="flex items-center gap-2 cursor-pointer">
                <Star className={cn("h-4 w-4", formData.favorite === 1 && "fill-foreground text-foreground")} />
                添加到收藏
              </Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                取消
              </Button>
              <Button type="submit">
                创建
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
