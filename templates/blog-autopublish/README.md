# blog-autopublish

조사하고, 초안을 쓰고, SEO 와 답변엔진 메타데이터를 채운 뒤 **검수 앞에서 멈추는 편집국**.

```bash
pnpm template apply blog-autopublish
pnpm install
pnpm dev        # web → :3000 · admin → :3001
```

| | |
| --- | --- |
| 상태 | `stable` |
| 만드는 것 | 공개 사이트 · 검수 데스크 |
| 로스터 | `blog-writer` (claude · opus) · `image-maker` (codex) |
| 게이트 | `pnpm audit:content` → `in_review` |
| 추가되는 스크립트 | `dev:web` · `dev:admin` · `audit:content` · `cover` · `imagegen` |

---

## 펼쳐지는 것

```
apps/web            공개 블로그 (Next.js 16 App Router, :3000)
apps/admin          콘텐츠 · 테크니컬 SEO/GEO · 검수 (:3001)
packages/content    스키마 · 저장소 드라이버 · 감사 · JSON-LD  ← 콘텐츠에 관한 모든 것
packages/supabase   클라이언트 · 스토리지 · 마이그레이션 (키 없으면 비활성)
content/posts       마크다운 글 (기본 드라이버, 진실 공급원)
agents/             blog-writer · image-maker + registry.yaml
wiki/03,04,07,08    콘텐츠 · SEO/GEO · 백엔드 · 테크니컬 SEO 가이드
```

---

## 이 회사의 하드 룰

코어 하드 룰 위에 얹힙니다. 매니페스트의 `rule:` 에 적혀 있고 세션 시작마다 주입됩니다.

1. 콘텐츠 접근은 `getRepository()` 로만. `getAllPosts()` 같은 파일 전용 함수를 앱 코드에서 직접
   부르지 않습니다 — Supabase 로 전환하면 깨집니다.
2. 파일 IO 는 `@repo/content` 경유. 앱 코드에서 `fs` 를 직접 import 하지 않습니다.
3. 프론트매터 필드를 추가하면 `schema.ts` → admin 폼 → `audit.ts` 세 곳을 함께 고칩니다.
4. 슬러그는 자연어를 씁니다 (한글 허용). 기존 슬러그를 바꾸지 않습니다.

> **업로드는 생성이 아닙니다.** 어드민 에디터의 이미지 업로드(`source: user-upload`)는 코어
> 하드 룰 1과 무관합니다. 금지되는 것은 **생성**입니다.

---

## 파이프라인

```
blog-writer (claude · opus)                      image-maker (codex)   사람
plan-post → write-draft → optimize-seo-geo   →   generate-cover    →   admin 검수 → 발행
                 ↓
         review-and-submit → status: in_review
```

```bash
pnpm agent blog-writer "Turborepo 캐시 전략으로 글 하나 써줘"
pnpm agent image-maker "turborepo-cache-strategy 커버 이미지"
```

`blog-writer` 는 본문과 프론트매터를, `image-maker` 는 `cover` 블록만 건드립니다. 다만 둘 다
프론트매터를 통째로 다시 쓰므로 **같은 글에 동시 실행은 피하세요.**

---

## web (`:3000`)

`content/posts/` 에서 `status: published` 인 글만 렌더링합니다. JSON-LD(BlogPosting · FAQPage),
`sitemap.xml`, `robots.txt`, `rss.xml` 자동 생성. 답변 엔진 크롤러(GPTBot, ClaudeBot,
PerplexityBot 등)를 명시적으로 허용합니다.

## admin (`:3001`)

- **에디터** — tiptap 리치 텍스트 + 이미지 업로드. 저장 형식은 항상 마크다운
- **테크니컬 SEO 패널** — canonical · robots 지시어 · OG/Twitter · 사이트맵 priority · hreflang
- **GEO 패널** — 추출용 요약 · FAQ · 엔티티 · 인용 출처 · 로케일/타깃 마켓
- **검수 화면** — 자동 감사 결과, JSON-LD 미리보기, 사람 체크리스트, 발행 버튼
- **SEO/GEO 대시보드** — 전체 글의 미해결 항목을 lane 별 집계

UI 는 네이티브 `<select>` 대신 Radix 기반 커스텀 컴포넌트를 씁니다 — OS 가 그리는 기본 셀렉트는
스타일이 먹지 않고 브라우저마다 다릅니다.

---

## SEO 와 GEO 를 나눠서 다루는 이유

| | SEO | GEO (Generative Engine Optimization) |
| --- | --- | --- |
| 대상 | 검색 엔진 | 답변 엔진 (ChatGPT · Claude · Perplexity · AI Overviews) |
| 목표 | **순위** | **인용** |
| 핵심 신호 | 타이틀 · 메타 · 링크 · 속도 | 추출 가능한 구조 · 명시적 Q&A · 출처 · 엔티티 |

