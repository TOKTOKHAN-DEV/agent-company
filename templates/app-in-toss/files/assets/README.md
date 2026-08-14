# assets — 스토어에 올라가는 것들

앱 안에 들어가는 이미지는 여기가 아니라 `apps/miniapp/public/` 입니다.
여기 있는 것은 **콘솔에 올려서 토스 앱 목록과 상세 페이지에 얹히는** 이미지입니다.

```bash
pnpm assets                                  # 규격 대조
pnpm imagegen --kind icon --prompt "<장면>"  # 만들기 (codex)
pnpm agent asset-maker "<앱 설명>"           # 에이전트에 맡기기
```

## 규격

**정확히** 이 해상도여야 합니다. 콘솔은 리사이즈도 크롭도 하지 않고, 1px 만 달라도
거부합니다. 검수 신청 단계에서 알게 되면 영업일 3일을 다시 기다립니다.

| 용도 | 해상도 | 포맷 | 경로 | 필수 |
| --- | --- | --- | --- | --- |
| 앱 로고 | 600×600 | PNG | `icon.png` | ✔ |
| 다크모드 로고 | 600×600 | PNG | `icon-dark.png` | |
| 가로 썸네일 | 1932×828 | PNG | `thumbnail.png` | ✔ |
| 세로 스크린샷 | 636×1048 | PNG · JPG | `screenshots/` | ✔ |
| 가로 스크린샷 | 1504×741 | PNG · JPG | `screenshots-landscape/` | |
| IAP 상품 아이콘 | 1024×1024 | PNG | `iap/` | |

파일당 5MB 이하. 넘으면 업로드 URL 발급 단계에서 거부됩니다.

규격의 단일 진실 공급원은 `scripts/asset-spec.ts` 입니다. `pnpm assets` 와 `pnpm preflight`
가 같은 모듈을 읽으므로 두 명령이 다른 답을 내놓지 않습니다.

## 스크린샷은 직접 찍습니다

**생성하지 않습니다.** 스토어 스크린샷은 실제 화면이어야 합니다. 없는 화면을 그려
올리면 심사에서 반려되고, 통과해도 받은 사람이 속습니다.

```bash
# 찍어서 넣고
cp <캡처> assets/screenshots/01-home.png
# 규격만 맞춥니다 (비율 유지 · 가운데 기준 잘라 채움)
pnpm assets fit assets/screenshots/01-home.png
```

파일 이름 앞에 번호를 붙이세요. **정렬 순서가 곧 스토어 노출 순서**입니다.

## 다크모드 로고가 있는 이유

앱 UI 는 라이트 모드만 지원합니다(이 회사의 하드 룰). 그런데 다크모드 로고가 있는 것은
모순이 아닙니다 — **토스 앱 자체가** 다크 모드를 지원해서, 목록에 얹힐 로고가 따로
필요한 것뿐입니다. 앱 안에 `prefers-color-scheme: dark` 분기를 넣으라는 뜻이 아닙니다.

## 출처

`SOURCES.md` 에 무엇을 어떤 프롬프트로 만들었는지 남습니다. `pnpm imagegen` 이 자동으로
덧붙입니다. **직접 넣거나 웹에서 가져온 이미지는 손으로 한 줄 추가하세요** — 웹에서
가져온 것은 라이선스를 반드시 적습니다 (ADR-0002).

## 올리기

에이전트가 `image_upload_url` → PUT 까지 합니다. 그다음 **검토 요청 버튼은 사람이**
누릅니다 — `miniapp_update_icon` 은 이름과 달리 앱정보 검토를 함께 신청합니다.

절차는 `wiki/09-store-assets.md`.
