# Orca AI Company

[한국어](../../README.md) ·
**English** ·
[日本語](./README.ja.md) ·
[简体中文](./README.zh-CN.md) ·
[Español](./README.es.md) ·
[Français](./README.fr.md) ·
[Deutsch](./README.de.md) ·
[Português](./README.pt-BR.md) ·
[Русский](./README.ru.md)

> A monorepo template for running IT projects with a team of AI agents.
> Context survives across sessions, and quality is protected by a review gate.

[![Node](https://img.shields.io/badge/node-%E2%89%A520.11-339933)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-%E2%89%A510-F69220)](https://pnpm.io)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000)](https://nextjs.org)
[![License](https://img.shields.io/badge/license-MIT-blue)](../../LICENSE)

---

## What it solves

When you hand a project to an AI, two things break over and over.

**Context disappears.** Once a session ends or the person in charge changes, the AI no longer knows what
was decided. It relitigates settled questions and reverts to approaches you already abandoned.

**There is no quality gate.** Without a review step, whatever the AI produces goes straight to production.

This template blocks both **structurally**.

| Problem | Solution |
| --- | --- |
| Context loss | `CLAUDE.md` + `AGENTS.md` + `wiki/` + short/long-term memory, auto-loaded by a SessionStart hook |
| Quality control | A deterministic audit function + an admin review screen + a publish button only a human can press |
| Blurred roles | Independent agents split by runtime + explicit model mapping + multi-terminal parallelism |
| Image provenance | A single Codex `imagegen` path + recorded provenance + triple enforcement |

---

## Install

### Installation for humans

Paste this prompt into your LLM agent (Claude Code, Codex, Cursor, Gemini CLI, …):

```text
Install and configure orca-ai-company by following the instructions here:
https://raw.githubusercontent.com/TOKTOKHAN-DEV/orca-ai-company/refs/heads/main/INSTALL.md
```

Or read the [installation guide](../../INSTALL.md) yourself. Seriously though, let the agent do it —
humans break config files with typos.

### Installation for LLM agents

Fetch the installation guide and follow it:

```bash
curl -s https://raw.githubusercontent.com/TOKTOKHAN-DEV/orca-ai-company/refs/heads/main/INSTALL.md
```

The guide is **self-contained, from clone to verification**. If the current directory is empty it clones
in place rather than nesting a subdirectory, and it documents every required and optional tool plus the
fallback procedures, so the agent can decide for itself wherever it gets stuck. The closing `pnpm check`
reports deterministically whether the setup succeeded.

### Install it yourself

```bash
git clone https://github.com/TOKTOKHAN-DEV/orca-ai-company.git
cd orca-ai-company
pnpm install
pnpm setup     # full dependency check · environment prep (following/starring is asked, never forced)
pnpm dev       # web → :3000 · admin → :3001
```

See **[INSTALL.md](../../INSTALL.md)** for the detailed procedure and troubleshooting.

> INSTALL.md is currently written in Korean. AI agents read it without trouble; if you need an English
> version for human readers, open an issue.

---

## Layout

```
orca-ai-company/
├── apps/
│   ├── web/              public blog (Next.js 16 App Router, :3000)
│   └── admin/            content · SEO/GEO · review dashboard (:3001)
├── packages/
│   ├── content/          schema · repository drivers · audit · JSON-LD (single source of truth)
│   └── supabase/         client · storage · migrations (inactive without keys)
├── content/posts/        markdown posts — the default driver
├── docs/i18n/            README translations, 8 languages
├── agents/
│   ├── registry.yaml     runtime · model · permissions (single source of truth)
│   ├── blog-writer/      AGENT.md + skills/ (claude · opus)
│   └── image-maker/      AGENT.md + skills/ (codex)
├── wiki/
│   ├── 00~06-*.md        overview · architecture · conventions · guides · history
│   ├── decisions/        ADRs
│   └── memory/           short-term · long-term memory
├── .claude/
│   ├── settings.json     hook registration
│   ├── hooks/            SessionStart context loading · image policy guard
│   └── skills/           3 slash commands
├── scripts/              deterministic shell scripts
├── CLAUDE.md             instructions for Claude Code
└── AGENTS.md             instructions for every AI coding agent
```

---

## Reference implementation: a blog run by AI

### web (`:3000`)

The public blog. Renders only posts with `status: published` from `content/posts/`.
Generates JSON-LD (BlogPosting · FAQPage), `sitemap.xml`, `robots.txt`, and `rss.xml` automatically.
Answer-engine crawlers (GPTBot, ClaudeBot, PerplexityBot, …) are explicitly allowed.

### admin (`:3001`)

- **Editor** — tiptap rich text with image upload. Always stored as markdown
- **Technical SEO panel** — canonical · robots directives · OG/Twitter · sitemap priority · hreflang
- **GEO panel** — extractive summary · FAQ · entities · citations · locale/target markets
- **Review screen** — audit results, JSON-LD preview, human checklist, publish button
- **SEO/GEO dashboard** — outstanding items across all posts, aggregated by lane

The UI uses a Radix-based select rather than the native `<select>` — the OS-drawn popup ignores styling
and differs across browsers.

### agents

```
blog-writer (claude · opus)                       image-maker (codex)   human
plan-post → write-draft → optimize-seo-geo    →   generate-cover    →   admin review → publish
                 ↓
         review-and-submit → status: in_review
```

Agents only go as far as `in_review`. **Publishing is a human act.**

---

## Why SEO and GEO are handled separately

| | SEO | GEO (Generative Engine Optimization) |
| --- | --- | --- |
| Target | Search engines | Answer engines (ChatGPT · Claude · Perplexity · AI Overviews) |
| Goal | **Ranking** | **Citation** |
| Key signals | Title · meta · links · speed | Extractable structure · explicit Q&A · sources · entities |

To be cited, a page has to be easy to lift from. That is why frontmatter carries a separate GEO block:
`geo.faq` renders as `FAQPage` JSON-LD, and `geo.answerSummary` renders as a summary block at the top of
the page.

The working rules live in [wiki/04-seo-geo-playbook.md](../../wiki/04-seo-geo-playbook.md).

---

## Technical SEO

### Generated automatically — nothing to maintain

| Path | Contents |
| --- | --- |
| `/sitemap.xml` | Published posts with per-post priority · changefreq · hreflang |
| `/robots.txt` | Search bots and answer-engine bots allowed, `/api/` blocked |
| `/rss.xml` | Feed of published posts |
| `/llms.txt` | **Site summary for LLMs** — models understand the site without parsing HTML |

`llms.txt` is the GEO counterpart to a sitemap. A sitemap says *where* the URLs are; llms.txt says *what
this site is and which posts exist*. Each entry reuses the post's `geo.answerSummary`, so filling in that
summary pays twice.

### Per-post, from the admin

canonical · noindex/nofollow · robots directives (`max-snippet`, …) · OG/Twitter cards ·
sitemap priority/changefreq · hreflang · whether to include the post in llms.txt.

### Search console and analytics

Set a value in `.env` to switch each one on. **Leave it empty and the tag or script is never emitted.**

| Variable | Target |
| --- | --- |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Search Console |
| `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` | Naver Search Advisor |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | Bing Webmaster Tools |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | GA4 (loaded `afterInteractive`) |

### Natural-language slugs

```
/blog/next-js-16-캐시-컴포넌트-완전-정복
```

Non-ASCII is preserved. Keeping the target keyword in the URL is a real ranking and click-through signal,
and a transliterated slug is unreadable to the audience it targets.

Details: [wiki/08-technical-seo.md](../../wiki/08-technical-seo.md)

---

## Backend — files now, Supabase later

App code never touches storage directly. It only sees an interface.

```
web · admin · audit CLI
        │
        ▼
  getRepository()          ← chosen automatically by whether keys exist
   ├── file       content/posts/*.md   (default · the current state)
   └── supabase   Postgres + Storage   (once keys are set)
```

**Having no keys is the normal state.** `pnpm install && pnpm dev` just works. To switch:

1. Put three Supabase keys in `.env`
2. Apply `packages/supabase/migrations/0001_init.sql`
3. `pnpm --filter @orca/supabase migrate` — move existing posts (idempotent; files are kept)

Not a line of app code changes. `CONTENT_DRIVER=file` reverts at any time.

An RLS policy restricts the anon key to `published` posts that are not `noindex` — the last line of
defence so a bug in the app still cannot leak a draft.

Details: [wiki/07-supabase.md](../../wiki/07-supabase.md)

---

## How context is preserved

When a session starts, a hook injects the following automatically:

```
hard rules  →  wiki index  →  long-term memory  →  recent short-term memory  →  agents  →  git status
```

It loads **the index, not the full wiki.** You hand the model a map and let it open what it needs.

### Two-tier memory

```
short-term ──(referenced 3+ times / confirmed still true)──▶ long-term
long-term  ──(becomes a project rule)───────────────────────▶ wiki doc or ADR
```

Promotion is managed by the `/save-memory` skill.

---

## Image policy (hard rule)

**Images are generated by Codex `imagegen` only. Claude generating images is forbidden.**

```bash
pnpm imagegen --slug <post-slug> --prompt "<scene description>"
```

If Codex is unavailable, fall back in this order:

1. **Proceed without an image** — the default. A cover is not required to publish.
2. **The user attaches one** — `source: user-upload`
3. **Web search** — license verification required. `source: web-search` plus a recorded `license`

A rule that lives only in documentation does not hold, so this one is **enforced in three layers**:

| Layer | Mechanism |
| --- | --- |
| Types | `ImageSource` has no `claude` value at all |
| Hook | `PreToolUse` blocks non-Codex image generation commands |
| Audit | Missing provenance or an unlicensed web image is an error → publishing is blocked |

Rationale: [ADR-0002](../../wiki/decisions/ADR-0002-codex-only-image-generation.md)

---

## Skills (slash commands)

| Command | What it does |
| --- | --- |
| `/orca-setup` | Full dependency check · install (deterministic script) · following/starring is optional |
| `/save-memory` | Save session findings to short-term memory, promoting to long-term/wiki when warranted |
| `/create-agent` | Create a new agent across registry + AGENT.md + skills/ in one consistent step |

The skills an agent reads (`agents/<id>/skills/`) are a different thing. Those are runtime-neutral
playbooks that the launcher injects into the system prompt, so the codex agent reads them too.

---

## Agents

**These are not Claude subagents.** Each one is an independent process in its own terminal, and the
runtimes differ. That is what lets Orca run them genuinely in parallel across terminals.

| ID | Runtime | Model | Role |
| --- | --- | --- | --- |
| `blog-writer` | `claude` | opus | plan → write → SEO/GEO → review |
| `image-maker` | `codex` | default | generate images with imagegen · record provenance |

```bash
pnpm agent --list
pnpm agent blog-writer "Write a post about Turborepo caching strategy"
pnpm agent image-maker "Cover image for turborepo-cache-strategy"
```

```
agents/blog-writer/
├── AGENT.md                       injected as the system prompt
└── skills/
    ├── plan-post/SKILL.md         planning · duplicate check · outline
    ├── write-draft/SKILL.md       writing the body
    ├── optimize-seo-geo/SKILL.md  metadata
    └── review-and-submit/SKILL.md audit · in_review
```

The launcher assembles `AGENT.md` plus a skill index (generated by scanning the folder) into the system
prompt and starts the right CLI with the right model. Adding a skill takes effect immediately, with no
separate registration.

### Why only two

**The dividing line is runtime and parallelism, not role.** All four stages of the content pipeline touch
the same file in sequence, so there is nothing to gain by splitting them into processes — they are split
into skills instead. Images, on the other hand, require a different runtime (Codex only), and that
boundary is non-negotiable, so it became a process boundary and the rule became structural.

Multi-terminal rules: [wiki/05-agent-operations.md](../../wiki/05-agent-operations.md).

---

## Commands

| Command | Description |
| --- | --- |
| `pnpm setup` | Full environment check + install (+ optional GitHub follow/star) |
| `pnpm check` | Check environment status only (installs nothing) |
| `pnpm dev` | Run web and admin together |
| `pnpm dev:web` / `pnpm dev:admin` | Run individually |
| `pnpm build` | Build both apps |
| `pnpm typecheck` | Type check |
| `pnpm audit:content` | Run the publish gate from the CLI (same function as the admin review screen) |
| `pnpm context` | Print the session context manually |
| `pnpm imagegen` | Generate an image with Codex |
| `pnpm memory:new <topic>` | Create a new memory file (`--long` for long-term) |
| `pnpm --filter @orca/supabase migrate` | Move posts from files to Supabase (`--dry-run` supported) |

---

## Adapting it to another domain

The blog is a reference to make the template concrete. To turn it into commerce, a dashboard, or a docs
site:

1. Replace the schema in `packages/content/src/schema.ts`
2. Replace the audit rules in `packages/content/src/audit.ts`
3. Rebuild the agents in `agents/` via `/create-agent`
4. Replace `wiki/03` and `wiki/04` with your domain guides

**What stays**: the hooks, the memory structure, the review-gate pattern, the image policy, and the
monorepo skeleton. That part is the actual value of the template.

---

## Stack

pnpm workspaces · Turborepo · Next.js 16 (App Router) · React 19 · TypeScript 5.9 (strict) ·
Tailwind CSS 4 · zod 4 · Supabase · tiptap · Radix UI · gray-matter · marked · turndown

---

## License

MIT
