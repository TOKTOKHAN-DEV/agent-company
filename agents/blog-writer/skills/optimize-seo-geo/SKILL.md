---
name: optimize-seo-geo
summary: 프론트매터의 seo/geo 블록을 채운다. 본문은 건드리지 않는다.
when: 본문이 완성된 뒤.
---

# optimize-seo-geo

## 먼저

`wiki/04-seo-geo-playbook.md`를 읽는다. SEO와 GEO는 다른 게임이다 — 전자는 **순위**, 후자는 **인용**.

## SEO

| 필드 | 규칙 |
| --- | --- |
| `seo.title` | ≤60자. 비우면 `title`이 쓰인다 |
| `seo.description` | ≤160자. 검색 결과에 그대로 노출된다고 생각하고 쓴다 |
| `seo.keywords` | 3~6개. 주 키워드 하나에 집중 |
| `seo.canonical` | 다른 곳에도 실린 글이면 원본 URL |
| `seo.ogImage` | 비우면 `cover.src`가 쓰인다 |

키워드를 억지로 늘리지 않는다. **관련 없는 키워드는 순위를 오히려 해친다.**

## GEO

| 필드 | 규칙 |
| --- | --- |
| `geo.answerSummary` | 답변 엔진이 통째로 인용할 2~3문장. **결론부터.** |
| `geo.faq` | 최소 2쌍. 실제로 검색되는 질문 형태로 |
| `geo.entities` | 이 글이 연결되어야 할 고유명사 (제품·기술·회사명) |
| `geo.citations` | 본문이 인용한 1차 출처 |
| `geo.locale` / `targetMarkets` | 지역 타깃팅 |

`faq`는 `FAQPage` JSON-LD로, `answerSummary`는 페이지 상단 요약 블록으로 렌더링된다.

### 원칙

**요약은 추출이지 창작이 아니다.** 본문에 없는 내용을 `answerSummary`에 넣지 않는다.
FAQ 답변도 본문에서 근거를 찾을 수 있어야 한다. 근거가 없으면 FAQ를 만들지 말고 본문을 보강해야 한다고
보고한다.

## 검증

```bash
pnpm audit:content <slug>
```

`[seo]`와 `[geo]` lane에 error가 없어야 한다.

```bash
git diff content/posts/<slug>.md
```

**본문에 diff가 있으면 안 된다.** 있으면 되돌린다.

## 완료 조건

- SEO/GEO lane error 0개
- `geo.faq` 2쌍 이상, `geo.answerSummary` 존재
- 본문 diff 없음

## 하지 않을 것

- 본문을 수정하지 않는다. 문제가 있으면 write-draft로 돌아간다.
- `status`를 바꾸지 않는다.
- 검증하지 않은 URL을 `citations`에 넣지 않는다.