인용되려면 뽑아 쓰기 좋은 형태여야 합니다. 그래서 프론트매터에 GEO 블록이 따로 있고,
`geo.faq` 는 `FAQPage` JSON-LD 로, `geo.answerSummary` 는 페이지 상단 요약 블록으로 렌더링됩니다.

실행 규칙: `wiki/04-seo-geo-playbook.md`

---

## 테크니컬 SEO

### 자동 생성 — 손댈 필요 없음

| 경로 | 내용 |
| --- | --- |
| `/sitemap.xml` | 발행 글 + 글별 priority · changefreq · hreflang |
| `/robots.txt` | 검색 봇 + 답변 엔진 봇 허용, `/api/` 차단 |
| `/rss.xml` | 발행 글 피드 |
| `/llms.txt` | **LLM 용 사이트 요약** — 모델이 HTML 파싱 없이 사이트를 이해합니다 |

`llms.txt` 는 sitemap 의 GEO 짝입니다. sitemap 이 "URL 이 어디 있는지"를 알려준다면, llms.txt 는
"이 사이트가 무엇이고 어떤 글이 있는지"를 알려줍니다. 각 글의 `geo.answerSummary` 가 한 줄 설명으로
쓰이므로, 요약을 채우면 두 배로 이득입니다.

### 글마다 어드민에서 설정

canonical · noindex/nofollow · robots 지시어(`max-snippet` 등) · OG/Twitter 카드 ·
사이트맵 priority/changefreq · hreflang · llms.txt 포함 여부.

### 검색엔진 · 애널리틱스 연동

`.env` 에 값을 넣으면 켜집니다. **비우면 해당 태그·스크립트가 아예 출력되지 않습니다.**
`pnpm check` 가 매니페스트의 `verify-env:` 를 읽어 어떤 것이 꺼져 있는지 알려줍니다.

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

한글·일본어를 그대로 허용합니다. URL 에 키워드가 남는 것은 실제 랭킹·클릭률 신호이고, 한국어
독자에게 음차 슬러그는 읽히지 않습니다.

자세한 내용: `wiki/08-technical-seo.md`

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

**키가 없는 상태가 정상입니다.** `pnpm install && pnpm dev` 로 바로 돌아갑니다. 전환하려면:

1. `.env` 에 Supabase 키 3개
2. `packages/supabase/migrations/0001_init.sql` 적용
3. `pnpm --filter @repo/supabase migrate` — 기존 글 이관 (멱등, 파일은 남겨둠)

앱 코드는 한 줄도 바뀌지 않습니다. `CONTENT_DRIVER=file` 로 언제든 되돌릴 수 있습니다.

RLS 정책이 anon 키에 대해 `published` + `noindex` 아님만 허용합니다 — 앱에 버그가 생겨도 초안이
공개되지 않도록 하는 마지막 방어선입니다.

자세한 내용: `wiki/07-supabase.md`

---

## 배포

두 앱 모두 표준 Next.js 앱이라 Node.js 를 실행할 수 있는 곳이면 어디든 배포됩니다.

```bash
pnpm build
pnpm start
```

주의할 점:

- **콘텐츠가 파일 시스템에 있습니다.** web 은 빌드 타임에 정적 생성되므로 문제없지만, admin 은
  쓰기 가능한 파일 시스템이 필요합니다. 읽기 전용 서버리스 환경에서는 admin 을 로컬 전용으로
  두거나 별도 환경에 배포하세요.
- **admin 은 인증이 없습니다.** 공개된 곳에 배포한다면 인증을 먼저 붙이세요. `metadata` 에
  `noindex` 가 설정되어 있지만 그것은 접근 제어가 아닙니다.
- `NEXT_PUBLIC_SITE_URL` 을 실제 도메인으로 설정하세요. canonical · sitemap · OG 태그에 쓰입니다.

---

## 다른 도메인으로 바꾸기

이 템플릿을 출발점으로 삼아 커머스 · 대시보드 · 문서 사이트로 바꾸려면:

1. `packages/content/src/schema.ts` 의 스키마를 교체
2. `packages/content/src/audit.ts` 의 감사 규칙을 교체
3. `agents/` 를 `/create-agent` 로 재구성
4. `wiki/03`, `wiki/04` 를 도메인 가이드로 교체
5. `templates/blog-autopublish/template.yaml` 의 `rule:` · `verify-*` 를 새 도메인에 맞게 수정

**그대로 두는 것**: 훅 · 메모리 구조 · 게이트 패턴 · 이미지 정책 · 저장소 드라이버 · 모노레포 뼈대.
이 부분은 코어라 어느 템플릿에서나 같습니다.

도메인이 블로그와 많이 다르다면 지우면서 시작하는 것보다 `bare` 에서 올라가는 편이 빠릅니다.
