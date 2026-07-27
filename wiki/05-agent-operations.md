# 05 — 에이전트 운영

## 에이전트란 무엇인가 (그리고 무엇이 아닌가)

이 프로젝트의 에이전트는 **독립 프로세스**입니다. Claude 서브에이전트가 아닙니다.

| | 이 프로젝트의 에이전트 | Claude 서브에이전트 |
| --- | --- | --- |
| 실행 | 별도 터미널의 별도 프로세스 | 한 Claude 세션 안에서 위임 |
| 런타임 | `claude` 또는 `codex` | Claude 고정 |
| 병렬성 | Orca 멀티 터미널로 진짜 병렬 | 부모 세션에 종속 |
| 정의 | `agents/<id>/AGENT.md` | `.claude/agents/*.md` |

`codex` 런타임 에이전트가 존재하는 이상 서브에이전트 모델로는 표현할 수 없습니다. 그래서 프로세스 분리를
택했습니다.

## 팀

| ID | 런타임 | 모델 | 역할 | 쓰기 범위 |
| --- | --- | --- | --- | --- |
| `blog-writer` | `claude` | opus | 기획 → 작성 → SEO/GEO → 검수 | `content/posts/**` |
| `image-maker` | `codex` | default | imagegen으로 이미지 생성 · 출처 기록 | `apps/web/public/images/**` + `cover` |

정의는 `agents/<id>/AGENT.md`, 런타임·모델 매핑은 `agents/registry.yaml`.

### 왜 둘뿐인가

**나누는 기준은 역할이 아니라 런타임과 병렬성입니다.**

콘텐츠 파이프라인을 기획·작성·최적화·검수 네 에이전트로 쪼갤 수도 있었습니다. 그러나 네 단계는 모두
**같은 파일을 순차로** 건드립니다. 병렬로 돌 수 없으니 프로세스를 나눌 이유가 없고, 나누면 컨텍스트 인계
비용만 생깁니다. 대신 단계별 **스킬**로 분리해 필요한 플레이북만 읽게 했습니다.

반면 이미지는 런타임 자체가 다릅니다(Codex 전용, ADR-0002). 이건 협상 대상이 아니므로 프로세스를
분리해 규칙을 구조로 만들었습니다.

## 실행

```bash
pnpm agent --list                                    # 등록된 에이전트
pnpm agent blog-writer "Turborepo 캐시 전략으로 글 하나"
pnpm agent image-maker "turborepo-cache-strategy 커버"
```

| 옵션 | 용도 |
| --- | --- |
| `--print` | 비대화형 (CI, 파이프라인) |
| `--dry-run` | 실행할 명령만 출력 |

런처(`scripts/run-agent.sh`)가 하는 일:

1. `registry.yaml`에서 런타임·모델을 읽는다
2. `AGENT.md` + **스킬 인덱스**(폴더 스캔으로 자동 생성)를 시스템 프롬프트로 조립한다
3. 해당 CLI를 올바른 모델로 실행한다

스킬을 추가하면 별도 등록 없이 다음 실행부터 프롬프트에 나타납니다.

## 멀티 터미널

```bash
# 터미널 1 — 글
pnpm agent blog-writer "Next.js 16 캐시 컴포넌트 주제로 글 하나 써줘"

# 터미널 2 — 이미지 (초안이 나온 뒤 시작)
pnpm agent image-maker "nextjs-16-cache-components 커버 이미지 만들어줘"
```

Orca에 붙일 명령만 필요하면:

```bash
pnpm agent blog-writer "작업" --dry-run
```

### 병렬 규칙

1. **같은 파일을 동시에 쓰지 않습니다.** `blog-writer`는 본문과 `seo`/`geo`를, `image-maker`는
   `cover` 블록만 건드리므로 **순서만 지키면** 충돌하지 않습니다. 동시에 돌리지는 마세요 —
   프론트매터를 통째로 다시 쓰는 구현이라 나중에 저장한 쪽이 이깁니다.
2. **글이 여러 개면 진짜 병렬이 가능합니다.** 서로 다른 슬러그면 `blog-writer`를 여러 개 띄워도 됩니다.
3. **에이전트는 `main`에 푸시하지 않습니다.** 통합은 사람이 합니다.
4. **세션 종료 시 `/save-memory`.** 다음 세션이 이어받을 맥락을 남깁니다.

## 파이프라인

```
blog-writer                                    image-maker         사람
─────────────────────────────────────────      ───────────         ────
plan-post → write-draft → optimize-seo-geo  →  generate-cover  →  admin 검수
                              ↓                (실패 시            ↓
                       review-and-submit        fallback-image)   발행
                         status: in_review
```

**에이전트는 `in_review`까지만 올립니다.** `published` 전환은 사람이 admin에서 하는 행위입니다.

커버가 필요 없으면 `image-maker` 단계를 건너뜁니다. Codex가 없어도 마찬가지 —
이미지 없이 발행하는 것이 정상 폴백입니다.

## 스킬

에이전트의 스킬은 Claude Code 슬래시 커맨드와 **다른 것**입니다.

| | `agents/<id>/skills/` | `.claude/skills/` |
| --- | --- | --- |
| 읽는 주체 | 그 에이전트 (claude 또는 codex) | 사람의 Claude Code 세션 |
| 형태 | 런타임 중립 플레이북 | 슬래시 커맨드 |
| 주입 | 런처가 인덱스를 시스템 프롬프트에 넣음 | Claude Code가 자동 탐색 |
| 예 | `write-draft`, `generate-cover` | `/save-memory`, `/create-agent` |

codex 에이전트도 읽어야 하므로 스킬 문서는 특정 CLI 기능에 의존하지 않습니다.

## 새 에이전트 / 새 스킬

```
/create-agent
```

**기본값은 "만들지 않는다"입니다.** 기존 에이전트가 할 수 있는 일이면 에이전트를 늘리지 말고
**스킬을 추가**하세요. 에이전트를 나누는 정당한 이유는 둘뿐입니다.

- 런타임이 다르다
- 파일이 겹치지 않아 진짜로 병렬 실행된다

## 공통 규칙

1. 자기 `writes` 범위 밖 파일을 고치지 않는다.
2. `status: published`로 쓰지 않는다.
3. 이미지는 `image-maker`만 만든다.
4. 완료 보고 전 `pnpm audit:content <slug>` 또는 `pnpm typecheck`를 통과시킨다.
5. 판단 근거를 출력해 사람이 `/save-memory`로 남길 수 있게 한다.
