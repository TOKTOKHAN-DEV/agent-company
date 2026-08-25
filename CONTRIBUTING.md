# 기여

고맙습니다. 이 문서는 **이 저장소에서만 통하는 규칙**을 모은 것입니다. 일반적인 오픈소스
예절은 적지 않았습니다.

읽는 순서: 이 문서 → [`CLAUDE.md`](./CLAUDE.md)(에이전트 행동 규칙) →
[`wiki/02-conventions.md`](./wiki/02-conventions.md)(코드 규칙 전체).

---

## 먼저 — 여기는 두 얼굴입니다

`.company/PRODUCT` 마커가 있으면 **제품 레포**입니다. 지금 보고 있는 이 저장소가 그렇습니다.
`site/`(랜딩)와 `templates/`(카탈로그)가 내용물이므로 정리(`pnpm template prune`)가 거부합니다.

마커가 없으면 사용자 프로젝트이고, 고른 회사 하나만 남기도록 정리할 수 있습니다.
**기여자가 클론해서 셋업을 돌려도 카탈로그가 지워지지 않습니다.**

```bash
git clone https://github.com/TOKTOKHAN-DEV/agent-company.git
cd agent-company
pnpm install
pnpm check          # 무엇이 없는지 먼저 봅니다
```

---

## 바꾸기 전에 ADR 이 필요한 것

코어 하드 룰 다섯 가지는 **템플릿과 무관하게 항상 참**입니다. 바꾸려면
[`wiki/decisions/`](./wiki/decisions/) 에 ADR 을 **먼저** 쓰세요. 코드부터 고치고 나중에
근거를 붙이는 순서가 아닙니다.

1. **이미지 생성 경로는 하나다** — Codex `imagegen`. 다른 이미지 모델 호출도, SVG 로 대신
   그리는 것도 금지 ([ADR-0002](./wiki/decisions/ADR-0002-codex-only-image-generation.md))
2. **출고는 사람만** — 에이전트는 `in_review` 까지
3. **진실은 저장소 파일** ([ADR-0001](./wiki/decisions/ADR-0001-file-based-content.md))
4. **게이트는 결정적으로** — 검수 함수에 LLM 호출을 넣지 않습니다
5. **컨텍스트는 스스로 올라온다** — 훅이 하는 일을 손으로 다시 하지 않습니다
   ([ADR-0003](./wiki/decisions/ADR-0003-session-context-loading.md))

도메인 규칙은 코어가 아닙니다. `templates/<id>/template.yaml` 의 `rule:` 에 적으세요 —
`CLAUDE.md` 에 넣으면 템플릿을 갈아탄 사람에게 **남의 회사 사규**가 됩니다.

---

## 하나를 고치면 짝을 함께 고쳐야 하는 것

이 저장소에서 가장 자주 나는 사고입니다. 어느 쪽도 에러를 내지 않고 **조용히** 어긋납니다.

| 고친 것 | 함께 고쳐야 하는 것 | 안 고치면 |
| --- | --- | --- |
| `template.yaml` 에 새 키 | `scripts/template.sh` · `check-deps.sh` · `load-context.sh` 중 읽는 쪽 | 키가 조용히 무시됨 |
| 로스터 · 템플릿 목록 · `status` | `site/index.html` 의 카드와 JS 로스터 데이터 | 랜딩이 사실과 어긋남 |
| `README.md` | `docs/i18n/README.*.md` 8종 | 번역본이 이전 구조를 설명 |
| 프론트매터 필드 (`blog`) | `schema.ts` → admin 폼 → `audit.ts` | 검증을 우회하는 경로가 생김 |

**매니페스트를 읽는 쪽은 셋뿐입니다.** `template.sh` · `check-deps.sh` · `load-context.sh`.
새 키를 추가하면 이 중 하나를 반드시 함께 고칩니다.

