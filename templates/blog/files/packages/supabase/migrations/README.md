# Supabase 마이그레이션

## 지금 상태

**아직 적용할 필요가 없습니다.** 키가 없으면 앱은 파일 기반(`content/posts/*.md`)으로 정상 동작합니다.
Supabase 는 "준비만 되어 있는" 상태입니다.

## 전환 절차

### 1. 프로젝트 생성 후 키를 `.env` 에 넣기

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>   # 서버 전용, 절대 공개 금지
```

### 2. 마이그레이션 적용

**A) 대시보드** — SQL Editor 에 `0001_init.sql` 을 붙여넣고 실행.

**B) CLI**

```bash
supabase link --project-ref <project-ref>
supabase db push
```

### 3. 확인

```bash
pnpm check    # "Supabase 활성 (읽기/쓰기)" 가 떠야 합니다
```

### 4. 기존 글 이관

파일에 있던 글을 테이블로 옮깁니다.

```bash
pnpm --filter @repo/supabase migrate
```

이 스크립트는 `content/posts/*.md` 를 읽어 `posts` 테이블에 upsert 합니다. 슬러그가 같으면 덮어씁니다.
**파일은 지우지 않습니다** — 이관이 잘못돼도 되돌릴 수 있도록 남겨둡니다.

## 주의

- `0001_init.sql` 의 컬럼과 `packages/content/src/schema.ts` 의 프론트매터는 1:1 대응입니다.
  한쪽만 바꾸면 이관이 깨집니다.
- RLS 정책상 anon 키로는 `status = 'published'` 이면서 `noindex` 가 아닌 글만 읽힙니다.
  **초안이 공개 사이트에 새지 않도록 하는 마지막 방어선**이므로 함부로 완화하지 마세요.
- 쓰기는 service role 로만 가능합니다. 어드민 서버 액션이 이 키를 씁니다.
