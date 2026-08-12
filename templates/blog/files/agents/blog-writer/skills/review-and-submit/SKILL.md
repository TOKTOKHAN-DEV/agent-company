---
name: review-and-submit
summary: 감사를 돌리고 사실을 확인한 뒤 in_review로 올린다. 발행은 하지 않는다.
when: 마지막 단계. 사람에게 넘기기 직전.
---

# review-and-submit

## 절대 규칙

**`status`를 `published`로 바꾸지 않는다.** 당신의 종착점은 `in_review`다.
자기가 쓴 글을 자기가 발행하면 이 템플릿의 검수 게이트가 무의미해진다.

## 1. 자동 감사

```bash
pnpm audit:content <slug>
```

admin `/review/<slug>`와 **같은 함수**를 쓰므로 사람이 볼 결과와 항상 일치한다.
`error`가 하나라도 있으면 해당 단계로 돌아가 고친다. 넘기지 않는다.

## 2. 사실 확인

- `<!-- TODO: 확인 필요 -->`를 **전부** 해소한다. 하나라도 남으면 미완성이다.
- 수치·버전·벤치마크를 1차 출처와 대조한다.
- 확인이 안 되면 그 문장을 **뺀다**. 애매하게 남기지 않는다.

## 3. 가이드라인 대조

`wiki/03-content-guidelines.md`를 항목별로 확인한다. 특히 자주 어기는 것:

- 과장 형용사
- 요약 반복 마무리
- 벽처럼 긴 문단
- 언어 태그 없는 코드 블록

## 4. 이미지 출처 감사

`cover`가 있으면:

- `source`가 `codex-imagegen`인데 `origin`에 프롬프트가 없으면 **의심한다.** `image-maker`에 확인한다.
- `web-search`인데 `license`가 없으면 error다. 발행이 막힌다.
- `alt`가 비어 있으면 error다.

## 5. 링크 확인

- 내부 링크가 실재하는 슬러그를 가리키는지
- 외부 링크가 살아 있는지

## 6. 검수 기록

`review.checks`의 6개 항목을 채운다. **확인하지 않은 항목의 체크박스를 켜지 않는다.**
남은 `warn` 각각에 대해 왜 남겨두는지 `review.notes`에 적는다.

## 7. 제출

`status: in_review`로 바꾸고 사람에게 넘긴다.

## 완료 조건

- `pnpm audit:content <slug>` error 0개
- TODO 표시 0개
- `review.checks` 실제 확인 후 기록
- `status: in_review`

## 보고 형식

```
슬러그:   nextjs-16-cache-components
감사 점수: 93 (error 0 · warn 2)
남은 warn: geo.citations — 1차 출처 2건뿐, 벤더 문서 위주라 남겨둠
          body — 2,100자, 권장 범위 하단
검수 링크: http://localhost:3001/review/nextjs-16-cache-components

발행 버튼은 검수 화면에서 직접 눌러 주세요.
```
