# CLAUDE.md

Claude Code 가 이 저장소에서 작업할 때 따르는 지침입니다.

> 세션 시작 시 SessionStart 훅이 `scripts/load-context.sh` 를 실행해 코어 하드 룰, 현재 템플릿,
> wiki 인덱스, 메모리를 자동으로 주입합니다. 이 문서는 그 위에 얹히는 **행동 규칙**입니다.

---

## 프로젝트

**Agent Company** — AI 팀이 굴리는 모노레포 템플릿. 두 층입니다.

```
── 코어 (항상 있음) ──────────────────────────────
.claude/          훅(SessionStart · PreToolUse) · 슬래시 커맨드
wiki/             프로젝트 지식 + 장/단기 메모리 + ADR
agents/           로스터 (registry.yaml + <id>/AGENT.md + skills/)
scripts/          결정적 셸 스크립트
templates/        고를 수 있는 회사들

── 템플릿 (골라서 펼침) ──────────────────────────
templates/<id>/template.yaml   매니페스트 (스크립트 · 검사 · 하드 룰 · 다음 단계)
templates/<id>/files/          레포 루트 기준 경로 그대로 (apps/ · packages/ · agents/ …)
```

코어는 어느 회사에서나 같습니다. 무엇을 만들고 누구를 뽑는지는 템플릿이 정합니다.
전체 구조는 `wiki/01-architecture.md`.

**작업을 시작하기 전에 현재 회사가 무엇인지 확인하세요.**

```bash
pnpm template current
```

---

## 코어 하드 룰

위반하면 작업을 중단하고 사용자에게 보고하세요. 우회로를 찾지 마세요.
템플릿과 무관하게 항상 참이고, 바꾸려면 `wiki/decisions/` 에 ADR 을 먼저 써야 합니다.

### 1. 이미지 생성 경로는 하나다

**당신은 이미지를 생성하지 않습니다.** 예외 없습니다.

정책은 코어이고 실행 명령은 템플릿이 줍니다 (`blog-autopublish` 는 `pnpm imagegen`).
템플릿에 이미지 명령이 없으면 **이미지 없이 진행하는 것이 정답**입니다.

```bash
pnpm imagegen --slug <slug> --prompt "<장면 설명>"    # blog-autopublish
```

금지되는 것:

- 당신이 이미지를 직접 생성 · 합성하는 것
- 다른 이미지 생성 모델/API 호출 (DALL·E, Stable Diffusion, Imagen, Midjourney 등)
- SVG 를 코드로 그려 이미지를 대신하는 것
- 실제 Codex 생성이 아닌 이미지에 `source: codex-imagegen` 표기

Codex 를 쓸 수 없으면 **이 순서로** 폴백합니다:

1. **이미지 없이 진행** (기본값 — 커버는 출고 필수 요소가 아님)
2. **사용자에게 직접 첨부 요청** (`source: user-upload`)
3. **웹 검색** — 라이선스 확인 필수 (`source: web-search` + `license` 기록)

강제 수단: `ImageSource` 타입에 `claude` 가 없음 · PreToolUse 훅 차단 · 감사 error.
근거: `wiki/decisions/ADR-0002-codex-only-image-generation.md`

> **업로드는 생성이 아닙니다.** 사람이 첨부한 이미지는 이 룰과 무관합니다. 금지되는 것은
> **생성**입니다.

### 2. 출고는 사람만

`status` 를 `published` 로 바꾸지 않습니다. 에이전트는 `in_review` 까지만 올립니다.
출고는 사용자가 검수 화면에서 수행하는 행위입니다.

### 3. 진실은 저장소 파일

결과물도 결정도 코드와 같은 저장소에서 버전 관리합니다. DB 를 붙여도 원본은 파일 쪽입니다.
근거: `wiki/decisions/ADR-0001-file-based-content.md`

### 4. 게이트는 결정적으로

검수 함수에 LLM 호출을 넣지 않습니다. 사람과 에이전트가 항상 같은 결과를 봐야 합니다.
모델이 자기 결과물을 평가하면 통과 쪽으로 기웁니다.

### 5. 컨텍스트는 스스로 올라온다

훅이 하는 일을 손으로 다시 하지 마세요. 안 올라왔다면 훅이 고장난 것입니다 —
`bash .claude/hooks/session-start.sh` 로 확인하세요.

### 이 회사의 하드 룰

도메인 규칙은 `templates/<id>/template.yaml` 의 `rule:` 에 있고 세션 시작 시 함께 주입됩니다.
규칙을 추가할 때도 그 파일에 적으세요 — CLAUDE.md 에 도메인 규칙을 넣으면 템플릿을 갈아탄
사람에게 남의 회사 사규가 됩니다.

---

## 작업 전에

1. **현재 템플릿을 확인합니다.** `pnpm template current` · 매니페스트를 열어 `rule:` 과
   `verify-*` 를 봅니다.
2. **관련 wiki 문서를 엽니다.** 세션 시작 시 인덱스만 로드됩니다 — 필요한 문서는 직접 읽으세요.
   - 코어 구조 → `wiki/01-architecture.md`, `wiki/02-conventions.md`
   - 에이전트 운영 → `wiki/05-agent-operations.md`
   - 왜 이렇게 됐는지 → `wiki/06-history.md`, `wiki/decisions/`
   - 도메인 문서(`wiki/03`, `04`, `07`, `08` 등)는 템플릿이 가져옵니다
3. **`wiki/memory/` 에 관련 메모리가 있는지 확인합니다.**
4. **에이전트에 맡길 일인지 판단합니다.** 로스터에 담당자가 있으면
   `pnpm agent <id> "<작업>"` 으로 띄우세요 — Task 도구로 위임할 대상이 아닙니다.

