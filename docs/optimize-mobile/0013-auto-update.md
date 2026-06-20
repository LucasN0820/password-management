# 0013 · 应用自动更新(OTA 热更 + 原生二进制更新)

- **优先级**:🟢 低(发布 / 体验)
- **类型**:发布 / 体验
- **状态**:✅ 已完成(2026-06-20)
- **预估工作量**:M(OTA 1 天)+ M(直装 APK 自更新 1–1.5 天)+ S(版本检查提示 0.5 天),分阶段

## 背景与现状

移动端已完成两层更新能力:

- **OTA 热更**:`expo-updates` 已配置 EAS Update URL、`fingerprint` runtime、启动自动检查和设置页手动检查。发现更新后先下载，再提示用户重启应用。
- **Android 直装更新**:从 GitHub Releases 查询最新稳定的 `mobile-v*` APK，比较版本后提示下载，并通过 Android 系统安装器打开 APK。
- **发布入口**:`update-mobile.yml` 提供手动触发的 production OTA 发布；原生 APK 仍由 `release-mobile.yml` 发布。

iOS 当前尚未上架，因此只启用 OTA；等 App Store 分发落地后再补商店版本检查。

当前分发渠道(决定方案):

| 平台        | 渠道                                                                                                                                                                                |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Android** | **双通道**:Google Play internal track(`eas:android --auto-submit`)**+** GitHub Releases 直装 APK(`mobile-v*` tag,见 `release-mobile.yml`)+ 官网 `/download/mobile` 重定向到最新 APK |
| **iOS**     | 实际**未分发**(CI 中 iOS 构建被注释;`eas.json` 无 submit 配置;无 App Store)                                                                                                         |

版本治理已补齐初始 `android.versionCode` / `ios.buildNumber`，EAS production 后续继续通过 `autoIncrement` 远端递增；OTA 使用 `runtimeVersion: { policy: 'fingerprint' }` 隔离不兼容的原生壳。

## 概念:移动端"更新"分两层(与桌面端不同)

1. **OTA 热更(JS/资源)** — 只换 JS bundle 与资源,跑在已装好的原生壳子上,**无需过审/重装**。`expo-updates` 即此用途,是移动端最接近"自动更新"的手段。
2. **原生二进制更新** — 改了原生层(新原生模块 / 升 SDK / 改权限)时 OTA 无能为力,必须发新二进制:
   - **iOS**:只能走 App Store,不能静默更新,顶多应用内**提示**去 App Store。
   - **Android Play**:可用 Play In-App Updates,但仅对从 Play 安装的用户生效。
   - **Android 直装 APK(本项目 GitHub/官网渠道)**:需自己做"查版本 → 下 APK → 拉起安装",要 `REQUEST_INSTALL_PACKAGES` 权限 + FileProvider(对称于桌面端 0012 的自托管更新)。

> **`runtimeVersion`** 是 OTA 正确性的命门:OTA 只会下发给 `runtimeVersion` 相同的二进制,避免"新 JS 调老壳子没有的原生能力"导致崩溃。动原生就必须改 `runtimeVersion` 并重发二进制;纯 JS 改动则保持不变、可持续 OTA。推荐 `runtimeVersion: { policy: 'fingerprint' }`(自动哈希原生工程,最不易漏改)。

## 方案对比

| 方案                        | 解决哪层         | 适配渠道                     | 工作量 | 说明                                                                                                                             |
| --------------------------- | ---------------- | ---------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------- |
| **EAS Update(托管 OTA)** ⭐ | JS 热更          | iOS + Android 全部           | 低     | 配 `updates.url`+`runtimeVersion`+channel(channel 已就绪),`eas update --branch` 推送。已用 EAS 构建,顺理成章;有免费额度,超出收费 |
| 自托管 expo-updates         | JS 热更          | 全部                         | 中高   | 自建 manifest 服务/静态托管(可复用 GitHub Releases + CDN),省 EAS 费用但要自维护协议/签名/回滚                                    |
| 应用内版本检查 + 跳转商店   | 原生二进制提示   | iOS App Store / Android Play | 低     | 用 iTunes lookup / Play 比对版本提示"去更新";iOS 唯一可行的二进制更新手段                                                        |
| **Android 直装 APK 自更新** | 原生二进制(直装) | GitHub/官网 APK              | 中     | 仿桌面 0012:查 `mobile-v*` 最新 release → 下 APK → `expo-intent-launcher` 拉起安装;需 `REQUEST_INSTALL_PACKAGES`                 |
| Play In-App Updates         | 原生二进制(Play) | Google Play                  | 中     | 需原生模块(社区库/自写),仅对 Play 安装用户生效                                                                                   |

