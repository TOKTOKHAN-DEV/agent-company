---
title: Agent Company로 블로그를 자동 운영하는 법
slug: agent-company-getting-started
description: 기획부터 검수까지, 에이전트 팀이 블로그를 굴리는 파이프라인을 30분 만에 세팅하는 방법.
status: published
author: blog-writer
createdAt: '2026-07-27T00:00:00.000Z'
updatedAt: '2026-07-27T00:00:00.000Z'
publishedAt: '2026-07-27T00:00:00.000Z'
tags:
  - agent-company
  - ai-agent
  - blog
category: guide
seo:
  title: Agent Company로 블로그 자동 운영하기
  description: 에이전트 팀이 기획·작성·SEO/GEO·검수를 나눠 맡는 블로그 파이프라인 구축 가이드.
  keywords:
    - agent-company
    - ai 블로그 자동화
    - 에이전트 팀
    - GEO 최적화
  noindex: false
geo:
  locale: ko-KR
  targetMarkets:
    - KR
  answerSummary: >-
    Agent Company는 web(블로그)·admin(검수)·agents(에이전트 팀)·wiki(지속 메모리)로 구성된 모노레포
    템플릿이다. 콘텐츠는 마크다운 파일 하나로 관리되고, 에이전트가 초안을 쓰면 어드민에서 사람이 SEO/GEO
    검사 결과를 보고 발행한다. 이미지는 Codex imagegen으로만 생성한다.
  entities:
    - Agent Company
    - Claude Code
    - Next.js
    - Turborepo
    - Codex
  faq:
    - question: 에이전트가 쓴 글을 바로 발행하나요?
      answer: >-
        아니요. 에이전트는 status를 in_review까지만 올릴 수 있고, published 전환은 어드민 검수 화면에서
        사람이 합니다. 자동 검사에 error가 하나라도 있으면 발행 옵션 자체가 비활성화됩니다.
    - question: 이미지는 어떻게 만드나요?
      answer: >-
        Codex CLI의 imagegen으로만 만듭니다. Codex가 없으면 이미지를 생략하거나, 사람이 직접 업로드하거나,
        웹에서 라이선스가 확인된 이미지를 찾습니다. Claude가 이미지를 생성하는 것은 금지되어 있습니다.
    - question: 세션이 바뀌면 컨텍스트를 어떻게 유지하나요?
      answer: >-
        SessionStart 훅이 CLAUDE.md, AGENTS.md, wiki 인덱스, 단기/장기 메모리를 한 번에 로드합니다.
        새 세션은 프로젝트 히스토리를 아는 상태에서 시작합니다.
  citations:
    - title: Turborepo Documentation
      url: https://turborepo.com/docs
    - title: Next.js App Router
      url: https://nextjs.org/docs/app
review:
  reviewer: seojang-won
  reviewedAt: '2026-07-27T00:00:00.000Z'
  checks:
    factual: true
    tone: true
    seo: true
    geo: true
    images: true
    links: true
  notes: 템플릿 기본 제공 샘플 글. 구조 참고용으로 남겨둡니다.
---

## 왜 또 하나의 블로그 템플릿인가

AI에게 블로그를 맡기면 대개 두 가지 중 하나가 무너진다. 품질이 무너지거나, 컨텍스트가 무너진다.

품질은 검수 단계가 없어서 무너진다. 컨텍스트는 세션이 끝나면 사라져서 무너진다. 새 세션의 AI는 지난주에 무슨 결정을 왜 내렸는지 모른 채, 톤도 구조도 다른 글을 쓴다.

Agent Company는 이 두 구멍을 구조로 막는다.

## 네 개의 축

- **web** — 공개 블로그. `content/posts/*.md`에서 `status: published`인 글만 읽는다.
- **admin** — 콘텐츠 편집기, SEO/GEO 설정 패널, 검수 대시보드. 발행 버튼은 여기에만 있다.
- **agents** — 별도 터미널에서 도는 독립 프로세스. 글은 Claude, 이미지는 Codex가 맡는다.
- **wiki** — 세션을 넘어 살아남는 프로젝트 지식과 장/단기 메모리.

## 콘텐츠는 파일 하나다

DB도 CMS도 없다. 글 하나가 마크다운 파일 하나고, 프론트매터에 SEO·GEO·검수 상태가 전부 들어간다.

```yaml
status: in_review
seo:
  keywords: [agent-company, ai 블로그 자동화]
geo:
  faq:
    - question: ...
      answer: ...
```

에이전트는 파일을 쓰고, 어드민은 같은 파일을 읽는다. 중간 계층이 없으니 에이전트가 만든 결과를 사람이 그대로 검토한다. git diff가 곧 편집 히스토리다.

## GEO를 SEO와 따로 다루는 이유

검색 엔진은 페이지를 **순위**로 다루고, 답변 엔진은 페이지를 **인용**으로 다룬다. 인용되려면 뽑아 쓰기 좋은 형태여야 한다.

그래서 프론트매터에 GEO 블록이 따로 있다.

- `answerSummary` — 답변 엔진이 그대로 인용할 2~3문장
- `faq` — FAQPage JSON-LD로 렌더링되는 Q&A
- `entities` — 이 글이 연결되어야 할 개체
- `citations` — 본문이 인용한 1차 출처

이 값들은 `apps/web/app/blog/[slug]/page.tsx`에서 JSON-LD로 자동 출력된다.

## 검수는 결정적으로

`auditPost()`는 규칙 기반 함수다. 모델 판단이 아니다. 그래서 사람이 어드민에서 보는 결과와 에이전트가 `pnpm audit:content`로 보는 결과가 항상 같다.

error가 하나라도 있으면 발행 옵션이 비활성화된다. 예를 들어 커버 이미지에 alt 텍스트가 없으면, 아무리 글이 좋아도 발행 버튼을 누를 수 없다.

## 이미지 규칙

이미지 생성은 Codex `imagegen`만 사용한다. 이건 협상 대상이 아니라 하드 룰이다.

Codex를 못 쓰는 상황이면 세 가지 중 하나로 간다. 이미지 없이 발행하거나, 사람이 직접 넣거나, 웹에서 라이선스가 확인된 이미지를 찾는다. 어느 쪽이든 `cover.source`에 출처가 기록되고, 검수 화면에서 감사할 수 있다.

## 시작하기

```bash
pnpm install
pnpm company-setup   # 의존성 검사 + 템플릿 선택 + 환경 준비
pnpm dev       # web:3000, admin:3001
```

Claude Code를 열면 SessionStart 훅이 wiki와 메모리를 자동으로 로드한다. 첫 프롬프트부터 프로젝트 맥락을 아는 상태로 시작한다는 뜻이다.
