---
date: 2026-08-25
type: decision
topic: landing-refresh-and-deploy
tags: [site, vercel, deploy, landing]
confidence: high
promoted: false
---

# 랜딩을 최신화해 배포하고, Root Directory 오해를 걷어냄

## 무엇

`site/` 랜딩을 저장소 실제 상태와 대조해 고치고 프로덕션에 올렸다.
운영 URL 은 **https://agent-company-ten.vercel.app** (Vercel 팀 `toktokhan-dev`).
커밋 `e99cd02` · `8be4a48`, 푸시 완료. 절차는 [site/README.md](../../../site/README.md) 에 있다 —
여기서 반복하지 않는다.

## 왜 — 「대시보드에서만 가능」은 틀린 전제였다

`Vercel Root Directory 를 site 로` 가 **세 세션에 걸쳐** 남아 있었다. 근거로 적혀 있던
"대시보드에서만 가능하고 vercel.json 으로는 안 된다"는 절반만 맞았다.

- `vercel.json` 으로 안 되는 것은 맞다. 하지만 **REST API 로 된다** —
  `PATCH /v9/projects/{id}` 에 `{"rootDirectory":"site"}`. 토큰은 CLI 가 이미 갖고 있다
  (`~/Library/Application Support/com.vercel.cli/auth.json`).
- 그 전에, **CLI 배포에는 애초에 필요 없는 설정이었다.** `site/` 안에서 `vercel deploy` 하면
  CWD 가 곧 배포 루트다. 처음 배포는 이 방법으로 했다.

**교훈 — 메모리에 적힌 제약은 재확인하고 넘어간다.** "대시보드 전용" 같은 플랫폼 제약은
CLI·API 쪽에 길이 있는 경우가 많다. 막혔다는 기록이 오래 남아 있을수록 의심하라.

## 알아 둘 것 — 되돌리기 전에 볼 것

- **Root Directory 를 켠 순간 CLI 배포 위치가 반대로 바뀐다.** 이제 **레포 루트**에서
  배포해야 한다. `site/` 안에서 돌리면 Vercel 이 `site/site` 를 찾아 실패한다.
- **루트 `.vercelignore` 를 지우지 마라.** 없으면 CLI 가 모노레포 전체를 업로드해
  배포가 **3분 49초** 걸렸다. `/*` + `!site` 로 **5.7초**가 됐다. git 연동 배포는 GitHub 에서
  클론하므로 영향이 없다 — CLI 배포만의 문제다.
- `.vercelignore` 는 `vercel.json` 과 다르다. 배포를 *설정*하지 않고 업로드 대상만 거르므로,
  정리(prune)로 `site/` 가 사라진 사용자 프로젝트에서는 아무 일도 하지 않는다.
  같은 자리에 `vercel.json` 을 두면 안 되는 이유는 그쪽은 남아서 배포를 깨뜨리기 때문이다.

## 도메인 — 아직 공유용 주소가 없다

- `agent-company.vercel.app` 은 **다른 계정이 선점**했다. 그래서 `-ten` 이 붙었다.
- `agent-company-toktokhan-dev.vercel.app` 은 **Vercel Authentication 때문에 SSO 로 302**
  된다. 별칭을 새로 걸어도 같은 이유로 막힌다 — 시도했다가 되돌렸다.
  **공유용으로 쓸 수 없다.**
- `agent-company.site` 가 팀에 등록돼 배포마다 별칭이 붙지만 네임서버가 외부라
  **DNS 가 아직 Vercel 을 가리키지 않는다.** 붙이면 이쪽이 정식 주소가 된다.

## 랜딩이 사실과 어긋나 있던 것

`asset-maker` 는 2026-08-14 에 뽑혔는데(`3a83fde`) 랜딩 카드와 로스터 표 **양쪽 모두에**
반영된 적이 없었다. 부팅 터미널의 파일 수도 실제 `git ls-files` 값과 달랐다.

**랜딩은 저장소 상태를 따라오지 않는다.** 로스터나 템플릿을 건드렸으면
`site/index.html` 을 함께 봐야 한다. 대조 대상은 `templates/*/template.yaml` 의
`hires:` · `ships:` · `status:` 와 `templates/*/files/agents/registry.yaml`.

## 이어서 할 것

- **git 연동 자동 배포는 안 걸려 있다.** 푸시해도 재배포되지 않는다.
  붙이려면 `vercel git connect` — Root Directory 는 이미 `site` 라 추가 설정은 없다.
- `agent-company.site` DNS 연결 (사용자 작업)
- **`app-in-toss` 는 여전히 `preview`.** 실제 심사를 통과시켜 본 적이 없다는 상황은
  그대로다 — [[2026-08-14-intake-and-asset-agent]] 참조.

## 관련

- `site/README.md` · `site/index.html` · `.vercelignore`
- [[2026-08-14-intake-and-asset-agent]] — 이 세션에서 그 메모리의 미해결 항목 3개를 닫았다
