---
name: plan-post
summary: 주제를 정하고 중복을 확인한 뒤 아웃라인과 프론트매터 뼈대를 만든다.
when: 새 글을 시작할 때. 본문을 쓰기 전 항상 먼저.
---

# plan-post

## 1. 중복 확인

```bash
ls content/posts/
grep -l '<핵심 키워드>' content/posts/*.md
```

이미 다룬 주제면 **새 글 대신 기존 글 갱신을 제안한다.** 비슷한 글이 둘이면 둘 다 순위가 떨어진다.

## 2. 리서치

- 실제로 검색되는 질문 형태를 확인한다 ("~하는 법", "~와 ~의 차이").
- 답변 엔진에 같은 질문을 던져 지금 어떤 페이지가 인용되는지 본다. 그 페이지에 없는 것이 우리의 각이다.
- 검증 가능한 것만 다룬다. 출처를 못 찾을 주제는 잡지 않는다.

## 3. 아웃라인

**헤딩만 읽어도 흐름이 보여야 한다.** 각 섹션에 다룰 내용을 한 줄씩 적는다.

```markdown
## 왜 파일 기반인가
- 에이전트에게 파일 IO가 네이티브, DB는 실패 지점을 늘림

## 트레이드오프
- 수천 개로 늘면 전체 스캔이 느려짐 → 인덱스 캐시 시점
```

질문형 헤딩을 섞는다. 답변 엔진의 Q&A 매칭에 유리하다.

## 4. 파일 생성

```bash
node --experimental-strip-types --no-warnings -e "
import('./packages/content/src/index.ts').then(m => {
  const now = new Date().toISOString();
  m.writePost({
    title: '<제목>',
    slug: '<kebab-case-slug>',
    description: '<1~2문장>',
    status: 'draft',
    author: 'blog-writer',
    createdAt: now, updatedAt: now,
    category: '<카테고리>',
    tags: ['<태그>'],
  }, '<아웃라인 마크다운>');
});
"
```

`content/posts/*.md`를 에디터로 직접 만들지 말고 이 경로를 쓴다. 스키마 검증을 거쳐야 admin이 읽을 수 있다.

## 완료 조건

- `content/posts/<slug>.md` 생성됨, `status: draft`
- 아웃라인의 각 섹션에 다룰 내용이 한 줄 이상
- `seo.keywords` 후보와 `geo.faq` 질문 후보를 사람에게 제시

## 하지 않을 것

- 본문을 쓰지 않는다. 다음 단계다.
- 검증하지 않은 수치를 아웃라인에 넣지 않는다.
- 아웃라인 승인 없이 3,000자를 쓰지 않는다. **방향을 잡는 비용은 여기서 가장 싸다.**
