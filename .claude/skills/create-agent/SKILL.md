---
name: create-agent
description: 새 에이전트를 설계하고 registry.yaml + AGENT.md + skills/ 를 정합성 있게 생성한다. 새 런타임이나 새 도메인이 필요할 때 사용.
allowed-tools: Bash, Read, Write, Edit, Grep, Glob
---

# /create-agent

새 에이전트를 만든다. **손으로 만들지 마세요** — `pnpm check`의 정합성 검사에서 걸립니다.

## 먼저: 이 프로젝트의 에이전트란

Claude 서브에이전트가 **아닙니다.** 각자 별도 터미널에서 도는 독립 프로세스이고, 런타임(`claude` /
`codex`)이 다를 수 있습니다. `scripts/run-agent.sh`가 registry를 읽어 해당 CLI를 띄웁니다.

```
agents/<id>/
├── AGENT.md            시스템 프롬프트로 주입되는 역할 정의
└── skills/<name>/SKILL.md   런타임 중립 플레이북 (런처가 인덱스를 자동 생성)
```

## 1단계 — 정말 필요한지 판단

```bash
pnpm agent --list
cat agents/registry.yaml
```

| 상황 | 판단 |
| --- | --- |
| 기존 에이전트가 할 수 있는 일 | **만들지 마세요.** 그 에이전트에 **스킬을 추가**합니다. |
| 다른 런타임이 필요하다 (codex 전용 기능 등) | 만듭니다. 런타임 경계가 프로세스 경계입니다. |
| 동시에 병렬로 돌려야 하는데 파일이 겹치지 않는다 | 만듭니다. |
| 같은 파일을 순차로 건드리는 다른 단계 | **만들지 마세요.** 스킬로 나눕니다. |

**기본값은 "만들지 않는다"입니다.** 현재 팀이 2개인 이유가 이것입니다 — 단계별로 쪼개면 조율 비용만
늘고, 어차피 같은 파일을 순차로 건드립니다. 나누는 기준은 **역할이 아니라 런타임과 병렬성**입니다.

새 스킬만 필요하다면 4단계로 바로 가세요.

## 2단계 — 사양 확정

사용자와 확정합니다. 추측하지 말고 물어보세요.

| 항목 | 결정 기준 |
| --- | --- |
| **id** | kebab-case. 역할이 드러나는 이름 |
| **runtime** | `claude` (판단·글·코드) / `codex` (이미지, OpenAI 전용 기능) |
| **model** | `opus` 판단·검수 / `sonnet` 실행 / `haiku` 기계적 / `default` CLI 기본값 |
| **writes** | glob. **좁을수록 좋습니다.** 기존 에이전트와 겹치면 병렬 실행 시 충돌합니다 |
| **hard_rules** | 이 에이전트가 절대 하지 않을 것 |

### 모델 선택

틀렸을 때 비용이 큰 작업(판단·검수·사실 확인)은 `opus`. 명세가 명확한 실행은 `sonnet`.
**전부 opus로 만들지 마세요** — 명세가 명확한 작업에서는 차이가 거의 없습니다.

codex 런타임은 특별한 이유가 없으면 `default`(CLI 기본 모델)를 씁니다.

### writes 충돌 검사

```bash
grep -A1 'writes:' agents/registry.yaml
```

겹치면 파이프라인 순서를 정하고 `wiki/05-agent-operations.md`에 기록합니다.

## 3단계 — registry 등록

`agents/registry.yaml`의 `agents:` 아래에 추가합니다.

```yaml
  - id: <id>
    name: <표시 이름>
    runtime: <claude|codex>
    model: <opus|sonnet|haiku|default>
    summary: <한 줄 — pnpm agent --list 와 세션 컨텍스트에 노출됨>
    writes: <glob>
    skills: agents/<id>/skills
    definition: agents/<id>/AGENT.md
    hard_rules:
      - <절대 하지 않을 것>
```

## 4단계 — AGENT.md

`agents/<id>/AGENT.md`. 이 파일이 **통째로 시스템 프롬프트에 들어갑니다.**

이미 있는 에이전트가 있으면 그 `AGENT.md` 의 구조를 따르세요. 로스터가 비어 있으면
(`bare` 템플릿) 아래 뼈대에서 시작합니다.

```markdown
# <이름>

당신은 <역할>이다. 런타임은 <runtime>, 모델은 <model>이다.

## 절대 규칙
<우회로를 찾지 말아야 할 것 2~4개. 위반 시 멈추고 보고하도록 명시>

## 작업 흐름
<스킬 이름을 노드로 하는 흐름도>

## 시작하기 전에
<읽어야 할 wiki 문서와 파일>

## 완료 조건
<검증 가능한 명령과 조건>

## 보고
<사람에게 무엇을 전달할지>
```

원칙:

- **완료 조건은 실행 가능한 명령으로.** "좋은 결과"는 완료 조건이 아닙니다.
- **절대 규칙을 비우지 마세요.** 경계가 없으면 writes 범위가 넘칩니다.
- 프로젝트 공통 하드 룰 중 해당되는 것을 명시합니다 (발행 금지, 이미지 금지 등).
- 스킬 목록을 여기에 쓰지 마세요. 런처가 `skills/`를 스캔해 자동으로 붙입니다.

## 5단계 — 스킬

`agents/<id>/skills/<skill-name>/SKILL.md`. 프론트매터 3개 필드가 런처에 노출됩니다.

```markdown
---
name: <skill-name>
summary: <한 줄 — 시스템 프롬프트의 스킬 인덱스에 들어감>
when: <언제 이 스킬을 쓰는지>
---

# <skill-name>

## 1. <단계>
<실행 가능한 명령과 판단 기준>

## 완료 조건
## 하지 않을 것
```

원칙:

- **한 스킬은 한 단계.** 여러 단계를 한 파일에 넣으면 안 읽습니다.
- 명령을 그대로 복사해 쓸 수 있게 적으세요.
- **런타임 중립으로.** codex 에이전트도 읽을 수 있어야 하므로 Claude Code 전용 기능에 의존하지 마세요.
- `## 하지 않을 것`을 비우지 마세요.

## 6단계 — 검증

```bash
pnpm check                          # 정의 · 스킬 정합성, 고아 디렉터리, 런타임 가용성
pnpm agent --list                   # 목록에 나오는지
pnpm agent <id> "테스트" --dry-run   # 조립된 명령 확인
```

`--dry-run`으로 모델 플래그가 의도대로 붙는지 확인하세요.

## 7단계 — 문서 갱신

- `agents/README.md` 팀 표에 행 추가
- `wiki/05-agent-operations.md`의 실행 예시와 병렬 규칙
- `/save-memory`로 왜 이 에이전트가 필요했는지 기록

## 하지 말아야 할 것

- registry만 추가하고 파일을 안 만들지 마세요. `pnpm check`가 잡습니다.
- `writes`를 `**`로 주지 마세요. 최소 권한 원칙입니다.
- 이미지 담당 에이전트가 이미 있으면 다른 에이전트에 이미지 생성 권한을 주지 마세요. 없다면
  새로 만들 때 런타임을 `codex` 로 두세요 — 이미지 경로는 하나입니다 (ADR-0002).
- 새 에이전트에 `status: published` 쓰기를 허용하지 마세요. 출고는 사람만입니다.
- 도메인 규칙은 `templates/<id>/template.yaml` 의 `rule:` 에 함께 적으세요. AGENT.md 에만
  적으면 세션 컨텍스트에 올라오지 않습니다.
