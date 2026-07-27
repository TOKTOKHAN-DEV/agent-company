# Agents

여기 있는 에이전트는 **Claude 서브에이전트가 아닙니다.** 각자 자기 터미널에서 도는 독립 프로세스이고,
런타임도 다릅니다. Orca가 이들을 멀티 터미널로 병렬 실행합니다.

```
agents/
├── registry.yaml            런타임 · 모델 · 권한 (단일 진실 공급원)
├── blog-writer/
│   ├── AGENT.md             시스템 프롬프트로 주입되는 역할 정의
│   └── skills/
│       ├── plan-post/SKILL.md
│       ├── write-draft/SKILL.md
│       ├── optimize-seo-geo/SKILL.md
│       └── review-and-submit/SKILL.md
└── image-maker/
    ├── AGENT.md
    └── skills/
        ├── generate-cover/SKILL.md
        └── fallback-image/SKILL.md
```

## 팀

| ID | 런타임 | 모델 | 역할 |
| --- | --- | --- | --- |
| [blog-writer](./blog-writer/AGENT.md) | `claude` | opus | 기획 → 작성 → SEO/GEO → 검수 |
| [image-maker](./image-maker/AGENT.md) | `codex` | default | imagegen으로 이미지 생성 · 출처 기록 |

둘로 나눈 기준은 **역할**이 아니라 **런타임**입니다. 글은 Claude가, 이미지는 Codex가 만듭니다
([ADR-0002](../wiki/decisions/ADR-0002-codex-only-image-generation.md)). 이 경계는 협상 대상이 아니므로
프로세스 자체를 분리했습니다.

콘텐츠 파이프라인 전체(기획·작성·최적화·검수)를 `blog-writer` 하나가 맡습니다. 단계마다 에이전트를 쪼개면
조율 비용만 늘고, 각 단계는 어차피 같은 파일을 순차로 건드립니다. 대신 단계별 **스킬**로 나눠 두어 필요한
플레이북만 읽게 했습니다.

## 실행

```bash
pnpm agent blog-writer "Next.js 16 캐시 컴포넌트 주제로 글 하나 써줘"
pnpm agent image-maker "nextjs-16-cache-components 글 커버 만들어줘"
```

런처(`scripts/run-agent.sh`)가 하는 일:

1. `registry.yaml`에서 런타임과 모델을 읽는다
2. `AGENT.md` + 스킬 인덱스(스킬 폴더를 스캔해 자동 생성)를 시스템 프롬프트로 조립한다
3. 해당 CLI를 올바른 모델로 띄운다

옵션:

| 옵션 | 용도 |
| --- | --- |
| `--print` | 비대화형 실행 (CI, 파이프라인) |
| `--dry-run` | 실행할 명령만 출력 — Orca 멀티 터미널에 붙여넣을 때 |
| `--list` | 등록된 에이전트 목록 |

### 멀티 터미널

```bash
# 터미널 1
pnpm agent blog-writer "이번 주 주제: Turborepo 캐시 전략"

# 터미널 2 — 초안이 나온 뒤 시작
pnpm agent image-maker "turborepo-cache-strategy 커버 이미지"
```

**같은 파일을 두 에이전트가 동시에 쓰지 않습니다.** `blog-writer`는 본문과 프론트매터를,
`image-maker`는 `cover` 블록만 건드리므로 순서만 지키면 충돌하지 않습니다.

## 스킬

각 에이전트의 `skills/`에 있는 마크다운은 **런타임 중립 플레이북**입니다. Claude Code의 슬래시 커맨드
스킬과는 다른 것입니다 — codex 에이전트도 읽어야 하므로 특정 CLI 기능에 의존하지 않습니다.

| | `agents/<id>/skills/` | `.claude/skills/` |
| --- | --- | --- |
| 읽는 주체 | 그 에이전트 (claude 또는 codex) | 사람의 Claude Code 세션 |
| 형태 | 플레이북 마크다운 | 슬래시 커맨드 |
| 주입 | 런처가 인덱스를 시스템 프롬프트에 넣음 | Claude Code가 자동 탐색 |

## 새 에이전트

```
/create-agent
```

`registry.yaml` 항목 + `AGENT.md` + `skills/` 뼈대를 한 번에 만듭니다. 손으로 만들면
`pnpm check`의 정합성 검사에서 걸립니다.

## 공통 규칙

1. 자기 `writes` 범위 밖 파일을 고치지 않는다.
2. `status: published`로 쓰지 않는다. 발행은 사람만.
3. 이미지는 `image-maker`만 만든다.
4. 완료 보고 전 검증 명령을 통과시킨다 (`pnpm audit:content` / `pnpm typecheck`).
5. 결정을 내렸으면 사람이 `/save-memory`로 남길 수 있게 근거를 출력한다.
