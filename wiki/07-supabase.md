# 07 — 백엔드 (Supabase)

## 지금 상태: 파일 기반

이 템플릿은 **Supabase 키가 없어도 완전히 동작합니다.** 글은 `content/posts/*.md` 에 있고,
`pnpm dev` 로 바로 실행됩니다. 이게 기본 데모 상태이고, 실패 상태가 아닙니다.

어드민 상단 배너가 현재 드라이버를 항상 표시합니다.

```
파일 기반 · Supabase 미설정 — content/posts/*.md 로 동작 중입니다.
```

## 드라이버 구조

앱 코드는 저장소를 직접 알지 못합니다. `ContentRepository` 인터페이스만 봅니다.

```
web · admin · audit CLI
        │
        ▼
  getRepository()          ← 키 유무로 자동 선택
   ├── fileRepository      content/posts/*.md      (기본)
   └── supabaseRepository  Postgres + Storage      (키가 있으면)
```

| 파일 | 역할 |
| --- | --- |
| `packages/content/src/repo/types.ts` | 인터페이스 (모든 메서드 async) |
| `packages/content/src/repo/file.ts` | 마크다운 드라이버 |
| `packages/content/src/repo/supabase.ts` | Postgres 드라이버 |
| `packages/content/src/repo/index.ts` | 드라이버 선택 |

**인터페이스가 async 인 이유**: 파일 드라이버는 동기로도 충분하지만, 그러면 나중에 DB 로 바꿀 때
모든 호출부를 고쳐야 합니다. 처음부터 async 로 두어 교체 비용을 0 으로 만들었습니다.

## 전환 절차

### 1. 키 넣기

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>   # 서버 전용
```

### 2. 마이그레이션

`packages/supabase/migrations/0001_init.sql` 을 대시보드 SQL Editor 에 붙여넣거나:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

### 3. 기존 글 이관

```bash
pnpm --filter @orca/supabase migrate            # 실제 이관
pnpm --filter @orca/supabase migrate --dry-run  # 미리보기
```

멱등적입니다(슬러그 기준 upsert). **파일은 지우지 않습니다** — 되돌릴 수 있어야 하기 때문입니다.

### 4. 확인

```bash
pnpm check     # "Supabase 설정됨 (읽기/쓰기)"
pnpm dev       # 어드민 배너가 초록색으로 바뀝니다
```

## 스키마 대응

`0001_init.sql` 의 컬럼과 `packages/content/src/schema.ts` 의 프론트매터는 **1:1** 입니다.

| 프론트매터 | 컬럼 | 타입 |
| --- | --- | --- |
| `title` · `slug` · `description` · `body` | 동명 | `text` |
| `status` | `status` | `text` + CHECK 제약 |
| `tags` | `tags` | `text[]` |
| `cover` · `seo` · `geo` · `review` | 동명 | `jsonb` |

중첩 블록을 `jsonb` 로 둔 이유: 프론트매터 필드를 추가할 때마다 마이그레이션을 쓰지 않아도 되고,
검증은 어차피 zod 가 앱에서 합니다. **한쪽만 바꾸면 이관이 깨집니다.**

## RLS — 초안 유출 방지의 마지막 방어선

anon 키로는 아래 조건을 만족하는 글만 읽힙니다.

```sql
status = 'published'
and (published_at is null or published_at <= now())
and coalesce((seo ->> 'noindex')::boolean, false) = false
```

앱 코드에도 같은 필터가 있지만, **DB 레벨에서 한 번 더 막습니다.** 앱에 버그가 생겨도 초안이
공개되지 않도록 하기 위해서입니다. 이 정책을 완화하지 마세요.

쓰기는 service role 로만 합니다. 어드민 서버 액션이 이 키를 씁니다.

## 이미지 스토리지

마이그레이션이 `post-images` 버킷을 만듭니다(public read).

- **어드민 에디터 업로드** → Supabase 설정 시 Storage, 아니면 `apps/web/public/images/uploads/`
- 업로드는 항상 `source: user-upload` 로 기록됩니다

> **이미지 생성 하드 룰과 무관합니다.** 업로드는 생성이 아닙니다. 생성은 여전히 Codex `imagegen`
> 전용입니다 ([ADR-0002](./decisions/ADR-0002-codex-only-image-generation.md)).

## 되돌리기

```bash
CONTENT_DRIVER=file
```

`.env` 에 이 한 줄이면 키가 있어도 파일 드라이버를 씁니다. 이관 중 문제가 생기면 즉시 되돌릴 수 있습니다.
