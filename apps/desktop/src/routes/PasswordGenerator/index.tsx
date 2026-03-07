import { AnimatePresence,motion } from 'framer-motion'
import { Check, Copy, RefreshCw, Save, Settings, Shield, Upload,Zap } from 'lucide-react'
import { useCallback,useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { usePasswordStore } from '@/store/passwordStore'

interface GeneratorSettings {
  length: number
  includeUppercase: boolean
  includeLowercase: boolean
  includeNumbers: boolean
  includeSymbols: boolean
  excludeSimilar: boolean
  customSymbols: string
}

export function PasswordGeneratorPage() {
  const [password, setPassword] = useState('')
  const [copied, setCopied] = useState(false)
  const [strength, setStrength] = useState(0)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveTitle, setSaveTitle] = useState('')
  const [saveUsername, setSaveUsername] = useState('')
  const [saveCategory, setSaveCategory] = useState('all')
  const [saveNotes, setSaveNotes] = useState('')
  const [saveIcon, setSaveIcon] = useState('')
  const iconInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { addPassword, categories } = usePasswordStore()

  const [settings, setSettings] = useState<GeneratorSettings>({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: false,
    customSymbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
  })

  const calculateStrength = useCallback((pwd: string) => {
    if (!pwd) {return 0}

    let score = 0
    const {length} = pwd

    // Length bonus
    if (length >= 8) {score = score + 25}
    if (length >= 12) {score = score + 25}
    if (length >= 16) {score = score + 25}

    // Character variety
    if (/[a-z]/.test(pwd)) {score = score + 10}
    if (/[A-Z]/.test(pwd)) {score = score + 10}
    if (/\d/.test(pwd)) {score = score + 10}
    if (/[^a-z0-9]/i.test(pwd)) {score = score + 15}

    return Math.min(100, score)
  }, [])

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

        setSaveIcon(dataUrl)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeIcon = () => {
    setSaveIcon('')
    if (iconInputRef.current) {
      iconInputRef.current.value = ''
    }
  }

  const generatePassword = useCallback(() => {
    let charset = ''
    let password = ''

    if (settings.includeLowercase) {charset = `${charset  }abcdefghijklmnopqrstuvwxyz`}
    if (settings.includeUppercase) {charset = `${charset  }ABCDEFGHIJKLMNOPQRSTUVWXYZ`}
    if (settings.includeNumbers) {charset = `${charset  }0123456789`}
    if (settings.includeSymbols) {charset = charset + settings.customSymbols}

    if (settings.excludeSimilar) {
      charset = charset.replaceAll(/[il1o0]/gi, '')
    }

    if (!charset) {
      toast({
        title: "错误",
        description: "请至少选择一种字符类型",
        variant: "destructive"
      })

      return
    }

    for (let i = 0; i < settings.length; i++) {
      password = password + charset.charAt(Math.floor(Math.random() * charset.length))
    }

    setPassword(password)
    setStrength(calculateStrength(password))
  }, [settings, calculateStrength, toast])

  const copyToClipboard = async () => {
    if (!password) {return}

    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      toast({
        title: "已复制",
        description: "密码已复制到剪贴板"
      })
      setTimeout(() => { setCopied(false); }, 2000)
    } catch (error) {
      toast({
        title: "复制失败",
        description: "无法复制到剪贴板",
        variant: "destructive"
      })
    }
  }

  const openSaveDialog = () => {
    setSaveTitle(`生成的密码 ${new Date().toLocaleDateString()}`)
    setSaveNotes(`密码强度: ${getStrengthText(strength)} (${strength}/100)\n生成设置: 长度${settings.length}位`)
    setShowSaveDialog(true)
  }

  const savePassword = async () => {
    if (!password) {return}

    try {
      // 只传递PasswordInput接口中定义的字段，不包含icon字段
      const passwordData = {
        title: saveTitle || `生成的密码 ${new Date().toLocaleDateString()}`,
        username: saveUsername,
        password,
        url: '',
        icon: saveIcon,
        notes: saveNotes || '由密码生成器创建',
        category: saveCategory,
        favorite: 0
      }

      await addPassword(passwordData)

      toast({
        title: "已保存",
        description: "密码已保存到密码库"
      })
      setShowSaveDialog(false)
    } catch (error) {
      console.error('保存密码失败:', error)
      toast({
        title: "保存失败",
        description: "无法保存密码",
        variant: "destructive"
      })
    }
  }

  const getStrengthColor = (strength: number) => {
    if (strength < 30) {return 'text-red-500'}
    if (strength < 60) {return 'text-yellow-500'}
    if (strength < 80) {return 'text-blue-500'}

    return 'text-green-500'
  }

  const getStrengthText = (strength: number) => {
    if (strength < 30) {return '弱'}
    if (strength < 60) {return '中等'}
    if (strength < 80) {return '强'}

    return '非常强'
  }

  useEffect(() => {
    generatePassword()
  }, [generatePassword])

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.4
      }
    }
  }

  const cardVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut" as const
      }
    },
    hover: {
      y: -4,
      boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1)"
    }
  }

  const floatingVariants = {
    initial: { y: 0 },
    animate: {
      y: [-5, 5, -5],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut" as const
      }
    }
  }

  return (
    <motion.div
      className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6 overflow-hidden"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-10 right-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-10 left-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.3, 1, 1.3],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="container mx-auto max-w-4xl relative z-10">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4"
            variants={floatingVariants}
            initial="initial"
            animate="animate"
            whileHover={{
              rotate: [0, -5, 5, 0],
              transition: { duration: 0.6 }
            }}
          >
            <Shield className="w-8 h-8 text-primary-foreground" />
          </motion.div>
          <motion.h1
            className="text-4xl font-bold text-foreground mb-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            密码生成器
          </motion.h1>
          <motion.p
            className="text-xl text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            创建安全、随机的密码
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Generator */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              variants={cardVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              className="bg-background/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-6">
                <Shield className="w-5 h-5" />
                <h2 className="text-lg font-semibold">生成的密码</h2>
              </div>
              <div className="space-y-6">
                {/* Password Display */}
                <div className="relative">
                  <motion.div
                    whileFocus={{
                      scale: 1.02,
                      transition: { duration: 0.2 }
                    }}
                  >
                    <Input
                      readOnly
                      type="text"
                      value={password}
                      className="text-lg font-mono pr-24 h-14 bg-muted/50 rounded-xl"
                      placeholder="点击生成密码..."
                    />
                  </motion.div>
                  <motion.div
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-10 w-10"
                        onClick={copyToClipboard}
                      >
                        <AnimatePresence>
                          {copied ? (
                            <motion.div
                              key="check"
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: 180 }}
                              transition={{ duration: 0.3 }}
                            >
                              <Check className="w-4 h-4 text-green-500" />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="copy"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <Copy className="w-4 h-4" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.1, rotate: 180 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-10 w-10"
                        onClick={generatePassword}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  </motion.div>
                </div>

                {/* Strength Indicator */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>密码强度</Label>
                    <motion.span
                      className={`font-semibold ${getStrengthColor(strength)}`}
                      key={strength}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {getStrengthText(strength)}
                    </motion.span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${strength}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`h-2 rounded-full ${strength < 30 ? 'bg-red-500' :
                        strength < 60 ? 'bg-yellow-500' :
                          strength < 80 ? 'bg-blue-500' : 'bg-green-500'
                        }`}
                    />
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-3">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1"
                  >
                    <Button className="w-full h-12" onClick={generatePassword}>
                      <motion.div
                        animate={copied ? { rotate: 360 } : { rotate: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                      </motion.div>
                      重新生成
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button variant="outline" className="h-12" onClick={openSaveDialog}>
                      <Save className="w-4 h-4 mr-2" />
                      保存到密码库
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Password Templates */}
            <motion.div
              variants={cardVariants}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.2 }}
              className="bg-background/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-6">
                <Zap className="w-5 h-5" />
                <h2 className="text-lg font-semibold">快速模板</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">使用预设的密码模板快速生成</p>
              <Tabs defaultValue="balanced" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="simple">简单</TabsTrigger>
                  <TabsTrigger value="balanced">平衡</TabsTrigger>
                  <TabsTrigger value="strong">强</TabsTrigger>
                  <TabsTrigger value="maximum">最大</TabsTrigger>
                </TabsList>

                <TabsContent value="simple" className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="outline"
                        className="h-12"
                        onClick={() => {
                          setSettings({ ...settings, length: 8, includeSymbols: false })
                          setTimeout(generatePassword, 100)
                        }}
                      >
                        8位数字+字母
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="outline"
                        className="h-12"
                        onClick={() => {
                          setSettings({ ...settings, length: 12, includeSymbols: false })
                          setTimeout(generatePassword, 100)
                        }}
                      >
                        12位数字+字母
                      </Button>
                    </motion.div>
                  </div>
                </TabsContent>

                <TabsContent value="balanced" className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="outline"
                        className="h-12"
                        onClick={() => {
                          setSettings({ ...settings, length: 16 })
                          setTimeout(generatePassword, 100)
                        }}
                      >
                        16位平衡
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="outline"
                        className="h-12"
                        onClick={() => {
                          setSettings({ ...settings, length: 20 })
                          setTimeout(generatePassword, 100)
                        }}
                      >
                        20位平衡
                      </Button>
                    </motion.div>
                  </div>
                </TabsContent>

                <TabsContent value="strong" className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="outline"
                        className="h-12"
                        onClick={() => {
                          setSettings({ ...settings, length: 24, excludeSimilar: true })
                          setTimeout(generatePassword, 100)
                        }}
                      >
                        24位强密码
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="outline"
                        className="h-12"
                        onClick={() => {
                          setSettings({ ...settings, length: 32, excludeSimilar: true })
                          setTimeout(generatePassword, 100)
                        }}
                      >
                        32位强密码
                      </Button>
                    </motion.div>
                  </div>
                </TabsContent>

                <TabsContent value="maximum" className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="outline"
                        className="h-12"
                        onClick={() => {
                          setSettings({ ...settings, length: 48, excludeSimilar: true })
                          setTimeout(generatePassword, 100)
                        }}
                      >
                        48位最大
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="outline"
                        className="h-12"
                        onClick={() => {
                          setSettings({ ...settings, length: 64, excludeSimilar: true })
                          setTimeout(generatePassword, 100)
                        }}
                      >
                        64位最大
                      </Button>
                    </motion.div>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>

          {/* Settings Panel */}
          <div className="space-y-6">
            <motion.div
              variants={cardVariants}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.4 }}
              className="bg-background/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-6">
                <Settings className="w-5 h-5" />
                <h2 className="text-lg font-semibold">生成设置</h2>
              </div>
              <div className="space-y-6">
                {/* Length Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>密码长度</Label>
                    <motion.span
                      className="text-sm font-medium bg-primary/10 px-2 py-1 rounded"
                      key={settings.length}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {settings.length}
                    </motion.span>
                  </div>
                  <Slider
                    value={[settings.length]}
                    max={64}
                    min={4}
                    step={1}
                    className="w-full"
                    onValueChange={([value]: number[]) => { setSettings({ ...settings, length: value }); }}
                  />
                </div>

                {/* Character Options */}
                <div className="space-y-4">
                  <Label>字符类型</Label>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="uppercase" className="text-sm">大写字母 (A-Z)</Label>
                    <Switch
                      id="uppercase"
                      checked={settings.includeUppercase}
                      onCheckedChange={(checked) => { setSettings({ ...settings, includeUppercase: checked }); }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="lowercase" className="text-sm">小写字母 (a-z)</Label>
                    <Switch
                      id="lowercase"
                      checked={settings.includeLowercase}
                      onCheckedChange={(checked) => { setSettings({ ...settings, includeLowercase: checked }); }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="numbers" className="text-sm">数字 (0-9)</Label>
                    <Switch
                      id="numbers"
                      checked={settings.includeNumbers}
                      onCheckedChange={(checked) => { setSettings({ ...settings, includeNumbers: checked }); }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="symbols" className="text-sm">特殊字符</Label>
                    <Switch
                      id="symbols"
                      checked={settings.includeSymbols}
                      onCheckedChange={(checked) => { setSettings({ ...settings, includeSymbols: checked }); }}
                    />
                  </div>
                </div>

                {/* Custom Symbols */}
                {settings.includeSymbols && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.3 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="custom-symbols" className="text-sm">自定义特殊字符</Label>
                    <Input
                      id="custom-symbols"
                      value={settings.customSymbols}
                      placeholder="输入自定义特殊字符..."
                      className="text-sm"
                      onChange={(e) => { setSettings({ ...settings, customSymbols: e.target.value }); }}
                    />
                  </motion.div>
                )}

                {/* Additional Options */}
                <div className="space-y-4">
                  <Label>其他选项</Label>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="exclude-similar" className="text-sm">排除相似字符 (ilLI1oO0)</Label>
                    <Switch
                      id="exclude-similar"
                      checked={settings.excludeSimilar}
                      onCheckedChange={(checked) => { setSettings({ ...settings, excludeSimilar: checked }); }}
                    />
                  </div>
                </div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button className="w-full h-12" onClick={generatePassword}>
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                    </motion.div>
                    生成新密码
                  </Button>
                </motion.div>
              </div>
            </motion.div>

            {/* History */}
            <motion.div
              variants={cardVariants}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.6 }}
              className="bg-background/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-6">
                <Shield className="w-5 h-5" />
                <h2 className="text-lg font-semibold">生成历史</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">最近生成的密码</p>
              <div className="text-center py-8 text-muted-foreground">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Shield className="w-8 h-8 mx-auto mb-2" />
                </motion.div>
                <p className="text-sm">暂无生成历史</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      <AnimatePresence>
        {showSaveDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => { setShowSaveDialog(false); }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md mx-4"
              onClick={(e) => { e.stopPropagation(); }}
            >
              <div className="bg-background rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center gap-2 mb-6">
                  <Save className="w-5 h-5" />
                  <h2 className="text-lg font-semibold">保存密码到密码库</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-6">自定义密码信息后保存</p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="save-title">标题</Label>
                    <Input
                      id="save-title"
                      value={saveTitle}
                      placeholder="输入密码标题..."
                      onChange={(e) => { setSaveTitle(e.target.value); }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="save-username">用户名</Label>
                    <Input
                      id="save-username"
                      value={saveUsername}
                      placeholder="输入用户名（可选）"
                      onChange={(e) => { setSaveUsername(e.target.value); }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="save-category">分类</Label>
                    <select
                      id="save-category"
                      value={saveCategory}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onChange={(e) => { setSaveCategory(e.target.value); }}
                    >
                      <option value="all">全部分类</option>
                      {categories.map((cat) => 
                        { return <option key={cat} value={cat}>
                          {cat}
                        </option> }
                      )}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="save-icon">图标</Label>
                    <div className="flex items-center gap-4">
                      <motion.div
                        className="w-16 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/30"
                        whileHover={{ scale: 1.05 }}
                      >
                        {saveIcon ? (
                          <motion.img
                            src={saveIcon}
                            alt="图标预览"
                            className="w-full h-full object-cover rounded-lg"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                        ) : (
                          <Shield className="w-8 h-8 text-muted-foreground" />
                        )}
                      </motion.div>
                      <div className="flex gap-2">
                        <input
                          ref={iconInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleIconUpload}
                        />
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => iconInputRef.current?.click()}
                          >
                            <Upload className="w-4 h-4" />
                            选择图标
                          </Button>
                        </motion.div>
                        {saveIcon && (
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={removeIcon}
                            >
                              移除
                            </Button>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="save-notes">备注</Label>
                    <textarea
                      id="save-notes"
                      value={saveNotes}
                      placeholder="添加备注信息..."
                      rows={3}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
                      onChange={(e) => { setSaveNotes(e.target.value); }}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1"
                    >
                      <Button
                        variant="outline"
                        className="w-full h-12"
                        onClick={() => { setShowSaveDialog(false); }}
                      >
                        取消
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1"
                    >
                      <Button className="w-full h-12" onClick={savePassword}>
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Save className="w-4 h-4 mr-2" />
                        </motion.div>
                        保存密码
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
