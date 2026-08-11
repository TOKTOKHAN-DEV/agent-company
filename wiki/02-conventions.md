# 02 — 코드 · 협업 규칙

## TypeScript

> 여기 있는 것은 **코어 규칙**입니다. 앱 프레임워크 규칙(서버 컴포넌트, 서버 액션, 컴포넌트
> 선택 등)은 템플릿이 앱을 가져올 때 적용됩니다 → `templates/<id>/README.md`

- `strict: true`, `noUncheckedIndexedAccess: true`. 배열 인덱싱 결과는 `undefined`일 수 있다고 가정하세요.
- `any` 금지. 모르면 `unknown`으로 받고 좁히세요.
- 외부에서 들어오는 데이터(폼, 파일, 환경 변수)는 **반드시** zod로 검증한 뒤 사용합니다.
- 파일 IO는 도메인 패키지를 통해서만. 앱 코드에 `fs`를 직접 import하지 마세요 — 검증·감사·경로
  해석이 한 곳에 모여 있어야 우회로가 생기지 않습니다. (`blog-autopublish` 는 `@repo/content`)

## 셸 스크립트

`scripts/` 가 전부 bash 인 이유는 결정성입니다. 모델이 매번 다르게 해석하는 체크리스트가 아니라,
항상 같은 순서로 같은 검사를 합니다.

- `set -uo pipefail` 로 시작합니다.
- tty 가 없을 수 있다고 가정하세요. 대화형 입력은 `[ -t 0 ]` 로 먼저 확인하고, 못 읽으면
  **기록하지 말고** 넘어갑니다 — 고르지도 않은 선택을 저장하면 다음에 묻지 않게 됩니다.
- 색상은 `[ -t 1 ]` 이 아닐 때 비웁니다.
- 매니페스트(`template.yaml` · `registry.yaml`)는 반복 키 형식입니다. YAML 파서를 들이지 말고
  `sed`/`awk` 로 읽으세요. 셋업 스크립트에 의존성을 추가하지 않기 위한 선택입니다.
- 경로를 코어에 박지 마세요. 무엇을 검사할지는 템플릿 매니페스트가 정합니다.

## 네이밍

| 대상 | 규칙 | 예 |
| --- | --- | --- |
| 파일(컴포넌트) | PascalCase | `StatusBadge.tsx` |
| 파일(그 외) | kebab-case 또는 camelCase | `session-start.sh`, `markdown.ts` |
| 템플릿 id | 소문자 kebab-case | `blog-autopublish`, `apps-in-toss` |
| 에이전트 id | 소문자 kebab-case, 역할 명사 | `blog-writer`, `release-manager` |
| wiki 문서 | `NN-topic.md` (2자리 접두) | `04-seo-geo-playbook.md` |
| 메모리 파일 | `YYYY-MM-DD-topic.md` | `2026-07-27-admin-server-actions.md` |
| ADR | `ADR-NNNN-title.md` | `ADR-0001-file-based-content.md` |

## 커밋

Conventional Commits를 씁니다.

```
feat(admin): GEO FAQ 편집 UI 추가
fix(content): 슬러그 검증에서 한글 처리 수정
docs(wiki): 이미지 정책 ADR 추가
chore(deps): Next.js 16.2로 업그레이드
```

코어 스코프는 `core` · `template` · `agents` · `wiki` · `skills` · `scripts`.
템플릿이 자기 스코프를 추가합니다 (`blog-autopublish` 는 `web` · `admin` · `content`).

에이전트가 커밋할 때는 무엇을 왜 바꿨는지 본문에 남깁니다.

## 검증 명령

작업을 끝냈다고 말하기 전에 실행하세요.

```bash
pnpm typecheck   # 타입 검사
pnpm build       # 앱을 건드렸다면
pnpm check       # 의존성 · 환경 · 현재 템플릿의 검사 항목
```

템플릿의 게이트가 따로 있으면 그것도 돌립니다 (`blog-autopublish` 는 `pnpm audit:content`).

## 하지 말아야 할 것

- **게이트 판단에 LLM 호출을 넣지 마세요.** 결정성이 깨집니다.
- **에이전트가 `status: published`를 쓰지 마세요.** 출고는 사람의 행위입니다.
- **이미지를 직접 생성하지 마세요.** → `CLAUDE.md` · [ADR-0002](./decisions/ADR-0002-codex-only-image-generation.md)
- **코어에 도메인 경로를 박지 마세요.** `apps/web` 을 코어 스크립트에 넣으면 다른 템플릿을 고른
  사람에게 없는 것을 없다고 혼내게 됩니다.
- **코어 wiki 에 도메인 문서를 두지 마세요.** `templates/<id>/files/wiki/` 에 둡니다.
