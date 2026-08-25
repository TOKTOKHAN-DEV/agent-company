## 무엇을

<!-- 한두 줄. 제목이 이미 말한다면 지워도 됩니다. -->

## 왜

<!-- 무엇을 했는지는 diff 가 압니다. 대안을 검토했다면 왜 버렸는지 적어 주세요. -->

---

### 검사

- [ ] `pnpm check` 통과
- [ ] `pnpm typecheck` 통과
- [ ] 앱을 건드렸다면 `pnpm build` 통과
- [ ] 템플릿의 게이트가 따로 있다면 그것도 (`blog` 는 `pnpm audit:content`)

### 같이 고쳐야 하는 것

건드린 것이 있다면 짝을 함께 고쳤는지 확인해 주세요. 하나만 고치면 **에러 없이 조용히**
어긋납니다.

- [ ] **매니페스트에 키를 추가** → `scripts/template.sh` · `check-deps.sh` · `load-context.sh`
      중 읽는 쪽을 함께 수정
- [ ] **로스터 · 템플릿 목록 · status 변경** → `site/index.html` 의 카드와 로스터 데이터도
      함께 수정 (진실은 `template.yaml` 과 `registry.yaml`)
- [ ] **README 변경** → `docs/i18n/README.*.md` 8종도 함께
- [ ] **코어 하드 룰 5개 중 하나를 바꿈** → `wiki/decisions/` 에 ADR 을 **먼저** 작성

### 남길 것

- [ ] 되돌리기 어려운 결정이면 `wiki/decisions/` 에 ADR
- [ ] 타임라인에 남을 결정이면 `wiki/06-history.md` 에 항목 추가

<!--
커밋은 Conventional Commits 입니다. 자세한 것은 CONTRIBUTING.md 를 봐 주세요.
-->
