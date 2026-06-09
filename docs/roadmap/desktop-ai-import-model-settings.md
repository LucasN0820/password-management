# Desktop AI Import Model Settings Roadmap

本文档定义 Desktop App 中 `AI Import` 本地模型下载、加载、运行状态和设置页的
后续优化方案。目标是把当前偏工程占位的 `Local AI Import` 设置页，升级成普通
用户也能理解、控制和恢复的本地模型管理体验。

## 背景

当前 Desktop AI Import 已经从默认远端 `DeepSeek` 服务迁移到本地
`llama.cpp` provider：

- 设置页通过 `window.electronAPI.getLocalImportModelStatus()` 获取模型状态。
- 设置页通过 `window.electronAPI.prepareLocalImportModel()` 触发模型准备。
- `model-cache.ts` 负责模型路径、下载、`.partial` 临时文件、SHA-256 manifest。
- `llama-runtime.ts` 负责启动本地 `llama-server`，并只监听 `127.0.0.1`。

现有设置页的问题是：

- 状态过粗，只区分 `Ready` 和 `Not downloaded`。
- 16GB 级模型下载没有进度、速度、预计剩余时间和取消能力。
- 模型不存在时，导入流程容易以错误提示中断，而不是引导用户完成准备。
- 模型缓存、GGUF 文件、runtime binary 和本地 server 状态混在一起，没有清晰边界。
- 错误信息偏技术字符串，用户很难判断下一步该怎么做。

## 产品目标

- 用户能清楚知道模型当前处于什么状态。
- 用户能控制大模型下载：开始、取消、重试、删除、重新校验。
- 用户能从内置模型目录中选择并下载 GGUF 模型，目前支持 `Qwen`、`Gemma`、
  `gpt-oss` 三类模型。
- 用户能导入已有本地 GGUF 文件，并在 AI Import 时选择该模型进行提取。
- 首次使用 AI Import 时，能在导入流程里完成模型准备，而不是被动报错。
- AI Import 开始前允许用户从已下载模型中选择本次使用的 extractor model。
- 用户能验证本机 runtime 是否真的可用，而不只是模型文件存在。
- 普通用户看到的是模型管理；高级配置仍可折叠展示。
- 所有敏感文件内容、prompt、候选密码仍不离开本机。

## 目标信息架构

设置页建议拆成三个区域：

1. `Local Model`
   管理 GGUF 模型目录、下载进度、缓存路径、校验状态和当前默认模型。
2. `Model Library`
   展示可下载模型和已下载模型，支持下载、选择、删除、导入本地 GGUF。
3. `Runtime`
   管理 `llama-server` binary、运行状态、监听地址和测试能力。
4. `Advanced`
   折叠展示环境变量覆盖项和 legacy provider 信息。

## 模型目录和选择策略

设置页需要从单一 Gemma 默认模型，升级为内置模型目录加本地模型库。

当前可下载模型族：

- `Qwen`
- `Gemma`
- `gpt-oss`

建议维护一个 allowlist catalog，而不是允许任意 URL 下载：

```ts
type LocalModelFamily = 'qwen' | 'gemma' | 'gpt-oss'

interface LocalModelCatalogEntry {
  id: string
  family: LocalModelFamily
  displayName: string
  repo: string
  quant: string
  fileName: string
  sizeBytes?: number
  sha256?: string
  downloadUrl?: string
  recommended: boolean
  minMemoryGb?: number
  contextSize: number
  maxTokens: number
}
```

产品行为：

- `Gemma` 可以继续作为默认推荐模型。
- `Qwen`、`Gemma`、`gpt-oss` 都以模型卡片展示名称、quant、大小、硬件提示和状态。
- 每个模型卡片支持 `Download`、`Use for AI Import`、`Remove`。
- 已下载模型进入本地模型库，不要求用户重复下载。
- 用户选择的默认模型写入 app-local settings；环境变量仍可覆盖。
- 用户也可以选择已有 `.gguf` 文件导入本地模型库，并给它一个显示名称和模型族。

本地模型库建议结构：

```ts
interface LocalModelLibraryItem {
  id: string
  family: LocalModelFamily | 'custom'
  displayName: string
  path: string
  source: 'catalog' | 'custom-file'
  repo?: string
  quant?: string
  fileName: string
  sizeBytes?: number
  sha256?: string
  verified: boolean
  downloadedAt?: string
  addedAt: string
  lastUsedAt?: string
}
```