## 推荐组合

**主力:EAS Update(OTA)** —— 覆盖绝大多数"修 bug / 改文案 / 调 UI"迭代,iOS+Android 通吃、无需过审、代码量最小,是 Expo 官方路径与移动端真正的"自动更新"。

**按渠道补充:**

- **iOS**:应用内"版本检查 → 提示去 App Store"(待 iOS 实际上架后)。
- **Android 直装 APK**:做"查 GitHub `mobile-v*` 最新版 → 提示 → 下载 APK → 拉起安装"自更新,逻辑与桌面端 generic-feed 对称,可复用官网 `download/[target]/route.ts` 的 `mobile-v*` 版本比对思路。

> 一句话:**OTA 用 EAS Update 解决 80% 迭代;原生二进制更新对 iOS 做"跳商店提示"、对直装 Android 做"APK 自更新"。**

## 关键约束 / 坑

1. **`runtimeVersion` 是命门**:配错轻则推不下去,重则把崩溃推给老用户。建议 `fingerprint` 策略。
2. **Apple OTA 政策**:允许 expo-updates 这类 JS 热更,但不得借此改变 App 核心性质/功能(修 bug、调 UI 没问题)。
3. **Android 直装权限**:APK 自更新需 `REQUEST_INSTALL_PACKAGES`,密码类应用申请该权限可能被部分市场/合规重点审查。
4. **版本治理缺口**:上 OTA 前需补 `versionCode`/`buildNumber`/`runtimeVersion` 这套基础。
5. **EAS Update 计费**:OTA 托管有 MAU/带宽免费额度,规模上来需付费或转自托管。

## 落地步骤(分阶段)

**阶段一(OTA,推荐先做):**

- [x] 配置 `updates.url`；`app.config.ts` 使用 `runtimeVersion: { policy: 'fingerprint' }`。
- [x] 启动时调用 `checkForUpdateAsync()` + `fetchUpdateAsync()`，下载完成后提示并通过 `reloadAsync()` 应用；设置页提供手动检查入口。
- [x] 新增 `update-mobile.yml`，通过 `eas update --branch production --message ...` 发布 production OTA。

**阶段二(原生二进制更新,按需):**

- [x] Android 直装 APK 自更新:GitHub API 查最新稳定 `mobile-v*` → 版本比对 → `expo-file-system` 下载 → `expo-intent-launcher` 拉起安装；`app.config.ts` 声明 `REQUEST_INSTALL_PACKAGES`。
- [ ] iOS(上架后):iTunes lookup 版本检查 → 提示跳 App Store。

## 涉及文件(预估)

- 改 `apps/mobile/app.config.ts`(`updates`、`runtimeVersion`、`android.versionCode`/`ios.buildNumber`、必要权限)
- 新增 `apps/mobile/src/features/app-update/`(检查/下载/提示逻辑)
- 接入根布局或设置页(启动检查 + "检查更新"入口);复用 `@repo/i18n` 文案
- 阶段二复用官网 `apps/landing/app/download/[target]/route.ts` 的 `mobile-v*` 版本解析思路
- 可能改 `.github/workflows/`(OTA 发布步骤)与 `eas.json`(channel/branch 映射,channel 已存在)

## 依赖

- 无强代码依赖。需先确认**范围**(只做 OTA?还是 OTA + 直装 APK 自更新都做?)与 **EAS Update 计费**接受度。
- 与桌面端 [0012 自动更新](../optimize-desktop/0012-auto-update.md) 在"直装包自更新"上思路对称,可复用其经验。

## 调研记录

- 2026-06-20:完成方案调研(本文)。确认现状:`expo-updates` 已装未用、无 `runtimeVersion`、Android 双通道分发(Play internal + 直装 APK)、iOS 未分发。结论:推荐 **EAS Update(OTA)为主**,按渠道补"iOS 跳商店提示 / Android 直装 APK 自更新"。待定:实现范围与 EAS 计费。
- 2026-06-20:完成落地。新增 EAS OTA 配置、启动与设置页检查、Android GitHub Release APK 更新、版本解析测试、production OTA workflow，并补齐中英文文案。开发环境不会触发真实更新；启动检查失败保持静默，手动检查失败会提示用户。