## 작업 후에

```bash
pnpm typecheck   # 필수
pnpm build       # 앱을 건드렸다면
pnpm check       # scripts · .claude · templates 를 건드렸다면
```

템플릿의 게이트가 따로 있으면 그것도 돌립니다 (`blog-autopublish` 는 `pnpm audit:content`).

통과 못 한 상태로 "완료"라고 말하지 마세요. 실패했으면 실패했다고 출력과 함께 보고하세요.

결정을 내렸다면 `/save-memory` 로 근거를 남깁니다.

---

## 코드 규칙 요약

전체는 `wiki/02-conventions.md`.

- `strict: true`, `noUncheckedIndexedAccess: true`. `any` 금지.
- 외부 입력(폼 · 파일 · 환경 변수)은 zod 로 검증한 뒤 사용.
- 셸 스크립트는 결정적으로. 모델 판단이 아니라 같은 순서로 같은 검사를 합니다.
- 매니페스트(`template.yaml` · `registry.yaml`)는 반복 키 형식입니다. YAML 파서를 들이지 말고
  `sed`/`awk` 로 읽으세요 — 셋업에 의존성을 추가하지 않기 위한 선택입니다.
- 커밋은 Conventional Commits.

앱 프레임워크 규칙(서버 컴포넌트, 서버 액션, `params` await, Radix `Select` 등)은 템플릿이
앱을 가져올 때 적용됩니다 → `templates/<id>/README.md`

---

## 템플릿

```bash
pnpm template list                    # 목록 + 현재 적용된 것
pnpm template apply <id>              # 펼치기
pnpm template apply <id> --force      # 다른 템플릿 위에 덮어쓰기
pnpm template prune                   # 안 쓰는 카탈로그 · 랜딩 정리
```

| id | 상태 | 만드는 것 |
| --- | --- | --- |
| `blog-autopublish` | stable | 공개 사이트 + 검수 데스크 |
| `bare` | stable | 코어만. 빈 로스터 |
| `app-in-toss` | preview | 토스 WebView 미니앱 (Vite + React 18 + TDS) |

매니페스트 키의 뜻은 README 의 「새 템플릿 만들기」에 정리돼 있습니다. 매니페스트를 읽는 쪽은
`scripts/template.sh` · `scripts/check-deps.sh` · `scripts/load-context.sh` 셋뿐입니다 —
새 키를 추가하면 이 셋 중 하나를 함께 고쳐야 합니다.

**템플릿을 갈아탈 때 이전 파일은 지우지 않습니다.** 자동으로 지우면 그 사이에 사람이 쓴 것까지
날아갑니다. 남은 것은 사용자에게 알리고 직접 정리하게 하세요.

### 한 레포, 두 얼굴

`.company/PRODUCT` 가 있으면 여기는 **제품 레포**입니다. `site/`(랜딩)와 `templates/`(카탈로그)가
이 레포의 내용물이므로 `prune` 이 거부합니다. 없으면 사용자 프로젝트이고, 고른 회사 하나만
남기도록 정리할 수 있습니다.

**`prune` 은 고른 템플릿의 `template.yaml` 을 남깁니다.** `check-deps.sh` 의 `verify-*` 와
`load-context.sh` 의 `rule:` 이 거기서 옵니다 — 지우면 검사와 하드 룰이 **에러 없이 조용히**
사라집니다. 정리 스크립트를 고칠 때 이 불변식을 깨지 마세요.

---

## 에이전트

**Claude 서브에이전트가 아닙니다.** 각자 별도 터미널에서 도는 독립 프로세스이고 런타임이 다릅니다.
Task 도구로 위임하지 말고, 필요하면 런처로 띄우세요.

```bash
pnpm agent --list
pnpm agent <id> "<작업>"
pnpm agent <id> "<작업>" --dry-run    # 조립된 명령만 출력
```

정의는 `agents/<id>/AGENT.md`, 스킬은 `agents/<id>/skills/`, 런타임·모델·쓰기 범위는
`agents/registry.yaml`. 런처가 AGENT.md + 스킬 인덱스를 시스템 프롬프트로 조립해 해당 CLI 를
띄웁니다.

로스터는 템플릿이 채웁니다. 템플릿을 안 펼쳤으면 `agents/registry.yaml` 이 없는 것이 정상입니다.

에이전트를 늘리는 기준은 **역할이 아니라 런타임과 병렬성입니다.** 기존 에이전트가 할 수 있는
일이면 에이전트 대신 **스킬을 추가**하세요.

---

## 슬래시 커맨드

`agents/<id>/skills/`(에이전트가 읽는 플레이북)와는 별개인, 이 세션용 커맨드입니다.

| 명령 | 용도 |
| --- | --- |
| `/company-setup` | 의존성 전수 검사 + 설치 + 템플릿 선택 (+ 선택: 조직 팔로우 · 레포 스타) |
| `/save-memory` | 세션 내용을 단기 메모리에 저장, 필요 시 장기/wiki 로 승격 |
| `/create-agent` | 새 에이전트를 registry + AGENT.md + skills/ 에 일괄 생성 |

---

## 소통

- **한국어로 답합니다.** 코드 주석과 커밋 메시지는 영어 혼용 가능.
- 결론 먼저. 옵션을 나열하기보다 추천안을 제시하세요.
- 확인하지 않은 것을 확인했다고 말하지 마세요. 검증 명령의 실제 출력으로 뒷받침하세요.
