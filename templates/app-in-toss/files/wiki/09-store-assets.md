# 09 — 스토어 에셋

토스 앱 목록과 상세 페이지에 얹히는 이미지. 사람들이 앱을 열기 전에 보는 유일한 것이고,
심사에서 가장 자주 반려되는 곳입니다. 대부분 **규격을 안 지켜서** 반려됩니다.

담당은 `asset-maker` (codex). 만드는 것은 `assets/`, 규격은 `scripts/asset-spec.ts`.

## 규격

| 용도 | 해상도 | 포맷 | 콘솔 슬롯 |
| --- | --- | --- | --- |
| 앱 로고 | 600×600 | PNG | `miniApp.iconUri` |
| 다크모드 로고 | 600×600 | PNG | `miniApp.darkModeIconUri` |
| 가로 썸네일 | 1932×828 | PNG | `images[]` `THUMBNAIL` + `HORIZONTAL` |
| 세로 스크린샷 | 636×1048 | PNG · JPG | `images[]` `PREVIEW` + `VERTICAL` |
| 가로 스크린샷 | 1504×741 | PNG · JPG | `images[]` `PREVIEW` + `HORIZONTAL` |
| IAP 상품 아이콘 | 1024×1024 | PNG | `iconImgUrl` |

- 파일당 **5MB 이하**. 넘으면 `image_upload_url` 단계에서 거부됩니다.
- **정확히** 그 해상도여야 합니다. 콘솔은 리사이즈도 크롭도 포맷 변환도 하지 않습니다.
- 로고와 가로 썸네일은 **PNG 만**. 스크린샷은 PNG·JPG 둘 다.
- 위 조합에 없는 것(예: 정사각 썸네일)은 해상도 제한이 없습니다.

> 이미 저장된 JPG 로고 URL 은 전체 갱신에서 그대로 재사용할 수 있지만, **새 JPG 로고를
> 넣는 것은** 콘솔 웹과 다른 결과를 냅니다. 새로 만들 때는 PNG 로 하세요.

### 가로 썸네일의 함정

게임·비게임 모두 `images[]` 의 `imageType=THUMBNAIL` · `orientation=HORIZONTAL` 에
넣습니다. 게임이면 `miniApp.gameInfo.horizontalThumbnailUri` 에도 **같은 주소를 한 번 더**
넣어야 합니다 — 콘솔 웹이 양쪽에 같이 저장하기 때문입니다.

`images[]` 쪽을 비우면 **AI 자동 검수에서 썸네일 항목이 통째로 빠집니다.**

## 왜 게이트가 있는가

```bash
pnpm assets
```

해상도 · 포맷 · 용량을 파일 헤더에서 직접 읽어 대조합니다. 네트워크도 모델 호출도
없습니다 (코어 하드 룰 4).

`pnpm preflight` 도 같은 모듈(`scripts/asset-spec.ts`)을 씁니다. 두 명령이 다른 답을
내놓을 수 없습니다 — 판정이 갈리기 시작하면 사람은 게이트를 안 믿습니다.

해상도가 어긋난 파일은 **업로드까지는 성공합니다.** 발급 단계는 확장자와 크기만 보기
때문입니다. 거부는 그 URL 을 쓰는 `miniapp_update_*` 호출에서 일어나고, 그건 검토 요청과
같이 나가는 호출이라 되돌리는 데 시간이 듭니다. 그래서 올리기 전에 잡습니다.

## 만들기

```bash
pnpm imagegen --kind icon      --prompt "<장면 설명>"
pnpm imagegen --kind thumbnail --prompt "<장면 설명>"
pnpm imagegen --kind iap-icon --name <상품키> --prompt "<장면 설명>"
```

생성 → 규격 맞춤 → `assets/SOURCES.md` 에 프롬프트 기록까지 한 번에 합니다.
**codex 를 직접 부르지 마세요** — 출처가 안 남으면 다시 만들 수도, 설명할 수도 없습니다.

이미지 생성 경로는 codex 하나뿐입니다 (ADR-0002). codex 가 없으면 이미지 생략 →
사람에게 직접 요청 → 웹 검색(라이선스 확인) 순으로 폴백합니다.

### 프롬프트

