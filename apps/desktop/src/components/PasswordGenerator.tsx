import { useState } from 'react'
import { X, Copy, RefreshCw, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PasswordGeneratorProps {
  onClose: () => void
}

export default function PasswordGenerator({ onClose }: PasswordGeneratorProps) {
  const [length, setLength] = useState(16)
  const [includeUppercase, setIncludeUppercase] = useState(true)
  const [includeLowercase, setIncludeLowercase] = useState(true)
  const [includeNumbers, setIncludeNumbers] = useState(true)
  const [includeSymbols, setIncludeSymbols] = useState(true)
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [copied, setCopied] = useState(false)

  const generatePassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const lowercase = 'abcdefghijklmnopqrstuvwxyz'
    const numbers = '0123456789'
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'

    let chars = ''
    if (includeUppercase) chars += uppercase
    if (includeLowercase) chars += lowercase
    if (includeNumbers) chars += numbers
    if (includeSymbols) chars += symbols

    if (chars === '') {
      setGeneratedPassword('')
      return
    }

    let password = ''
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setGeneratedPassword(password)
    setCopied(false)
  }

  const copyToClipboard = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg">密码生成器</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="generated-password">生成的密码</Label>
            <div className="flex gap-2">
              <Input
                id="generated-password"
                value={generatedPassword}
                readOnly
                placeholder="点击生成按钮创建密码"
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={copyToClipboard}
                disabled={!generatedPassword}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? '已复制' : '复制'}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="length">密码长度: {length}</Label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  id="length"
                  min="4"
                  max="64"
                  value={length}
                  onChange={(e) => setLength(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm text-muted-foreground w-8 text-right">{length}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="uppercase"
                  checked={includeUppercase}
                  onChange={(e) => setIncludeUppercase(e.target.checked)}
                  className="h-4 w-4 rounded border border-primary text-primary focus:ring-2 focus:ring-ring"
                />
                <Label htmlFor="uppercase" className="text-sm font-medium cursor-pointer">
                  大写字母 (A-Z)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="lowercase"
                  checked={includeLowercase}
                  onChange={(e) => setIncludeLowercase(e.target.checked)}
                  className="h-4 w-4 rounded border border-primary text-primary focus:ring-2 focus:ring-ring"
                />
                <Label htmlFor="lowercase" className="text-sm font-medium cursor-pointer">
                  小写字母 (a-z)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="numbers"
                  checked={includeNumbers}
                  onChange={(e) => setIncludeNumbers(e.target.checked)}
                  className="h-4 w-4 rounded border border-primary text-primary focus:ring-2 focus:ring-ring"
                />
                <Label htmlFor="numbers" className="text-sm font-medium cursor-pointer">
                  数字 (0-9)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="symbols"
                  checked={includeSymbols}
                  onChange={(e) => setIncludeSymbols(e.target.checked)}
                  className="h-4 w-4 rounded border border-primary text-primary focus:ring-2 focus:ring-ring"
                />
                <Label htmlFor="symbols" className="text-sm font-medium cursor-pointer">
                  特殊符号 (!@#$...)
                </Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={generatePassword}>
              <RefreshCw className="h-4 w-4" />
              生成密码
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
