/**
 * Supabase 테이블 타입.
 *
 * `migrations/0001_init.sql` 과 **수동으로 동기화**합니다.
 * 마이그레이션을 바꾸면 이 파일도 함께 고치세요. (`supabase gen types` 를 쓸 수도 있지만,
 * 데모 상태에서 CLI 의존성을 추가하지 않기 위해 손으로 관리합니다.)
 */

/**
 * posts 테이블의 한 행. 프론트매터 스키마와 1:1 대응됩니다.
 *
 * `interface` 가 아니라 `type` 이어야 합니다. supabase-js 의 `GenericTable` 은
 * `Row extends Record<string, unknown>` 을 요구하는데, 인터페이스에는 암묵적
 * 인덱스 시그니처가 붙지 않아 이 제약을 통과하지 못하고 모든 쿼리 결과 타입이
 * 조용히 `never` 로 무너집니다.
 */
export type PostRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  body: string;
  status: string;
  author: string;
  category: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  published_at: string | null;
  /** 프론트매터의 cover 블록 전체. */
  cover: Record<string, unknown> | null;
  /** 프론트매터의 seo 블록 전체 (canonical · robots · og · twitter · sitemap). */
  seo: Record<string, unknown>;
  /** 프론트매터의 geo 블록 전체 (answerSummary · faq · entities · citations). */
  geo: Record<string, unknown>;
  /** 프론트매터의 review 블록 전체. */
  review: Record<string, unknown>;
};

export type PostInsert = Omit<PostRow, 'id'> & { id?: string };

/**
 * supabase-js checks this against its internal `GenericSchema`. Omitting
 * `Views` / `Functions` / `Enums` / `CompositeTypes` / `Relationships` makes
 * the constraint fail silently and every query result collapses to `never`,
 * so the empty members below are load-bearing, not boilerplate.
 */
export type Database = {
  public: {
    Tables: {
      posts: {
        Row: PostRow;
        Insert: PostInsert;
        Update: Partial<PostInsert>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
