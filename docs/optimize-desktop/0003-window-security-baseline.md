# 0003 · 窗口安全基线(CSP / sandbox / 生产禁用调试)

- **优先级**:🔴 高(安全)
- **类型**:安全加固
- **状态**:⬜ 未开始
- **预估工作量**:S(0.5 天)

## 背景与问题
`BrowserWindow` 的基础已不错:`contextIsolation: true`、`nodeIntegration: false`(`electron/main.ts:128-129,170-171`)。但仍缺几项纵深防御:

1. **未启用 `sandbox`**:渲染进程未沙箱化,一旦 XSS 影响面更大。
2. **缺 Content-Security-Policy**:未限制脚本/连接来源,XSS 防护薄弱。
3. **生产环境调试入口**:开发模式自动开 DevTools(`main.ts:143-145`)且注册了调试快捷键(约 `main.ts:214`)。需确保仅依赖编译期 `isDev` 之外,生产构建确实关闭 DevTools 与调试快捷键,避免标志被绕过时暴露内存/IPC。

## 任务详情
- [ ] `webPreferences` 增加 `sandbox: true`(确认 preload 在 sandbox 下仍可用;如不可用记录原因并采用替代收敛)。
- [ ] 注入 CSP:通过 `session.defaultSession.webRequest.onHeadersReceived` 或 `index.html` meta,设置 `default-src 'self'`,按需放开本地资源/AI 服务地址,**禁止 `unsafe-eval`**;dev 与 prod 分别配置。
- [ ] 生产环境运行时双重确认:`DevTools` 不打开、调试快捷键不注册(以 `app.isPackaged` 等运行时判据而非仅编译常量)。
- [ ] 拦截 `webContents` 的 `will-navigate` / `setWindowOpenHandler`,阻止跳转到外部/未知来源(防钓鱼与远程代码加载)。

## 验收 / 测试标准
- [ ] 打包产物中 DevTools 无法通过快捷键打开;`will-navigate` 到外部 URL 被拦截。
- [ ] 响应头/页面含预期 CSP;违规脚本来源被浏览器拦截(控制台报 CSP 违规)。
- [ ] 启用 sandbox 后全功能回归正常(增删改查、AI 导入、spotlight、生成器)。
- [ ] `tsc`/`eslint` 通过。

## 涉及文件
- 改 `apps/desktop/electron/main.ts`(`webPreferences.sandbox`、CSP 注入、`isPackaged` 判据、导航拦截)
- 视情况改 `apps/desktop/index.html`(CSP meta 兜底)
- 如 sandbox 影响 preload:调整 `apps/desktop/electron/preload.ts`

## 依赖
- 无。独立验证。建议与 [0002](./0002-ipc-validation-and-errors.md) 一并构成主进程安全基线。
