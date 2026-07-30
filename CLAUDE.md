# CLAUDE.md

Claude Code 가 이 저장소에서 작업할 때 따르는 지침입니다.

> 세션 시작 시 SessionStart 훅이 `scripts/load-context.sh` 를 실행해 wiki 인덱스와 메모리를 자동으로
> 주입합니다. 이 문서는 그 위에 얹히는 **행동 규칙**입니다.

---

## 프로젝트

**Orca AI Company** — Orca 사용자가 IT 프로젝트를 AI 에이전트 팀으로 굴리기 위한 모노레포 템플릿.
레퍼런스 구현은 "AI 팀이 운영하는 블로그"입니다.

```
apps/web          공개 블로그 (Next.js 16, :3000)
apps/admin        콘텐츠 · 테크니컬 SEO/GEO · 검수 (Next.js 16, :3001)
packages/content  스키마 · 저장소 드라이버 · 감사 · JSON-LD  ← 콘텐츠에 관한 모든 것
packages/supabase 클라이언트 · 스토리지 · 마이그레이션 (키 없으면 비활성)
content/posts     마크다운 글 (기본 드라이버, 진실 공급원)
agents/           독립 실행 에이전트 (AGENT.md + skills/) + registry.yaml
wiki/             프로젝트 지식 + 장/단기 메모리
scripts/          결정적 셸 스크립트
```

전체 구조는 `wiki/01-architecture.md`.

---

## 하드 룰

위반하면 작업을 중단하고 사용자에게 보고하세요. 우회로를 찾지 마세요.

### 1. 이미지 생성은 Codex `imagegen` 전용

**당신은 이미지를 생성하지 않습니다.** 예외 없습니다.

```bash
pnpm imagegen --slug <post-slug> --prompt "<장면 설명>"
```

금지되는 것:
- 당신이 이미지를 직접 생성 · 합성하는 것
- 다른 이미지 생성 모델/API 호출 (DALL·E, Stable Diffusion, Imagen, Midjourney 등)
- SVG 를 코드로 그려 이미지를 대신하는 것
- 실제 Codex 생성이 아닌 이미지에 `source: codex-imagegen` 표기

Codex 를 쓸 수 없으면 **이 순서로** 폴백합니다:

1. **이미지 없이 진행** (기본값 — 커버는 발행 필수 요소가 아님)
2. **사용자에게 직접 첨부 요청** (`source: user-upload`)
3. **웹 검색** — 라이선스 확인 필수 (`source: web-search` + `license` 기록)

강제 수단: `ImageSource` 타입에 `claude` 가 없음 · PreToolUse 훅 차단 · `auditPost()` error.
근거: `wiki/decisions/ADR-0002-codex-only-image-generation.md`

### 2. 발행은 사람만

`status` 를 `published` 로 바꾸지 않습니다. 에이전트는 `in_review` 까지만 올립니다.
발행은 사용자가 admin 검수 화면에서 수행하는 행위입니다.

### 3. 콘텐츠 접근은 저장소 인터페이스로

`getRepository()` 만 씁니다. `getAllPosts()` 같은 파일 전용 함수를 앱 코드에서 직접 부르지 마세요 —
Supabase 로 전환하면 깨집니다.

기본 드라이버는 파일(`content/posts/*.md`)이고, Supabase 키가 있으면 자동으로 DB 드라이버가 됩니다.
**키가 없는 상태가 정상 데모 상태입니다.** → `wiki/07-supabase.md`

### 4. 검수 게이트는 결정적으로

`packages/content/src/audit.ts` 에 LLM 호출을 넣지 않습니다. 사람과 에이전트가 항상 같은 결과를
봐야 합니다. 모델이 자기 결과물을 평가하면 통과 쪽으로 기웁니다.

### 5. 파일 IO 는 `@orca/content` 경유

앱 코드에서 `fs` 를 직접 import 하지 않습니다. 검증 · 감사 · 경로 해석이 한 곳에 모여 있어야
우회로가 생기지 않습니다.

> **업로드는 생성이 아닙니다.** 어드민 에디터의 이미지 업로드(`source: user-upload`)는 하드 룰 1과
> 무관합니다. 금지되는 것은 **생성**입니다.

---

## 작업 전에

