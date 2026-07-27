# Orca AI Company

**한국어** ·
[English](./docs/i18n/README.en.md) ·
[日本語](./docs/i18n/README.ja.md) ·
[简体中文](./docs/i18n/README.zh-CN.md) ·
[Español](./docs/i18n/README.es.md) ·
[Français](./docs/i18n/README.fr.md) ·
[Deutsch](./docs/i18n/README.de.md) ·
[Português](./docs/i18n/README.pt-BR.md) ·
[Русский](./docs/i18n/README.ru.md)

> AI 에이전트 팀으로 IT 프로젝트를 운영하기 위한 모노레포 템플릿.
> 컨텍스트는 세션을 넘어 유지되고, 품질은 검수 게이트로 지킵니다.

[![Node](https://img.shields.io/badge/node-%E2%89%A520.11-339933)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-%E2%89%A510-F69220)](https://pnpm.io)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000)](https://nextjs.org)
[![License](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

---

## 무엇을 해결하나

AI에게 프로젝트를 맡기면 반복해서 두 가지가 무너집니다.

**컨텍스트가 사라집니다.** 세션이 끝나거나 담당자가 바뀌면 AI는 지난 결정을 모릅니다. 같은 논의를 반복하고,
이미 폐기한 방식으로 되돌아갑니다.

**품질 관리가 없습니다.** 검수 게이트가 없으면 AI 결과물이 그대로 프로덕션에 나갑니다.

이 템플릿은 두 문제를 **구조로** 막습니다.

| 문제 | 해결책 |
| --- | --- |
| 컨텍스트 소실 | `CLAUDE.md` + `AGENTS.md` + `wiki/` + 장/단기 메모리를 SessionStart 훅으로 자동 로드 |
| 품질 관리 | 결정적 감사 함수 + 어드민 검수 화면 + 사람만 누를 수 있는 발행 버튼 |
| 역할 혼재 | 런타임별 독립 에이전트 + 모델 매핑 + 멀티 터미널 병렬 실행 |
| 이미지 신뢰성 | Codex `imagegen` 단일 경로 + 출처 기록 + 3중 강제 |

---

## 설치

### 방법 1 — AI에게 맡기기 (한 줄 복붙)

`claude` · `codex` · `gemini` 중 아무 CLI나 열고 아래 한 줄을 붙여넣으세요.
AI가 [INSTALL.md](./INSTALL.md)를 읽고 그대로 설치합니다.

```text
https://github.com/TOKTOKHAN-DEV/orca-ai-company 를 클론한 뒤 INSTALL.md 를 읽고 거기 적힌 대로 설치해줘. 끝나면 pnpm check 를 실행해서 결과를 보여줘.
```

<details>
<summary>영어 버전 (English prompt)</summary>

```text
Clone https://github.com/TOKTOKHAN-DEV/orca-ai-company, read its INSTALL.md, and set it up exactly as written. When done, run `pnpm check` and show me the result.
```

</details>

INSTALL.md에 필수/선택 도구, 폴백 절차, 문제 해결이 모두 있으므로 AI가 막히는 지점에서 스스로 판단할 수
있습니다. 마지막 `pnpm check`가 설치 성공 여부를 결정적으로 알려줍니다.

### 방법 2 — 직접 설치

```bash
git clone https://github.com/TOKTOKHAN-DEV/orca-ai-company.git
cd orca-ai-company
pnpm install
pnpm setup     # 의존성 전수 검사 · 환경 준비 · GitHub 조직 팔로우 · 레포 스타
pnpm dev       # web → :3000 · admin → :3001
```

자세한 설치 절차와 문제 해결은 **[INSTALL.md](./INSTALL.md)** 를 보세요.

---

## 구조

```
orca-ai-company/
├── apps/
│   ├── web/              공개 블로그 (Next.js 16 App Router, :3000)
│   └── admin/            콘텐츠 · SEO/GEO · 검수 대시보드 (:3001)
├── packages/
│   ├── content/          스키마 · 저장소 드라이버 · 감사 · JSON-LD (단일 진실 공급원)
│   └── supabase/         클라이언트 · 스토리지 · 마이그레이션 (키 없으면 비활성)
├── content/posts/        마크다운 글 — 기본 드라이버
├── docs/i18n/            README 번역 8개 언어
├── agents/
│   ├── registry.yaml     런타임 · 모델 · 권한 (단일 진실 공급원)
│   ├── blog-writer/      AGENT.md + skills/ (claude · opus)
│   └── image-maker/      AGENT.md + skills/ (codex)
├── wiki/
│   ├── 00~06-*.md        개요 · 아키텍처 · 규칙 · 가이드 · 히스토리
│   ├── decisions/        ADR
│   └── memory/           단기 · 장기 메모리
├── .claude/
│   ├── settings.json     훅 등록
│   ├── hooks/            SessionStart 컨텍스트 로드 · 이미지 정책 가드
│   └── skills/           슬래시 커맨드 3종
├── scripts/              결정적 셸 스크립트
├── CLAUDE.md             Claude Code 지침
└── AGENTS.md             모든 AI 코딩 에이전트 지침
```

---

## 레퍼런스 구현: AI가 운영하는 블로그

### web (`:3000`)

공개 블로그. `content/posts/` 에서 `status: published` 인 글만 렌더링합니다.
JSON-LD(BlogPosting · FAQPage), `sitemap.xml`, `robots.txt`, `rss.xml` 자동 생성.
답변 엔진 크롤러(GPTBot, ClaudeBot, PerplexityBot 등)를 명시적으로 허용합니다.

### admin (`:3001`)

- **에디터** — tiptap 리치 텍스트 + 이미지 업로드. 저장 형식은 항상 마크다운
- **테크니컬 SEO 패널** — canonical · robots 지시어 · OG/Twitter · 사이트맵 priority · hreflang
- **GEO 패널** — 추출용 요약 · FAQ · 엔티티 · 인용 출처 · 로케일/타깃 마켓
- **검수 화면** — 자동 감사 결과, JSON-LD 미리보기, 사람 체크리스트, 발행 버튼
- **SEO/GEO 대시보드** — 전체 글의 미해결 항목을 lane별 집계

UI는 네이티브 `<select>` 대신 Radix 기반 커스텀 컴포넌트를 씁니다 — OS가 그리는 기본 셀렉트는
스타일이 먹지 않고 브라우저마다 다릅니다.

### agents

```
blog-writer (claude · opus)                      image-maker (codex)   사람
plan-post → write-draft → optimize-seo-geo   →   generate-cover    →   admin 검수 → 발행
                 ↓
         review-and-submit → status: in_review
```

에이전트는 `in_review` 까지만 올립니다. **발행은 사람의 행위입니다.**

---

## SEO와 GEO를 나눠서 다루는 이유

| | SEO | GEO (Generative Engine Optimization) |
| --- | --- | --- |
| 대상 | 검색 엔진 | 답변 엔진 (ChatGPT · Claude · Perplexity · AI Overviews) |
| 목표 | **순위** | **인용** |
| 핵심 신호 | 타이틀 · 메타 · 링크 · 속도 | 추출 가능한 구조 · 명시적 Q&A · 출처 · 엔티티 |

인용되려면 뽑아 쓰기 좋은 형태여야 합니다. 그래서 프론트매터에 GEO 블록이 따로 있고,
`geo.faq` 는 `FAQPage` JSON-LD로, `geo.answerSummary` 는 페이지 상단 요약 블록으로 렌더링됩니다.

실행 규칙은 [wiki/04-seo-geo-playbook.md](./wiki/04-seo-geo-playbook.md).

---

## 테크니컬 SEO

### 자동 생성 — 손댈 필요 없음

| 경로 | 내용 |
| --- | --- |
| `/sitemap.xml` | 발행 글 + 글별 priority · changefreq · hreflang |
| `/robots.txt` | 검색 봇 + 답변 엔진 봇 허용, `/api/` 차단 |
| `/rss.xml` | 발행 글 피드 |
| `/llms.txt` | **LLM용 사이트 요약** — 모델이 HTML 파싱 없이 사이트를 이해합니다 |

`llms.txt`는 sitemap의 GEO 짝입니다. sitemap이 "URL이 어디 있는지"를 알려준다면, llms.txt는
"이 사이트가 무엇이고 어떤 글이 있는지"를 알려줍니다. 각 글의 `geo.answerSummary`가 한 줄 설명으로
쓰이므로, 요약을 채우면 두 배로 이득입니다.

### 글마다 어드민에서 설정

canonical · noindex/nofollow · robots 지시어(`max-snippet` 등) · OG/Twitter 카드 ·
사이트맵 priority/changefreq · hreflang · llms.txt 포함 여부.

### 검색엔진 · 애널리틱스 연동

`.env`에 값을 넣으면 켜집니다. **비우면 해당 태그·스크립트가 아예 출력되지 않습니다.**

| 변수 | 대상 |
| --- | --- |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | 구글 서치콘솔 |
| `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` | 네이버 서치어드바이저 |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | Bing 웹마스터 |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | GA4 (`afterInteractive` 로드) |

### 자연어 슬러그

```
/blog/next-js-16-캐시-컴포넌트-완전-정복
```

한글·일본어를 그대로 허용합니다. URL에 키워드가 남는 것은 실제 랭킹·클릭률 신호이고, 한국어 독자에게
음차 슬러그는 읽히지 않습니다.

자세한 내용: [wiki/08-technical-seo.md](./wiki/08-technical-seo.md)

---

## 백엔드 — 지금은 파일, 나중에 Supabase

앱 코드는 저장소를 직접 알지 못합니다. 인터페이스만 봅니다.

```
web · admin · audit CLI
        │
        ▼
  getRepository()          ← 키 유무로 자동 선택
   ├── file       content/posts/*.md   (기본 · 지금 이 상태)
   └── supabase   Postgres + Storage   (키를 넣으면)
```

**키가 없는 상태가 정상입니다.** `pnpm install && pnpm dev`로 바로 돌아갑니다.
전환하려면:

1. `.env`에 Supabase 키 3개
2. `packages/supabase/migrations/0001_init.sql` 적용
3. `pnpm --filter @orca/supabase migrate` — 기존 글 이관 (멱등, 파일은 남겨둠)

앱 코드는 한 줄도 바뀌지 않습니다. `CONTENT_DRIVER=file`로 언제든 되돌릴 수 있습니다.

RLS 정책이 anon 키에 대해 `published` + `noindex` 아님만 허용합니다 — 앱에 버그가 생겨도 초안이
공개되지 않도록 하는 마지막 방어선입니다.

자세한 내용: [wiki/07-supabase.md](./wiki/07-supabase.md)

---

## 컨텍스트 유지 방식

세션이 시작되면 훅이 자동으로 주입합니다.

```
하드 룰  →  wiki 인덱스  →  장기 메모리  →  최근 단기 메모리  →  에이전트 팀  →  git 상태
```

**wiki 전문이 아니라 인덱스만** 로드합니다. 지도를 주고, 필요한 문서는 모델이 직접 엽니다.

### 2단 메모리

```
단기 메모리 ──(3회 이상 참조 / 계속 참으로 확인)──▶ 장기 메모리
장기 메모리 ──(프로젝트 규칙이 됨)──────────────▶ wiki 문서 또는 ADR
```

승격은 `/save-memory` 스킬이 관리합니다.

---

## 이미지 정책 (하드 룰)

**이미지 생성은 Codex `imagegen` 으로만 합니다. Claude의 이미지 생성은 금지입니다.**

```bash
pnpm imagegen --slug <post-slug> --prompt "<장면 설명>"
```

Codex를 쓸 수 없으면 이 순서로 폴백합니다:

1. **이미지 없이 진행** — 기본값. 커버는 발행 필수 요소가 아닙니다.
2. **사용자가 직접 첨부** — `source: user-upload`
3. **웹 검색** — 라이선스 확인 필수. `source: web-search` + `license` 기록

문서로만 둔 규칙은 지켜지지 않으므로 **세 겹으로 강제**합니다:

| 층 | 수단 |
| --- | --- |
| 타입 | `ImageSource` 에 `claude` 값이 존재하지 않음 |
| 훅 | `PreToolUse` 가 비-Codex 이미지 생성 명령을 차단 |
| 감사 | 출처 미기록 · 라이선스 없는 웹 이미지를 error 처리 → 발행 불가 |

근거: [ADR-0002](./wiki/decisions/ADR-0002-codex-only-image-generation.md)

---

## 스킬 (슬래시 커맨드)

| 명령 | 하는 일 |
| --- | --- |
| `/orca-setup` | 의존성 전수 검사 · 설치 · 조직 팔로우 · 레포 스타 (결정적 스크립트) |
| `/save-memory` | 세션 내용을 단기 메모리에 저장하고 필요 시 장기/wiki로 승격 |
| `/create-agent` | 새 에이전트를 registry + AGENT.md + skills/ 에 일괄 생성 |

에이전트가 읽는 스킬(`agents/<id>/skills/`)은 이것과 별개입니다. 그쪽은 런처가 시스템 프롬프트에
주입하는 런타임 중립 플레이북이라 codex 에이전트도 읽습니다.

---

## 에이전트

**Claude 서브에이전트가 아닙니다.** 각자 별도 터미널에서 도는 독립 프로세스이고, 런타임이 다릅니다.
그래서 Orca가 멀티 터미널로 진짜 병렬 실행할 수 있습니다.

| ID | 런타임 | 모델 | 역할 |
| --- | --- | --- | --- |
| `blog-writer` | `claude` | opus | 기획 → 작성 → SEO/GEO → 검수 |
| `image-maker` | `codex` | default | imagegen으로 이미지 생성 · 출처 기록 |

```bash
pnpm agent --list
pnpm agent blog-writer "Turborepo 캐시 전략으로 글 하나 써줘"
pnpm agent image-maker "turborepo-cache-strategy 커버 이미지"
```

```
agents/blog-writer/
├── AGENT.md                       시스템 프롬프트로 주입
└── skills/
    ├── plan-post/SKILL.md         기획 · 중복 확인 · 아웃라인
    ├── write-draft/SKILL.md       본문 작성
    ├── optimize-seo-geo/SKILL.md  메타데이터
    └── review-and-submit/SKILL.md 감사 · in_review
```

런처가 `AGENT.md` + 스킬 인덱스(폴더 스캔으로 자동 생성)를 시스템 프롬프트로 조립해 해당 CLI를
올바른 모델로 띄웁니다. 스킬을 추가하면 별도 등록 없이 바로 반영됩니다.

### 왜 둘뿐인가

**나누는 기준은 역할이 아니라 런타임과 병렬성입니다.** 콘텐츠 파이프라인 네 단계는 모두 같은 파일을
순차로 건드리므로 프로세스를 나눌 이유가 없습니다 — 대신 스킬로 나눴습니다. 반면 이미지는 런타임 자체가
다르고(Codex 전용) 그 경계는 협상 대상이 아니므로 프로세스를 분리해 규칙을 구조로 만들었습니다.

멀티 터미널 병렬 규칙은 [wiki/05-agent-operations.md](./wiki/05-agent-operations.md).

---

## 명령

| 명령 | 설명 |
| --- | --- |
| `pnpm setup` | 전체 환경 검사 + 설치 + GitHub 팔로우/스타 |
| `pnpm check` | 환경 상태만 검사 (설치하지 않음) |
| `pnpm dev` | web + admin 동시 실행 |
| `pnpm dev:web` / `pnpm dev:admin` | 개별 실행 |
| `pnpm build` | 두 앱 빌드 |
| `pnpm typecheck` | 타입 검사 |
| `pnpm audit:content` | 발행 게이트를 CLI 로 실행 (admin 검수 화면과 동일한 함수) |
| `pnpm context` | 세션 컨텍스트 수동 출력 |
| `pnpm imagegen` | Codex 이미지 생성 |
| `pnpm memory:new <topic>` | 새 메모리 파일 생성 (`--long` 으로 장기) |
| `pnpm --filter @orca/supabase migrate` | 파일 → Supabase 글 이관 (`--dry-run` 지원) |

---

## 다른 도메인으로 바꾸기

블로그는 이해를 돕기 위한 레퍼런스입니다. 커머스 · 대시보드 · 문서 사이트로 바꾸려면:

1. `packages/content/src/schema.ts` 의 스키마를 교체
2. `packages/content/src/audit.ts` 의 감사 규칙을 교체
3. `agents/` 를 `/create-agent` 로 재구성
4. `wiki/03`, `wiki/04` 를 도메인 가이드로 교체

**그대로 두는 것**: 훅 · 메모리 구조 · 검수 게이트 패턴 · 이미지 정책 · 저장소 드라이버 · 테크니컬 SEO ·
모노레포 뼈대. 이 부분이 템플릿의 실제 가치입니다.

---

## 기술 스택

pnpm workspaces · Turborepo · Next.js 16 (App Router) · React 19 · TypeScript 5.9 (strict) ·
Tailwind CSS 4 · zod 4 · Supabase · tiptap · Radix UI · gray-matter · marked · turndown

---

## 라이선스

MIT
