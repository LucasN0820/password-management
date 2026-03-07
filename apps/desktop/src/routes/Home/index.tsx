import { AnimatePresence,motion } from 'framer-motion'
import { BarChart3, Command,Key, Lock, Plus, Search, Shield, Zap } from 'lucide-react'
import { useEffect,useState } from 'react'
import { useNavigate } from 'react-router'
import { Input } from '@/components/ui/input'
import { usePasswordStore } from '@/store/passwordStore'

export function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const { passwords, categories, loadPasswords } = usePasswordStore()
  const navigate = useNavigate()

  useEffect(() => {
    loadPasswords()
  }, [loadPasswords])

  const recentPasswords = passwords.slice(0, 6)
  const favoritePasswords = passwords.filter(p => p.favorite === 1).slice(0, 4)
  const totalPasswords = passwords.length
  const totalCategories = categories.length

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/password?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

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
      action: () => {
        // 使用全局快捷键或者导航到搜索页面
        navigate('/search')
      }
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 30,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 12,
        mass: 1
      }
    }
  }

  const cardHoverVariants = {
    hover: {
      y: -8,
      scale: 1.02,
      boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1)"
    },
    tap: {
      scale: 0.98,
      transition: { duration: 0.1 }
    }
  }

  const floatingVariants = {
    initial: { y: 0 },
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut" as const
      }
    }
  }

  return (
    <motion.div
      className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="container mx-auto px-6 py-12 max-w-7xl relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          variants={itemVariants}
        >
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-6"
            variants={floatingVariants}
            initial="initial"
            animate="animate"
            whileHover={{
              rotate: [0, -10, 10, 0],
              transition: { duration: 0.5 }
            }}
          >
            <Key className="w-8 h-8 text-primary-foreground" />
          </motion.div>
          <motion.h1
            className="text-4xl font-bold text-foreground mb-4 tracking-tight"
            variants={itemVariants}
          >
            密码管理器
          </motion.h1>
          <motion.p
            className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            variants={itemVariants}
          >
            安全、简单、高效的密码管理解决方案
          </motion.p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          className="max-w-2xl mx-auto mb-16"
          variants={itemVariants}
        >
          <form className="relative" onSubmit={handleSearch}>
            <motion.div
              className="relative"
              whileFocus={{
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
            >
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="搜索密码、网站或标签..."
                value={searchQuery}
                className="pl-12 pr-4 h-14 text-base bg-background/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                onChange={(e) => { setSearchQuery(e.target.value); }}
              />
            </motion.div>
            <motion.div
              className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <kbd className="px-2 py-1 text-xs bg-muted rounded-md border border-border">⌘</kbd>
              <kbd className="px-2 py-1 text-xs bg-muted rounded-md border border-border">K</kbd>
            </motion.div>
          </form>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants}>
            <motion.div
              className="bg-background/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6 cursor-pointer"
              variants={cardHoverVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <span className="text-sm font-medium text-muted-foreground">总密码数</span>
                <Lock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold text-foreground">{totalPasswords}</div>
              <p className="text-xs text-muted-foreground mt-1">所有存储的密码</p>
            </motion.div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <motion.div
              className="bg-background/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6 cursor-pointer"
              variants={cardHoverVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <span className="text-sm font-medium text-muted-foreground">收藏密码</span>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold text-foreground">{favoritePasswords.length}</div>
              <p className="text-xs text-muted-foreground mt-1">标记为重要</p>
            </motion.div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <motion.div
              className="bg-background/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6 cursor-pointer"
              variants={cardHoverVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <span className="text-sm font-medium text-muted-foreground">分类数量</span>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold text-foreground">{totalCategories}</div>
              <p className="text-xs text-muted-foreground mt-1">组织分类</p>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="mb-16"
          variants={containerVariants}
        >
          <motion.h2
            className="text-2xl font-bold text-foreground mb-8 text-center"
            variants={itemVariants}
          >
            快速操作
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => 
              { return <motion.div
                key={index}
                variants={itemVariants}
                whileHover="hover"
                whileTap="tap"
                className="cursor-pointer"
                onClick={action.action}
              >
                <div className="bg-background/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6 h-full group">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors duration-200">
                    <action.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 text-center">{action.title}</h3>
                  <p className="text-sm text-muted-foreground text-center">{action.description}</p>
                </div>
              </motion.div> }
            )}
          </div>
        </motion.div>

        {/* Recent & Favorite Passwords */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          variants={containerVariants}
        >
          {/* Recent Passwords */}
          <motion.div variants={itemVariants}>
            <motion.h3
              className="text-xl font-bold text-foreground mb-6 flex items-center gap-2"
              variants={itemVariants}
            >
              <Lock className="w-5 h-5 text-primary" />
              最近添加
            </motion.h3>
            <div className="space-y-3">
              <AnimatePresence>
                {recentPasswords.length > 0 ? (
                  recentPasswords.map((password) => 
                    { return <motion.div
                      key={password.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="cursor-pointer"
                      onClick={() => navigate('/password')}
                    >
                      <div className="bg-background/60 backdrop-blur-sm border-0 shadow rounded-2xl p-4 group hover:shadow-lg transition-all duration-200">
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
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.2 }}
                            >
                              <Zap className="w-4 h-4 text-yellow-500" />
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.div> }
                  )
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-background/60 backdrop-blur-sm border-0 rounded-2xl p-8 text-center"
                  >
                    <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground">暂无最近添加的密码</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Favorite Passwords */}
          <motion.div variants={itemVariants}>
            <motion.h3
              className="text-xl font-bold text-foreground mb-6 flex items-center gap-2"
              variants={itemVariants}
            >
              <Zap className="w-5 h-5 text-yellow-500" />
              收藏密码
            </motion.h3>
            <div className="space-y-3">
              <AnimatePresence>
                {favoritePasswords.length > 0 ? (
                  favoritePasswords.map((password) => 
                    { return <motion.div
                      key={password.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="cursor-pointer"
                      onClick={() => navigate('/password')}
                    >
                      <div className="bg-background/60 backdrop-blur-sm border-0 shadow rounded-2xl p-4 group hover:shadow-lg transition-all duration-200">
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
                          <motion.div
                            initial={{ rotate: 0 }}
                            whileHover={{ rotate: 15 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Zap className="w-4 h-4 text-yellow-500" />
                          </motion.div>
                        </div>
                      </div>
                    </motion.div> }
                  )
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-background/60 backdrop-blur-sm border-0 rounded-2xl p-8 text-center"
                  >
                    <Zap className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground">暂无收藏的密码</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>

        {/* Keyboard Shortcuts */}
        <motion.div
          className="mt-16 text-center"
          variants={itemVariants}
        >
          <div className="bg-background/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl max-w-md mx-auto p-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Command className="w-4 h-4" />
              <span className="font-semibold">键盘快捷键</span>
            </div>
            <div className="space-y-3">
              <motion.div
                className="flex justify-between items-center"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-sm text-muted-foreground">全局搜索</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 text-xs bg-muted rounded border">⌘</kbd>
                  <kbd className="px-2 py-1 text-xs bg-muted rounded border">⇧</kbd>
                  <kbd className="px-2 py-1 text-xs bg-muted rounded border">P</kbd>
                </div>
              </motion.div>
              <motion.div
                className="flex justify-between items-center"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-sm text-muted-foreground">开发者工具</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 text-xs bg-muted rounded border">F12</kbd>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}