# INSTALL

Agent Company 설치 가이드.

---

## 이 문서를 읽는 에이전트에게

당신은 아직 이 저장소를 받지 않았을 수 있습니다. 아래 순서대로 진행하세요.

1. **[클론](#1-클론)** — 현재 폴더가 비어 있으면 그 자리에 그대로 받습니다
2. **[셋업](#2-셋업-실행)** — `pnpm install && pnpm company-setup`
3. **[검증](#설치-확인)** — `pnpm check` 결과를 사용자에게 보여줍니다

진행 중 판단이 필요한 지점:

- **셋업 3단계에서 템플릿을 물어봅니다.** 사용자가 무엇을 만들려는지 이미 말했다면
  `--template <id>` 로 넘기세요. 아직 모르면 사용자에게 물어보고 고르게 하세요. **임의로
  고르지 마세요** — 템플릿은 파일을 루트에 펼치고, 갈아타면 이전 파일이 남습니다.
- **필수 도구가 없으면** 스크립트가 설치 명령을 출력하고 중단합니다. 그 명령을 사용자에게
  그대로 전달하세요. 대안 도구를 임의로 고르지 마세요.
- **Codex 가 없으면** 경고만 뜨고 설치는 계속됩니다. 정상입니다 — 이미지 생성만 비활성화됩니다.
  다른 이미지 생성 도구를 찾지 마세요 ([이미지 정책](#codex-설정-이미지-생성)).
- **`gh` 가 미인증이면** 조직 팔로우·스타 단계를 묻지 않고 건너뜁니다. 설치 자체는 성공입니다.
  선택 단계이므로 `gh` 를 설치하거나 로그인하라고 권하지 마세요.
- **`pnpm check` 의 `!` 경고**는 선택 항목이라 실패가 아닙니다. `✘` 만 해결 대상입니다.

템플릿 선택 외에는 사용자에게 물어보지 말고 끝까지 진행한 뒤, 마지막에 `pnpm check` 출력과
다음 실행 명령을 정리해 보고하세요.

---

## 요구 사항

| | 최소 버전 | 필수 | 없으면 |
| --- | --- | --- | --- |
| [Node.js](https://nodejs.org) | 20.11 | 필수 | 실행 불가 |
| [pnpm](https://pnpm.io) | 10 | 필수 | 실행 불가 |
| [git](https://git-scm.com) | 2.30 | 필수 | 실행 불가 |
| [Claude Code](https://claude.com/claude-code) | 최신 | 권장 | 훅 · 슬래시 커맨드 · `claude` 런타임 에이전트 사용 불가 |
| [Codex CLI](https://developers.openai.com/codex/cli) | 최신 | 선택 | **이미지 생성 불가** (폴백으로 동작) |
| [GitHub CLI](https://cli.github.com) | 2.0 | 선택 | 조직 팔로우 · 스타 단계를 건너뜀 |

어떤 런타임이 실제로 필요한지는 고른 템플릿이 정합니다. 매니페스트의 `runtime:` 에 적혀 있고,
`pnpm check` 가 없는 것을 경고로 알려줍니다.

### macOS

```bash
brew install node pnpm git gh
brew install codex        # 또는 npm i -g @openai/codex
```

### Node 버전 관리자를 쓰는 경우

```bash
nvm install 22 && nvm use 22     # nvm
fnm install 22 && fnm use 22     # fnm
```

### pnpm 설치

Node 20+ 에 포함된 corepack 을 쓰는 것이 가장 간단합니다.

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

---

## 설치

### 1. 클론

**현재 폴더가 비어 있다면** 하위 폴더를 만들지 말고 그 자리에 그대로 받으세요.

```bash
git clone https://github.com/TOKTOKHAN-DEV/agent-company.git .
```

`.` 이 핵심입니다. 이미 프로젝트 폴더를 만들어 그 안에 들어와 있는데 또 하위 폴더가 생기면
`agent-company/agent-company/` 같은 중첩이 됩니다.

비어 있는지 판단은 이렇게 합니다 (숨김 파일 포함, `.git` 은 제외).

```bash
if [ -z "$(ls -A . 2>/dev/null | grep -v '^\.git$')" ]; then
  git clone https://github.com/TOKTOKHAN-DEV/agent-company.git .
else
  git clone https://github.com/TOKTOKHAN-DEV/agent-company.git
  cd agent-company
fi
```

템플릿으로 **새 프로젝트**를 시작한다면 GitHub 의 **Use this template** 버튼을 쓰거나:

```bash
gh repo create <내-프로젝트> --template TOKTOKHAN-DEV/agent-company --private --clone
cd <내-프로젝트>
```

### 2. 셋업 실행

```bash
pnpm install
pnpm company-setup
```

> `pnpm setup` 이 아닙니다. `setup` 은 pnpm 내장 명령이라 같은 이름이면 스크립트가 가려집니다.

`pnpm company-setup` 이 하는 일:

| 단계 | 내용 |
| --- | --- |
| 1/7 | **필수 도구 확인** — node ≥20.11, pnpm ≥10, git. 없으면 설치 명령을 출력하고 중단 |
| 2/7 | **도구 상태 확인** — codex, gh, claude. 없으면 무엇이 비활성화되는지 알림 |
| 3/7 | **회사 선택** — 어떤 템플릿을 펼칠지 고름. 이미 적용돼 있으면 다시 묻지 않음 |
| 4/7 | **환경 준비** — `.env` 생성, 템플릿이 요구하는 디렉터리 생성, 실행 권한 부여 |
| 5/7 | **의존성 설치** — `pnpm install` |
| 6/7 | **검증** — 구조 검사 + 타입 검사 |
| 7/7 | **GitHub 응원 (선택)** — `@TOKTOKHAN-DEV` 팔로우 + 레포 스타를 **물어봄** |

3단계가 5단계보다 앞에 오는 이유: 템플릿이 `apps/` · `packages/` 워크스페이스를 루트에 펼치므로
그 다음에 설치해야 의존성이 연결됩니다.

7단계 선택지는 `Yes, star it!` · `No thanks` · `Maybe later` 세 개이고, 거절하면
`.company/state/community` 에 기록되어 **다시 묻지 않습니다**. 이미 되어 있거나 `gh` 가 미인증이면
묻지 않고 넘어갑니다. 실패해도 셋업은 성공으로 끝납니다.

옵션:

| 옵션 | 용도 |
| --- | --- |
| `--template <id>` | 템플릿을 묻지 않고 바로 적용 (CI · 자동화) |
| `--prune` / `--no-prune` | 안 쓰는 카탈로그·랜딩 정리 여부 (기본: 물어봄) |
| `--yes` | 모든 확인을 자동 승인 (CI) |
| `--skip-install` | `pnpm install` 건너뛰기 |
| `--no-community-prompt` | 7단계를 묻지 않고 넘어감 |

```bash
bash scripts/company-setup.sh --template blog --yes   # 예: CI (GH_TOKEN 필요)
```

`--template` 없이 비대화형으로 돌리면 3단계를 **건너뜁니다**. 임의로 하나를 고르지 않습니다 —
무엇을 만드는 회사인지는 사람이 정할 일이고, 잘못 고르면 파일이 이미 루트에 깔린 뒤입니다.

### 3. 템플릿

셋업 밖에서 따로 다루려면:

```bash
pnpm template list                    # 목록 + 현재 적용된 것
pnpm template current                 # 현재 id (없으면 none)
pnpm template apply <id>              # 펼치기
pnpm template apply <id> --force      # 다른 템플릿 위에 덮어쓰기
pnpm template prune                   # 안 쓰는 카탈로그 · 랜딩 정리
```

| id | 상태 | 만드는 것 |
| --- | --- | --- |
| `blog` | stable | 공개 사이트 + 검수 데스크 → [README](./templates/blog/README.md) |
| `blank` | stable | 빈 템플릿. 코어만 있고 로스터는 직접 채움 |
| `app-in-toss` | preview | 토스 WebView 미니앱 → [README](./templates/app-in-toss/README.md) |

`planned` 는 `apply` 가 거부합니다. 빈 껍데기를 깔아 놓고 나중에 "왜 안 되지" 하게 만들지
않기 위해서입니다.

**갈아탈 때 주의**: `--force` 는 새 템플릿 파일을 덮어쓰고 `package.json` 에서 이전 템플릿의
스크립트 키를 회수하지만, **이전 템플릿이 놓았던 파일은 지우지 않습니다.** 정리는 직접 하세요.
자동으로 지우면 그 사이에 사람이 쓴 것까지 날아갑니다.

### 3-b. 정리 (prune)

프로젝트 하나는 회사 하나입니다. 고르고 나면 나머지 카탈로그와 제품 랜딩은 이 프로젝트에
의미가 없으므로 셋업이 정리를 제안합니다.

```bash
pnpm template prune
```

지우는 것 / 남기는 것:

| 대상 | 처리 | 이유 |
| --- | --- | --- |
| 안 고른 템플릿 | 삭제 | 이 프로젝트와 무관 |
| 고른 템플릿의 `files/` | 삭제 | 이미 루트에 펼쳐져 중복 |
| 고른 템플릿의 `template.yaml` · `README.md` | **남김** | `check-deps` 와 `load-context` 가 계속 읽음 |
| `site/` (제품 랜딩) | 삭제 | 이 레포의 것이지 프로젝트의 것이 아님 |

`.company/PRODUCT` 마커가 있으면 거부합니다 — 제품 레포에서는 카탈로그와 랜딩이 내용물이기
때문입니다. 기여하려고 클론한 경우가 여기 해당합니다.

정리 뒤 다른 템플릿이 다시 필요하면:

```bash
git remote add upstream https://github.com/TOKTOKHAN-DEV/agent-company.git
git fetch upstream && git checkout upstream/main -- templates/
```

### 4. 실행

무엇이 뜨는지는 템플릿이 정합니다. 셋업 마지막에 매니페스트의 `next:` 가 출력됩니다.

```bash
pnpm dev
```

`blog` 라면:

| 앱 | 주소 |
| --- | --- |
| web (블로그) | http://localhost:3000 |
| admin (운영) | http://localhost:3001 |

```bash
pnpm dev:web
pnpm dev:admin
```

---

## 환경 변수

`.env.example` 을 `.env` 로 복사하면 기본값으로 동작합니다. `pnpm company-setup` 이 자동으로
처리합니다.

### 코어 (항상)

| 변수 | 기본값 | 설명 |
| --- | --- | --- |
| `IMAGE_PROVIDER` | `codex` | **변경하지 마세요.** 하드 룰입니다 |
| `IMAGE_OUTPUT_DIR` | 템플릿마다 다름 | 생성 이미지 저장 위치 |
| `IMAGE_FALLBACK` | `user` | Codex 부재 시: `none` / `user` / `websearch` |
| `CODEX_IMAGEGEN_CMD` | (없음) | Codex CLI 호출 방식이 다를 때 덮어쓰기 |

### 템플릿

템플릿을 펼치면 그 템플릿의 `.env.example` 이 루트 파일을 덮어씁니다 (코어 이미지 블록은 그대로
포함되어 있습니다). `blog` 는 `NEXT_PUBLIC_SITE_URL` · `WEB_PORT` · `ADMIN_PORT` ·
`CONTENT_DIR` · Supabase · 검색엔진 소유 확인 · GA4 를 추가합니다.

어떤 값이 비어 있어서 무엇이 꺼져 있는지는 `pnpm check` 가 알려줍니다.

---

## Claude Code 연동

이 디렉터리에서 Claude Code 를 열면 자동으로 활성화됩니다.

```bash
claude
```

### 자동으로 일어나는 일

**SessionStart 훅**이 다음을 컨텍스트에 주입합니다:

```
코어 하드 룰 → 현재 회사(템플릿) + 그 회사의 하드 룰 → wiki 인덱스
             → 장기 메모리 → 최근 단기 메모리 → 로스터 → git 상태
```

수동으로 확인하려면:

```bash
pnpm context
```

**PreToolUse 훅**이 비-Codex 이미지 생성 명령을 차단합니다.

### 사용 가능한 스킬

| 명령 | 용도 |
| --- | --- |
| `/company-setup` | 의존성 전수 검사 + 설치 + 템플릿 선택 |
| `/save-memory` | 세션 내용을 메모리에 저장하고 필요 시 승격 |
| `/create-agent` | 새 에이전트 생성 |

---

## 에이전트 실행

에이전트는 Claude 서브에이전트가 **아닙니다.** 각자 별도 터미널에서 도는 독립 프로세스라 런타임이
다를 수 있습니다.

```bash
pnpm agent --list                              # 등록된 에이전트
pnpm agent <id> "<작업>"
pnpm agent <id> "<작업>" --dry-run             # 조립된 명령만 출력
pnpm agent <id> "<작업>" --print               # 비대화형 (CI, 파이프라인)
```

로스터는 템플릿이 채웁니다. 템플릿을 아직 안 펼쳤으면 `agents/registry.yaml` 이 없고, 런처가
그 사실을 알려줍니다.

런타임이 없으면 런처가 설치 방법을 안내하고 종료 코드 3으로 끝납니다.

### 멀티 터미널

```bash
# 터미널 1
pnpm agent blog-writer "Turborepo 캐시 전략으로 글 하나"
# 터미널 2 (초안이 나온 뒤)
pnpm agent image-maker "turborepo-cache-strategy 커버"
```

쓰기 범위(`registry.yaml` 의 `writes`)가 겹치지 않으면 동시에 돌려도 됩니다. 겹치면 순서를
지키세요.

---

## Codex 설정 (이미지 생성)

이미지 생성은 **Codex 전용**입니다. 다른 이미지 모델 호출도, SVG 로 대신 그리는 것도 금지되어
있습니다 ([ADR-0002](./wiki/decisions/ADR-0002-codex-only-image-generation.md)).

```bash
npm i -g @openai/codex     # 또는 brew install codex
codex login
codex --version
```

사용 — **명령은 템플릿이 제공합니다.** 생성한 이미지를 어디에 두고 어떤 메타데이터에 출처를
적을지가 도메인마다 다르기 때문입니다. `blog` 라면:

```bash
pnpm imagegen --slug <slug> --prompt "<장면 설명>"
```

템플릿에 이미지 명령이 없으면 **이미지 없이 진행하는 것이 정답**입니다. 정책(다른 이미지 모델
금지)은 템플릿과 무관하게 PreToolUse 훅이 계속 강제합니다.

### 호출 방식이 다른 경우

Codex CLI 버전에 따라 이미지 생성 인터페이스가 다를 수 있습니다. 환경 변수로 덮어쓰세요.
`{out}` 과 `{prompt}` 가 치환됩니다.

```bash
export CODEX_IMAGEGEN_CMD='codex imagegen --out {out} "{prompt}"'
pnpm imagegen --slug my-post --prompt "..."
```

### Codex 없이 쓰기

정상 동작합니다. 이미지 단계가 이 순서로 폴백합니다:

1. **이미지 없이 진행** — 기본값
2. **직접 첨부** — `source: user-upload`
3. **웹 검색** — 라이선스 기록 필수. `source: web-search` + `license`

폴백을 프론트매터에 반영하는 명령은 템플릿이 제공합니다 (`blog` 는 `pnpm cover`).

---

## 설치 확인

```bash
pnpm check
```

검사 항목:

- 필수 런타임 (node · pnpm · git) 버전
- 선택 도구 (codex · gh · claude) 존재 여부
- 의존성 설치 상태 · `.env`
- **현재 회사(템플릿)** — 매니페스트의 `verify-workspace` · `verify-dir` · `verify-optional` ·
  `verify-env` · `note-env` 를 그대로 검사
- AI 컨텍스트 레이어 (`CLAUDE.md` · `AGENTS.md` · wiki · memory)
- 훅 존재 · 실행 권한 · 셸 문법
- 슬래시 커맨드 3종
- **에이전트 레지스트리 정합성** — `registry.yaml` 의 각 항목에 대응하는 정의 파일이 있는지,
  레지스트리에 없는 고아 정의가 있는지
- **커뮤니티 (선택)** — 조직 팔로우 · 레포 스타 상태. 선택 항목이라 경고로 세지 않습니다
- 타입 검사

종료 코드 0 이면 통과입니다. `✘` 는 반드시 해결해야 하고, `!` 는 선택 항목이라 실행에는 지장이
없습니다.

출고 게이트는 템플릿이 제공합니다. `blog` 라면:

```bash
pnpm audit:content            # 모든 글
pnpm audit:content <slug>     # 한 글
pnpm audit:content --errors   # error 가 있는 글만
```

admin 검수 화면과 **같은 함수**를 실행하므로 사람과 에이전트가 항상 같은 결과를 봅니다.
종료 코드 1 은 출고를 막는 error 가 남아 있다는 뜻이라 CI 게이트로 그대로 쓸 수 있습니다.

---

## 문제 해결

### `pnpm setup` 이 이상하게 동작함

pnpm 내장 명령이 실행된 것입니다. `pnpm company-setup` 을 쓰세요.

### `pnpm dev` 가 아무것도 띄우지 않음

템플릿을 아직 펼치지 않아 워크스페이스가 없는 상태입니다.

```bash
pnpm template list
pnpm template apply <id>
pnpm install
```

### `pnpm agent` 가 로스터가 없다고 함

같은 원인입니다. 로스터는 템플릿이 채웁니다.

### 템플릿을 바꿨더니 이전 파일이 남아 있음

의도된 동작입니다. `--force` 는 덮어쓰기만 하고 지우지 않습니다. 남은 것을 직접 지우거나,
`git status` 로 확인한 뒤 정리하세요.

### `turbo: command not found`

```bash
pnpm install
```

### `pnpm: command not found`

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

### 포트가 이미 사용 중

```bash
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

또는 `.env` 의 `WEB_PORT` · `ADMIN_PORT` 를 바꾸세요.

### SessionStart 훅이 동작하지 않음

```bash
chmod +x .claude/hooks/*.sh scripts/*.sh    # 1. 실행 권한
bash .claude/hooks/session-start.sh         # 2. 직접 실행해 오류 확인
bash -n .claude/hooks/session-start.sh      # 3. 셸 문법 검사
```

훅은 조용히 실패하지 않도록 설계되어 있습니다. 실패하면 경고가 출력됩니다.

### 이미지 생성이 차단됨

의도된 동작입니다. 템플릿이 주는 이미지 명령(`blog` 는 `pnpm imagegen`)을 쓰세요.
다른 이미지 생성 도구는 PreToolUse 훅이 차단합니다. Codex 가 없으면 위의 폴백 절차를 따르세요.

### `gh` 팔로우 실패 (스코프 부족)

```bash
gh auth refresh -s user:follow
bash scripts/community.sh apply     # 셋업 전체를 다시 돌릴 필요는 없습니다
```

### 응원 요청을 다시 받고 싶지 않을 때 / 다시 받고 싶을 때

```bash
bash scripts/community.sh status               # unavailable | done | optout | pending
bash scripts/community.sh optout maybe-later   # 다시 묻지 않게
bash scripts/community.sh reset                # 다시 묻게
```

### 에이전트 레지스트리 정합성 실패

`registry.yaml` 항목과 정의 파일이 어긋난 상태입니다. 손으로 맞추지 말고 `/create-agent` 를
실행해 누락된 파일을 재생성하세요.

### 템플릿 관련 문제 해결

| 증상 | 확인 |
| --- | --- |
| 검사 항목이 실제와 다름 | `templates/<id>/template.yaml` 의 `verify-*` 를 고치세요 |
| 스크립트가 남아 있음 | `script:` 에 적힌 키만 회수됩니다. 매니페스트에 없으면 남습니다 |
| 세션에 도메인 룰이 안 올라옴 | `rule:` 을 매니페스트에 적었는지 확인. `pnpm context` 로 검증 |

---

## 배포

템플릿에 따라 다릅니다. `blog` 는
[templates/blog/README.md](./templates/blog/README.md#배포) 를 보세요.

---

## 다음 단계

1. `wiki/00-overview.md` — 프로젝트가 무엇이고 왜 이렇게 만들어졌는지
2. `wiki/01-architecture.md` — 코어와 템플릿의 경계
3. `wiki/05-agent-operations.md` — 에이전트 팀을 멀티 터미널로 굴리는 법
4. `wiki/memory/long-term/user-preferences.md` — 본인 팀에 맞게 갱신
