# LLM Wiki — 인덱스

이 wiki는 **세션을 넘어 살아남는 프로젝트 지식**입니다. 사람이 바뀌든, 터미널이 바뀌든, 모델이 바뀌든
새 세션은 이 문서들을 읽고 프로젝트를 이해한 상태에서 시작합니다.

> 세션 시작 시 `.claude/hooks/session-start.sh` 가 이 인덱스와 메모리를 자동으로 로드합니다.

## 문서 지도

| 문서 | 내용 | 언제 읽나 |
| --- | --- | --- |
| [00-overview.md](./00-overview.md) | 프로젝트가 무엇이고 왜 존재하는가 | 항상 (세션 시작) |
| [01-architecture.md](./01-architecture.md) | 모노레포 구조, 데이터 흐름, 경계 | 코드를 건드리기 전 |
| [02-conventions.md](./02-conventions.md) | 코드 · 커밋 · 파일 네이밍 규칙 | 코드를 쓰기 전 |
| [03-content-guidelines.md](./03-content-guidelines.md) | 블로그 톤앤매너, 글 구조 | 글을 쓰기 전 |
| [04-seo-geo-playbook.md](./04-seo-geo-playbook.md) | SEO / GEO 최적화 실행 규칙 | 메타데이터를 채우기 전 |
| [05-agent-operations.md](./05-agent-operations.md) | 에이전트 팀 운영, 멀티 터미널 분업 | 에이전트를 띄우기 전 |
| [06-history.md](./06-history.md) | 결정 타임라인 | 왜 이렇게 됐는지 궁금할 때 |
| [07-supabase.md](./07-supabase.md) | 백엔드 드라이버 · 전환 절차 | DB 로 옮길 때 |
| [08-technical-seo.md](./08-technical-seo.md) | 메타 · 사이트맵 · llms.txt · 소유 확인 · GA4 | 배포·색인 설정 시 |
| [decisions/](./decisions/) | ADR — 되돌리기 어려운 결정 기록 | 아키텍처를 바꾸려 할 때 |
| [memory/](./memory/) | 단기 · 장기 메모리 | 세션 시작 / 종료 |

## wiki vs memory

| | wiki | memory |
| --- | --- | --- |
| 성격 | 안정적인 사실 · 규칙 | 관찰 · 진행 중인 맥락 |
| 수명 | 프로젝트 수명 | 단기 30일 / 장기 무기한 |
| 갱신 | 신중하게, PR로 | 세션 중 자유롭게 (`/save-memory`) |
| 예시 | "이미지는 Codex로만 생성한다" | "2026-07-27 세션에서 admin 폼을 서버 액션으로 전환" |

단기 메모리가 반복해서 나타나면 → 장기 메모리로 승격.
장기 메모리가 프로젝트 규칙이 되면 → wiki로 승격. `/save-memory` 스킬이 이 승격을 관리합니다.

## 갱신 규칙

1. **문서를 지우지 말고 갱신하세요.** 결정이 뒤집혔다면 `06-history.md`에 뒤집힌 이유를 남깁니다.
2. **에이전트도 wiki를 씁니다.** 단, wiki 수정은 항상 사람 리뷰가 붙는 커밋으로 나갑니다.
3. **길이보다 정확성.** 틀린 wiki는 없는 wiki보다 나쁩니다.
