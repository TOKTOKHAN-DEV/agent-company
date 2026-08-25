# Agent Company

[한국어](../../README.md) ·
[English](./README.en.md) ·
[日本語](./README.ja.md) ·
**简体中文** ·
[Español](./README.es.md) ·
[Français](./README.fr.md) ·
[Deutsch](./README.de.md) ·
[Português](./README.pt-BR.md) ·
[Русский](./README.ru.md)

> 由 AI 团队运转的 monorepo 模板。
> 组织架构、公司规章、跨会话留存的记忆，以及只有人能按的发布按钮。

[![Website](https://img.shields.io/badge/website-agent--company.site-9A6410)](https://www.agent-company.site)
[![Node](https://img.shields.io/badge/node-%E2%89%A520.11-339933)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-%E2%89%A510-F69220)](https://pnpm.io)
[![License](https://img.shields.io/badge/license-MIT-blue)](../../LICENSE)

---

## 项目概述

Orca、Paseo 这类智能体 IDE 提供了工作环境：并行 worktree、每个智能体一个终端、diff 视图。
可是真正推进项目时，同样的问题往往还是会出现。

过去做过的事情没有留下记录。会话结束或者换一个智能体接手，之前的决策就消失了。已经讲过的内容要
重新讲一遍，有时还会退回到早已弃用的做法。

而且成果物的审核也不容易。所以需要一个由人来确认并发布的入口。博客是后台管理页面，Toss 小程序则是
提审前检查和控制台。

这两件事都不是靠打磨提示词能解决的。我们在每个会塌陷的地方各加了一套系统。

| 塌陷的地方 | 系统 | 强制手段 |
| --- | --- | --- |
| 上下文丢失 | 手册 · wiki 索引 · 长短期记忆在每次会话开始时自动加载 | SessionStart 钩子 |
| 质量漂移 | 发布闸门是确定性函数。人和智能体看到相同判定 | 闸门内不调用 LLM |
| 角色混淆 | 每个智能体声明运行时 · 模型 · 写入范围 | `agents/registry.yaml` |
| 来源不明的素材 | 图片生成只有一条路径，每个素材都记录来源 | 工具守卫 + 审计 |
| 意外发布 | 智能体只能推进到 `in_review`。发布按钮由人来按 | 类型里没有这条路径 |

---

## 安装

### 交给智能体来做（推荐）

把这段话原样粘贴给你在用的编码智能体（Claude Code、Codex、Cursor、Gemini CLI 等）。

```text
Install Agent Company by following the instructions here:
https://raw.githubusercontent.com/TOKTOKHAN-DEV/agent-company/refs/heads/main/INSTALL.md
```

这份指南从克隆到验证是自包含的。当前目录为空就直接在原地克隆，必需工具、可选工具以及各自的回退
步骤都写清楚了，智能体卡住时可以自己判断。

### 手动安装

```bash
git clone https://github.com/TOKTOKHAN-DEV/agent-company.git
cd agent-company

pnpm install
pnpm company-setup    # 依赖检查 → 选择要开哪家公司 → 准备环境 → 验证
pnpm dev
```

详细步骤和问题排查请看 [INSTALL.md](../../INSTALL.md)。

> 是 `pnpm company-setup`，不是 `pnpm setup`。`setup` 是 pnpm 的内置命令，同名的脚本会被遮住。

---

## 核心与模板

仓库由两层构成。核心在任何一家公司里都一样，做什么由模板决定。

```
agent-company/
│
├── ── 核心（始终存在） ─────────────────────────────
│   ├── .claude/          钩子(SessionStart · PreToolUse) · 斜杠命令
│   ├── wiki/             项目知识 + 长/短期记忆 + ADR
│   ├── agents/           花名册所在位置 (registry.yaml + <id>/)
│   ├── scripts/          确定性 shell 脚本
│   ├── CLAUDE.md         给 Claude Code 的指引
│   └── AGENTS.md         给所有 AI 编码智能体的共同指引
│
├── ── 模板（选一个铺开） ───────────────────────────
│   └── templates/<id>/
│       ├── template.yaml   清单 — 脚本 · 检查项 · 硬性规则 · 下一步
│       └── files/          按仓库根目录的路径原样存放 (apps/ · packages/ · agents/ …)
│
└── ── 产品（仅本仓库） ─────────────────────────────
    └── site/               落地页。单个静态 HTML，无需构建 → Vercel
```

`pnpm company-setup` 让你选模板，把 `templates/<id>/files/` 铺到根目录，再把清单里的 `script:`
合并进根 `package.json`。切换模板时，只有上一个模板加入的脚本键会被准确收回。

### 现有模板

| id | 状态 | 产出 | 花名册 | 闸门 |
| --- | --- | --- | --- | --- |
| [`blog`](../../templates/blog/README.md) | stable | 公开站点 + 审核台 | blog-writer · image-maker | `audit` → `in_review` |
| `blank` | stable | 只有核心。空花名册 | 自己决定 | 自己做 |
| [`app-in-toss`](../../templates/app-in-toss/README.md) | preview | Toss WebView 小程序 | spec-writer · ui-builder · release-manager | `preflight` → 控制台审核 |

```bash
pnpm template list                    # 列表 · 当前应用的模板
pnpm template apply <id>              # 铺开
pnpm template apply <id> --force      # 覆盖到另一个模板之上
pnpm template prune                   # 清理没用到的目录清单和落地页
```

`planned` 表示清单里只写了意图，还没有内容。`apply` 会拒绝，因为铺一个空壳只会让人事后去找为什么
跑不起来。

### 一个项目就是一家公司

一个仓库有两副面孔。选定之后，剩下的模板清单和产品落地页对那个项目就不需要了，所以
`pnpm company-setup` 会提议清理。

| | 产品仓库（这里） | 用 Use this template 建的自己的项目 |
| --- | --- | --- |
| `site/`（落地页） | 有 → 部署到 Vercel | 清理时删除 |
| 没选中的模板 | 全部保留 | 清理时删除 |
| 选中模板的 `files/` | 有 | 删除（已经铺到根目录） |
| 选中模板的 `template.yaml` | 有 | 保留 |
| 核心 | 有 | 有 |

保留清单很关键，因为 `check-deps.sh` 会从中读取 `verify-*`，`load-context.sh` 会读取 `rule:`。
删掉之后，检查和硬性规则的注入会悄无声息地消失，连报错都没有。

产品仓库带有 `.company/PRODUCT` 标记，所以在这里 prune 会拒绝执行。贡献者克隆下来跑一遍安装，
目录清单也不会被删掉。

清理之后如果又需要别的模板，可以从 upstream 取回。

```bash
git remote add upstream https://github.com/TOKTOKHAN-DEV/agent-company.git
git fetch upstream && git checkout upstream/main -- templates/
```

### 为什么模板没有放在独立仓库

清单里的键是跟核心脚本一起演进的。它们用 `sed` 读取，所以不认识的键会被静默忽略，远程模板一旦是
旧版本，整块检查就会在没有报错的情况下消失。放在同一个仓库里就不会有这个问题。而且安装过程中
夹进网络请求，会破坏“跑两次得到同样状态”的承诺。

体积算不上理由。以 git 的口径看，`templates/` 只有 388K。

该拆分的时机是：第三方开始贡献模板、模板里加入大体积素材、各模板的发布节奏出现分化。到那时要改的
地方只有一处，就是 `template.sh` 里铺文件的部分。

---

## 核心提供的能力

### 1. 上下文层

会话开始时钩子会自动注入以下内容。

```
核心硬性规则 → 当前公司(模板) + 该公司的硬性规则 → wiki 索引
             → 长期记忆 → 最近的短期记忆 → 花名册 → git 状态
```

加载的是索引而不是 wiki 全文。给模型一张地图，需要的文档让它自己去打开
([ADR-0003](../../wiki/decisions/ADR-0003-session-context-loading.md))。

两级记忆只留下能长久的东西。

```
短期记忆 ──(被引用 3 次以上 / 持续被确认为真)──▶ 长期记忆
长期记忆 ──(成为项目规则)──────────────────▶ wiki 文档或 ADR
```

晋级由 `/save-memory` 管理。

### 2. 花名册

这里说的智能体不是 Claude 的子智能体。每个都是在自己终端里运行的独立进程，运行时也各不相同。
正因如此，Orca 这类 ADE 才能在多终端里真正并行执行。

```bash
pnpm agent --list
pnpm agent <id> "<任务>"
pnpm agent <id> "<任务>" --dry-run   # 只输出拼好的命令（贴到另一个终端）
```

启动器从 `agents/registry.yaml` 读取运行时和模型，把 `AGENT.md` 和技能索引（扫描目录自动生成）
组装成系统提示词，再启动对应 CLI。加了技能不用注册就会立刻生效。

增加智能体的依据是运行时和并行性，而不是角色。已有的智能体能做的事，加一个技能会更好 →
[wiki/05-agent-operations.md](../../wiki/05-agent-operations.md)

### 3. 发布闸门

闸门是确定性函数。后台页面和 CLI 调用的是同一个函数，所以人和智能体看到相同的判定。闸门里不放
模型调用，因为让模型评价自己的产出，结果会偏向通过。

闸门具体检查什么由模板决定。`blog` 是 `pnpm audit:content`。

### 4. 图片策略

图片生成只有一条路径，就是 Codex `imagegen`。策略属于核心，执行命令由模板提供，因为生成的图片放
在哪里、把来源写进哪个元数据，各领域并不一样。`blog` 是这样的。

```bash
pnpm imagegen --slug <slug> --prompt "<场景说明>"
```

用不了 Codex 时，按这个顺序回退。

1. 不带图片继续（默认）
2. 请用户自己上传（`source: user-upload`）
3. 网络搜索。必须确认许可，并记录 `source: web-search` 和 `license`

只写在文档里的规则不会被遵守，所以用三层来强制。

| 层 | 手段 |
| --- | --- |
| 类型 | `ImageSource` 里不存在 `claude` 这个值 |
| 钩子 | `PreToolUse` 拦截非 Codex 的图片生成命令 |
| 审计 | 未记录来源 · 没有许可的网络图片按 error 处理 → 无法发布 |

依据：[ADR-0002](../../wiki/decisions/ADR-0002-codex-only-image-generation.md)

### 5. 交接

把在别的工作区做的东西引入进来。将既有服务移植为小程序、接收设计资源包、
接手做了一半的项目时使用。

```bash
pnpm intake ~/Downloads/design-kit.zip
pnpm intake ~/work/other-repo --as reference
```

它会把 zip · tar.gz · 文件夹解开到 `inbox/<名称>/`，剔除 `node_modules` 之类的内容，
然后**生成目录（`INVENTORY.md`）**——技术栈、该先读哪些文档、图片及其分辨率、
打不开的设计文件，以及疑似混入密钥时的警告。

做目录是为了上下文。把整个文件夹丢给智能体，它会一个个打开文件烧掉上下文。
先告诉它什么在哪里，它就只打开需要的那些。

收到的东西不会被执行。软链接会被删除（可能指向仓库之外），解开的代码不会安装也不会构建。
别人给的 zip 是读物，不是拿来运行的。

`inbox/` 不纳入版本管理。**它是原料而不是产出**——只有从中提炼出的规格与素材会留在仓库里
（核心硬性规则 3）。

---

## 核心硬性规则

与模板无关，始终成立。要改动其中一条，得先在 `wiki/decisions/` 写一份 ADR。

1. **图片生成只有一条路径。** 不允许调用别的图片模型，也不允许用 SVG 顶替。
2. **发布按钮由人来按。** 智能体只推进到待审核（`in_review`）。
3. **真相在仓库文件里。** 产出和决策都和代码放在同一个仓库里做版本管理。
4. **闸门是确定性的。** 审核里不加入模型推理。
5. **上下文会自己加载。** 谁都不需要专门去带上它。

领域规则写在 `templates/<id>/template.yaml` 的 `rule:` 里，会话开始时叠加在这五条之上注入。

---

## 命令

### 核心（始终可用）

| 命令 | 说明 |
| --- | --- |
| `pnpm company-setup` | 依赖检查 → 选择模板 → 准备环境 → 验证（+ 可选：GitHub 关注/star） |
| `pnpm check` | 只检查状态（不安装）。包含当前模板的检查项 |
| `pnpm template list \| apply <id> \| prune` | 模板的查看 · 应用 · 清理 |
| `pnpm agent --list \| <id> "<任务>"` | 智能体列表 · 运行 |
| `pnpm intake <zip \| 文件夹>` | 把其他工作区的成果引入 `inbox/` 并生成目录 |
| `pnpm context` | 手动输出会话上下文 |
| `pnpm memory:new <topic>` | 创建新的记忆文件（`--long` 为长期） |
| `pnpm dev \| build \| typecheck \| lint \| test` | 整个工作区（turbo） |

### 模板追加的命令

应用 `blog` 会加上 `dev:web` · `dev:admin` · `audit:content` · `cover` ·
`imagegen`。具体会来哪些键，写在清单的 `script:` 行里。

---

## 斜杠命令

| 命令 | 作用 |
| --- | --- |
| `/company-setup` | 依赖全量检查 + 安装 · 选择模板（关注 · star 为可选） |
| `/save-memory` | 把会话内容存进短期记忆，必要时晋级到长期/wiki |
| `/create-agent` | 一次性在 registry + AGENT.md + skills/ 里创建新智能体 |

智能体读的技能（`agents/<id>/skills/`）是另一回事。那边是启动器注入系统提示词的运行时中立
playbook，所以 codex 智能体也会读。

---

## 编写新模板

```
templates/<id>/
├── template.yaml    清单
└── files/           按仓库根目录的路径原样存放
```

清单采用重复键格式。不引入 YAML 解析器，用 `sed`/`awk` 读取，因为安装过程必须是确定性的。

| 键 | 含义 |
| --- | --- |
| `id` · `name` · `status` · `summary` | 列表里显示的内容。`status` 为 `stable` · `preview` · `planned` |
| `ships` · `hires` · `gate` | 一行摘要（文档 · 落地页会用到） |
| `script: key=value` | 合并进根 `package.json`。切换时只收回这些键 |
| `verify-workspace:` | 连依赖链接一起确认（没有则失败） |
| `verify-dir:` | 目录存在 + 文件数量（没有则失败） |
| `verify-optional:` | 有更好的文件/目录（没有则警告） |
| `verify-env: VAR=说明` | 确认 `.env` 的值。未设置时说明什么功能会关闭 |
| `note-env: VAR=说明` | 空着才正常的值。只展示状态 |
| `runtime:` | 该模板使用的 CLI（没有则警告） |
| `mcp: 服务名=说明` | 该模板使用的 MCP 服务。检查是否已注册 |
| `mcp-claude:` · `mcp-codex:` | 未注册时输出的注册命令 |
| `rule:` | 这家公司的硬性规则。每次会话开始叠加在核心规则之上注入 |
| `next:` | 安装完成后的提示。`${VAR}` 会从 `.env` 替换 |

读取清单的有四处：`scripts/template.sh` · `scripts/check-deps.sh` · `scripts/load-context.sh` ·
`scripts/company-setup.sh`。加了新键，就得让其中一处学会读它。没人读的键只是文档，不是配置。

MCP 的注册检查是读取配置文件（`~/.claude.json` · `.mcp.json` · `~/.codex/config.toml`）来完成的，
而不是执行 `claude mcp list`。那条命令会通过网络做健康检查，会让 `pnpm check` 失去确定性。

---

## 技术栈

pnpm workspaces · Turborepo · TypeScript 5.9（strict）· 确定性 bash 脚本。
应用侧的技术栈（Next.js · React · Tailwind · zod 等）由模板带来。

## 许可证

MIT
