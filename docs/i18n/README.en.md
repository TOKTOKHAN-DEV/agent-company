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

## Overview

Agent IDEs like Orca and Paseo give you a working environment: parallel worktrees, a terminal per
agent, a diff view. Once you start running a real project on them, though, the same problems tend
to come up.

The history of what you already did doesn't stick around. The session ends, or another agent picks
the work up, and past decisions are gone. You end up explaining things you already settled, and
sometimes the work drifts back to an approach you had abandoned.

Reviewing the output is not easy either. That is why you need a place where a person checks the
work and sends it out. For a blog that is an admin page; for a Toss mini app it is the submission
preflight and the console.

Neither problem is solved by polishing prompts. We added one system for each point where things
break down.

| What breaks | System | Enforced by |
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
clones in place, and every required and optional tool along with its fallback is written down, so
the agent can decide for itself wherever it gets stuck.

### By hand

```bash
git clone https://github.com/TOKTOKHAN-DEV/agent-company.git
cd agent-company

pnpm install
pnpm company-setup    # check deps → pick which company to start → prepare env → verify
pnpm dev
```

For the full procedure and troubleshooting, see [INSTALL.md](../../INSTALL.md).

> It's `pnpm company-setup`, not `pnpm setup`. `setup` is a pnpm builtin, so a script with the same
> name would be shadowed.

---

## Core and templates

The repo is made of two layers. The core is the same in every company, and a template decides what
gets built.

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
| [`app-in-toss`](../../templates/app-in-toss/README.md) | preview | Toss WebView mini app | spec-writer · ui-builder · release-manager | `preflight` → console review |

```bash
pnpm template list                    # list · what's applied
pnpm template apply <id>              # lay it down
pnpm template apply <id> --force      # overwrite on top of another template
pnpm template prune                   # drop the unused catalog and the landing page
```

`planned` means the manifest states the intent but there are no files yet. `apply` refuses it,
because laying down an empty shell only leaves you wondering later why nothing works.

### One project is one company

One repo carries two faces. Once you have picked, the rest of the catalog and the product landing
page are not needed in that project, so `pnpm company-setup` offers to clean them up.

| | Product repo (this one) | Your project via Use this template |
| --- | --- | --- |
| `site/` (landing) | present → deployed to Vercel | deleted |
| Templates you didn't pick | all present | deleted |
| Picked template's `files/` | present | deleted (already at the root) |
| Picked template's `template.yaml` | present | kept |
| Core | present | present |

Keeping the manifest matters, because `check-deps.sh` reads `verify-*` from it and
`load-context.sh` reads `rule:`. Delete it and your checks and hard rules disappear without an
error.

The product repo carries a `.company/PRODUCT` marker, so prune refuses there. A contributor who
clones and runs setup won't lose the catalog.

If you need another template later, you can pull it from upstream.

```bash
git remote add upstream https://github.com/TOKTOKHAN-DEV/agent-company.git
git fetch upstream && git checkout upstream/main -- templates/
```

### Why templates are not separate repos

Manifest keys move together with the core scripts. They are read with `sed`, so an unknown key is
silently ignored, and a stale remote template would drop entire checks without an error. Keeping
one repo avoids that. A network fetch in the middle of setup would also break the promise that
running it twice gives you the same state.

Weight is not much of an argument. `templates/` is 388K as far as git is concerned.

The time to split is when third parties start contributing templates, when a template gains large
assets, or when release cadences diverge. The one spot to change is the file copy in
`template.sh`.

---

## What the core provides

### 1. The context layer

At session start a hook injects the following.

```
core hard rules → current company (template) + its hard rules → wiki index
                → long-term memory → recent short-term memory → roster → git status
```

It loads an index rather than the full wiki. The model gets a map and opens what it needs
([ADR-0003](../../wiki/decisions/ADR-0003-session-context-loading.md)).

Two-tier memory keeps only what lasts.

```
short-term ──(referenced 3+ times / still true)──▶ long-term
long-term  ──(becomes a project rule)───────────▶ wiki doc or ADR
```

`/save-memory` manages the promotion.

### 2. The roster

The agents here are not Claude subagents. Each one is an independent process in its own terminal,
and their runtimes differ. That is what lets an ADE like Orca run them genuinely in parallel.

```bash
pnpm agent --list
pnpm agent <id> "<task>"
pnpm agent <id> "<task>" --dry-run   # print the assembled command for another terminal
```

The launcher reads runtime and model from `agents/registry.yaml`, assembles `AGENT.md` and a skill
index (generated by scanning the folder) into the system prompt, and starts that CLI. Add a skill
and it shows up without registering anything.

You add an agent for runtime and parallelism, not for roles. If an existing agent could do the
work, adding a skill is the better move →
[wiki/05-agent-operations.md](../../wiki/05-agent-operations.md)

### 3. The ship gate

The gate is a deterministic function. The admin screen and the CLI call the same function, so
people and agents see the same verdict. No model call goes inside it, because a model asked to
grade its own output leans toward passing.

What the gate checks is up to the template. For `blog-autopublish` it is `pnpm audit:content`.

### 4. The image policy

There is one path for image generation: Codex `imagegen`. The policy belongs to the core and the
command comes from the template, because where an image lands and which metadata records its
provenance differ per domain. For `blog-autopublish` it looks like this.

```bash
pnpm imagegen --slug <slug> --prompt "<scene>"
```

If Codex isn't available, fall back in this order.

1. Ship without an image (the default)
2. Ask the user to attach one (`source: user-upload`)
3. Web search. The license must be verified, and `source: web-search` plus `license` are recorded

A rule that only lives in a doc isn't followed, so it is enforced in three layers.

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
| `/company-setup` | Full dependency check + install · template selection (follow/star optional) |
| `/save-memory` | Save the session to short-term memory, promote to long-term/wiki when warranted |
| `/create-agent` | Create an agent across registry + AGENT.md + skills/ in one pass |

Agent skills (`agents/<id>/skills/`) are a different thing. Those are runtime-neutral playbooks the
launcher injects into the system prompt, so codex agents read them too.

---

## Writing a new template

```
templates/<id>/
├── template.yaml    manifest
└── files/           repo-root-relative paths
```

The manifest uses a repeated-key format. No YAML parser is pulled in, since `sed`/`awk` read it and
setup has to stay deterministic.

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
`scripts/load-context.sh`, and `scripts/company-setup.sh`. Add a key and one of them has to learn
it, since a key nobody reads is documentation rather than configuration.

MCP registration is checked by reading config files (`~/.claude.json`, `.mcp.json`,
`~/.codex/config.toml`) rather than running `claude mcp list`. That command health-checks over the
network, which would make `pnpm check` non-deterministic.

---

## Stack

pnpm workspaces · Turborepo · TypeScript 5.9 (strict) · deterministic bash scripts.
The app stack (Next.js, React, Tailwind, zod, and so on) comes from the template.

## License

MIT
