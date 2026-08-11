---
name: generate-cover
summary: imagegen으로 커버 이미지를 만들고 프론트매터에 출처와 함께 기록한다.
when: 글에 커버 이미지가 필요할 때. 기본 경로.
---

# generate-cover

## 1. 프롬프트 작성

글의 주제를 **시각적 장면**으로 번역한다. 글 제목을 그대로 넣지 않는다.

| 좋은 프롬프트 | 나쁜 프롬프트 |
| --- | --- |
| 겹쳐진 반투명 문서 레이어가 하나의 흐름으로 정렬되는 추상 구성 | AI 블로그 자동화에 관한 이미지 |
| 구체적 장면 · 구도 · 색조 | 글 제목 복사 |

**텍스트가 들어간 이미지를 요청하지 않는다.** 생성된 글자는 대부분 깨진다.

스타일은 기존 커버와 맞춘다. 기본 프리셋은 스크립트가 붙인다:
`clean editorial illustration, flat vector, muted palette, no text, no lettering`

## 2. 생성

```bash
pnpm imagegen --slug <post-slug> --prompt "<장면 설명>" --alt "<대체 텍스트>"
```

스크립트가 하는 일:

1. `imagegen`으로 이미지 생성 → `apps/web/public/images/posts/<slug>.png`
2. `scripts/set-cover.mjs`로 프론트매터 `cover` 갱신
   (`source: codex-imagegen`, `origin`에 프롬프트 기록)

`--alt`를 생략하면 프롬프트가 대체 텍스트로 쓰인다. 대체 텍스트는 **보이는 것을 설명**해야 하므로,
프롬프트가 그대로 쓰기에 부적절하면 직접 지정한다.

### 호출 방식이 다를 때

CLI 버전에 따라 인터페이스가 다르면 환경 변수로 덮어쓴다.

```bash
CODEX_IMAGEGEN_CMD='codex imagegen --out {out} "{prompt}"' \
  pnpm imagegen --slug <slug> --prompt "..."
```

`{out}`과 `{prompt}`가 치환된다.

## 3. 확인

```bash
ls -la apps/web/public/images/posts/
pnpm audit:content <slug>
```

`[images]` lane에 error가 없어야 한다.

## 실패 처리

**3회까지 재시도한다.** 프롬프트를 단순하게 바꿔가며 시도한다 (요소 수를 줄이고, 추상도를 높인다).

3회 실패하면 `skills/fallback-image`로 넘어간다. **다른 이미지 생성 모델이나 API를 찾지 않는다.**

## 하지 않을 것

- 실제 생성이 아닌 이미지에 `source: codex-imagegen`을 붙이지 않는다. 감사에서 걸리고, 걸리지 않아도
  거짓 기록이다.
- 본문이나 `seo`/`geo` 필드를 수정하지 않는다.
- `cover.alt`를 비워두지 않는다. 접근성 문제이자 발행 차단 사유다.
