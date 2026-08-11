# Agent Company

[한국어](../../README.md) ·
**English** ·
[日本語](./README.ja.md) ·
[简体中文](./README.zh-CN.md) ·
[Español](./README.es.md) ·
[Français](./README.fr.md) ·
[Deutsch](./README.de.md) ·
[Português](./README.pt-BR.md) ·
[Русский](./README.ru.md)

> A monorepo run by an AI team.
> An org chart, a handbook, memory that outlives the session, and a ship button only a person can press.

[![Node](https://img.shields.io/badge/node-%E2%89%A520.11-339933)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-%E2%89%A510-F69220)](https://pnpm.io)
[![License](https://img.shields.io/badge/license-MIT-blue)](../../LICENSE)

---

## What it solves

Agent IDEs give you the office: parallel worktrees, a terminal per agent, a diff view.
Then you hand over a real project and it stalls in the same two places.

**Past decisions don't survive.** The session ends, or another agent picks it up, and three
months of decisions are gone. It reopens settled arguments and brings back the approach you
threw out.

**Nothing stops the output.** Without a gate, whatever the agent produced is what ships.
Handing the review to a model doesn't help — it grades its own output generously.

Neither is fixed by a better prompt. Every failure point gets a mechanism instead.

| What breaks | Mechanism | Enforced by |
| --- | --- | --- |
| Context loss | Handbook, wiki index, and long/short-term memory load at every session start | SessionStart hook |
| Quality drift | The ship gate is a deterministic function. People and agents see the same verdict | No LLM call in the gate |
| Role bleed | Runtime, model, and write scope are declared per agent | `agents/registry.yaml` |
| Untraceable assets | One path for image generation, provenance recorded on every asset | Tool guard + audit |
| Accidental shipping | Agents raise work to `in_review` and stop. A person presses ship | No such route in the types |

---

## Install

### Let an agent do it (recommended)

Paste this into whichever coding agent you use — Claude Code, Codex, Cursor, Gemini CLI.

```text
Install Agent Company by following the instructions here:
https://raw.githubusercontent.com/TOKTOKHAN-DEV/agent-company/refs/heads/main/INSTALL.md
```

The guide is self-contained from clone through verification. If the current folder is empty it
clones in place, and every required/optional tool and fallback is written down so the agent can
decide on its own where it gets stuck.

### By hand

```bash
git clone https://github.com/TOKTOKHAN-DEV/agent-company.git
cd agent-company

pnpm install
pnpm company-setup    # check deps → pick which company to start → prepare env → verify
pnpm dev
```

Full procedure and troubleshooting: **[INSTALL.md](../../INSTALL.md)**.

> It's `pnpm company-setup`, not `pnpm setup`. `setup` is a pnpm builtin and would shadow the
> script.

---

## Core and templates

The repo has two layers. **The core is the same in every company; a template decides what gets
built.**

```
agent-company/
│
├── ── core (always present) ────────────────────────
│   ├── .claude/          hooks (SessionStart · PreToolUse) · slash commands
│   ├── wiki/             project knowledge + long/short-term memory + ADRs
│   ├── agents/           where the roster goes (registry.yaml + <id>/)
│   ├── scripts/          deterministic shell scripts
│   ├── CLAUDE.md         instructions for Claude Code
│   └── AGENTS.md         instructions for every AI coding agent
│
├── ── templates (pick one, lay it down) ────────────
│   └── templates/<id>/
│       ├── template.yaml   manifest — scripts · checks · hard rules · next steps
│       └── files/          repo-root-relative paths (apps/ · packages/ · agents/ …)
│
└── ── product (this repo only) ─────────────────────
    └── site/               landing page. one static HTML file, no build → Vercel
```

`pnpm company-setup` asks which template to use, copies `templates/<id>/files/` into the repo
root, and merges the manifest's `script:` entries into the root `package.json`. Switch templates
and exactly the keys the previous template added are reclaimed.

### Templates today

| id | status | ships | roster | gate |
| --- | --- | --- | --- | --- |
| [`blog-autopublish`](../../templates/blog-autopublish/README.md) | stable | public site + review desk | blog-writer · image-maker | `audit` → `in_review` |
| `bare` | stable | core only, empty roster | you decide | bring your own |
| [`apps-in-toss`](../../templates/apps-in-toss/README.md) | preview | Toss WebView mini app | spec-writer · ui-builder · release-manager | `preflight` → console review |

```bash
pnpm template list                    # list · what's applied
pnpm template apply <id>              # lay it down
pnpm template apply <id> --force      # overwrite on top of another template
pnpm template prune                   # drop the unused catalog and the landing page
```

`planned` means the manifest states intent but there are no files yet. `apply` refuses it —
laying down an empty shell only produces a "why doesn't this work" later.

### One project is one company

**One repo, two faces.** Once you've picked, the rest of the catalog and the product landing page
mean nothing to that project, so `pnpm company-setup` offers to clean them up.

| | Product repo (this one) | Your project via Use this template |
| --- | --- | --- |
| `site/` (landing) | present → deployed to Vercel | deleted |
| Templates you didn't pick | all present | deleted |
| Picked template's `files/` | present | deleted (already at the root) |
| Picked template's `template.yaml` | present | **kept** |
| Core | present | present |

Keeping the manifest is the point — `check-deps.sh` reads `verify-*` from it and
`load-context.sh` reads `rule:`. Delete it and your checks and hard rules vanish silently.

The product repo carries a `.company/PRODUCT` marker, so prune refuses there. A contributor who
clones and runs setup won't lose the catalog.

Need another template later:

```bash
git remote add upstream https://github.com/TOKTOKHAN-DEV/agent-company.git
git fetch upstream && git checkout upstream/main -- templates/
```

### Why templates aren't separate repos

Manifest keys move in lockstep with the core scripts. They're read with `sed`, so **an unknown key
is silently ignored** — a stale remote template would drop entire checks without an error. Keeping
one repo forecloses that. And a network fetch in the middle of setup breaks the "run it twice, get
the same state" promise.

Weight isn't an argument: `templates/` is 388K as far as git is concerned.

Split it when third parties start contributing templates, when a template gains large assets, or
when release cadences diverge. The seam is one spot — the file copy in `template.sh`.

---

## What the core gives you

### 1. The context layer

At session start a hook injects:

```
core hard rules → current company (template) + its hard rules → wiki index
                → long-term memory → recent short-term memory → roster → git status
```

**An index, not the full wiki.** Give the model a map and let it open what it needs
([ADR-0003](../../wiki/decisions/ADR-0003-session-context-loading.md)).

Two-tier memory keeps only what lasts:

```
short-term ──(referenced 3+ times / still true)──▶ long-term
long-term  ──(becomes a project rule)───────────▶ wiki doc or ADR
```

`/save-memory` manages the promotion.

### 2. The roster

**These are not Claude subagents.** Each is an independent process in its own terminal, on its
own runtime. That's what lets an ADE like Orca run them genuinely in parallel.

```bash
pnpm agent --list
pnpm agent <id> "<task>"
pnpm agent <id> "<task>" --dry-run   # print the assembled command for another terminal
```

The launcher reads runtime and model from `agents/registry.yaml`, assembles `AGENT.md` plus a
skill index (generated by scanning the folder) into the system prompt, and starts that CLI.
Add a skill and it shows up without registering anything.

You add an agent for **runtime and parallelism, not for roles**. If an existing agent could do
it, add a skill instead → [wiki/05-agent-operations.md](../../wiki/05-agent-operations.md)

### 3. The ship gate

The gate is a deterministic function. The admin screen and the CLI call the same function, so
people and agents see the same verdict. No model call goes inside it — a model asked to grade
its own output leans toward passing.

What the gate checks is up to the template. For `blog-autopublish` it's `pnpm audit:content`.

### 4. The image policy

There is exactly one path for image generation: Codex `imagegen`. The policy is core; the
command comes from the template, because where an image lands and which metadata records its
provenance differ per domain. For `blog-autopublish`:

```bash
pnpm imagegen --slug <slug> --prompt "<scene>"
```

If Codex isn't available, fall back in this order:

1. **Ship without an image** — the default
2. **Ask the user to attach one** — `source: user-upload`
3. **Web search** — license must be verified. `source: web-search` + `license`

A rule that only lives in a doc isn't followed, so it's enforced in three layers:

| Layer | Mechanism |
| --- | --- |
| Types | `ImageSource` has no `claude` value |
| Hook | `PreToolUse` blocks non-Codex image generation commands |
| Audit | Missing provenance or an unlicensed web image is an error → cannot ship |

Rationale: [ADR-0002](../../wiki/decisions/ADR-0002-codex-only-image-generation.md)

---

## Core hard rules

True regardless of template. Changing one requires an ADR in `wiki/decisions/` first.

1. **One path for image generation.** No other image model, no SVG stand-in.
2. **A person presses ship.** Agents raise work to `in_review` and stop.
3. **Files are the source of truth.** Output and decisions are versioned in the same repo as the code.
4. **The gate is deterministic.** No model inference inside the review.
5. **Context loads itself.** Nobody has to remember to bring it.

Domain rules go in `templates/<id>/template.yaml` under `rule:` and are injected on top of these
five at session start.

---

## Commands

### Core (always)

| Command | Description |
| --- | --- |
| `pnpm company-setup` | Check deps → pick a template → prepare env → verify (+ optional GitHub follow/star) |
| `pnpm check` | Inspect state only (installs nothing), including the current template's checks |
| `pnpm template list \| apply <id> \| prune` | List · apply · clean up templates |
| `pnpm agent --list \| <id> "<task>"` | List · run agents |
| `pnpm context` | Print the session context manually |
| `pnpm memory:new <topic>` | Create a memory file (`--long` for long-term) |
| `pnpm dev \| build \| typecheck \| lint \| test` | Whole workspace (turbo) |

### What a template adds

Applying `blog-autopublish` adds `dev:web`, `dev:admin`, `audit:content`, `cover`, and
`imagegen`. The manifest's `script:` lines say exactly which keys arrive.

---

## Slash commands

| Command | What it does |
| --- | --- |
| `/company-setup` | Full dependency check + install + template selection (follow/star optional) |
| `/save-memory` | Save the session to short-term memory, promote to long-term/wiki when warranted |
| `/create-agent` | Create an agent across registry + AGENT.md + skills/ in one pass |

Agent skills (`agents/<id>/skills/`) are a different thing: runtime-neutral playbooks the
launcher injects into the system prompt, so codex agents read them too.

---

## Writing a new template

```
templates/<id>/
├── template.yaml    manifest
└── files/           repo-root-relative paths
```

The manifest uses a repeated-key format. No YAML parser is pulled in — `sed`/`awk` read it,
because setup has to stay deterministic.

| Key | Meaning |
| --- | --- |
| `id` · `name` · `status` · `summary` | What shows in the list. `status` is `stable` · `preview` · `planned` |
| `ships` · `hires` · `gate` | One-line summaries (used in docs and the landing page) |
| `script: key=value` | Merged into the root `package.json`. Only these keys are reclaimed on switch |
| `verify-workspace:` | Dependencies must be linked (failure if not) |
| `verify-dir:` | Directory exists + file count (failure if not) |
| `verify-optional:` | Nice-to-have file/dir (warning if missing) |
| `verify-env: VAR=why` | Check `.env`. If unset, report what's turned off |
| `note-env: VAR=why` | Values that are normally empty. State only, never a warning |
| `runtime:` | CLIs this template uses (warning if missing) |
| `mcp: name=why` | MCP servers this template uses. Registration is checked |
| `mcp-claude:` · `mcp-codex:` | The add command to print when one is missing |
| `rule:` | This company's hard rules, injected on top of the core rules |
| `next:` | Post-setup guidance. `${VAR}` is substituted from `.env` |

Four scripts read the manifest: `scripts/template.sh`, `scripts/check-deps.sh`,
`scripts/load-context.sh`, and `scripts/company-setup.sh`. Add a key and one of them has to
learn it — a key nobody reads is documentation, not configuration.

MCP registration is checked by reading config files (`~/.claude.json`, `.mcp.json`,
`~/.codex/config.toml`) rather than running `claude mcp list`, which would health-check over the
network and make `pnpm check` non-deterministic.

---

## Stack

pnpm workspaces · Turborepo · TypeScript 5.9 (strict) · deterministic bash scripts.
The app stack (Next.js, React, Tailwind, zod, …) comes from the template.

## License

MIT
