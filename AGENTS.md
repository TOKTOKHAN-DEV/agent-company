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

wiki 인덱스, 장기 메모리, 최근 단기 메모리, 에이전트 팀, git 상태를 한 번에 출력합니다.

---

## 프로젝트

**Orca AI Company** — AI 에이전트 팀으로 IT 프로젝트를 운영하기 위한 모노레포 템플릿.
레퍼런스 구현은 AI 팀이 운영하는 블로그입니다.

```
apps/web          공개 블로그 (Next.js 16, :3000)
apps/admin        콘텐츠 · 테크니컬 SEO/GEO · 검수 (Next.js 16, :3001)
packages/content  스키마 · 저장소 드라이버 · 감사 · JSON-LD
packages/supabase 클라이언트 · 스토리지 · 마이그레이션 (키 없으면 비활성)
content/posts     마크다운 글 (기본 드라이버)
agents/           독립 실행 에이전트 (AGENT.md + skills/) + registry.yaml
wiki/             프로젝트 지식 + 장/단기 메모리
scripts/          결정적 셸 스크립트
```

---

## 하드 룰

위반하면 작업을 중단하고 사람에게 보고합니다. 우회로를 찾지 마세요.

1. **이미지 생성은 Codex `imagegen` 전용.**
   `pnpm imagegen --slug <slug> --prompt "<설명>"`
   다른 이미지 모델이나 API 를 호출하지 않습니다. SVG 로 대체하지 않습니다.
   Codex 부재 시 폴백 순서: ① 이미지 없이 진행 ② 사용자에게 첨부 요청 ③ 웹 검색(라이선스 기록).
   → [ADR-0002](./wiki/decisions/ADR-0002-codex-only-image-generation.md)

2. **발행은 사람만.** `status: published` 로 쓰지 않습니다. `in_review` 까지만.

3. **콘텐츠 접근은 `getRepository()` 경유.** 파일 전용 함수를 앱 코드에서 직접 부르지 않습니다.
   키가 없으면 파일 드라이버, 있으면 Supabase 드라이버로 자동 전환됩니다 → `wiki/07-supabase.md`

4. **검수 게이트는 결정적으로.** `packages/content/src/audit.ts` 에 LLM 호출 금지.

5. **파일 IO 는 `@orca/content` 경유.** 앱 코드에서 `fs` 직접 사용 금지.
   (업로드는 생성이 아닙니다 — 어드민 이미지 업로드는 하드 룰 1과 무관합니다.)

---

## 명령

```bash
pnpm install        # 의존성 설치
pnpm setup          # 전체 환경 검사 + 설치 + GitHub 팔로우/스타
pnpm check          # 환경 상태만 검사
pnpm dev            # web:3000 + admin:3001
pnpm typecheck      # 타입 검사 — 완료 보고 전 필수
pnpm build          # 두 앱 빌드
pnpm audit:content  # 발행 게이트를 CLI 로 실행 (admin 과 동일한 함수)
pnpm agent          # 에이전트 실행 (--list 로 목록)
pnpm context        # 세션 컨텍스트 수동 로드
pnpm imagegen       # Codex 이미지 생성
pnpm memory:new     # 새 메모리 파일 생성
```

---

## 코드 규칙

전체는 [wiki/02-conventions.md](./wiki/02-conventions.md).

- TypeScript strict. `any` 금지, `noUncheckedIndexedAccess` 켜져 있음.
- 외부 입력(폼 · 파일 · env)은 zod 검증 후 사용.
- 서버 컴포넌트 기본. 폼은 서버 액션.
- `params` / `searchParams` 는 Promise — `await` 할 것.
- 프론트매터 필드 추가 시 `schema.ts` → admin 폼 → `audit.ts` 함께 수정.
- 네이티브 `<select>` 금지 — `components/Select.tsx`(Radix). 본문 편집은 tiptap `Editor.tsx`.
- 슬러그는 자연어(한글 허용). 기존 슬러그를 바꾸지 않습니다 — URL 이 깨집니다.
- Conventional Commits. 스코프: `web` `admin` `content` `agents` `wiki` `skills` `scripts`.

---

## 에이전트

**Claude 서브에이전트가 아닙니다.** 각자 별도 터미널에서 도는 독립 프로세스이고, 런타임이 다릅니다.

| ID | 런타임 | 모델 | 역할 | 쓰기 범위 |
| --- | --- | --- | --- | --- |
| `blog-writer` | `claude` | opus | 기획 → 작성 → SEO/GEO → 검수 | `content/posts/**` |
| `image-maker` | `codex` | default | imagegen으로 이미지 생성 · 출처 기록 | `apps/web/public/images/**` + `cover` |

```bash
pnpm agent --list                       # 목록
pnpm agent <id> "<작업>"                # 실행
pnpm agent <id> "<작업>" --dry-run      # 명령만 출력 (멀티 터미널용)
```

- 정의: `agents/<id>/AGENT.md` — 통째로 시스템 프롬프트에 주입됨
- 스킬: `agents/<id>/skills/<name>/SKILL.md` — 런처가 인덱스를 자동 생성
- 런타임 · 모델: `agents/registry.yaml`
- 운영 방법: [wiki/05-agent-operations.md](./wiki/05-agent-operations.md)

**자기 `writes` 범위 밖의 파일을 고치지 마세요.** 범위 밖 문제는 보고만 합니다.

### 파이프라인

```
blog-writer                                    image-maker      사람
plan-post → write-draft → optimize-seo-geo  →  generate-cover → admin 검수 → 발행
                ↓
        review-and-submit (status: in_review)
```

에이전트는 `in_review`까지만 올립니다. 커버가 필요 없거나 Codex가 없으면 `image-maker` 단계를
건너뜁니다 — 이미지 없이 발행하는 것이 정상 폴백입니다.

### 에이전트를 늘리는 기준

**역할이 아니라 런타임과 병렬성입니다.** 기존 에이전트가 할 수 있는 일이면 에이전트 대신
**스킬을 추가**하세요. `/create-agent` 참조.

---

## 메모리

```
wiki/memory/short-term/   세션 기록 (~30일)
wiki/memory/long-term/    지속 지식 (무기한)
wiki/memory/index.md      장기 메모리 인덱스 — 세션 시작 시 로드됨
```

승격: 단기 →(3회 이상 참조)→ 장기 →(프로젝트 규칙이 됨)→ wiki 문서 / ADR

새 메모리:

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
pnpm build       # apps/ 를 건드렸다면
pnpm check      # scripts/ .claude/ 설정을 건드렸다면
```

통과하지 못한 상태로 완료를 보고하지 마세요. 실패했으면 출력과 함께 실패를 보고합니다.
