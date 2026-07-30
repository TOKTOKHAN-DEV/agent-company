# 02 — 코드 · 협업 규칙

## TypeScript

- `strict: true`, `noUncheckedIndexedAccess: true`. 배열 인덱싱 결과는 `undefined`일 수 있다고 가정하세요.
- `any` 금지. 모르면 `unknown`으로 받고 좁히세요.
- 외부에서 들어오는 데이터(폼, 파일, 환경 변수)는 **반드시** zod로 검증한 뒤 사용합니다.
- 파일 IO는 `@orca/content`를 통해서만. 앱 코드에 `fs`를 직접 import하지 마세요.

## React / Next.js

- 기본은 서버 컴포넌트. `'use client'`는 상호작용이 실제로 필요할 때만.
- 폼은 서버 액션(`app/actions.ts`)으로 처리합니다. admin에는 클라이언트 상태 라이브러리가 없습니다.
- `params`와 `searchParams`는 Promise입니다. `await` 하세요.
- 스타일은 Tailwind 유틸리티. 공용 패턴은 `globals.css`의 `.field` / `.btn` / `.card`를 재사용합니다.
- **네이티브 `<select>` 를 쓰지 마세요.** `components/Select.tsx`(Radix 기반)를 씁니다 — OS 가 그리는
  기본 셀렉트는 스타일이 먹지 않고 브라우저마다 다릅니다. 접근성 배선은 Radix 가 처리합니다.
- 본문 편집은 `components/Editor.tsx`(tiptap)를 씁니다. 저장 형식은 항상 마크다운입니다.

## 네이밍

| 대상 | 규칙 | 예 |
| --- | --- | --- |
| 파일(컴포넌트) | PascalCase | `StatusBadge.tsx` |
| 파일(그 외) | kebab-case 또는 camelCase | `session-start.sh`, `markdown.ts` |
| 글 슬러그 | 소문자 kebab-case | `orca-ai-company-getting-started` |
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

스코프는 `web` · `admin` · `content` · `agents` · `wiki` · `skills` · `scripts` 중 하나.

에이전트가 커밋할 때는 무엇을 왜 바꿨는지 본문에 남깁니다.

## 검증 명령

작업을 끝냈다고 말하기 전에 실행하세요.

```bash
pnpm typecheck       # 타입 검사
pnpm build           # 두 앱 빌드
pnpm check           # 의존성 · 환경 상태
pnpm audit:content   # 발행 게이트 (글을 건드렸다면)
```

## 하지 말아야 할 것

- `audit.ts`의 게이트 판단에 LLM 호출을 넣지 마세요. 결정성이 깨집니다.
- `content/posts/*.md`를 `@orca/content` 밖에서 직접 쓰지 마세요. 검증을 우회하게 됩니다.
- 에이전트가 `status: published`를 쓰지 마세요. 발행은 사람의 행위입니다.
- 이미지를 직접 생성하지 마세요. → [04-seo-geo-playbook.md](./04-seo-geo-playbook.md) 및 `CLAUDE.md` 참조.