导入时模型选择：

- `OnboardPage` 的 AI Import 启动区域显示当前选择的本地模型。
- 如果已有多个 downloaded / custom 模型，`Start AI Import` 旁边提供模型选择菜单。
- 用户可以选择本次导入使用的模型，但不必改变全局默认模型。
- 如果所选模型尚未下载，则先进入下载引导，下载完成后继续导入。
- 如果所选模型是 custom GGUF，则跳过下载，但仍需要检查文件存在并可读。

## 模型状态设计

当前状态：

```ts
interface LocalModelStatus {
  path: string
  exists: boolean
  repo: string
  quant: string
  fileName: string
  sha256?: string
  downloadedAt?: string
}
```

建议扩展为：

```ts
type LocalModelLifecycle =
  | 'not-downloaded'
  | 'downloading'
  | 'verifying'
  | 'ready'
  | 'failed'
  | 'outdated'
  | 'custom-path'

interface LocalModelStatus {
  id: string
  family: LocalModelFamily | 'custom'
  displayName: string
  lifecycle: LocalModelLifecycle
  path: string
  exists: boolean
  repo: string
  quant: string
  fileName: string
  sizeBytes?: number
  sha256?: string
  expectedSha256?: string
  verified: boolean
  downloadedAt?: string
  source: 'cache' | 'catalog' | 'custom-path' | 'custom-file'
  isDefault: boolean
  isSelectedForImport: boolean
  error?: {
    code: string
    message: string
    recoverable: boolean
  }
}
```

状态说明：

- `not-downloaded`: 缓存目录没有模型文件。
- `downloading`: 正在下载 `.partial` 文件。
- `verifying`: 下载完成，正在计算并校验 SHA-256。
- `ready`: 模型文件存在并通过校验，或无 expected hash 但 manifest 可用。
- `failed`: 下载、写入、校验或文件读取失败。
- `outdated`: manifest 与当前配置的 repo / quant / fileName 不匹配。
- `custom-path`: 使用 `AI_IMPORT_MODEL_PATH` 或用户手动选择的 GGUF 文件。

多模型状态建议由单个状态升级为列表：

```ts
interface LocalModelLibraryStatus {
  defaultModelId?: string
  selectedImportModelId?: string
  catalog: LocalModelCatalogEntry[]
  models: LocalModelStatus[]
}
```

## 下载进度和取消

大模型下载必须有明确反馈。建议新增 IPC event：

```ts
interface LocalModelDownloadProgress {
  status: 'starting' | 'downloading' | 'verifying' | 'completed' | 'failed' | 'cancelled'
  downloadedBytes: number
  totalBytes?: number
  bytesPerSecond?: number
  estimatedSecondsRemaining?: number
  path: string
  error?: { code: string; message: string }
}
```

Renderer API 建议：

```ts
window.electronAPI.prepareLocalImportModel(modelId)
window.electronAPI.cancelLocalImportModelDownload()
window.electronAPI.onLocalModelDownloadProgress(callback)
```

UI 行为：

- 模型卡片的 `Download` 或 `Prepare Local Model` 点击后变成进度条。
- 显示 `downloaded / total`、百分比、速度、预计剩余时间。
- 下载中显示 `Cancel`。
- 失败后显示 `Retry`。
- 校验失败时显示 `Remove partial file and retry`。
- 取消后删除 `.partial` 文件。

实现重点：

- `model-cache.ts` 的 `downloadFile()` 已经逐 chunk 读取 response body，可以在循环中计算
  `downloadedBytes` 并上报。
- `Content-Length` 存在时展示总大小；不存在时展示已下载和速度。
- 下载和校验共用同一个 `AbortController`。
- 不记录 URL 中可能带 token 的完整下载地址到日志。
- 下载来源必须来自 catalog allowlist，除非用户明确选择的是本地 GGUF 文件。

## 首次导入引导

模型准备不应该只藏在 Settings。`OnboardPage` 点击 `Start AI Import` 时，如果模型
不存在，应先进入模型准备引导。如果本地已经有多个模型，则应允许用户选择本次
AI Import 使用的模型。

建议流程：

1. 用户选择文件。
2. 选择本次导入使用的模型：
   - 默认使用 Settings 里选择的默认模型。
   - 可从已下载模型中切换。
   - 可选择 `Download another model`，从 `Qwen`、`Gemma`、`gpt-oss` 中下载。
   - 可选择 `Choose local GGUF file`，使用已有本地模型文件。