이미지 모델은 **글자를 제대로 못 씁니다.** 앱 이름은 콘솔이 따로 얹으므로 프롬프트에
텍스트를 넣지 마세요. 토스는 로고를 둥근 사각형으로 잘라 쓰므로 가장자리에 붙은 요소는
잘립니다 — 여백을 요구하세요.

## 스크린샷은 찍습니다

**생성하지 않습니다.** 실제 화면이어야 합니다. `pnpm imagegen --kind screenshot` 은
거부하고 찍는 방법을 안내합니다.

```bash
cp <캡처> assets/screenshots/01-home.png
pnpm assets fit assets/screenshots/01-home.png
```

파일명 앞 번호가 곧 스토어 노출 순서입니다 (`images` 배열 순서 = 표시 순서).

## 올리기

```
1. image_upload_url(workspaceId, extension, contentLength)
     → uploadUrl · publicUrl · contentType
2. curl -X PUT -H 'Content-Type: {contentType}' -H 'x-amz-acl: public-read' \
        --data-binary @{파일} '{uploadUrl}'
3. publicUrl 을 이미지 필드에 넣는다
```

- `contentLength` 는 **실제 byte 수**. 어림수를 넣으면 PUT 이 거부됩니다.
- `uploadUrl` 은 **10분** 유효. 만료되면 다시 발급받습니다.
- 완료 통지 도구는 없습니다. PUT 성공이 곧 완료입니다.
- 로컬 경로나 이 절차로 발급되지 않은 외부 URL 은 거부됩니다.
- 이미지는 공개 URL(`static.toss.im`)로 서빙됩니다. **얼굴 사진·신분증은 올리지 마세요** —
  심사에서 확인되면 반려됩니다.

## 여기서 멈춥니다

`miniapp_update_icon` · `miniapp_update_screenshots` 는 이름과 달리 **앱정보 검토를 함께
신청합니다.** 콘솔 웹의 "검토 요청" 버튼과 같습니다. 에이전트는 부르지 않습니다
(코어 하드 룰 2).

에이전트는 페이로드까지 조립해 `release/` 에 두고, 사람이 확인하고 누릅니다.

### 페이로드를 조립할 때

전체를 다시 보내는 방식이라 **안 바꿀 값도 다 담아야** 합니다. `miniapp_get` 으로 지금
값을 가져와 옮기되, 카테고리는 모양이 다릅니다.

| 조회 (`miniapp_get`) | 요청 |
| --- | --- |
| `impression.categoryPaths[].category.id` | `impression.categoryIds` |
| `impression.categoryPaths[].subCategory.id` | `impression.subCategoryIds` |
| `impression.keywordList` | 그대로 |

옮기지 않으면 **기존 카테고리와 검색 키워드가 지워집니다.**

### 사람이 동의해야 하는 5가지

콘솔은 아래에 모두 동의해야 검토 요청 버튼이 열립니다. 에이전트가 대신 동의할 수
없으니, 원문 그대로 보여주고 확인을 받습니다.

1. 앱인토스에서 오픈할 수 있는 서비스다
2. 환전·현금화·자금세탁 우려가 있는 서비스가 아니다
3. 서비스 운영에 필요한 인허가·등록·신고를 모두 마쳤다
4. 부정행위를 조장하거나 신분증 위조 등 위법 행위를 포함하지 않는다
5. 위반으로 문제가 생기면 모든 책임은 파트너사에 있고 토스에 생긴 손해를 보상한다

## 기계가 못 잡는 것

`pnpm assets` 는 규격만 봅니다. 아래는 사람이 봐야 합니다.

- 16×16 으로 줄었을 때 알아볼 수 있는가
- 다른 앱과 헷갈리지 않는가
- 스크린샷이 지금 앱의 실제 화면인가 (구버전 화면이 남아 있기 쉽습니다)
- 이미지 안의 글자가 깨지지 않았는가

## 관련

- `assets/README.md` — 경로와 파일 이름 규칙
- `wiki/07-console-mcp.md` — 콘솔 MCP 전체 도구
- `wiki/04-review-checklist.md` — 심사 체크리스트
- `wiki/08-monetization.md` — IAP 상품 아이콘이 붙는 곳
