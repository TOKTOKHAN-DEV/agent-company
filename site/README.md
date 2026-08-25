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
`<style>` · `<script>` 로 들어 있습니다. 렌더링에 필요한 것이 전부 파일 안에 있으므로
번들러도, 프레임워크도, `package.json` 도 필요하지 않습니다.

`site/` 는 `pnpm-workspace.yaml` 에 등록되어 있지 않습니다. 워크스페이스 패키지가 아니라
정적 산출물이기 때문입니다.

### 딱 하나 나가는 요청 — GitHub 별 개수

헤더의 별 개수만 `api.github.com` 에서 가져옵니다. **점진적 향상입니다** — 오프라인이든
레이트리밋이든 차단이든, 실패하면 HTML 에 박힌 숫자가 그대로 남고 나머지는 아무 영향이
없습니다.

그래서 **HTML 의 폴백 숫자도 가끔 최신으로 맞춰 주세요.** 실패했을 때 보이는 값이 그것입니다.

```html
<span class="gh-n" id="ghStars">28</span>
```

비인증 GitHub API 는 IP 당 시간 60회입니다. 재방문이 한도를 태우지 않도록 6시간
`localStorage` 캐시를 둡니다. 사생활 모드나 사이트 데이터 차단에서는 `localStorage` 접근
자체가 예외를 던지므로 읽기·쓰기를 모두 `try` 로 감쌌습니다.

## 배포

**운영 중** — https://www.agent-company.site (Vercel 팀 `toktokhan-dev`)

프로젝트의 **Root Directory 가 `site`** 로 설정돼 있습니다. 그래서 배포는 **레포 루트에서**
합니다 — `site/` 안에서 돌리면 Vercel 이 `site/site` 를 찾아 실패합니다.

```bash
vercel deploy --prod --scope toktokhan-dev      # 레포 루트에서
```

| 항목 | 값 |
| --- | --- |
| Root Directory | `site` |
| Framework Preset | Other (`vercel.json` 의 `framework: null`) |
| Build Command | 없음 |
| Install Command | 없음 |
| Output Directory | `.` |

### 왜 루트에 `.vercelignore` 가 있나

CLI 배포는 로컬 디스크를 그대로 업로드합니다. 거르지 않으면 `templates/` 아래 `node_modules`
와 `.next` 까지 올라가 **배포가 3분 49초** 걸렸습니다. `/*` + `!site` 로 site 만 남기니
**5.7초**가 됐습니다.

`vercel.json` 을 루트에 두지 않는 것과는 다른 이야기입니다. `.vercelignore` 는 배포를
*설정*하지 않고 업로드 대상만 거르므로, 정리(prune)로 `site/` 가 사라진 사용자 프로젝트에서는
아무 일도 하지 않습니다. `vercel.json` 이었다면 남아서 그 프로젝트의 배포를 깨뜨립니다.

### 링크 파일

`vercel link` 가 루트 `.vercel/project.json` 에 `projectId` 와 `orgId` 를 씁니다. 계정에 묶인
ID 라 `.gitignore` 에 있습니다.

### 도메인

정식 주소는 **https://www.agent-company.site** 입니다. 네임서버가 Vercel(`ns1/ns2.vercel-dns.com`)
이고, 와일드카드 `ALIAS` 가 apex 와 `www` 를 모두 받습니다.

```
*  ALIAS  cname.vercel-dns-016.com.
   ALIAS  7ae3d4ca77b81dc7.vercel-dns-016.com
```

`vercel.app` 쪽 주소는 이렇습니다.

| 주소 | 상태 |
| --- | --- |
| `agent-company-ten.vercel.app` | 살아 있음. 자동 생성 이름 — `agent-company.vercel.app` 은 다른 계정이 선점했습니다 |
| `agent-company-toktokhan-dev.vercel.app` | Vercel Authentication 때문에 SSO 로 302. **공유용으로 쓸 수 없습니다** |

**DNS 를 갓 옮겼다면 로컬 리졸버 캐시를 의심하세요.** 네임서버가 Vercel 로 바뀐 뒤에도
로컬에서는 한동안 이전 파킹 레코드가 나옵니다. 네임서버에 직접 물어보면 구분됩니다.

```bash
dig +short @ns1.vercel-dns.com www.agent-company.site   # Vercel 이 실제로 주는 답
dig +short @1.1.1.1 www.agent-company.site              # 공개 리졸버가 받은 답
```

### git 연동 자동 배포

아직 연결하지 않았습니다. 지금은 푸시해도 재배포되지 않고 위 CLI 명령으로만 나갑니다.
붙이려면 `vercel git connect` — Root Directory 는 이미 `site` 라 추가 설정은 없습니다.

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
