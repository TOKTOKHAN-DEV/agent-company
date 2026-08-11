# AGENTS.md

이 저장소에서 작업하는 **모든 AI 코딩 에이전트**를 위한 지침입니다.
Claude Code, Codex, Cursor, Gemini CLI 등 어떤 도구로 들어오든 여기서 시작하세요.

Claude Code 전용 지침은 [CLAUDE.md](./CLAUDE.md) 에 있습니다 (내용은 대부분 동일합니다).

---

## 먼저 읽을 것

세션 시작 시 자동 로드가 없는 도구를 쓰고 있다면 직접 실행하세요:

```bash
bash scripts/load-context.sh      # 또는: pnpm context
```

코어 하드 룰, **현재 적용된 템플릿과 그 템플릿의 하드 룰**, wiki 인덱스, 장기 메모리,
최근 단기 메모리, 로스터, git 상태를 한 번에 출력합니다.

**현재 회사가 무엇인지 먼저 확인하세요.** 이 저장소는 템플릿을 갈아끼울 수 있고, 무엇을
만드는 프로젝트인지에 따라 규칙과 검사 항목이 달라집니다.

```bash
pnpm template current
```

---

## 프로젝트

**Agent Company** — AI 팀이 굴리는 모노레포 템플릿. 두 층입니다.

```
── 코어 (항상 있음) ──────────────────────────────
.claude/          훅(SessionStart · PreToolUse) · 슬래시 커맨드
wiki/             프로젝트 지식 + 장/단기 메모리 + ADR
agents/           로스터 (registry.yaml + <id>/AGENT.md + skills/)
scripts/          결정적 셸 스크립트
CLAUDE.md         Claude Code 지침
AGENTS.md         모든 AI 코딩 에이전트 공통 지침

── 템플릿 (골라서 펼침) ──────────────────────────
templates/<id>/template.yaml   매니페스트 (스크립트 · 검사 · 하드 룰 · 다음 단계)
templates/<id>/files/          레포 루트 기준 경로 그대로
```

코어는 어느 회사에서나 같습니다. 무엇을 만들고 누구를 뽑는지는 템플릿이 정합니다.
전체 구조는 [wiki/01-architecture.md](./wiki/01-architecture.md).

---

## 코어 하드 룰

위반하면 작업을 중단하고 사람에게 보고합니다. 우회로를 찾지 마세요.
템플릿과 무관하게 항상 참이고, 바꾸려면 `wiki/decisions/` 에 ADR 을 먼저 써야 합니다.

1. **이미지 생성 경로는 하나다.**
   정책은 코어, 명령은 템플릿이 줍니다 (`blog-autopublish` 는
   `pnpm imagegen --slug <slug> --prompt "<설명>"`). 템플릿에 이미지 명령이 없으면
   이미지 없이 진행하는 것이 정답입니다.
   다른 이미지 모델이나 API 를 호출하지 않습니다. SVG 로 대체하지 않습니다.
   Codex 부재 시 폴백: ① 이미지 없이 진행 ② 사용자에게 첨부 요청 ③ 웹 검색(라이선스 기록).
   → [ADR-0002](./wiki/decisions/ADR-0002-codex-only-image-generation.md)

2. **출고 버튼은 사람이 누른다.** 에이전트는 검수 대기(`in_review`)까지만 올립니다.
   `status: published` 로 쓰지 않습니다.

3. **진실은 저장소 파일이다.** 결과물도 결정도 코드와 같은 저장소에서 버전 관리합니다.
   DB 를 붙여도 원본은 파일 쪽입니다 → [ADR-0001](./wiki/decisions/ADR-0001-file-based-content.md)

4. **게이트는 결정적이다.** 검수 함수에 LLM 호출을 넣지 않습니다. 사람과 에이전트가 같은
   판정을 봐야 합니다.

5. **컨텍스트는 스스로 올라온다.** 훅이 하는 일을 손으로 다시 하지 마세요.

### 이 회사의 하드 룰

도메인 규칙은 `templates/<id>/template.yaml` 의 `rule:` 에 있고, 세션 시작 시 위 다섯 개 위에
얹혀서 주입됩니다. 없다고 느껴지면 `pnpm context` 로 확인하세요.

> **업로드는 생성이 아닙니다.** 사람이 첨부한 이미지(`source: user-upload`)는 하드 룰 1과
> 무관합니다. 금지되는 것은 **생성**입니다.

---

## 명령

### 코어 (항상)

