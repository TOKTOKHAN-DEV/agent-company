# Agent Company

**한국어** ·
[English](./docs/i18n/README.en.md) ·
[日本語](./docs/i18n/README.ja.md) ·
[简体中文](./docs/i18n/README.zh-CN.md) ·
[Español](./docs/i18n/README.es.md) ·
[Français](./docs/i18n/README.fr.md) ·
[Deutsch](./docs/i18n/README.de.md) ·
[Português](./docs/i18n/README.pt-BR.md) ·
[Русский](./docs/i18n/README.ru.md)

> AI 팀이 굴리는 모노레포 템플릿.
> 조직도, 사규, 세션이 끝나도 남는 기억, 그리고 사람만 누를 수 있는 출고 버튼.

[![Website](https://img.shields.io/badge/website-agent--company.site-9A6410)](https://www.agent-company.site)
[![Node](https://img.shields.io/badge/node-%E2%89%A520.11-339933)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-%E2%89%A510-F69220)](https://pnpm.io)
[![License](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

---

## 프로젝트 개요

Orca, Paseo와 같은 에이전트 IDE 는 업무 환경을 제공합니다. 병렬 워크트리, 에이전트마다 하나씩인
터미널, diff 뷰. 그런데 실제 프로젝트를 진행하다보면 동일한 문제들이 생기기 마련입니다.

과거에 진행한 히스토리가 남아 있지 않습니다. 세션이 끝나거나 다른 에이전트가 이어받으면 과거의
의사결정이 사라집니다. 이미 이야기 했던 내용을 다시 전달해야하고, 이미 버린 방식으로 되돌아가는
경우도 있습니다.

그리고 결과물에 대한 검수도 쉽지 않습니다. 그래서 사람이 확인하고 내보내는 창구가 필요합니다.
블로그라면 어드민 페이지고, 앱인토스라면 심사 사전점검과 콘솔입니다.

둘 다 프롬프트를 다듬어서 해결되는 문제가 아닙니다. 무너지는 지점마다 시스템을 하나씩 붙였습니다.

| 무너지는 것 | 시스템 | 강제 수단 |
| --- | --- | --- |
| 컨텍스트 소실 | 핸드북 · wiki 인덱스 · 장단기 메모리가 세션 시작마다 자동으로 올라옴 | SessionStart 훅 |
| 품질 드리프트 | 출고 게이트가 결정적 함수. 사람과 에이전트가 같은 판정을 봄 | 게이트에 LLM 호출 없음 |
| 역할 혼재 | 에이전트마다 런타임 · 모델 · 쓰기 범위를 선언 | `agents/registry.yaml` |
| 출처 없는 자산 | 이미지 생성 경로가 하나뿐, 모든 자산에 출처 기록 | 도구 가드 + 감사 |
| 사고 출고 | 에이전트는 `in_review` 까지만. 출고 버튼은 사람이 누름 | 타입에 경로 없음 |

---

## 설치

### 에이전트에게 시키기 (권장)

이 문장을 쓰는 코딩 에이전트(Claude Code, Codex, Cursor, Gemini CLI 등)에 그대로 붙여넣으세요.

```text
Install Agent Company by following the instructions here:
https://raw.githubusercontent.com/TOKTOKHAN-DEV/agent-company/refs/heads/main/INSTALL.md
```

가이드는 클론부터 검증까지 자기완결적으로 구성되어 있습니다. 빈 폴더면 그 자리에 받고, 필수와
선택 도구, 폴백 절차가 모두 적혀 있어 막히는 지점에서 에이전트가 스스로 판단할 수 있습니다.

### 직접 하기

```bash
git clone https://github.com/TOKTOKHAN-DEV/agent-company.git
cd agent-company

pnpm install
pnpm company-setup    # 의존성 검사 → 어떤 회사를 차릴지 선택 → 환경 준비 → 검증
pnpm dev
```

자세한 절차와 문제 해결은 [INSTALL.md](./INSTALL.md) 를 참고하세요.

> `pnpm setup` 이 아니라 `pnpm company-setup` 입니다. `setup` 은 pnpm 내장 명령이라 같은 이름이면
> 스크립트가 가려집니다.

---

## 코어와 템플릿

저장소는 두 층으로 구성되어 있습니다. 코어는 어느 회사에서나 같고, 템플릿이 무엇을 만들지
정합니다.

```
agent-company/
│
├── ── 코어 (항상 있음) ─────────────────────────────
│   ├── .claude/          훅(SessionStart · PreToolUse) · 슬래시 커맨드
│   ├── wiki/             프로젝트 지식 + 장/단기 메모리 + ADR
│   ├── agents/           로스터가 들어올 자리 (registry.yaml + <id>/)
│   ├── scripts/          결정적 셸 스크립트
│   ├── CLAUDE.md         Claude Code 지침
│   └── AGENTS.md         모든 AI 코딩 에이전트 공통 지침
│
├── ── 템플릿 (골라서 펼침) ─────────────────────────
│   └── templates/<id>/
│       ├── template.yaml   매니페스트 — 스크립트 · 검사 항목 · 하드 룰 · 다음 단계
│       └── files/          레포 루트 기준 경로 그대로 (apps/ · packages/ · agents/ …)
│
└── ── 제품 (이 레포에만) ───────────────────────────
    └── site/               랜딩 페이지. 정적 HTML 하나, 빌드 없음 → Vercel
```

`pnpm company-setup` 이 템플릿을 고르게 하고, `templates/<id>/files/` 를 루트에 펼친 뒤
매니페스트의 `script:` 를 루트 `package.json` 에 병합합니다. 템플릿을 갈아타면 이전 템플릿이
넣은 스크립트 키만 정확히 회수됩니다.

### 지금 있는 템플릿

| id | 상태 | 만드는 것 | 로스터 | 게이트 |
| --- | --- | --- | --- | --- |
| [`blog`](./templates/blog/README.md) | stable | 공개 사이트 + 검수 데스크 | blog-writer · image-maker | `audit` → `in_review` |
| `blank` | stable | 빈 템플릿. 코어만 있음 | 직접 정하세요 | 직접 만드세요 |
| [`app-in-toss`](./templates/app-in-toss/README.md) | preview | 토스 WebView 미니앱 | spec-writer · ui-builder · release-manager | `preflight` → 콘솔 검수 |

```bash
pnpm template list                    # 목록 · 현재 적용된 것
pnpm template apply <id>              # 펼치기
pnpm template apply <id> --force      # 다른 템플릿 위에 덮어쓰기
pnpm template prune                   # 안 쓰는 카탈로그 · 랜딩 정리
```

`planned` 는 매니페스트에 의도만 적혀 있고 내용물이 없는 상태입니다. `apply` 가 거부합니다.
빈 껍데기를 깔아 놓으면 나중에 왜 동작하지 않는지 찾게 되기 때문입니다.

### 프로젝트 하나는 회사 하나

한 레포가 두 얼굴을 가집니다. 고르고 나면 나머지 카탈로그와 제품 랜딩은 그 프로젝트에 필요하지
않으므로, `pnpm company-setup` 이 정리를 제안합니다.

| | 제품 레포 (여기) | Use this template 한 내 프로젝트 |
| --- | --- | --- |
| `site/` (랜딩) | 있음 → Vercel 배포 | 정리로 삭제 |
| 안 고른 템플릿 | 전부 | 정리로 삭제 |
| 고른 템플릿의 `files/` | 있음 | 삭제 (이미 루트에 펼쳐짐) |
| 고른 템플릿의 `template.yaml` | 있음 | 남김 |
| 코어 | 있음 | 있음 |

매니페스트를 남기는 것이 중요합니다. `check-deps.sh` 와 `load-context.sh` 가 `verify-*` 와
`rule:` 을 계속 읽기 때문입니다. 지우면 검사와 하드 룰 주입이 에러 없이 조용히 사라집니다.

제품 레포는 `.company/PRODUCT` 마커가 있어 정리를 거부합니다. 기여자가 클론해서 셋업을 돌려도
카탈로그가 지워지지 않습니다.

정리한 뒤 다른 템플릿이 다시 필요하면 upstream 에서 가져올 수 있습니다.

```bash
git remote add upstream https://github.com/TOKTOKHAN-DEV/agent-company.git
git fetch upstream && git checkout upstream/main -- templates/
```

### 템플릿을 별도 레포로 두지 않은 이유

매니페스트 키는 코어 스크립트와 함께 움직입니다. `sed` 로 읽기 때문에 모르는 키는 조용히
무시되고, 원격 템플릿이 구버전이면 에러 없이 검사가 통째로 빠지게 됩니다. 한 레포에 두면 이
문제가 생기지 않습니다. 그리고 셋업 중간에 네트워크가 끼면 두 번 돌려도 같은 상태라는 약속이
깨집니다.

무게는 근거가 되기 어렵습니다. `templates/` 는 git 기준으로 388K 입니다.

쪼갤 시점은 서드파티가 템플릿을 기여하기 시작할 때, 템플릿에 대용량 에셋이 들어갈 때, 템플릿별
릴리스 주기가 갈릴 때입니다. 그때 손댈 곳은 `template.sh` 의 파일 펼치기 한 곳입니다.

---

## 코어 구성 요소

### 1. 컨텍스트 레이어

세션이 시작되면 훅이 자동으로 주입합니다.

```
코어 하드 룰 → 현재 회사(템플릿) + 그 회사의 하드 룰 → wiki 인덱스
             → 장기 메모리 → 최근 단기 메모리 → 로스터 → git 상태
```

wiki 전문이 아니라 인덱스만 올립니다. 지도를 주고, 필요한 문서는 모델이 직접 엽니다
([ADR-0003](./wiki/decisions/ADR-0003-session-context-loading.md)).

2단 메모리로 오래가는 것만 남습니다.

```
단기 메모리 ──(3회 이상 참조 / 계속 참으로 확인)──▶ 장기 메모리
장기 메모리 ──(프로젝트 규칙이 됨)──────────────▶ wiki 문서 또는 ADR
```

승격은 `/save-memory` 가 관리합니다.

### 2. 로스터

여기서 말하는 에이전트는 Claude 서브에이전트가 아닙니다. 각자 별도 터미널에서 도는 독립
프로세스이고 런타임도 다릅니다. 그래서 Orca 같은 ADE 가 멀티 터미널로 진짜 병렬 실행할 수
있습니다.

```bash
pnpm agent --list
pnpm agent <id> "<작업>"
pnpm agent <id> "<작업>" --dry-run   # 조립된 명령만 출력 (다른 터미널에 붙여넣기)
```

런처가 `agents/registry.yaml` 에서 런타임과 모델을 읽고, `AGENT.md` 와 스킬 인덱스(폴더 스캔으로
자동 생성)를 시스템 프롬프트로 조립해 해당 CLI 를 띄웁니다. 스킬을 추가하면 등록 없이 바로
반영됩니다.

에이전트를 늘리는 기준은 역할이 아니라 런타임과 병렬성입니다. 기존 에이전트가 할 수 있는 일이면
에이전트 대신 스킬을 추가하는 편이 좋습니다 →
[wiki/05-agent-operations.md](./wiki/05-agent-operations.md)

### 3. 출고 게이트

게이트는 결정적 함수입니다. 어드민 화면과 CLI 가 같은 함수를 부르므로 사람과 에이전트가 같은
판정을 봅니다. 게이트 안에 모델 호출을 넣지 않습니다. 모델이 자기 결과물을 평가하면 통과 쪽으로
기울기 때문입니다.

게이트의 구체적인 규칙은 템플릿이 정합니다. `blog` 라면 `pnpm audit:content` 입니다.

### 4. 이미지 정책

이미지 생성 경로는 Codex `imagegen` 하나입니다. 정책은 코어이고, 실행 명령은 템플릿이 제공합니다.
생성한 이미지를 어디에 두고 어떤 메타데이터에 출처를 적을지는 도메인마다 다르기 때문입니다.
`blog` 라면 아래와 같습니다.

```bash
pnpm imagegen --slug <slug> --prompt "<장면 설명>"
```

Codex 를 쓸 수 없으면 이 순서로 폴백합니다.

1. 이미지 없이 진행 (기본값)
2. 사용자가 직접 첨부 (`source: user-upload`)
3. 웹 검색. 라이선스 확인이 필수이고 `source: web-search` 와 `license` 를 기록합니다

문서로만 둔 규칙은 지켜지지 않으므로 세 겹으로 강제합니다.

| 층 | 수단 |
| --- | --- |
| 타입 | `ImageSource` 에 `claude` 값이 존재하지 않음 |
| 훅 | `PreToolUse` 가 비-Codex 이미지 생성 명령을 차단 |
| 감사 | 출처 미기록 · 라이선스 없는 웹 이미지를 error 처리 → 출고 불가 |

근거: [ADR-0002](./wiki/decisions/ADR-0002-codex-only-image-generation.md)

### 5. 인계

다른 워크스페이스에서 만들던 것을 들여옵니다. 기존 서비스를 미니앱으로 옮기거나, 디자인
킷을 넘겨받거나, 반쯤 만들다 만 프로젝트를 이어받을 때 씁니다.

```bash
pnpm intake ~/Downloads/design-kit.zip
pnpm intake ~/work/other-repo --as reference
```

zip · tar.gz · 폴더를 `inbox/<이름>/` 에 풀고, `node_modules` 같은 것을 걷어낸 뒤
**목차(`INVENTORY.md`)를 만듭니다** — 스택, 먼저 읽을 문서, 이미지와 그 해상도, 열 수 없는
디자인 파일, 그리고 키가 섞여 있으면 경고까지.

목차를 만드는 이유는 컨텍스트입니다. 폴더를 통째로 던지면 에이전트가 파일을 하나씩 열어
보며 컨텍스트를 태웁니다. 무엇이 어디 있는지 먼저 알려주면 필요한 것만 엽니다.

받은 것은 실행하지 않습니다. 심볼릭 링크는 지우고(저장소 밖을 가리킬 수 있습니다), 압축을
푼 코드를 설치하거나 빌드하지 않습니다. 남이 준 zip 은 읽을거리이지 실행할 것이 아닙니다.

`inbox/` 는 버전 관리하지 않습니다. **재료이지 결과물이 아니기 때문입니다** — 여기서 뽑아낸
명세와 에셋만 저장소에 남습니다 (코어 하드 룰 3).

---

## 코어 하드 룰

템플릿과 무관하게 항상 참입니다. 바꾸려면 `wiki/decisions/` 에 ADR 을 먼저 써야 합니다.

1. **이미지 생성 경로는 하나다.** 다른 이미지 모델 호출도, SVG 로 대신 그리는 것도 금지.
2. **출고 버튼은 사람이 누른다.** 에이전트는 검수 대기(`in_review`)까지만 올린다.
3. **진실은 저장소 파일이다.** 결과물도 결정도 코드와 같은 저장소에서 버전 관리한다.
4. **게이트는 결정적이다.** 검수에 모델 추론을 넣지 않는다.
5. **컨텍스트는 스스로 올라온다.** 누구도 챙겨올 필요가 없다.

도메인 규칙은 `templates/<id>/template.yaml` 의 `rule:` 에 적고, 세션 시작 시 코어 룰 위에
얹혀서 주입됩니다.

---

## 명령

### 코어 (항상)

| 명령 | 설명 |
| --- | --- |
| `pnpm company-setup` | 의존성 검사 → 템플릿 선택 → 환경 준비 → 검증 (+ 선택: GitHub 응원) |
| `pnpm check` | 환경 상태만 검사 (설치하지 않음). 현재 템플릿의 검사 항목까지 확인 |
| `pnpm template list \| apply <id> \| prune` | 템플릿 조회 · 적용 · 정리 |
| `pnpm agent --list \| <id> "<작업>"` | 에이전트 목록 · 실행 |
| `pnpm intake <zip \| 폴더>` | 다른 워크스페이스의 작업물을 `inbox/` 로 들여오고 목차 생성 |
| `pnpm context` | 세션 컨텍스트 수동 출력 |
| `pnpm memory:new <topic>` | 새 메모리 파일 생성 (`--long` 으로 장기) |
| `pnpm dev \| build \| typecheck \| lint \| test` | 워크스페이스 전체 (turbo) |

### 템플릿이 얹는 것

`blog` 를 적용하면 `dev:web` · `dev:admin` · `audit:content` · `cover` · `imagegen`
이 추가됩니다. 어떤 키가 오는지는 매니페스트의 `script:` 줄에 적혀 있습니다.

---

## 슬래시 커맨드

| 명령 | 하는 일 |
| --- | --- |
| `/company-setup` | 의존성 전수 검사 + 설치 · 템플릿 선택 (조직 팔로우 · 스타는 선택) |
| `/save-memory` | 세션 내용을 단기 메모리에 저장하고 필요 시 장기/wiki 로 승격 |
| `/create-agent` | 새 에이전트를 registry + AGENT.md + skills/ 에 일괄 생성 |

에이전트가 읽는 스킬(`agents/<id>/skills/`)은 이것과 별개입니다. 그쪽은 런처가 시스템 프롬프트에
주입하는 런타임 중립 플레이북이라 codex 에이전트도 읽습니다.

---

## 새 템플릿 만들기

```
templates/<id>/
├── template.yaml    매니페스트
└── files/           레포 루트 기준 경로 그대로
```

매니페스트는 반복 키 형식입니다. YAML 파서를 들이지 않고 `sed`/`awk` 로 읽습니다. 셋업이
결정적이어야 하기 때문입니다.

| 키 | 뜻 |
| --- | --- |
| `id` · `name` · `status` · `summary` | 목록에 보이는 것. `status` 는 `stable` · `preview` · `planned` |
| `ships` · `hires` · `gate` | 한 줄 요약 (문서 · 랜딩에서 씀) |
| `script: key=value` | 루트 `package.json` 에 병합. 갈아탈 때 이 키만 회수 |
| `verify-workspace:` | 의존성 연결까지 확인 (없으면 실패) |
| `verify-dir:` | 디렉터리 존재 + 파일 개수 (없으면 실패) |
| `verify-optional:` | 있으면 좋은 파일/디렉터리 (없으면 경고) |
| `verify-env: VAR=설명` | `.env` 값 확인. 없으면 무엇이 꺼지는지 알림 |
| `note-env: VAR=설명` | 비어 있는 게 정상인 값. 상태만 보여줌 |
| `runtime:` | 이 템플릿이 쓰는 CLI (없으면 경고) |
| `mcp: 서버명=설명` | 이 템플릿이 쓰는 MCP 서버. 등록 여부를 검사 |
| `mcp-claude:` · `mcp-codex:` | 미등록일 때 출력할 등록 명령 |
| `rule:` | 이 회사의 하드 룰. 세션 시작마다 코어 룰 위에 주입 |
| `next:` | 셋업 완료 후 안내. `${VAR}` 는 `.env` 에서 치환 |

매니페스트를 읽는 곳은 `scripts/template.sh` · `scripts/check-deps.sh` ·
`scripts/load-context.sh` · `scripts/company-setup.sh` 네 곳입니다. 키를 추가하면 이 중 하나가
읽도록 함께 고쳐야 합니다. 아무도 읽지 않는 키는 설정이 아니라 문서일 뿐입니다.

MCP 등록 확인은 `claude mcp list` 대신 설정 파일(`~/.claude.json` · `.mcp.json` ·
`~/.codex/config.toml`)을 읽어서 합니다. 그 명령은 네트워크로 헬스체크를 하기 때문에
`pnpm check` 가 결정적이지 않게 됩니다.

---

## 기술 스택

pnpm workspaces · Turborepo · TypeScript 5.9 (strict) · 결정적 bash 스크립트.
앱 스택(Next.js · React · Tailwind · zod 등)은 템플릿이 가져옵니다.

## 기여

[CONTRIBUTING.md](./CONTRIBUTING.md) 에 이 저장소에서만 통하는 규칙을 모아 두었습니다.
바꾸기 전에 ADR 이 필요한 것, 하나를 고치면 짝을 함께 고쳐야 하는 것, 에이전트를 늘리는
기준입니다.

취약점은 공개 이슈 대신 [SECURITY.md](./SECURITY.md) 의 절차로 신고해 주세요.

## 라이선스

MIT