`prune` 은 고른 템플릿의 `template.yaml` 을 **남깁니다.** `check-deps.sh` 의 `verify-*` 와
`load-context.sh` 의 `rule:` 이 거기서 오기 때문입니다. 정리 스크립트를 고칠 때 이 불변식을
깨지 마세요 — 지우면 검사와 하드 룰이 **에러 없이** 사라집니다.

---

## 코드 규칙

- `strict: true`, `noUncheckedIndexedAccess: true`. **`any` 금지.**
- 외부 입력(폼 · 파일 · 환경 변수)은 zod 로 검증한 뒤 사용합니다.
- **셸 스크립트는 결정적으로.** 모델 판단이 아니라 같은 순서로 같은 검사를 합니다.
- **매니페스트에 YAML 파서를 들이지 마세요.** `template.yaml` 과 `registry.yaml` 은 반복 키
  형식이고 `sed`/`awk` 로 읽습니다. 셋업에 의존성을 추가하지 않기 위한 선택입니다.

---

## 에이전트를 늘리기 전에

기준은 **역할이 아니라 런타임과 병렬성**입니다.

- **런타임이 다른가** — 이미지 생성은 codex 뿐이라 claude 에이전트로는 표현 자체가 불가능합니다.
- **진짜 병렬로 도는가** — 서로 다른 파일을 건드려야 합니다. 같은 파일을 순차로 건드리는
  단계들은 프로세스를 나눌 이유가 없습니다.

둘 다 아니면 에이전트 대신 **스킬을 추가**하세요 (`agents/<id>/skills/`). 로스터를 8개에서
2개로 줄인 적이 있습니다 — 근거는 [`wiki/06-history.md`](./wiki/06-history.md) 의 2026-07-28
항목에 있습니다.

에이전트는 손으로 만들지 말고 `/create-agent` 로 만드세요. 손으로 만들면 정합성 검사에
걸립니다.

---

## 커밋과 PR

[Conventional Commits](https://www.conventionalcommits.org/) 를 씁니다.

```
feat(template): app-in-toss 에 결제 화면 스캐폴드 추가
fix(setup): 정리를 셋업에 편입
docs(memory): 세션 진행 상황을 단기 메모리로
```

본문에는 **왜**를 적으세요. 무엇을 했는지는 diff 가 압니다. 검토했다가 버린 대안이 있으면
그것도 남겨 주세요 — 나중에 같은 논의를 다시 하지 않게 됩니다.

한국어로 씁니다. 코드 주석과 커밋 제목은 영어 혼용 가능합니다.

## 올리기 전에

```bash
pnpm check       # scripts · .claude · templates 를 건드렸다면 (항상 돌려도 좋습니다)
pnpm typecheck   # 필수
pnpm build       # 앱을 건드렸다면
```

템플릿의 게이트가 따로 있으면 그것도 돌립니다 (`blog` 는 `pnpm audit:content`).

**통과 못 한 상태로 "완료"라고 적지 마세요.** 실패했으면 실패했다고 출력과 함께 적어 주세요.
같은 검사를 CI 도 돌립니다 — 사람과 에이전트와 CI 가 같은 판정을 봐야 합니다.

---

## 새 템플릿을 만들려면

[`README.md` 의 「새 템플릿 만들기」](./README.md#새-템플릿-만들기) 에 매니페스트 키의 뜻이
정리돼 있습니다. 제안 단계라면 **새 템플릿 제안** 이슈 폼을 써 주세요 — 출고 게이트가
결정적인지, 로스터를 나눈 근거가 런타임·병렬성인지를 먼저 맞춰 두는 편이 빠릅니다.

## 결정을 내렸으면 남기세요

- 되돌리기 어려운 결정 → [`wiki/decisions/`](./wiki/decisions/) 에 ADR
- 타임라인에 남을 결정 → [`wiki/06-history.md`](./wiki/06-history.md)
- 세션에서 알아낸 것 → `/save-memory`

경로만 적지 말고 **읽어낸 내용을 옮겨 적으세요.** 나중에 그 파일이 없는 사람에게 경로는 빈
참조입니다.
