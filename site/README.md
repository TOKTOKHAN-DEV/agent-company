# site — 제품 랜딩

Agent Company 를 소개하는 공개 페이지입니다. **이 레포(제품 레포)에만 있습니다** —
`pnpm company-setup` 의 정리 단계가 사용자 프로젝트에서는 이 디렉터리를 지웁니다.

```
site/
├── index.html     자체완결 페이지 (폰트 · CSS · JS 전부 인라인)
├── vercel.json    정적 배포 설정
└── README.md      이 파일
```

## 왜 빌드가 없나

페이지가 파일 하나입니다. 폰트(Pretendard)는 `@font-face` 의 data URI 로, CSS 와 JS 는
`<style>` · `<script>` 로 들어 있습니다. 외부 호스트로 나가는 요청이 없으므로 번들러도,
프레임워크도, `package.json` 도 필요하지 않습니다.

`site/` 는 `pnpm-workspace.yaml` 에 등록되어 있지 않습니다. 워크스페이스 패키지가 아니라
정적 산출물이기 때문입니다.

## Vercel 설정

프로젝트를 만들 때 **Root Directory 를 `site` 로** 지정하세요. 나머지는 `vercel.json` 이
처리합니다.

| 항목 | 값 |
| --- | --- |
| Root Directory | `site` |
| Framework Preset | Other (`vercel.json` 의 `framework: null`) |
| Build Command | 없음 |
| Install Command | 없음 |
| Output Directory | `.` |

Root Directory 는 `vercel.json` 으로 설정할 수 없는 프로젝트 설정이라 대시보드에서 한 번
지정해야 합니다. 이걸 레포 루트의 `vercel.json` 으로 대신하지 않는 이유: 그러면 정리 단계가
`site/` 를 지운 뒤에도 루트에 배포 설정이 남아 사용자 프로젝트의 배포를 깨뜨립니다.

## 수정할 때

랜딩 문구는 저장소의 실제 상태와 어긋나면 안 됩니다. 특히:

- 설치 명령(`pnpm company-setup`)과 raw URL — GitHub 는 레포 이름을 바꿔도 리다이렉트해 주지만
  **raw.githubusercontent.com 은 리다이렉트하지 않습니다.**
- 템플릿 목록과 `status` — `templates/*/template.yaml` 이 진실입니다
- 로스터 표 — `templates/<id>/files/agents/registry.yaml` 이 진실입니다

## 폰트를 분리하고 싶다면

지금은 폰트가 인라인이라 페이지가 210KB 입니다. 재방문 캐시를 살리려면 base64 를 꺼내
`site/fonts/pretendard.woff2` 로 두고 `@font-face` 의 `src` 를 상대 경로로 바꾸세요.
파일이 둘로 늘어나는 대신 HTML 이 30KB 로 줄어듭니다.
