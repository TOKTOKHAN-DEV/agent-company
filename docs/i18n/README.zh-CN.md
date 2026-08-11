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

> **⚠️ 此翻译仍是旧结构。** 仓库已改为「核心 + 模板」结构。
> 最新内容请参阅 [한국어](../../README.md) 或 [English](./README.en.md)。

> 用 AI 智能体团队运行 IT 项目的 monorepo 模板。
> 上下文跨会话保留，质量由审核关卡把守。

[![Node](https://img.shields.io/badge/node-%E2%89%A520.11-339933)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-%E2%89%A510-F69220)](https://pnpm.io)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000)](https://nextjs.org)
[![License](https://img.shields.io/badge/license-MIT-blue)](../../LICENSE)

---

## 解决什么问题

把项目交给 AI 时，有两件事会反复崩掉。

**上下文消失。** 会话结束或负责人更换后，AI 不知道之前做过什么决定。它会重复同样的讨论，并退回到你已经
废弃的做法。

**没有质量把关。** 没有审核关卡，AI 产出的东西会直接上生产环境。

这个模板用**结构**堵住这两个洞。

| 问题 | 解决方案 |
| --- | --- |
| 上下文丢失 | `CLAUDE.md` + `AGENTS.md` + `wiki/` + 长短期记忆，由 SessionStart 钩子自动加载 |
| 质量控制 | 确定性审计函数 + 后台审核界面 + 只有人能按的发布按钮 |
| 角色混杂 | 按运行时拆分的独立智能体 + 显式模型映射 + 多终端并行 |
| 图片可信度 | Codex `imagegen` 单一路径 + 记录来源 + 三重强制 |

---

## 安装

### 面向人类的安装

把这段提示词粘贴到你的 LLM 智能体（Claude Code、Codex、Cursor、Gemini CLI 等）里：

```text
Install and configure agent-company by following the instructions here:
https://raw.githubusercontent.com/TOKTOKHAN-DEV/agent-company/refs/heads/main/INSTALL.md
```

你也可以自己读[安装指南](../../INSTALL.md)。不过说真的，交给智能体吧 —— 人类会把配置文件敲错。

### 面向 LLM 智能体的安装

拉取安装指南并照着执行：

```bash
curl -s https://raw.githubusercontent.com/TOKTOKHAN-DEV/agent-company/refs/heads/main/INSTALL.md
```

这份指南**从克隆到验证都是自包含的**。如果当前目录为空，它会就地克隆而不是嵌套一层子目录；必需与可选
工具、回退流程也都写清楚了，智能体遇到卡点时能自行判断。最后的 `pnpm check` 会确定性地告诉你安装
是否成功。

### 自己安装

```bash
git clone https://github.com/TOKTOKHAN-DEV/agent-company.git
cd agent-company
pnpm install
pnpm setup     # 依赖全量检查 · 环境准备 · 关注组织 · 给仓库点 star
pnpm dev       # web → :3000 · admin → :3001
```

详细步骤与故障排查见 **[INSTALL.md](../../INSTALL.md)**。

> INSTALL.md 目前是韩语。AI 智能体读取没有问题。

---

## 结构

```
agent-company/
├── apps/
│   ├── web/              公开博客 (Next.js 16 App Router, :3000)
│   └── admin/            内容 · SEO/GEO · 审核面板 (:3001)
├── packages/
│   ├── content/          schema · 存储驱动 · 审计 · JSON-LD（唯一可信来源）
│   └── supabase/         客户端 · 存储 · 迁移（没有密钥时不启用）
├── content/posts/        Markdown 文章 — 默认驱动
├── docs/i18n/            README 翻译，8 种语言
├── agents/
│   ├── registry.yaml     运行时 · 模型 · 权限（唯一可信来源）
│   ├── blog-writer/      AGENT.md + skills/ (claude · opus)
│   └── image-maker/      AGENT.md + skills/ (codex)
├── wiki/
│   ├── 00~06-*.md        概览 · 架构 · 约定 · 指南 · 历史
│   ├── decisions/        ADR
│   └── memory/           短期 · 长期记忆
├── .claude/
│   ├── settings.json     钩子注册
│   ├── hooks/            SessionStart 上下文加载 · 图片策略守卫
│   └── skills/           3 个斜杠命令
├── scripts/              确定性 shell 脚本
├── CLAUDE.md             给 Claude Code 的指令
└── AGENTS.md             给所有 AI 编码智能体的指令
```

---

## 参考实现：由 AI 运营的博客

### web (`:3000`)

公开博客。只渲染 `content/posts/` 中 `status: published` 的文章。
自动生成 JSON-LD（BlogPosting · FAQPage）、`sitemap.xml`、`robots.txt` 和 `rss.xml`。
明确允许回答引擎的爬虫（GPTBot、ClaudeBot、PerplexityBot 等）。

### admin (`:3001`)

- **编辑器** — tiptap 富文本 + 图片上传。存储格式始终是 Markdown
- **技术 SEO 面板** — canonical · robots 指令 · OG/Twitter · 站点地图 priority · hreflang
- **GEO 面板** — 可提取摘要 · FAQ · 实体 · 引用来源 · 语言/目标市场
- **审核界面** — 自动审计结果、JSON-LD 预览、人工检查清单、发布按钮
- **SEO/GEO 看板** — 按 lane 汇总所有文章的未解决项

界面使用基于 Radix 的自定义 select，而不是原生 `<select>` —— 由操作系统绘制的下拉框无法应用样式，
且各浏览器表现不一致。

### agents

```
blog-writer (claude · opus)                       image-maker (codex)   人
plan-post → write-draft → optimize-seo-geo    →   generate-cover    →   admin 审核 → 发布
                 ↓
         review-and-submit → status: in_review
```

智能体最多推进到 `in_review`。**发布是人的行为。**

---

## 为什么把 SEO 和 GEO 分开处理

| | SEO | GEO（生成式引擎优化） |
| --- | --- | --- |
| 对象 | 搜索引擎 | 回答引擎（ChatGPT · Claude · Perplexity · AI Overviews） |
| 目标 | **排名** | **被引用** |
| 关键信号 | 标题 · meta · 链接 · 速度 | 可提取的结构 · 显式问答 · 出处 · 实体 |

想被引用，页面就得易于摘取。因此 frontmatter 里有独立的 GEO 块：
`geo.faq` 渲染为 `FAQPage` JSON-LD，`geo.answerSummary` 渲染为页面顶部的摘要块。

实操规则见 [wiki/04-seo-geo-playbook.md](../../wiki/04-seo-geo-playbook.md)。

---

## 技术 SEO

### 自动生成 — 无需维护

| 路径 | 内容 |
| --- | --- |
| `/sitemap.xml` | 已发布文章 + 每篇的 priority · changefreq · hreflang |
| `/robots.txt` | 允许搜索爬虫与回答引擎爬虫，屏蔽 `/api/` |
| `/rss.xml` | 已发布文章的订阅源 |
| `/llms.txt` | **面向 LLM 的站点摘要** — 模型无需解析 HTML 即可理解本站 |

`llms.txt` 是站点地图的 GEO 对应物。站点地图告诉爬虫"URL 在哪里"，llms.txt 告诉模型"这个站点是什么、
有哪些文章"。每一条都复用文章的 `geo.answerSummary`，所以写好摘要收益翻倍。

### 每篇文章在后台设置

canonical · noindex/nofollow · robots 指令（`max-snippet` 等）· OG/Twitter 卡片 ·
站点地图 priority/changefreq · hreflang · 是否收录进 llms.txt。

### 搜索平台与分析

在 `.env` 中填值即可启用。**留空则相应的标签或脚本根本不会输出。**

| 变量 | 对应平台 |
| --- | --- |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Search Console |
| `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` | Naver 搜索顾问 |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | Bing 站长工具 |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | GA4（`afterInteractive` 加载） |

### 自然语言 slug

```
/blog/next-js-16-缓存组件完全指南
```

保留非 ASCII 字符。让目标关键词留在 URL 里是真实的排名与点击率信号，而音译 slug 对目标读者来说
根本读不懂。

详见：[wiki/08-technical-seo.md](../../wiki/08-technical-seo.md)

---

## 后端 —— 现在是文件，以后是 Supabase

应用代码从不直接接触存储，只面向接口。

```
web · admin · audit CLI
        │
        ▼
  getRepository()          ← 根据是否存在密钥自动选择
   ├── file       content/posts/*.md   （默认 · 当前状态）
   └── supabase   Postgres + Storage   （填入密钥后）
```

**没有密钥就是正常状态。** `pnpm install && pnpm dev` 直接可用。切换方式：

1. 在 `.env` 填入三个 Supabase 密钥
2. 执行 `packages/supabase/migrations/0001_init.sql`
3. `pnpm --filter @repo/supabase migrate` — 迁移已有文章（幂等，文件保留）

应用代码一行都不用改。随时可用 `CONTENT_DRIVER=file` 回退。

RLS 策略限制 anon 密钥只能读取 `published` 且非 `noindex` 的文章 —— 这是即使应用出 bug 也不会
泄露草稿的最后一道防线。

详见：[wiki/07-supabase.md](../../wiki/07-supabase.md)

---

## 上下文如何保留

会话开始时，钩子会自动注入：

```
硬规则 → wiki 索引 → 长期记忆 → 最近的短期记忆 → 智能体 → git 状态
```

只加载**索引而非 wiki 全文**。给模型一张地图，需要的文档让它自己打开。

### 两级记忆

```
短期记忆 ──(被引用 3 次以上 / 确认仍然成立)──▶ 长期记忆
长期记忆 ──(成为项目规则)──────────────────▶ wiki 文档或 ADR
```

晋级由 `/save-memory` 技能管理。

---

## 图片策略（硬规则）

**图片只能用 Codex `imagegen` 生成。禁止 Claude 生成图片。**

```bash
pnpm imagegen --slug <post-slug> --prompt "<场景描述>"
```

Codex 不可用时，按此顺序回退：

1. **不带图片继续** — 默认。封面不是发布的必需项。
2. **用户自行上传** — `source: user-upload`
3. **网络搜索** — 必须确认许可。`source: web-search` 并记录 `license`

只写在文档里的规则不会被遵守，所以这条**用三层强制**：

| 层 | 手段 |
| --- | --- |
| 类型 | `ImageSource` 里根本不存在 `claude` 这个值 |
| 钩子 | `PreToolUse` 拦截非 Codex 的图片生成命令 |
| 审计 | 未记录来源、无许可的网络图片判为 error → 无法发布 |

依据：[ADR-0002](../../wiki/decisions/ADR-0002-codex-only-image-generation.md)

---

## 技能（斜杠命令）

| 命令 | 作用 |
| --- | --- |
| `/company-setup` | 依赖全量检查 · 安装 · 关注组织 · 点 star（确定性脚本） |
| `/save-memory` | 把会话内容存入短期记忆，必要时晋级到长期/wiki |
| `/create-agent` | 一次性在 registry + AGENT.md + skills/ 中生成新智能体 |

智能体读取的技能（`agents/<id>/skills/`）是另一回事。那些是启动器注入系统提示词的运行时中立
playbook，codex 智能体同样会读。

---

## 智能体

**它们不是 Claude 子智能体。** 每个都是各自终端里的独立进程，运行时也不同。正因如此 Orca 才能在多终端里
真正并行运行。

| ID | 运行时 | 模型 | 角色 |
| --- | --- | --- | --- |
| `blog-writer` | `claude` | opus | 策划 → 写作 → SEO/GEO → 审核 |
| `image-maker` | `codex` | default | 用 imagegen 生成图片 · 记录来源 |

```bash
pnpm agent --list
pnpm agent blog-writer "写一篇关于 Turborepo 缓存策略的文章"
pnpm agent image-maker "turborepo-cache-strategy 的封面图"
```

```
agents/blog-writer/
├── AGENT.md                       作为系统提示词注入
└── skills/
    ├── plan-post/SKILL.md         策划 · 查重 · 大纲
    ├── write-draft/SKILL.md       写正文
    ├── optimize-seo-geo/SKILL.md  元数据
    └── review-and-submit/SKILL.md 审计 · in_review
```

启动器把 `AGENT.md` 和技能索引（扫描文件夹自动生成）组装成系统提示词，并用正确的模型启动对应 CLI。
新增技能无需注册即刻生效。

### 为什么只有两个

**划分依据是运行时和并行性，不是角色。** 内容流水线的四个阶段都在顺序地改同一个文件，拆成进程没有收益 ——
所以改用技能来拆分。而图片的运行时本身就不同（仅限 Codex），这条边界没有商量余地，于是把它做成进程边界，
让规则变成结构。

多终端规则见 [wiki/05-agent-operations.md](../../wiki/05-agent-operations.md)。

---

## 命令

| 命令 | 说明 |
| --- | --- |
| `pnpm setup` | 完整环境检查 + 安装 + GitHub 关注/star |
| `pnpm check` | 只检查环境状态（不安装） |
| `pnpm dev` | 同时运行 web 和 admin |
| `pnpm dev:web` / `pnpm dev:admin` | 单独运行 |
| `pnpm build` | 构建两个应用 |
| `pnpm typecheck` | 类型检查 |
| `pnpm audit:content` | 在 CLI 里跑发布关卡（与后台审核界面同一个函数） |
| `pnpm context` | 手动输出会话上下文 |
| `pnpm imagegen` | 用 Codex 生成图片 |
| `pnpm memory:new <topic>` | 创建新记忆文件（`--long` 为长期） |
| `pnpm --filter @repo/supabase migrate` | 把文章从文件迁移到 Supabase（支持 `--dry-run`） |

---

## 改成其他领域

博客只是帮助理解的参考实现。要改成电商、仪表盘或文档站：

1. 替换 `packages/content/src/schema.ts` 中的 schema
2. 替换 `packages/content/src/audit.ts` 中的审计规则
3. 用 `/create-agent` 重建 `agents/`
4. 把 `wiki/03` 和 `wiki/04` 换成你的领域指南

**保留不动的**：钩子、记忆结构、审核关卡模式、图片策略、monorepo 骨架。
这部分才是模板的真正价值。

---

## 技术栈

pnpm workspaces · Turborepo · Next.js 16 (App Router) · React 19 · TypeScript 5.9 (strict) ·
Tailwind CSS 4 · zod 4 · Supabase · tiptap · Radix UI · gray-matter · marked · turndown

---

## 许可证

MIT