1. **관련 wiki 문서를 엽니다.** 세션 시작 시 인덱스만 로드됩니다 — 필요한 문서는 직접 읽으세요.
   - 코드 수정 → `wiki/01-architecture.md`, `wiki/02-conventions.md`
   - 글 작성 → `wiki/03-content-guidelines.md`
   - 메타데이터 전략 → `wiki/04-seo-geo-playbook.md`
   - 백엔드 · 저장소 → `wiki/07-supabase.md`
   - 메타 태그 · 사이트맵 · 소유 확인 · GA4 → `wiki/08-technical-seo.md`
   - 에이전트 운영 → `wiki/05-agent-operations.md`
2. **`wiki/memory/` 에 관련 메모리가 있는지 확인합니다.**
3. **에이전트에 맡길 일인지 판단합니다.** 글쓰기는 `blog-writer`, 이미지는 `image-maker` 가
   전담합니다. `pnpm agent <id> "<작업>"` 으로 띄우세요 — Task 도구로 위임할 대상이 아닙니다.

## 작업 후에

```bash
pnpm typecheck       # 필수
pnpm build           # 앱을 건드렸다면
pnpm check           # 설정 · 스크립트 · 훅을 건드렸다면
pnpm audit:content   # 글을 건드렸다면 (발행 게이트 — admin 과 동일한 함수)
```

통과 못 한 상태로 "완료"라고 말하지 마세요. 실패했으면 실패했다고 출력과 함께 보고하세요.

결정을 내렸다면 `/save-memory` 로 근거를 남깁니다.

---

## 코드 규칙 요약

전체는 `wiki/02-conventions.md`.

- `strict: true`, `noUncheckedIndexedAccess: true`. `any` 금지.
- 외부 입력(폼 · 파일 · 환경 변수)은 zod 로 검증한 뒤 사용.
- 서버 컴포넌트가 기본. `'use client'` 는 상호작용이 실제로 필요할 때만.
- 폼은 서버 액션(`app/actions.ts`). admin 에 클라이언트 상태 라이브러리를 도입하지 않음.
- `params` / `searchParams` 는 Promise. `await` 할 것.
- 프론트매터 필드 추가 시 `schema.ts` → admin 폼 → `audit.ts` 세 곳을 함께 수정.
- 네이티브 `<select>` 금지. `components/Select.tsx`(Radix)를 씁니다. 본문 편집은 tiptap `Editor.tsx`.
- 슬러그는 자연어를 씁니다 (한글 허용). 키워드가 URL 에 남습니다. 기존 슬러그를 바꾸지 마세요.
- 커밋은 Conventional Commits. 에이전트는 `main` 에 직접 푸시하지 않음.

---

## 에이전트

**Claude 서브에이전트가 아닙니다.** 각자 별도 터미널에서 도는 독립 프로세스이고 런타임이 다릅니다.
Task 도구로 위임하지 말고, 필요하면 런처로 띄우세요.

| ID | 런타임 | 모델 | 역할 | 쓰기 범위 |
| --- | --- | --- | --- | --- |
| `blog-writer` | `claude` | opus | 기획 → 작성 → SEO/GEO → 검수 | `content/posts/**` |
| `image-maker` | `codex` | default | imagegen으로 이미지 생성 · 출처 기록 | `public/images/**` + `cover` |

```bash
pnpm agent --list
pnpm agent blog-writer "<작업>"
pnpm agent image-maker "<작업>"
```

정의는 `agents/<id>/AGENT.md`, 스킬은 `agents/<id>/skills/`, 런타임·모델 매핑은 `agents/registry.yaml`.
런처가 AGENT.md + 스킬 인덱스를 시스템 프롬프트로 조립해 해당 CLI를 띄웁니다.

에이전트를 늘리는 기준은 **역할이 아니라 런타임과 병렬성**입니다. 기존 에이전트가 할 수 있는 일이면
에이전트 대신 **스킬을 추가**하세요.

---

## 슬래시 커맨드

`agents/<id>/skills/`(에이전트가 읽는 플레이북)와는 별개인, 이 세션용 커맨드입니다.

| 명령 | 용도 |
| --- | --- |
| `/orca-setup` | 의존성 전수 검사 + 설치 (+ 선택: 조직 팔로우 · 레포 스타) |
| `/save-memory` | 세션 내용을 단기 메모리에 저장, 필요 시 장기/wiki 승격 |
| `/create-agent` | 새 에이전트를 registry + AGENT.md + skills/ 에 일괄 생성 |

---

## 소통

- **한국어로 답합니다.** 코드 주석과 커밋 메시지는 영어 혼용 가능.
- 결론 먼저. 옵션을 나열하기보다 추천안을 제시하세요.
- 확인하지 않은 것을 확인했다고 말하지 마세요. 검증 명령의 실제 출력으로 뒷받침하세요.
