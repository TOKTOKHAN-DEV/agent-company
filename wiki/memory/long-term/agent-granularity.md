---
date: 2026-07-28
type: decision
topic: agent-granularity
tags: [agents, architecture, rules]
confidence: high
promoted: true
---

# 에이전트를 나누는 기준

**역할이 아니라 런타임과 병렬성으로 나눈다.**

## 규칙

새 에이전트를 만드는 정당한 이유는 둘뿐이다.

1. **런타임이 다르다** — 예: 이미지는 codex여야 한다(ADR-0002). 프로세스를 나눠야 표현된다.
2. **진짜로 병렬 실행된다** — 파일이 겹치지 않아 동시에 돌릴 수 있다.

둘 다 아니면 에이전트를 늘리지 말고 **스킬을 추가**한다.

```
agents/<id>/skills/<name>/SKILL.md
```

런처가 `skills/`를 스캔해 시스템 프롬프트에 인덱스를 붙이므로 별도 등록이 필요 없다.

## 왜

처음에 역할별로 8개를 만들었다가 2개로 줄였다. 콘텐츠 파이프라인의 네 단계(기획·작성·최적화·검수)는
**모두 같은 파일을 순차로** 건드린다. 병렬로 돌 수 없으니 프로세스를 나눌 이득이 없고, 나누면 단계마다
컨텍스트를 다시 세우는 비용만 생긴다.

반대로 이미지는 런타임 자체가 다르다. 이 경계는 협상 대상이 아니므로 프로세스로 분리해 규칙을 구조로
만들었다.

## 이 프로젝트의 에이전트는 Claude 서브에이전트가 아니다

| | 이 프로젝트 | Claude 서브에이전트 |
| --- | --- | --- |
| 실행 | 별도 터미널의 별도 프로세스 | 한 세션 안에서 위임 |
| 런타임 | claude 또는 codex | Claude 고정 |
| 정의 | `agents/<id>/AGENT.md` | `.claude/agents/*.md` |

Claude Code 세션에서 `Task` 도구로 위임하려 하지 말고 `pnpm agent <id> "<작업>"`으로 띄운다.

## 예외

없음. 애매하면 만들지 않는 쪽이 기본값이다.

## 관련

- `agents/registry.yaml` — 런타임·모델 단일 진실 공급원
- `scripts/run-agent.sh` — 런처
- [wiki/05-agent-operations.md](../../05-agent-operations.md)
- [[image-generation-policy]]
