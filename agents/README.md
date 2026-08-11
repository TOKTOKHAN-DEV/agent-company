# Agents

여기 있는 에이전트는 **Claude 서브에이전트가 아닙니다.** 각자 자기 터미널에서 도는 독립
프로세스이고, 런타임도 다릅니다. 그래서 Orca 같은 ADE 가 멀티 터미널로 진짜 병렬 실행할 수
있습니다.

**로스터는 템플릿이 채웁니다.** 템플릿을 아직 펼치지 않았다면 이 디렉터리에 이 문서만 있는
것이 정상입니다.

```bash
pnpm template list       # 어떤 회사를 차릴지
pnpm agent --list        # 지금 등록된 직원
```

---

## 구조

```
agents/
├── registry.yaml            런타임 · 모델 · 쓰기 범위 (단일 진실 공급원)
└── <id>/
    ├── AGENT.md             시스템 프롬프트로 통째로 주입되는 역할 정의
    └── skills/
        └── <name>/SKILL.md  단계별 플레이북
```

`registry.yaml` 항목 형태:

```yaml
  - id: blog-writer
    name: Blog Writer
    runtime: claude          # claude | codex
    model: opus              # opus | sonnet | haiku | default
    summary: 한 줄로 무엇을 하는 에이전트인지.
    writes: content/posts/** # 이 범위 밖은 건드리지 않는다
    skills: agents/blog-writer/skills
    definition: agents/blog-writer/AGENT.md
    hard_rules:
      - 이 에이전트가 절대 하지 않는 일.
```

### 모델 선택 기준

| 모델 | 쓰는 곳 |
| --- | --- |
| `opus` | 판단 · 설계 · 검수. 틀리면 비싼 작업 |
| `sonnet` | 실행 · 구현 · 변환. 명세가 명확한 작업 |
| `haiku` | 분류 · 추출 · 포맷팅. 기계적인 작업 |
| `default` | 해당 CLI 의 기본 모델을 그대로 사용 (플래그를 넘기지 않음) |

---

## 실행

```bash
pnpm agent <id> "<작업>"
```

런처(`scripts/run-agent.sh`)가 하는 일:

1. `registry.yaml` 에서 런타임과 모델을 읽는다
2. `AGENT.md` + 스킬 인덱스(스킬 폴더를 스캔해 자동 생성)를 시스템 프롬프트로 조립한다
3. 해당 CLI 를 올바른 모델로 띄운다

스킬 인덱스를 폴더 스캔으로 만들기 때문에 `SKILL.md` 를 추가하면 별도 등록 없이 바로
노출됩니다.

| 옵션 | 용도 |
| --- | --- |
| `--list` | 등록된 에이전트 목록 |
| `--print` | 비대화형 실행 (CI, 파이프라인) |
| `--dry-run` | 실행할 명령만 출력 — 멀티 터미널에 붙여넣을 때 |

### 멀티 터미널

```bash
# 터미널 1
pnpm agent blog-writer "이번 주 주제: Turborepo 캐시 전략"

# 터미널 2 — 초안이 나온 뒤 시작
pnpm agent image-maker "turborepo-cache-strategy 커버 이미지"
```

**쓰기 범위(`writes`)가 겹치지 않으면 동시에 돌려도 됩니다.** 겹치면 순서를 지키세요.
같은 파일의 프론트매터를 둘 다 통째로 다시 쓴다면 범위가 달라 보여도 충돌합니다.

멀티 터미널 운영 규칙은 [wiki/05-agent-operations.md](../wiki/05-agent-operations.md).

---

## 스킬

각 에이전트의 `skills/` 에 있는 마크다운은 **런타임 중립 플레이북**입니다. Claude Code 의
슬래시 커맨드 스킬과는 다른 것입니다 — codex 에이전트도 읽어야 하므로 특정 CLI 기능에
의존하지 않습니다.

| | `agents/<id>/skills/` | `.claude/skills/` |
| --- | --- | --- |
| 읽는 주체 | 그 에이전트 (claude 또는 codex) | 사람의 Claude Code 세션 |
| 형태 | 플레이북 마크다운 | 슬래시 커맨드 |
| 주입 | 런처가 인덱스를 시스템 프롬프트에 넣음 | Claude Code 가 자동 탐색 |

---

## 새 에이전트

```
/create-agent
```

`registry.yaml` 항목 + `AGENT.md` + `skills/` 뼈대를 한 번에 만듭니다. 손으로 만들면
`pnpm check` 의 정합성 검사에서 걸립니다 (레지스트리에 있는데 정의가 없거나, 정의가 있는데
레지스트리에 없는 경우 둘 다 잡습니다).

### 늘리는 기준

**역할이 아니라 런타임과 병렬성입니다.**

한 파이프라인의 여러 단계가 같은 파일을 순차로 건드린다면 프로세스를 나눌 이유가 없습니다 —
조율 비용만 늘어납니다. 대신 단계별 **스킬**로 나누세요. 반대로 런타임 자체가 다르거나
(claude ↔ codex) 진짜로 동시에 돌아야 한다면 그때 프로세스를 분리합니다.

근거: [wiki/memory/long-term/agent-granularity.md](../wiki/memory/long-term/agent-granularity.md)

---

## 공통 규칙

1. 자기 `writes` 범위 밖 파일을 고치지 않는다. 범위 밖 문제는 보고만 한다.
2. `status: published` 로 쓰지 않는다. 출고는 사람만.
3. 이미지는 허가된 경로 하나로만 만든다 (`pnpm imagegen`).
4. 완료 보고 전 검증 명령을 통과시킨다 (`pnpm typecheck` + 템플릿의 게이트).
5. 결정을 내렸으면 사람이 `/save-memory` 로 남길 수 있게 근거를 출력한다.