```bash
pnpm install            # 의존성 설치
pnpm company-setup      # 의존성 검사 → 템플릿 선택 → 환경 준비 → 검증
pnpm check              # 환경 상태만 검사 (현재 템플릿의 검사 항목 포함)
pnpm template list      # 템플릿 목록 · 현재 적용된 것
pnpm template prune     # 안 쓰는 카탈로그 · 랜딩 정리 (제품 레포에서는 거부됨)
pnpm agent --list       # 로스터
pnpm context            # 세션 컨텍스트 수동 로드
pnpm memory:new         # 새 메모리 파일 생성
pnpm typecheck          # 타입 검사 — 완료 보고 전 필수
pnpm dev | build        # 워크스페이스 전체 (turbo)
```

`pnpm setup` 이 아니라 `pnpm company-setup` 입니다 — `setup` 은 pnpm 내장 명령입니다.

### 템플릿이 얹는 것

`templates/<id>/template.yaml` 의 `script:` 줄에 적혀 있습니다. `blog-autopublish` 라면
`dev:web` · `dev:admin` · `audit:content` · `cover` · `imagegen`.

---

## 코드 규칙

전체는 [wiki/02-conventions.md](./wiki/02-conventions.md).

- TypeScript strict. `any` 금지, `noUncheckedIndexedAccess` 켜져 있음.
- 외부 입력(폼 · 파일 · env)은 zod 검증 후 사용.
- 셸 스크립트는 결정적으로. 모델 판단이 아니라 같은 순서로 같은 검사를 합니다.
- 매니페스트는 반복 키 형식입니다. YAML 파서를 들이지 말고 `sed`/`awk` 로 읽으세요.
- Conventional Commits. 스코프: `core` `template` `agents` `wiki` `skills` `scripts`
  (+ 템플릿이 정의하는 스코프).

프레임워크 규칙(서버 컴포넌트, 서버 액션, `params` await 등)은 템플릿이 앱을 가져올 때
적용됩니다 — `templates/<id>/README.md` 와 wiki 도메인 문서를 보세요.

---

## 로스터

**Claude 서브에이전트가 아닙니다.** 각자 별도 터미널에서 도는 독립 프로세스이고, 런타임이
다릅니다. 그래서 ADE 가 멀티 터미널로 진짜 병렬 실행할 수 있습니다.

```bash
pnpm agent --list                       # 목록
pnpm agent <id> "<작업>"                # 실행
pnpm agent <id> "<작업>" --dry-run      # 명령만 출력 (멀티 터미널용)
```

- 정의: `agents/<id>/AGENT.md` — 통째로 시스템 프롬프트에 주입됨
- 스킬: `agents/<id>/skills/<name>/SKILL.md` — 런처가 인덱스를 자동 생성
- 런타임 · 모델 · 쓰기 범위: `agents/registry.yaml`
- 운영 방법: [wiki/05-agent-operations.md](./wiki/05-agent-operations.md)

**자기 `writes` 범위 밖의 파일을 고치지 마세요.** 범위 밖 문제는 보고만 합니다.

로스터는 템플릿이 채웁니다. 템플릿을 안 펼쳤으면 `agents/registry.yaml` 이 없는 것이 정상입니다.

### 에이전트를 늘리는 기준

**역할이 아니라 런타임과 병렬성입니다.** 기존 에이전트가 할 수 있는 일이면 에이전트 대신
**스킬을 추가**하세요. 새로 만들 때는 `/create-agent` — 손으로 만들면 `pnpm check` 의 정합성
검사에서 걸립니다.

---

## 메모리

```
wiki/memory/short-term/   세션 기록 (~30일)
wiki/memory/long-term/    지속 지식 (무기한)
wiki/memory/index.md      장기 메모리 인덱스 — 세션 시작 시 로드됨
```

승격: 단기 →(3회 이상 참조)→ 장기 →(프로젝트 규칙이 됨)→ wiki 문서 / ADR

```bash
pnpm memory:new <kebab-case-topic>          # 단기
pnpm memory:new <kebab-case-topic> --long   # 장기 (index.md 갱신 필수)
```

**남길 것**: 판단 근거, 버린 대안, 사용자 선호, 막힌 지점.
**남기지 않을 것**: 코드를 읽으면 아는 것, git log 가 기록한 것, 일반 기술 지식.

---

## 작업 완료 기준

```bash
pnpm typecheck   # 필수
pnpm build       # 앱을 건드렸다면
pnpm check       # scripts/ · .claude/ · templates/ 를 건드렸다면
```

템플릿의 게이트가 따로 있으면 그것도 돌립니다 (`blog-autopublish` 는 `pnpm audit:content`).

통과하지 못한 상태로 완료를 보고하지 마세요. 실패했으면 출력과 함께 실패를 보고합니다.
