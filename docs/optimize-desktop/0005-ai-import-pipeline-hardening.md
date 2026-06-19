# 0005 · AI 导入链路健壮性与安全

- **优先级**:🟠 较高(安全 / 健壮性)
- **类型**:安全加固 + 健壮性
- **状态**:⬜ 未开始
- **预估工作量**:M(1–1.5 天)

## 背景与问题
AI 导入链路(远程上传 + 本地 llama)有多处可加固:

1. **远程导入工作流**(`electron/main.ts:415-486`):
   - 上传使用原始 `file.name`,泄露本地文件结构;无文件大小/MIME 校验;
   - 轮询循环无整体超时,网络异常可能无限挂起;
   - 错误响应直接回传给前端,可能泄露服务端信息。
2. **本地 llama 二进制提权无校验**(`ai-import/llama-runtime.ts:89`):spawn 前 `chmodSync` 到 755,但二进制路径来自配置/环境变量,且**无签名/哈希校验**。
3. **模型缓存文件**(`ai-import/model-cache.ts`):下载的模型无权限收紧、无完整性校验,可能被替换篡改 AI 行为。
4. **LLM 响应解析**(`ai-import/local-llama-provider.ts`):假设响应 JSON 格式正确,无超时/严格校验/重试。

## 任务详情
- [ ] 远程上传:用 UUID/哈希替代原始文件名;加入大小上限 + MIME 白名单校验;轮询设置整体超时(如 30–60s)与单次请求超时;错误回传改为**通用错误码**,服务端细节仅记本地日志。
- [ ] llama 二进制:spawn 前校验 **SHA256/签名**(与预期清单比对),路径做白名单约束;避免无条件提权(校验通过才执行,失败明确报错)。
- [ ] 模型文件:下载后设只读权限(如 0400);启动时校验 SHA256;不匹配则拒绝加载并提示重新下载。
- [ ] LLM 响应:加请求超时 + 失败重试(有上限);用 zod 严格校验响应结构,非法不入库。

## 验收 / 测试标准
- [ ] 单测:文件大小/MIME 校验拒绝超限与非白名单类型;响应 schema 拒绝非法 JSON。
- [ ] 模拟:远程轮询超时能正确中断并返回通用错误;模型 SHA256 不匹配时拒绝加载。
- [ ] 手动:正常 AI 导入(远程 + 本地)端到端可用;断网/超时场景给出可读错误而非卡死。
- [ ] `tsc`/`eslint` 通过;日志无服务端敏感细节。

## 涉及文件
- 改 `apps/desktop/electron/main.ts`(远程导入:文件名、校验、超时、错误收敛)
- 改 `apps/desktop/electron/ai-import/llama-runtime.ts`(二进制校验/受控提权)
- 改 `apps/desktop/electron/ai-import/model-cache.ts`(模型权限 + SHA256 校验)
- 改 `apps/desktop/electron/ai-import/local-llama-provider.ts`(超时/重试/严格校验)

## 依赖
- 无强依赖。可拆为「远程」「本地 llama」两个子批次分别测试。AI 导入相关背景见 [docs/roadmap/desktop-ai-import.md](../roadmap/desktop-ai-import.md)。
