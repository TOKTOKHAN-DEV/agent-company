---
date: 2026-07-27
type: preference
topic: user-preferences
tags: [communication, workflow]
confidence: medium
promoted: true
---

# 사용자 선호

> 확인될 때마다 갱신하세요. 추측으로 채우지 말고, 실제로 관찰된 것만 적습니다.

## 커뮤니케이션

- **응답 언어: 한국어.** 코드 주석과 커밋 메시지는 영어 혼용 가능.
- 장황한 설명보다 결론 먼저. 옵션 나열보다 추천안 제시.

## 작업 방식

- 결정적으로 확인 가능한 것은 스크립트로 만든다 (예: `company-setup`을 문서가 아닌 셸 스크립트로).
- 규칙은 문서로만 두지 말고 코드/훅으로 강제한다.
- 에이전트 병렬 실행(멀티 터미널)을 전제로 설계한다.

## 미확인 (관찰되면 채울 것)

- 선호하는 배포 대상
- 브랜치 전략 (trunk-based vs git-flow)
- 테스트 커버리지 기준
