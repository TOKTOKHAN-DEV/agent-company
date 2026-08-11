---
name: run-preflight
summary: 심사 사전점검을 돌리고 사람이 확인할 항목을 정리한다.
when: 검수 신청 전에. 그리고 번들을 올리기 전에 한 번 더.
---

# run-preflight

## 1. 빌드부터 한다

preflight 의 번들 검사는 산출물이 있어야 돈다.

```bash
pnpm typecheck
pnpm build:miniapp
pnpm preflight
```

`pnpm preflight` 만 돌리면 `bundle` 항목이 warn 으로 남는다. 그 상태로 "통과" 라고 보고하지
않는다.

## 2. error 를 해석한다

| 규칙 | 뜻 | 넘길 곳 |
| --- | --- | --- |
| `config` | appName 이 기본값이거나 .env 와 불일치 | 사람 (콘솔 식별자 확인 필요) |
| `privacy` | 개인정보처리방침 URL 없음 | 사람 |
| `no-eval` · `wss-only` · `share-scheme` | 금지 패턴이 소스에 있음 | `ui-builder` |
| `light-only` | 다크 모드 분기가 있음 | `ui-builder` |
| `tds` | TDS 를 안 씀 | `ui-builder` |
| `no-zoom` | viewport 에 user-scalable=no 없음 | `ui-builder` |
| `specs` | 수용 기준 없는 명세 | `spec-writer` |
| `bundle-size` | 100MB 초과 | `ui-builder` (에셋을 CDN 으로) |
| `static-only` | 정적 산출물이 아님 | `ui-builder` (SSR 제거) |

**직접 고치지 않는다.** 당신의 쓰기 범위는 `release/**` 다.

## 3. 기계가 못 잡는 것을 목록으로 만든다

preflight 가 통과해도 심사의 절반은 남아 있다. `wiki/04-review-checklist.md` 에서 이번
릴리즈에 해당하는 항목을 뽑아 **사람이 실기기에서 확인할 목록**을 만든다.

특히 기계로 못 잡는 것:

- 인터랙션이 2초 안에 반응하는가
- 뒤로가기 버튼이 두 개 동시에 보이지 않는가
- 결제·광고 중 배경음이 멈추는가
- 광고가 미리 로드되는가 (실시간 로딩 금지)
- 배너가 스크롤 화면에만 뜨는가
- 비속어·과도한 유행어가 없는가

## 4. 릴리즈 노트를 쓴다

`release/<버전>.md`:

```markdown
# v<버전>

## 들어간 것
- <명세 파일 기준으로>

## preflight
- error 0 / warn N
- 번들 <크기>MB (상한 100MB)

## 사람이 확인할 것
- [ ] <항목>

## 다음
콘솔에서 검수 신청 버튼을 누르세요. 영업일 3일까지 걸립니다.
```

## 출력

- preflight 결과 (error/warn 수, 규칙별)
- 넘긴 곳 (어떤 error 를 누구에게)
- 사람 확인 목록
- **검수 신청은 사람이 누른다는 안내**
