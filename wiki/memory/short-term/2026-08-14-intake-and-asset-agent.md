---
date: 2026-08-14
type: progress
topic: intake-and-asset-agent
tags: [intake, assets, app-in-toss, agents]
confidence: high
promoted: false
---

# 인계 + 에셋 에이전트 작업 (커밋 3a83fde, 미푸시)

## 무엇

코어에 `pnpm intake` (zip · tar.gz · 폴더 → `inbox/<이름>/` + `INVENTORY.md`), app-in-toss 에
`asset-maker` (codex) + `pnpm assets` · `pnpm imagegen` 를 추가했다. 배경과 근거는
[wiki/06-history.md](../../06-history.md) 의 2026-08-14 항목에 있다 — 여기서 반복하지 않는다.

## 이어서 할 것

- **푸시하지 않았다.** 커밋 `3a83fde` 가 로컬 `main` 에만 있다.
- **app-in-toss 는 여전히 `preview`.** 에셋 규격 숫자는 콘솔 MCP 도구 설명에서 그대로 옮긴
  것이지만 **실제로 심사를 통과시켜 본 적이 없다.** `stable` 로 올리기 전에 한 번은 실제
  제출까지 가 봐야 한다.
- **Vercel Root Directory 를 `site` 로 지정**하는 일이 여러 세션째 남아 있다. 대시보드에서만
  가능하고 `vercel.json` 으로는 안 된다.
- 브랜치 `refactor/agent-company-restructure` 가 로컬·원격에 남아 있다 (머지 완료됨).

## 알아 둘 것

- **`fit` 은 sips(macOS 기본 탑재) → ImageMagick 순으로 찾는다.** 둘 다 없으면 추측해서
  진행하지 않고 멈춘다. 게이트가 설치 상태에 따라 다르게 동작하면 결정적이지 않기 때문에,
  해상도 판정(PNG·JPEG 헤더 직접 파싱)에는 의존성을 일부러 넣지 않았다.
- `scripts/intake-inventory.mjs`(코어)와 `scripts/asset-spec.ts`(템플릿)에 비슷한 이미지 헤더
  리더가 **일부러 중복**돼 있다. 코어는 템플릿 파일에 의존할 수 없다 — 템플릿은 prune 으로
  사라질 수 있고 그때 코어가 같이 죽으면 안 된다.
- 이 저장소의 시스템 시계와 `date` 출력이 어긋난 적이 있다(커밋은 08-14, `date` 는 08-25).
  날짜는 **git 커밋 날짜**에 맞췄다.

## 관련

- `scripts/intake.sh` · `scripts/intake-inventory.mjs`
- `templates/app-in-toss/files/scripts/{asset-spec,assets}.ts`
- `templates/app-in-toss/files/agents/asset-maker/`
- [[publish-gate]] — `miniapp_update_*` 를 금지한 근거
- [[agent-granularity]] — asset-maker 를 별도 프로세스로 뽑은 근거
