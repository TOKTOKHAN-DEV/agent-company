---
name: upload-assets
summary: 콘솔 MCP 로 에셋을 올리고, 검토 요청 페이로드를 사람에게 넘긴다.
when: 규격을 통과한 에셋을 콘솔에 반영해야 할 때.
---

# upload-assets

## 이 스킬의 경계

```
바이트를 올리는 것        당신
검토 요청 버튼을 누르는 것  사람
```

`image_upload_url` + PUT 은 CDN 에 파일을 올릴 뿐 아무것도 신청하지 않는다. 여기까지는
당신이 한다. 반면 **`miniapp_update_icon` 과 `miniapp_update_screenshots` 는 이름과 달리
앱정보 검토를 함께 신청한다.** 콘솔 웹의 "검토 요청" 버튼과 같다 — 부르지 마라.

코어 하드 룰 2번이다. 출고 버튼은 사람이 누른다.

## 올리기 전에

```bash
pnpm assets
```

`규격 통과` 가 아니면 **올리지 마라.** 해상도가 어긋난 파일은 업로드 자체는 되지만
(발급 단계는 확장자와 크기만 본다) 그 URL 을 쓰는 순간 거부된다.

## 올리는 절차

파일 하나마다 세 단계다. 순서를 바꾸면 실패한다.

**1. 크기를 정확히 재고 발급받는다**

```
image_upload_url(workspaceId, extension, contentLength)
  → uploadUrl · publicUrl · contentType
```

`contentLength` 는 **실제 byte 수**여야 한다. 어림수를 넣으면 PUT 이 거부된다.
`uploadUrl` 은 10분간 유효하다. 만료되면 다시 발급받는다.

**2. PUT 으로 올린다**

```bash
curl -X PUT \
  -H 'Content-Type: {contentType}' \
  -H 'x-amz-acl: public-read' \
  --data-binary @{파일경로} \
  '{uploadUrl}'
```

인증 헤더는 필요 없다. 두 헤더와 Content-Length 가 발급 조건과 다르면 거부된다.
**완료 통지 도구는 없다** — PUT 이 성공하면 그것이 완료다.

**3. publicUrl 을 기록한다**

`release/` 에 남긴다. 로컬 경로나 이 절차로 발급되지 않은 외부 URL 은 콘솔이 거부한다.

## 그다음 — 페이로드를 만들어 사람에게 넘긴다

`miniapp_update_*` 는 **전체 페이로드를 다시 보내는** 방식이다. 안 바꿀 값도 다 담아야
하고, 빠뜨리면 기존 값이 사라진다. 그러니 당신이 만들어 두고 사람이 누르게 한다.

**`miniapp_get` 으로 지금 값을 가져와 그대로 옮긴다.** 카테고리는 모양이 다르니 주의:

| 조회 (`miniapp_get`) | 요청 |
| --- | --- |
| `impression.categoryPaths[].category.id` | `impression.categoryIds` |
| `impression.categoryPaths[].subCategory.id` | `impression.subCategoryIds` |
| `impression.keywordList` | `impression.keywordList` (그대로) |

옮기지 않으면 **기존 카테고리와 검색 키워드가 지워진다.**

썸네일은 `images[]` 의 `imageType=THUMBNAIL` · `orientation=HORIZONTAL` 에 넣는다.
여기를 비우면 AI 자동 검수에서 썸네일 항목이 통째로 빠진다.

## 사람에게 넘길 때 반드시 보여줄 것

콘솔은 아래 5개에 모두 동의해야 검토 요청 버튼이 열린다. 당신이 대신 동의할 수 없다.
**원문 그대로** 보여주고 확인을 받아라.

1. 앱인토스에서 오픈할 수 있는 서비스다
2. 환전·현금화·자금세탁 우려가 있는 서비스가 아니다
3. 서비스 운영에 필요한 인허가·등록·신고를 모두 마쳤다
4. 부정행위를 조장하거나 신분증 위조 등 위법 행위를 포함하지 않는다
5. 위반으로 문제가 생기면 모든 책임은 파트너사에 있고 토스에 생긴 손해를 보상한다

## 부르지 않는 도구

| 도구 | 왜 |
| --- | --- |
| `miniapp_update_icon` · `miniapp_update_screenshots` | 검토 요청이 함께 나간다 |
| `miniapp_update_basic_info` · `miniapp_update_category` | 같은 이유 |
| `review_submit` · `review_cancel` | 검수 신청은 사람의 행위 |

## 출력

- 올린 파일과 `publicUrl` 목록
- 조립한 페이로드 (JSON, `release/` 에 저장)
- 위 5개 확약 문구
- 다음 행동: **"콘솔에서 검토 요청 버튼을 누르세요"**
