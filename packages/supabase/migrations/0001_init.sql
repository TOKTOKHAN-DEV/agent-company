-- ─────────────────────────────────────────────────────────────
-- 0001_init.sql — posts 테이블 · RLS · 이미지 스토리지 버킷
--
-- 적용 방법 (둘 중 하나)
--   A) Supabase 대시보드 → SQL Editor 에 붙여넣고 실행
--   B) supabase CLI:  supabase db push
--
-- 이 스키마는 packages/content/src/schema.ts 의 프론트매터와 1:1 대응됩니다.
-- 한쪽을 바꾸면 반드시 다른 쪽도 바꾸세요.
-- ─────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

-- ── posts ────────────────────────────────────────────────────
create table if not exists public.posts (
  id           uuid primary key default gen_random_uuid(),

  -- 자연어 슬러그를 허용합니다 (한글·일본어 등). 키워드가 URL 에 그대로 남도록.
  slug         text not null unique,
  title        text not null,
  description  text not null default '',
  body         text not null default '',

  status       text not null default 'draft'
               check (status in ('draft','in_review','scheduled','published','archived')),
  author       text not null default 'unknown',
  category     text not null default 'general',
  tags         text[] not null default '{}',

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  published_at timestamptz,

  -- 프론트매터의 중첩 블록을 그대로 담습니다. 스키마 검증은 앱(zod)에서 합니다.
  cover        jsonb,
  seo          jsonb not null default '{}'::jsonb,
  geo          jsonb not null default '{}'::jsonb,
  review       jsonb not null default '{}'::jsonb
);

comment on table public.posts is 'Blog posts. Mirrors the frontmatter schema in packages/content/src/schema.ts';
comment on column public.posts.slug is 'Natural-language slug; may contain non-ASCII (Hangul, Kana, …)';

create index if not exists posts_status_published_at_idx
  on public.posts (status, published_at desc);
create index if not exists posts_tags_idx on public.posts using gin (tags);
create index if not exists posts_seo_idx  on public.posts using gin (seo);

-- updated_at 자동 갱신
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────
-- 공개 사이트는 anon 키로 읽습니다. 따라서 published 만 노출되어야 합니다.
-- 초안이 anon 에게 보이면 "발행은 사람만" 규칙이 무너집니다.
alter table public.posts enable row level security;

drop policy if exists "published posts are readable by anyone" on public.posts;
create policy "published posts are readable by anyone"
  on public.posts for select
  to anon, authenticated
  using (
    status = 'published'
    and (published_at is null or published_at <= now())
    and coalesce((seo ->> 'noindex')::boolean, false) = false
  );

-- 쓰기는 service role 로만. 어드민 서버 액션이 service role 키를 씁니다.
-- (service role 은 RLS 를 우회하므로 별도 정책이 필요 없습니다.)

-- 로그인한 편집자에게 전체 접근을 주려면 아래 주석을 해제하세요.
-- create policy "authenticated editors manage all posts"
--   on public.posts for all
--   to authenticated
--   using (true) with check (true);

-- ── Storage ──────────────────────────────────────────────────
-- 어드민 에디터(tiptap)의 이미지 업로드가 이 버킷을 씁니다.
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

drop policy if exists "post images are publicly readable" on storage.objects;
create policy "post images are publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'post-images');

-- 업로드도 service role 로만 수행합니다 (어드민 서버 액션 경유).
-- 브라우저에서 직접 업로드하게 하려면 아래를 해제하세요.
-- create policy "authenticated users can upload post images"
--   on storage.objects for insert
--   to authenticated
--   with check (bucket_id = 'post-images');
