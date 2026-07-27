# 08 — 테크니컬 SEO

콘텐츠 전략은 [04-seo-geo-playbook.md](./04-seo-geo-playbook.md) 에 있습니다. 이 문서는 **크롤러가
실제로 읽는 것들** — 메타 태그, 사이트맵, robots, 소유 확인, 애널리틱스 — 을 다룹니다.

## 어드민에서 제어하는 값

`/posts/<slug>` 의 **테크니컬 SEO** 패널에서 글마다 설정합니다. 전부 `seo` 프론트매터에 저장됩니다.

### 색인 제어

| 필드 | 출력 | 언제 쓰나 |
| --- | --- | --- |
| `canonical` | `<link rel="canonical">` | 다른 곳에도 실린 글. 비우면 자동 생성 |
| `noindex` | `robots: noindex` | 색인에서 빼야 할 글 |
| `nofollow` | `robots: nofollow` | 링크 신뢰를 넘기지 않을 때 |
| `robotsDirectives` | `googleBot` 지시어 | `max-snippet:-1` 등 |

`robotsDirectives` 는 **GEO 에 직접 영향을 줍니다.** `max-snippet:-1` 과
`max-image-preview:large` 는 답변 엔진이 인용할 수 있는 분량을 늘립니다. 기본값으로 이미 켜져
있으니, 줄이려는 게 아니라면 건드리지 마세요.

### 소셜 카드

| 필드 | 출력 |
| --- | --- |
| `ogType` · `ogTitle` · `ogDescription` · `ogImage` | Open Graph |
| `twitterCard` · `twitterSite` · `twitterCreator` | Twitter/X 카드 |

비우면 각각 SEO 타이틀 · 메타 설명 · 커버 이미지로 자동 대체됩니다. **대부분 비워두는 게 맞습니다.**

### 사이트맵

| 필드 | 기본값 |
| --- | --- |
| `changefreq` | `monthly` |
| `priority` | `0.7` |

코너스톤 글만 `0.9` 로 올리세요. 전부 `1.0` 이면 우선순위 정보가 사라집니다.

### 다국어

`alternates` 에 `hreflang` / `href` 쌍을 넣으면 `<link rel="alternate">` 와 사이트맵 양쪽에 반영됩니다.
`x-default` 도 유효한 값입니다.

### llms.txt 포함 여부

`llmsTxt` 를 끄면 `/llms.txt` 목록에서 빠집니다. 얇거나 시의성이 짧은 글에 씁니다.

## 자동 생성되는 것 — 손대지 마세요

| 경로 | 내용 |
| --- | --- |
| `/sitemap.xml` | 발행 글 + priority/changefreq/hreflang |
| `/robots.txt` | 검색 봇 + 답변 엔진 봇 허용, `/api/` 차단 |
| `/rss.xml` | 발행 글 피드 (atom self 링크 포함) |
| `/llms.txt` | LLM 용 사이트 요약 |

구현: `apps/web/app/{sitemap.ts,robots.ts,rss.xml,llms.txt}`

### llms.txt 란

[llmstxt.org](https://llmstxt.org) 관례로, 사이트 루트에 두는 **LLM 용 사이트 안내문**입니다.
sitemap.xml 이 크롤러에게 "URL 이 어디 있는지" 알려준다면, llms.txt 는 모델에게 "이 사이트가 무엇이고
어떤 글이 있는지"를 HTML 파싱 없이 알려줍니다. GEO 의 짝입니다.

각 글은 `geo.answerSummary` 를 한 줄 설명으로 사용합니다 — 그래서 요약을 채우는 것이 두 배로 이득입니다.

## 검색엔진 소유 확인

`.env` 에 값을 넣으면 해당 메타 태그가 출력됩니다. **비우면 태그 자체가 나가지 않습니다.**

| 변수 | 어디서 받나 |
| --- | --- |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Search Console → 소유권 확인 → HTML 태그 |
| `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` | 네이버 서치어드바이저 → 사이트 등록 |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | Bing Webmaster Tools |

등록 후 각 도구에 사이트맵을 제출하세요.

```
https://<도메인>/sitemap.xml
```

### 네이버 주의점

네이버 크롤러(`Yeti`)는 `robots.ts` 에 명시적으로 허용되어 있습니다. 서치어드바이저에서
**RSS 도 별도 제출**할 수 있으니 `https://<도메인>/rss.xml` 을 함께 등록하세요.

## GA4

```
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

`afterInteractive` 로 로드해 초기 렌더 경로를 막지 않습니다. **Core Web Vitals 자체가 랭킹
신호**이므로 애널리틱스가 그것을 깎아먹으면 안 됩니다. 값이 없으면 스크립트가 아예 렌더되지 않아,
로컬 개발과 데모 상태에서 트래커가 나가지 않습니다.

## 슬러그

**자연어 슬러그를 씁니다.** 한글·일본어를 그대로 허용합니다.

```
/blog/next-js-16-캐시-컴포넌트-완전-정복
```

URL 에 키워드가 남는 것은 실제 랭킹·클릭률 신호이고, 한국어 독자에게 음차 슬러그
(`kaesi-keomponeonteu`)는 읽히지 않습니다. 브라우저가 전송 시 퍼센트 인코딩하고 표시할 때 디코딩합니다.

- `slugify()` 가 소문자화 + 하이픈 연결 + 100자 절단을 처리합니다
- 스키마가 `\p{Ll}\p{Lo}\p{N}` + 하이픈만 허용합니다
- **슬러그를 바꾸지 마세요.** URL 이 깨집니다. 바꿔야 한다면 새 글을 만들고 리다이렉트를 거세요

## 검증

```bash
pnpm audit:content         # canonical 형식, priority 범위, hreflang 절대경로 등
pnpm dev:admin             # → /seo 대시보드에서 lane 별 집계
```

`auditPost()` 가 잡는 테크니컬 오류:

- canonical 이 절대 URL 이 아님 → **error**
- og:image 가 상대 경로도 절대 URL 도 아님 → **error**
- priority 가 0~1 범위 밖 → **error**
- hreflang href 가 상대 경로 → **error**
- 발행 상태인데 noindex → **warn**
- 자동 생성 슬러그(`post-1234`) → **warn**
