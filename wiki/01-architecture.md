# 01 — 아키텍처

## 두 층

```
agent-company/
│
├── ── 코어 ─────────────────────────────────────────────────────
│   ├── .claude/
│   │   ├── settings.json         훅 등록
│   │   ├── hooks/
│   │   │   ├── session-start.sh      → scripts/load-context.sh
│   │   │   └── guard-image-generation.sh   PreToolUse 차단
│   │   └── skills/               슬래시 커맨드 3종
│   ├── wiki/                     지식 · 메모리 · ADR
│   ├── agents/                   로스터 (내용물은 템플릿이 채움)
│   ├── scripts/                  결정적 셸 스크립트
│   ├── CLAUDE.md · AGENTS.md     핸드북
│   └── package.json              코어 스크립트 + 템플릿이 병합한 키
│
├── ── 템플릿 ───────────────────────────────────────────────────
│   templates/<id>/
│   ├── template.yaml             매니페스트
│   ├── README.md                 이 회사가 무엇인지
│   └── files/                    레포 루트 기준 경로 그대로
│       ├── apps/ · packages/
│       ├── agents/registry.yaml · agents/<id>/
│       ├── content/ 등 도메인 디렉터리
│       ├── wiki/<도메인 문서>
│       └── .env.example
│
└── ── 제품 (이 레포에만) ───────────────────────────────────────
    ├── site/                     랜딩. 정적 HTML 하나, 빌드 없음
    └── .company/PRODUCT          "여기는 제품 레포" 마커 — prune 이 이걸 보고 거부
```

빌드 오케스트레이션은 Turborepo, 패키지 매니저는 pnpm workspaces 입니다.

## 템플릿이 펼쳐지는 과정

```
pnpm company-setup
      │
      │  3/7 회사 선택
      ▼
scripts/template.sh apply <id>
      │
      ├─▶ templates/<id>/files/. ──cp -R──▶ 레포 루트
      │
      ├─▶ 매니페스트 `script:` ──병합──▶ package.json
      │       (갈아탈 때 이전 템플릿의 키만 정확히 회수)
      │
      └─▶ .company/state/company ◀── 적용된 id 기록 (gitignore)
```

`.company/state/` 는 gitignore 됩니다. 어떤 회사를 차렸는지는 **클론마다 다른 로컬 상태**이지
저장소가 공유할 사실이 아닙니다.

**갈아탈 때 이전 파일은 지우지 않습니다.** 자동으로 지우면 그 사이에 사람이 쓴 것까지
날아갑니다. 덮어쓰고, 남은 것을 알리고, 정리는 사람에게 맡깁니다.

## 한 레포, 두 얼굴

프로젝트 하나는 회사 하나입니다. 그래서 `prune` 이 있습니다.

```
                     제품 레포                 Use this template 한 프로젝트
                     (.company/PRODUCT 있음)   (마커 없음)
site/                배포됨 (Vercel)           삭제
안 고른 templates/    전부 유지                  삭제
고른 템플릿 files/     유지                      삭제 (루트에 이미 있음)
고른 템플릿 yaml       유지                      ★ 유지
코어                  유지                      유지
```

**매니페스트를 남기는 게 핵심입니다.** `check-deps.sh` 는 `verify-*` 를, `load-context.sh` 는
`rule:` 을 계속 읽습니다. 통째로 지우면 검사와 하드 룰 주입이 **에러 없이 조용히** 사라집니다 —
가장 나쁜 종류의 고장입니다.

정리 뒤 남는 것은 `templates/<id>/{template.yaml,README.md}` 둘뿐이고 10KB 수준입니다.

## 왜 템플릿이 별도 레포가 아닌가

세 가지 이유이고, 무게는 그중에 없습니다 (`templates/` 는 git 기준 388K).

1. **버전 호환.** 매니페스트 키는 코어 스크립트와 lockstep 으로 움직입니다. `sed` 로 읽으므로
   모르는 키는 조용히 무시되고, 원격 템플릿이 구버전이면 에러 없이 검사가 통째로 빠집니다.
2. **결정성.** 셋업 중간에 네트워크가 끼면 "두 번 돌려도 같은 상태"가 깨지고 오프라인·사내망에서
   설치가 실패합니다.
3. **기여 비용.** 템플릿 하나 고치는 데 PR 두 개.

쪼갤 시점: 서드파티가 템플릿을 기여하기 시작할 때 · 템플릿에 대용량 에셋이 들어갈 때 ·
템플릿별 릴리스 주기가 갈릴 때. 그때 손댈 곳은 `cmd_apply` 의 파일 펼치기 한 곳입니다.

## 매니페스트를 읽는 쪽

매니페스트는 반복 키 형식입니다 (`agents/registry.yaml` 과 같은 규칙). YAML 파서를 들이지 않고
`sed`/`awk` 로 읽습니다 — 셋업이 결정적이어야 하고, 셋업 스크립트에 의존성을 추가하고 싶지
않기 때문입니다.

| 스크립트 | 읽는 키 | 쓰는 곳 |
| --- | --- | --- |
| `template.sh` | `status` · `script` | 적용 거부 판단 · package.json 병합 |
| `check-deps.sh` | `name` · `status` · `verify-*` · `note-env` · `mcp*` | 환경 검사 |
| `load-context.sh` | `name` · `status` · `summary` · `rule` | 세션 컨텍스트 |
| `company-setup.sh` | `name` · `status` · `summary` · `verify-dir` · `next` | 선택 메뉴 · 디렉터리 · 완료 안내 |

