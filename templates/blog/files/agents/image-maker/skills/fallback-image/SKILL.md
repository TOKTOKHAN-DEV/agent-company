---
name: fallback-image
summary: imagegen을 쓸 수 없을 때의 폴백. 순서가 정해져 있다.
when: generate-cover가 3회 실패했거나 imagegen을 쓸 수 없을 때.
---

# fallback-image

**순서를 지킨다.** 위에서부터 시도하고, 임의로 건너뛰지 않는다.

## 1. 이미지 없이 진행 (기본값)

커버는 발행 필수 요소가 아니다. `cover`를 비운 채로 두고 사람에게 보고한다.

```
imagegen 실패 (3회 시도). 커버 없이 진행합니다.
필요하시면 직접 첨부해 주세요 — 경로: apps/web/public/images/posts/<slug>.png
```

감사에서 `[images] cover`는 `info` 레벨이라 발행을 막지 않는다. **이게 정상 동작이다.**

## 2. 사용자에게 요청

사람이 이미지를 주겠다고 하면, 어떤 이미지가 필요한지 구체적으로 설명하고 기다린다.

```bash
cp <받은 이미지> apps/web/public/images/posts/<slug>.png

node scripts/set-cover.mjs \
  --slug <slug> \
  --src "/images/posts/<slug>.png" \
  --alt "<보이는 것을 설명>" \
  --source user-upload
```

## 3. 웹 검색

**라이선스가 명확한 이미지만.** 확인할 수 없으면 쓰지 않는다.

```bash
node scripts/set-cover.mjs \
  --slug <slug> \
  --src "/images/posts/<slug>.png" \
  --alt "<설명>" \
  --source web-search \
  --origin "<원본 URL>" \
  --license "<라이선스 표기>"
```

`--license` 없이는 스크립트가 거부하고, 감사에서도 error로 잡힌다. 우회하지 않는다 —
출처 불명 이미지가 들어가는 것보다 이미지가 없는 편이 낫다.

## 허용되는 출처는 넷뿐

```
codex-imagegen | user-upload | web-search | none
```

`set-cover.mjs`가 이 외의 값을 거부한다. 다른 값이 필요하다고 느껴지면 정책을 잘못 이해한 것이다.

## 하지 않을 것

- 다른 이미지 생성 모델이나 API를 찾지 않는다.
- SVG나 CSS로 이미지를 흉내 내 커버 자리에 넣지 않는다.
- 라이선스를 추측해서 기록하지 않는다. 모르면 그 이미지를 쓰지 않는다.
