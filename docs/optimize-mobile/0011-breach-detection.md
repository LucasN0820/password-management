# 0011 · 泄露检测(HIBP k-anonymity)

- **优先级**:🟢 低(功能,可选;需联网)
- **类型**:功能
- **状态**:⬜ 未开始
- **预估工作量**:S–M(1 天)

## 背景与问题
检测密码是否出现在已知泄露库中,是密码管理器的高价值能力。可用 **Have I Been Pwned「Pwned Passwords」range API + k-anonymity**:本地对密码做 SHA-1,只把哈希**前 5 位**发给服务端,返回该前缀下的所有后缀,本地比对——**不上传完整密码或哈希**,与本项目「隐私优先」定位基本契合。

## 任务详情
- [ ] 实现 k-anonymity 查询:`SHA1(password)` → 取前 5 位请求 `range/{prefix}` → 本地匹配后缀,得到泄露次数。
- [ ] 集成进 [0008 安全审计仪表盘](./0008-password-health-dashboard.md):新增「已泄露」分类与计数。
- [ ] **默认关闭 + 明确告知**:这是唯一需要联网的安全检查,必须在设置([0004](./0004-settings-screen.md))中显式开启,并说明「仅发送哈希前缀」。
- [ ] 失败/离线优雅降级,不阻塞其它功能。
- [ ] 结果缓存,避免频繁请求。

## 验收 / 测试标准
- [ ] 用已知被泄露密码(如 `password`)检测到 >0 次;用强随机密码检测为 0。
- [ ] 抓包确认仅发送 5 位前缀,不含完整密码 / 完整哈希。
- [ ] 功能默认关闭;离线时不报错、不卡死。

## 涉及文件
- 新增 `apps/mobile/src/features/breach-check/`
- 接入 `apps/mobile/src/screens/health/`(0008)
- 设置开关:`apps/mobile/src/screens/settings/`(0004)

## 依赖
- 依赖 [0004](./0004-settings-screen.md)(开关)与 [0008](./0008-password-health-dashboard.md)(展示宿主)更完整;核心查询逻辑可独立实现与测试。

## 进度记录
- _(待填写)_
