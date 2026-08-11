# Agent Company

[한국어](../../README.md) ·
[English](./README.en.md) ·
**日本語** ·
[简体中文](./README.zh-CN.md) ·
[Español](./README.es.md) ·
[Français](./README.fr.md) ·
[Deutsch](./README.de.md) ·
[Português](./README.pt-BR.md) ·
[Русский](./README.ru.md)

> **⚠️ この翻訳は古い構成のままです。** リポジトリは「コア + テンプレート」構成に変わりました。
> 最新の内容は [한국어](../../README.md) または [English](./README.en.md) を参照してください。

> AI エージェントのチームで IT プロジェクトを運用するためのモノレポテンプレート。
> コンテキストはセッションをまたいで維持され、品質はレビューゲートが守ります。

[![Node](https://img.shields.io/badge/node-%E2%89%A520.11-339933)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-%E2%89%A510-F69220)](https://pnpm.io)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000)](https://nextjs.org)
[![License](https://img.shields.io/badge/license-MIT-blue)](../../LICENSE)

---

## 何を解決するか

AI にプロジェクトを任せると、繰り返し二つのものが壊れます。

**コンテキストが消えます。** セッションが終わったり担当者が変わったりすると、AI は過去の決定を知りません。
同じ議論を繰り返し、すでに廃止した方法に逆戻りします。

**品質管理がありません。** レビューゲートがなければ、AI の成果物はそのまま本番に出ていきます。

このテンプレートは、この二つを**構造で**塞ぎます。

| 問題 | 解決策 |
| --- | --- |
| コンテキストの喪失 | `CLAUDE.md` + `AGENTS.md` + `wiki/` + 短期/長期メモリを SessionStart フックで自動ロード |
| 品質管理 | 決定的な監査関数 + 管理画面のレビュー + 人間だけが押せる公開ボタン |
| 役割の混在 | ランタイム別の独立エージェント + モデルの明示的な対応付け + マルチターミナル並列実行 |
| 画像の信頼性 | Codex `imagegen` の単一経路 + 出所の記録 + 三重の強制 |

---

## インストール

### 人間向けのインストール

このプロンプトをお使いの LLM エージェント（Claude Code、Codex、Cursor、Gemini CLI など）に貼り付けてください。

```text
Install and configure agent-company by following the instructions here:
https://raw.githubusercontent.com/TOKTOKHAN-DEV/agent-company/refs/heads/main/INSTALL.md
```

[インストールガイド](../../INSTALL.md) を直接読んでも構いません。ただし本気で、エージェントにやらせて
ください。人間は設定ファイルをタイプミスで壊します。

### LLM エージェント向けのインストール

インストールガイドを取得して、その通りに従ってください。

```bash
curl -s https://raw.githubusercontent.com/TOKTOKHAN-DEV/agent-company/refs/heads/main/INSTALL.md
```

ガイドは**クローンから検証まで自己完結**しています。カレントディレクトリが空ならサブディレクトリを作らず
その場にクローンし、必須・任意ツールとフォールバック手順もすべて書かれているので、詰まった箇所で自分で
判断できます。最後の `pnpm check` がセットアップの成否を決定的に示します。

### 自分でインストール

```bash
git clone https://github.com/TOKTOKHAN-DEV/agent-company.git
cd agent-company
pnpm install
pnpm setup     # 依存関係の全数検査 · 環境準備 · Organization のフォロー · リポジトリに star
pnpm dev       # web → :3000 · admin → :3001
```

詳しい手順とトラブルシューティングは **[INSTALL.md](../../INSTALL.md)** を参照してください。

> INSTALL.md は現在韓国語で書かれています。AI エージェントは問題なく読めます。

---

## 構成

```
agent-company/
├── apps/
│   ├── web/              公開ブログ (Next.js 16 App Router, :3000)
│   └── admin/            コンテンツ · SEO/GEO · レビューのダッシュボード (:3001)
├── packages/
│   ├── content/          スキーマ · ストレージドライバ · 監査 · JSON-LD（唯一の情報源）
│   └── supabase/         クライアント · ストレージ · マイグレーション（キーがなければ無効）
├── content/posts/        Markdown の記事 — 既定のドライバ
├── docs/i18n/            README の翻訳 8 言語
├── agents/
│   ├── registry.yaml     ランタイム · モデル · 権限（唯一の情報源）
│   ├── blog-writer/      AGENT.md + skills/ (claude · opus)
│   └── image-maker/      AGENT.md + skills/ (codex)
├── wiki/
│   ├── 00~06-*.md        概要 · アーキテクチャ · 規約 · ガイド · 履歴
│   ├── decisions/        ADR
│   └── memory/           短期 · 長期メモリ
├── .claude/
│   ├── settings.json     フックの登録
│   ├── hooks/            SessionStart のコンテキスト読み込み · 画像ポリシーのガード
│   └── skills/           スラッシュコマンド 3 種
├── scripts/              決定的なシェルスクリプト
├── CLAUDE.md             Claude Code 向けの指示
└── AGENTS.md             すべての AI コーディングエージェント向けの指示
```

---

## リファレンス実装：AI が運用するブログ

### web (`:3000`)

公開ブログ。`content/posts/` から `status: published` の記事だけをレンダリングします。
JSON-LD（BlogPosting · FAQPage）、`sitemap.xml`、`robots.txt`、`rss.xml` を自動生成します。
回答エンジンのクローラー（GPTBot、ClaudeBot、PerplexityBot など）を明示的に許可しています。

### admin (`:3001`)

- **エディタ** — tiptap リッチテキスト + 画像アップロード。保存形式は常に Markdown
- **テクニカル SEO パネル** — canonical · robots 指示子 · OG/Twitter · サイトマップ priority · hreflang
- **GEO パネル** — 抽出用の要約 · FAQ · エンティティ · 引用元 · ロケール/ターゲット市場
- **レビュー画面** — 自動監査の結果、JSON-LD プレビュー、人間用チェックリスト、公開ボタン
- **SEO/GEO ダッシュボード** — 全記事の未解決項目をレーン別に集計

UI はネイティブの `<select>` ではなく Radix ベースのコンポーネントを使います。OS が描く既定の
セレクトはスタイルが効かず、ブラウザごとに異なるためです。

### agents

```
blog-writer (claude · opus)                       image-maker (codex)   人間
plan-post → write-draft → optimize-seo-geo    →   generate-cover    →   admin レビュー → 公開
                 ↓
         review-and-submit → status: in_review
```

エージェントは `in_review` までしか進めません。**公開は人間の行為です。**

---

## SEO と GEO を分けて扱う理由

| | SEO | GEO (Generative Engine Optimization) |
| --- | --- | --- |
| 対象 | 検索エンジン | 回答エンジン（ChatGPT · Claude · Perplexity · AI Overviews） |
| 目標 | **順位** | **引用** |
| 主要シグナル | タイトル · メタ · リンク · 速度 | 抽出しやすい構造 · 明示的な Q&A · 出典 · エンティティ |

引用されるには、抜き出しやすい形である必要があります。だからフロントマターに GEO ブロックが別にあり、
`geo.faq` は `FAQPage` JSON-LD として、`geo.answerSummary` はページ上部の要約ブロックとして描画されます。

実務ルールは [wiki/04-seo-geo-playbook.md](../../wiki/04-seo-geo-playbook.md) にあります。

---

## テクニカル SEO

### 自動生成 — 手を入れる必要はありません

| パス | 内容 |
| --- | --- |
| `/sitemap.xml` | 公開記事 + 記事ごとの priority · changefreq · hreflang |
| `/robots.txt` | 検索ボットと回答エンジンのボットを許可、`/api/` を遮断 |
| `/rss.xml` | 公開記事のフィード |
| `/llms.txt` | **LLM 向けサイト要約** — HTML を解析せずにサイトを理解できます |

`llms.txt` はサイトマップの GEO 版です。サイトマップが「URL がどこにあるか」を伝えるのに対し、
llms.txt は「このサイトが何で、どんな記事があるか」を伝えます。各項目は記事の `geo.answerSummary` を
使うため、要約を書くと二重に効きます。

### 記事ごとに管理画面で設定

canonical · noindex/nofollow · robots 指示子（`max-snippet` など）· OG/Twitter カード ·
サイトマップの priority/changefreq · hreflang · llms.txt に含めるかどうか。

### サーチコンソールとアナリティクス

`.env` に値を入れると有効になります。**空のままならタグもスクリプトも一切出力されません。**

| 変数 | 対象 |
| --- | --- |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Search Console |
| `NEXT_PUBLIC_NAVER_SITE_VERIFICATION` | ネイバー サーチアドバイザー |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | Bing Webmaster Tools |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | GA4（`afterInteractive` で読み込み） |

### 自然言語スラッグ

```
/blog/next-js-16-キャッシュ-コンポーネント
```

非 ASCII をそのまま保持します。URL にキーワードが残ることは実際のランキングとクリック率の signal で、
音訳したスラッグは対象読者にとって読めません。

詳細: [wiki/08-technical-seo.md](../../wiki/08-technical-seo.md)

---

## バックエンド — 今はファイル、あとで Supabase

アプリのコードはストレージを直接触りません。インターフェースだけを見ます。

```
web · admin · audit CLI
        │
        ▼
  getRepository()          ← キーの有無で自動選択
   ├── file       content/posts/*.md   （既定 · 現在の状態）
   └── supabase   Postgres + Storage   （キーを入れると）
```

**キーがない状態が正常です。** `pnpm install && pnpm dev` でそのまま動きます。切り替えるには:

1. `.env` に Supabase のキー 3 つ
2. `packages/supabase/migrations/0001_init.sql` を適用
3. `pnpm --filter @repo/supabase migrate` — 既存記事の移行（冪等・ファイルは残します）

アプリのコードは 1 行も変わりません。`CONTENT_DRIVER=file` でいつでも戻せます。

RLS ポリシーにより anon キーでは `published` かつ `noindex` でない記事しか読めません。アプリに
バグが出ても下書きが漏れないための最後の防衛線です。

詳細: [wiki/07-supabase.md](../../wiki/07-supabase.md)

---

## コンテキストの維持方法

セッション開始時にフックが自動的に注入します。

```
ハードルール → wiki インデックス → 長期メモリ → 直近の短期メモリ → エージェント → git の状態
```

**wiki 全文ではなくインデックスだけ**を読み込みます。地図を渡し、必要な文書はモデル自身に開かせます。

### 二段メモリ

```
短期メモリ ──(3 回以上参照 / 今も真だと確認)──▶ 長期メモリ
長期メモリ ──(プロジェクトのルールになる)─────▶ wiki 文書または ADR
```

昇格は `/save-memory` スキルが管理します。

---

## 画像ポリシー（ハードルール）

**画像生成は Codex `imagegen` のみ。Claude による画像生成は禁止です。**

```bash
pnpm imagegen --slug <post-slug> --prompt "<シーンの説明>"
```

Codex が使えない場合は、この順にフォールバックします。

1. **画像なしで進める** — 既定値。カバー画像は公開の必須要素ではありません。
2. **ユーザーが直接添付** — `source: user-upload`
3. **ウェブ検索** — ライセンス確認が必須。`source: web-search` と `license` の記録

文書に書いただけのルールは守られないため、**三層で強制**します。

| 層 | 手段 |
| --- | --- |
| 型 | `ImageSource` に `claude` という値がそもそも存在しない |
| フック | `PreToolUse` が Codex 以外の画像生成コマンドをブロック |
| 監査 | 出所の未記録・ライセンスのないウェブ画像を error 扱い → 公開不可 |

根拠：[ADR-0002](../../wiki/decisions/ADR-0002-codex-only-image-generation.md)

---

## スキル（スラッシュコマンド）

| コマンド | 内容 |
| --- | --- |
| `/company-setup` | 依存関係の全数検査 · インストール · Organization のフォロー · star（決定的スクリプト） |
| `/save-memory` | セッションの内容を短期メモリに保存し、必要に応じて長期/wiki へ昇格 |
| `/create-agent` | 新しいエージェントを registry + AGENT.md + skills/ に一括生成 |

エージェントが読むスキル（`agents/<id>/skills/`）はこれとは別物です。そちらはランチャーがシステム
プロンプトに注入するランタイム非依存のプレイブックで、codex エージェントも読みます。

---

## エージェント

**Claude のサブエージェントではありません。** それぞれ別のターミナルで動く独立プロセスで、ランタイムも
異なります。だから Orca はマルチターミナルで本当に並列実行できます。

| ID | ランタイム | モデル | 役割 |
| --- | --- | --- | --- |
| `blog-writer` | `claude` | opus | 企画 → 執筆 → SEO/GEO → レビュー |
| `image-maker` | `codex` | default | imagegen で画像生成 · 出所の記録 |

```bash
pnpm agent --list
pnpm agent blog-writer "Turborepo のキャッシュ戦略で記事を1本書いて"
pnpm agent image-maker "turborepo-cache-strategy のカバー画像"
```

```
agents/blog-writer/
├── AGENT.md                       システムプロンプトとして注入
└── skills/
    ├── plan-post/SKILL.md         企画 · 重複確認 · アウトライン
    ├── write-draft/SKILL.md       本文の執筆
    ├── optimize-seo-geo/SKILL.md  メタデータ
    └── review-and-submit/SKILL.md 監査 · in_review
```

ランチャーが `AGENT.md` とスキルインデックス（フォルダのスキャンで自動生成）を組み立ててシステム
プロンプトにし、正しいモデルで該当の CLI を起動します。スキルを追加すれば登録なしで即反映されます。

### なぜ 2 つだけなのか

**分ける基準は役割ではなく、ランタイムと並列性です。** コンテンツパイプラインの 4 段階はすべて同じ
ファイルを順番に触るため、プロセスを分ける利点がありません — 代わりにスキルで分けました。一方、画像は
ランタイム自体が異なり（Codex 専用）、その境界は交渉の余地がないので、プロセスの境界にしてルールを構造に
しました。

マルチターミナルのルールは [wiki/05-agent-operations.md](../../wiki/05-agent-operations.md)。

---

## コマンド

| コマンド | 説明 |
| --- | --- |
| `pnpm setup` | 環境の全体検査 + インストール + GitHub のフォロー/star |
| `pnpm check` | 環境の状態のみ検査（インストールはしない） |
| `pnpm dev` | web と admin を同時に起動 |
| `pnpm dev:web` / `pnpm dev:admin` | 個別に起動 |
| `pnpm build` | 両アプリをビルド |
| `pnpm typecheck` | 型検査 |
| `pnpm audit:content` | 公開ゲートを CLI で実行（admin のレビュー画面と同じ関数） |
| `pnpm context` | セッションコンテキストを手動で出力 |
| `pnpm imagegen` | Codex で画像生成 |
| `pnpm memory:new <topic>` | 新しいメモリファイルを作成（`--long` で長期） |
| `pnpm --filter @repo/supabase migrate` | ファイルから Supabase へ記事を移行（`--dry-run` 対応） |

---

## 別のドメインに変える

ブログは理解を助けるためのリファレンスです。EC・ダッシュボード・ドキュメントサイトに変えるには：

1. `packages/content/src/schema.ts` のスキーマを差し替える
2. `packages/content/src/audit.ts` の監査ルールを差し替える
3. `agents/` を `/create-agent` で再構成する
4. `wiki/03` と `wiki/04` をドメインのガイドに差し替える

**そのまま残すもの**：フック、メモリ構造、レビューゲートのパターン、画像ポリシー、モノレポの骨組み。
ここがテンプレートの実際の価値です。

---

## 技術スタック

pnpm workspaces · Turborepo · Next.js 16 (App Router) · React 19 · TypeScript 5.9 (strict) ·
Tailwind CSS 4 · zod 4 · Supabase · tiptap · Radix UI · gray-matter · marked · turndown

---

## ライセンス

MIT