3. 点击 `Start AI Import`。
4. main process 返回 `MODEL_NOT_READY` 类型错误，或 renderer 预先查询状态。
5. Onboard 页面展示模型准备面板：
   - 模型名称和 quant。
   - 模型族：`Qwen`、`Gemma`、`gpt-oss` 或 custom。
   - 预计下载大小。
   - 保存路径。
   - 本地隐私说明。
   - `Download and continue`。
   - `Choose local GGUF file`。
   - 可选：`Use legacy remote provider`，仅在显式启用时展示。
6. 下载完成或本地 GGUF 校验通过后，自动继续当前导入。

这样用户不会因为缺模型而中断导入上下文。

## 模型管理操作

设置页建议新增以下操作：

- `Open Model Folder`
  打开 `app.getPath('userData')/models`。
- `Download Catalog Model`
  从内置 catalog 中选择 `Qwen`、`Gemma`、`gpt-oss` 的 GGUF artifact 下载到本地。
- `Choose Existing GGUF`
  选择已有本地 `.gguf` 文件，加入本地模型库，并允许 AI Import 使用。
- `Set as Default`
  设置默认 AI Import 模型。
- `Use for Next Import`
  仅设置下一次 AI Import 使用的模型，不改变默认值。
- `Remove Model`
  删除缓存模型和 manifest。
- `Re-verify Checksum`
  重新计算 SHA-256，并更新状态。
- `Copy Path`
  复制模型路径。
- `Change Quant`
  在 `Q4_K_M`、`Q8_0` 等 allowlist 里切换目标 artifact。

注意：

- 删除模型前需要确认，因为文件体积大、重新下载成本高。
- 自定义 GGUF 文件不应默认写入 manifest 的官方下载 metadata。
- 自定义 GGUF 文件应保存为 `custom-file` source，不允许伪装成 catalog 模型。
- `Change Quant` 后应把状态变成 `outdated` 或 `not-downloaded`，提示重新下载。
- 同一模型族可以存在多个 quant 或多个文件，但同一路径不应重复加入模型库。

## Runtime 状态和测试

模型文件存在不代表本机能完成推理。设置页需要单独显示 runtime 状态。

建议新增：

```ts
interface LocalRuntimeStatus {
  serverPath: string
  serverExists: boolean
  running: boolean
  baseUrl?: string
  platform: NodeJS.Platform
  arch: string
  lastStartedAt?: string
  lastStartupMs?: number
  error?: { code: string; message: string }
}
```

UI 展示：

- `llama-server binary`: found / missing。
- `Server`: stopped / running。
- `Address`: `127.0.0.1:<port>`，只在运行时展示。
- `Backend`: Metal / CUDA / Vulkan / CPU，如果后续可检测。
- `Test Local Model` 按钮。

测试行为：

1. 确认模型 ready。
2. 启动或复用 `llama-server`。
3. 调用 `/v1/models`。
4. 调用一个极小的 `/v1/chat/completions` prompt。
5. 展示启动耗时、首 token/总耗时，或错误原因。

测试 prompt 不应包含用户文件内容。

## 错误分类

建议 main process 把底层错误映射为稳定错误码：

```ts
type LocalModelErrorCode =
  | 'MODEL_NOT_FOUND'
  | 'DOWNLOAD_FAILED'
  | 'DOWNLOAD_CANCELLED'
  | 'CHECKSUM_MISMATCH'
  | 'DISK_SPACE_LOW'
  | 'MODEL_PATH_INVALID'
  | 'SERVER_BINARY_NOT_FOUND'
  | 'SERVER_START_TIMEOUT'
  | 'SERVER_HEALTHCHECK_FAILED'
  | 'MODEL_COMPLETION_FAILED'
```

UI 文案示例：

- `MODEL_NOT_FOUND`: 需要先下载本地模型，或选择已有 GGUF 文件。
- `CHECKSUM_MISMATCH`: 下载文件校验失败，请删除并重新下载。
- `DISK_SPACE_LOW`: 目标磁盘空间不足，请释放空间或选择其他路径。
- `SERVER_BINARY_NOT_FOUND`: 应用缺少 llama.cpp runtime，或需要设置自定义 binary。
- `SERVER_START_TIMEOUT`: 本机启动本地模型超时，可稍后重试或切换更小模型。

## 高级设置

环境变量仍然保留，但应折叠到 Advanced 区域：