**새 키를 추가하면 이 넷 중 하나를 함께 고쳐야 합니다.** 아무도 읽지 않는 키는 문서지 설정이
아닙니다.

## 컨텍스트 주입 흐름

```
세션 시작
   │
   ▼
.claude/hooks/session-start.sh
   │
   ▼
scripts/load-context.sh
   │
   ├─ 코어 하드 룰 (스크립트에 박혀 있음 — 5개)
   ├─ 현재 회사 + 그 회사의 `rule:`      ← templates/<id>/template.yaml
   ├─ wiki 인덱스 (제목만, 전문 아님)     ← wiki/*.md
   ├─ 장기 메모리                        ← wiki/memory/index.md
   ├─ 최근 단기 메모리 5건               ← wiki/memory/short-term/
   ├─ 로스터                             ← agents/registry.yaml
   └─ git 상태
```

**wiki 전문이 아니라 인덱스만** 올립니다. 지도를 주고, 필요한 문서는 모델이 직접 엽니다.
근거: [ADR-0003](./decisions/ADR-0003-session-context-loading.md)

## 에이전트 실행 흐름

```
pnpm agent <id> "<작업>"
   │
   ▼
scripts/run-agent.sh
   │
   ├─ agents/registry.yaml ──▶ runtime · model · definition · skills · writes
   │
   ├─ 시스템 프롬프트 조립
   │     AGENT.md 전문
   │   + 스킬 인덱스 (skills/*/SKILL.md 를 스캔해 자동 생성)
   │   + 프로젝트 컨텍스트 (AGENTS.md · wiki/README.md · memory/index.md 를 읽으라는 지시)
   │
   └─ exec claude|codex  ← 각자 별도 프로세스. 서브에이전트가 아님
```

스킬 인덱스를 폴더 스캔으로 만들기 때문에 `SKILL.md` 를 추가하면 등록 없이 바로 노출됩니다.

## 경계 규칙

| 경계 | 규칙 |
| --- | --- |
| 코어 → 템플릿 | 코어 스크립트는 특정 템플릿의 경로를 알지 못한다. 매니페스트로만 안다. |
| 템플릿 → 코어 | 템플릿은 `files/` 로 파일을 놓고 `script:` 로 스크립트를 얹는다. 코어 스크립트를 고치지 않는다. |
| 에이전트 → 파일 | `registry.yaml` 의 `writes` 범위 밖은 건드리지 않는다. |
| 에이전트 → 출고 | `status: published` 로 쓰지 않는다. `in_review` 까지. |
| 사람 → 하드 룰 | 코어 5개를 바꾸려면 ADR 을 먼저 쓴다. |

코어에 `apps/web` 같은 경로를 박아 두면 다른 템플릿을 고른 사람에게 없는 것을 없다고 혼내게
됩니다. `check-deps.sh` 가 매니페스트를 읽는 이유입니다.

## 확장 지점

| 하고 싶은 것 | 건드릴 곳 |
| --- | --- |
| 도메인 규칙 추가 | `templates/<id>/template.yaml` 의 `rule:` |
| 검사 항목 추가 | 같은 파일의 `verify-*` · `note-env` |
| MCP 서버 요구 | 같은 파일의 `mcp:` · `mcp-claude:` · `mcp-codex:` |
| 템플릿 전용 스크립트 추가 | 같은 파일의 `script:` (갈아탈 때 자동 회수됨) |
| 에이전트에 새 단계 추가 | `agents/<id>/skills/` 에 `SKILL.md` 추가 (등록 불필요) |
| 새 에이전트 추가 | `/create-agent` — 런타임이 다르거나 진짜 병렬일 때만 |
| 새 회사 추가 | `templates/<새-id>/` 에 매니페스트 + `files/` |
| 매니페스트 키 추가 | 위 「읽는 쪽」 표의 스크립트 중 하나를 함께 수정 |

## MCP 검사

템플릿은 `mcp:` 로 필요한 MCP 서버를 선언하고, `pnpm check` 가 등록 여부를 봅니다.

```
mcp: <서버명>=없으면 무엇을 못 하는지
mcp-claude: <서버명>=claude mcp add ...
mcp-codex: <서버명>=codex mcp add ...
```

`scripts/mcp-status.mjs` 가 설정 파일 네 곳을 읽습니다.

```
~/.claude.json        mcpServers               (user)
~/.claude.json        projects[cwd].mcpServers (local)
./.mcp.json           mcpServers               (project, 커밋됨)
~/.codex/config.toml  [mcp_servers.<name>]     (codex)
```

**`claude mcp list` 를 쓰지 않습니다.** 그 명령은 각 서버에 접속해 헬스체크를 하므로 네트워크가
끼고, 그러면 `pnpm check` 가 느려지고 결과가 흔들립니다. 검사는 결정적이어야 합니다.

같은 이유로 **인증 여부는 확인하지 않습니다.** OAuth 토큰 확인은 결국 네트워크를 타야 합니다.
등록만 보고, 인증은 사람이 `/mcp` 에서 합니다.

## 왜 셸인가

`scripts/` 가 전부 bash 인 이유는 **결정성**입니다. 모델이 매번 다르게 해석하는 체크리스트가
아니라, 항상 같은 순서로 같은 검사를 하고 같은 파일을 같은 자리에 놓습니다.

"확인했습니다"가 실제로는 확인하지 않은 상태를 뜻하지 않게 하려면, 확인하는 주체가 모델이
아니어야 합니다.
