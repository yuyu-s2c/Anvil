# Anvil

个人桌面 Agent。Electron + React + TypeScript，对话走 OpenAI Chat Completions，默认真 DeepSeek。目标是双击打开、可换任意兼容端点。

架构细节见 [ARCHITECTURE.md](ARCHITECTURE.md)。

## 命令

```bash
npm run dev          # 开发
npm test             # vitest，改主进程逻辑后必跑
npm run typecheck    # 主进程 + 渲染进程
npm run build:win    # Windows portable exe → dist/Anvil-*-portable.exe
```

国内打包若拉 GitHub 超时，可设：

```
ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
```

## 分层（必须守）

| 层 | 路径 | 规则 |
|---|---|---|
| 领域 | `src/shared` | 无 Electron、无 IO、无 OpenAI SDK。IPC 频道名也放这里。 |
| 运行时 | `src/main/agent` | 只编排一轮对话。工具循环以后加这里，不要写进 IPC。 |
| 端口 | `ChatProvider`、`*Repository` | 换模型/存储只换适配器。 |
| 适配器 | `src/main/providers`、`storage`、`ipc` | 允许依赖 Electron / openai / fs。 |
| UI | `src/renderer` | 只通过 `window.anvil` 说话，禁止直接打模型 HTTP。 |
| 组装 | `src/main/index.ts` | 唯一组合根。 |

测试放 `tests/`，不启动 Electron。领域规则改了就要补对应用例。

## 协议与模型

- 只走 OpenAI 兼容 Chat Completions（`baseURL` + `apiKey` + `model`）。
- 默认：`https://api.deepseek.com` + `deepseek-v4-flash`。
- 预设：`deepseek-v4-flash`、`deepseek-v4-pro`、`deepseek-v4-flash-vision-exp`。
- 旧名 `deepseek-chat` / `deepseek-reasoner` 在读设置时迁移到 flash / pro。
- 视觉与图片输入尚未实现；不要假装已经支持。

## 安全与日志

- API Key 只留主进程，用 `safeStorage` 加密后写入 userData。
- 日志在 `%APPDATA%\Anvil\logs\`，必须打码 `apiKey` / `sk-` 等密钥。
- 不要把对话正文打到 info 日志；排障用 `ANVIL_LOG_LEVEL=debug`。
- 禁止把 `.env`、Key、userData 提交进 git。

## 改动习惯

- 新网关：实现 `ChatProvider`，不要改 Runtime 和 UI。
- 新 IPC：先改 `src/shared/ipc.ts` 和 `AnvilAPI`，preload / 主进程 / UI 一起对齐。
- UI 文案用中文。设置变更后，用设置页走一遍保存和「打开日志目录」。
- 保持模块可单测；能在 `tests/` 里验的，不要只靠手动点。