```env
AI_IMPORT_PROVIDER=local-llama
AI_IMPORT_MODEL_FAMILY=gemma
AI_IMPORT_MODEL_REPO=ggml-org/gemma-4-26B-A4B-it-GGUF
AI_IMPORT_MODEL_QUANT=Q4_K_M
AI_IMPORT_MODEL_FILE=gemma-4-26B-A4B-it-Q4_K_M.gguf
AI_IMPORT_MODEL_SHA256=
AI_IMPORT_MODEL_DOWNLOAD_URL=
AI_IMPORT_MODEL_PATH=
AI_IMPORT_LLAMA_SERVER_PATH=
AI_IMPORT_CONTEXT_SIZE=8192
AI_IMPORT_MAX_TOKENS=2000
AI_IMPORT_KEEP_SERVER_ALIVE_MS=300000
```

普通用户不需要理解这些变量；它们主要用于开发、调试、企业分发或手动模型管理。

## 建议实现阶段

### Phase 1: 状态模型和设置页信息重构

- 扩展 `LocalModelStatus`。
- 新增 model catalog 和 model library 概念。
- 设置页拆分为 `Local Model`、`Model Library`、`Runtime`、`Advanced`。
- 展示 repo、quant、fileName、path、size、downloadedAt、SHA-256。
- 增加 `Copy Path` 和 `Open Model Folder`。

### Phase 2: 多模型下载和选择

- 内置 `Qwen`、`Gemma`、`gpt-oss` catalog allowlist。
- 支持从模型卡片下载指定 GGUF artifact。
- 支持选择已有本地 `.gguf` 文件并加入模型库。
- 支持设置默认模型和下一次导入使用的模型。

### Phase 3: 下载进度、取消和重试

- 为 `downloadFile()` 增加 progress callback。
- main process 通过 IPC event 推送下载进度。
- renderer 订阅进度并展示进度条、速度、剩余时间。
- 新增取消下载 IPC。
- 失败和取消后清理 `.partial` 文件。

### Phase 4: 首次导入引导

- Onboard 开始导入前检查模型状态。
- Onboard 支持选择已下载模型作为本次 extractor。
- Onboard 支持选择 catalog 模型并下载后继续导入。
- Onboard 支持选择本地 GGUF 文件并直接用于导入。
- 模型缺失时展示内联准备面板或 modal。
- 下载完成后自动继续当前 import。
- 保留 review-first 流程。

### Phase 5: 模型管理

- 新增选择已有 GGUF 文件。
- 新增删除模型。
- 新增重新校验 SHA-256。
- 新增 quant allowlist 和切换逻辑。
- 对 custom path 和 managed cache 做不同 UI 标识。

### Phase 6: Runtime 测试和诊断

- 新增 `getLocalImportRuntimeStatus()`。
- 新增 `testLocalImportRuntime()`。
- 设置页展示 binary path、server 状态、平台架构。
- 提供不含敏感数据的本地测试 prompt。

## 验收标准

- 模型未下载时，Settings 和 Onboard 都能明确引导用户准备模型。
- Settings 可以从 `Qwen`、`Gemma`、`gpt-oss` 中选择并下载 GGUF 模型。
- 用户可以选择已有本地 GGUF 文件，并在 AI Import 时使用该模型。
- AI Import 开始前可以从已下载模型中选择本次使用的 extractor model。
- 未下载的 catalog 模型会先下载，下载完成后继续当前导入。
- 下载 16GB 级模型时有进度、速度、取消和重试。
- 下载取消或失败不会留下被误认为 ready 的 partial 文件。
- SHA-256 校验失败时不会启动本地模型。
- 用户可以打开模型目录、复制路径、删除模型、选择已有 GGUF。
- `llama-server` 缺失、启动超时、healthcheck 失败都有可恢复提示。
- Runtime 测试不发送任何用户文件、prompt、密码候选项到远端。
- 高级环境变量仍可用于开发和打包覆盖，但不再是普通用户的主要入口。

## 与现有 AI Import Roadmap 的关系

`desktop-ai-import.md` 关注从远端 DeepSeek 到本地 llama.cpp 的架构迁移。本文件关注
迁移之后的模型下载、加载、状态管理和设置页体验。两者共享同一条安全原则：

- 默认使用本地模型。
- 默认不访问远端 import service。
- 文件内容、prompt、模型输出和候选密码不离开用户设备。
- AI 只生成候选项，保存前必须经过人工 review。
