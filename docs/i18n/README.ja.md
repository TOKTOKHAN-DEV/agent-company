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

> AI チームが回すモノレポテンプレート。
> 組織図、社則、セッションをまたいで残る記憶、そして人間だけが押せる出荷ボタン。

[![Node](https://img.shields.io/badge/node-%E2%89%A520.11-339933)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-%E2%89%A510-F69220)](https://pnpm.io)
[![License](https://img.shields.io/badge/license-MIT-blue)](../../LICENSE)

---

## プロジェクト概要

Orca や Paseo のようなエージェント IDE は作業環境を提供してくれます。並列ワークツリー、
エージェントごとのターミナル、diff ビュー。ところが実際のプロジェクトを進めていくと、同じ問題が
出てくるものです。

過去に進めた履歴が残りません。セッションが終わったり別のエージェントが引き継いだりすると、
過去の意思決定が消えてしまいます。すでに話した内容をもう一度伝えることになり、すでに捨てたはずの
やり方に戻ってしまう場合もあります。

そして成果物のレビューも簡単ではありません。ですから人が確認して送り出す窓口が必要になります。
ブログなら管理画面、Toss ミニアプリなら審査の事前チェックとコンソールがその役割を担います。

どちらもプロンプトを磨いて解決する問題ではありません。崩れる箇所ごとにシステムを一つずつ
付けました。

| 崩れるもの | システム | 強制手段 |
| --- | --- | --- |
| コンテキストの消失 | ハンドブック · wiki インデックス · 長短期メモリがセッション開始ごとに自動で載る | SessionStart フック |
| 品質のドリフト | 出荷ゲートが決定的な関数。人間もエージェントも同じ判定を見る | ゲートに LLM 呼び出しなし |
| 役割の混在 | エージェントごとにランタイム · モデル · 書き込み範囲を宣言 | `agents/registry.yaml` |
| 出所不明の資産 | 画像生成の経路は一つだけ、全資産に出所を記録 | ツールガード + 監査 |
| 事故による出荷 | エージェントは `in_review` まで。出荷ボタンは人間が押す | 型にその経路がない |

---

## インストール

### エージェントに任せる (推奨)

この文を、お使いのコーディングエージェント (Claude Code, Codex, Cursor, Gemini CLI など) に
そのまま貼り付けてください。

```text
Install Agent Company by following the instructions here:
https://raw.githubusercontent.com/TOKTOKHAN-DEV/agent-company/refs/heads/main/INSTALL.md
```

ガイドはクローンから検証まで自己完結する形で書かれています。現在のフォルダが空ならその場に
クローンし、必須ツールと任意ツール、そのフォールバック手順まで書かれているので、詰まった箇所で
エージェントが自分で判断できます。

### 手動で行う

```bash
git clone https://github.com/TOKTOKHAN-DEV/agent-company.git
cd agent-company

pnpm install
pnpm company-setup    # 依存チェック → どの会社を始めるか選択 → 環境準備 → 検証
pnpm dev
```

詳しい手順とトラブルシューティングは [INSTALL.md](../../INSTALL.md) を参照してください。

> `pnpm setup` ではなく `pnpm company-setup` です。`setup` は pnpm の組み込みコマンドなので、
> 同じ名前だとスクリプトが隠れてしまいます。

---

## コアとテンプレート

リポジトリは二つの層で構成されています。コアはどの会社でも同じで、何を作るかはテンプレートが
決めます。

```
agent-company/
│
├── ── コア (常にある) ──────────────────────────────
│   ├── .claude/          フック(SessionStart · PreToolUse) · スラッシュコマンド
│   ├── wiki/             プロジェクト知識 + 長/短期メモリ + ADR
│   ├── agents/           ロスターが入る場所 (registry.yaml + <id>/)
│   ├── scripts/          決定的なシェルスクリプト
│   ├── CLAUDE.md         Claude Code 向けの指針
│   └── AGENTS.md         すべての AI コーディングエージェント共通の指針
│
├── ── テンプレート (選んで展開) ────────────────────
│   └── templates/<id>/
│       ├── template.yaml   マニフェスト — スクリプト · 検査項目 · ハードルール · 次の一手
│       └── files/          リポジトリルート基準のパスそのまま (apps/ · packages/ · agents/ …)
│
└── ── プロダクト (このリポジトリのみ) ──────────────
    └── site/               ランディングページ。静的 HTML 一枚、ビルドなし → Vercel
```

`pnpm company-setup` がテンプレートを選ばせ、`templates/<id>/files/` をルートに展開したあと、
マニフェストの `script:` をルートの `package.json` にマージします。テンプレートを乗り換えると、
前のテンプレートが入れたスクリプトキーだけが正確に回収されます。

### 現在あるテンプレート

| id | 状態 | 作るもの | ロスター | ゲート |
| --- | --- | --- | --- | --- |
| [`blog`](../../templates/blog/README.md) | stable | 公開サイト + レビューデスク | blog-writer · image-maker | `audit` → `in_review` |
| `blank` | stable | コアのみ。空のロスター | ご自身で決める | ご自身で作る |
| [`app-in-toss`](../../templates/app-in-toss/README.md) | preview | Toss の WebView ミニアプリ | spec-writer · ui-builder · release-manager | `preflight` → コンソール審査 |

```bash
pnpm template list                    # 一覧 · 現在適用中のもの
pnpm template apply <id>              # 展開する
pnpm template apply <id> --force      # 他のテンプレートの上に上書き
pnpm template prune                   # 使わないカタログとランディングを片付ける
```

`planned` はマニフェストに意図だけ書かれていて中身がない状態です。`apply` は拒否します。空の器を
敷いてしまうと、後から動かない理由を探すことになるからです。

### プロジェクト一つは会社一つ

一つのリポジトリが二つの顔を持ちます。選んだあとは、残りのカタログとプロダクトのランディングは
そのプロジェクトに必要ないので、`pnpm company-setup` が片付けを提案します。

| | プロダクトリポジトリ (ここ) | Use this template で作った自分のプロジェクト |
| --- | --- | --- |
| `site/` (ランディング) | あり → Vercel にデプロイ | 片付けで削除 |
| 選ばなかったテンプレート | 全部 | 片付けで削除 |
| 選んだテンプレートの `files/` | あり | 削除 (すでにルートに展開済み) |
| 選んだテンプレートの `template.yaml` | あり | 残す |
| コア | あり | あり |

マニフェストを残すことが重要です。`check-deps.sh` と `load-context.sh` が `verify-*` と `rule:` を
読み続けるからです。消すと検査とハードルールの注入がエラーも出さずに静かに消えます。

プロダクトリポジトリには `.company/PRODUCT` マーカーがあるので片付けを拒否します。
コントリビューターがクローンしてセットアップを走らせてもカタログは消えません。

片付けたあとで別のテンプレートが必要になったら、upstream から取得できます。

```bash
git remote add upstream https://github.com/TOKTOKHAN-DEV/agent-company.git
git fetch upstream && git checkout upstream/main -- templates/
```

### テンプレートを別リポジトリにしなかった理由

マニフェストのキーはコアスクリプトと一緒に動きます。`sed` で読むため知らないキーは静かに無視され、
リモートテンプレートが古いバージョンだとエラーなしに検査がまるごと抜け落ちます。一つのリポジトリに
置けばこの問題は起きません。またセットアップの途中にネットワークが挟まると、二回走らせても同じ
状態という約束が崩れます。

重さは根拠になりにくいところです。`templates/` は git 基準で 388K です。

分ける時期は、サードパーティがテンプレートを提供し始めたとき、テンプレートに大容量アセットが
入るとき、テンプレートごとにリリース周期が分かれるときです。そのとき手を入れるのは
`template.sh` のファイル展開部分の一か所です。

---

## コアの構成要素

### 1. コンテキストレイヤー

セッションが始まるとフックが自動で注入します。

```
コアのハードルール → 現在の会社(テンプレート) + その会社のハードルール → wiki インデックス
                   → 長期メモリ → 直近の短期メモリ → ロスター → git の状態
```

wiki の全文ではなくインデックスだけを載せます。地図を渡し、必要な文書はモデルが自分で開きます
([ADR-0003](../../wiki/decisions/ADR-0003-session-context-loading.md))。

二段メモリで長持ちするものだけが残ります。

```
短期メモリ ──(3回以上参照 / 引き続き真と確認)──▶ 長期メモリ
長期メモリ ──(プロジェクトのルールになる)─────▶ wiki 文書または ADR
```

昇格は `/save-memory` が管理します。

### 2. ロスター

ここで言うエージェントは Claude のサブエージェントではありません。それぞれが自分のターミナルで
動く独立プロセスで、ランタイムも異なります。だから Orca のような ADE がマルチターミナルで本当に
並列実行できます。

```bash
pnpm agent --list
pnpm agent <id> "<タスク>"
pnpm agent <id> "<タスク>" --dry-run   # 組み立てたコマンドだけ出力 (別ターミナルに貼り付け)
```

ランチャーが `agents/registry.yaml` からランタイムとモデルを読み、`AGENT.md` とスキルインデックス
(フォルダをスキャンして自動生成) をシステムプロンプトに組み立てて該当 CLI を起動します。スキルを
追加すれば登録なしですぐ反映されます。

エージェントを増やす基準は役割ではなくランタイムと並列性です。既存のエージェントでできる仕事なら、
エージェントではなくスキルを追加するほうが良いです →
[wiki/05-agent-operations.md](../../wiki/05-agent-operations.md)

### 3. 出荷ゲート

ゲートは決定的な関数です。管理画面と CLI が同じ関数を呼ぶので、人間もエージェントも同じ判定を
見ます。ゲートの中にモデル呼び出しを入れません。モデルが自分の成果物を評価すると合格側に傾く
からです。

ゲートが何を見るかはテンプレートが決めます。`blog` なら `pnpm audit:content` です。

### 4. 画像ポリシー

画像生成の経路は Codex `imagegen` の一つだけです。ポリシーはコアにあり、実行コマンドは
テンプレートが提供します。生成した画像をどこに置き、どのメタデータに出所を書くかはドメインごとに
異なるからです。`blog` なら次のようになります。

```bash
pnpm imagegen --slug <slug> --prompt "<シーンの説明>"
```

Codex が使えない場合は、この順にフォールバックします。

1. 画像なしで進める (デフォルト)
2. ユーザーに添付を依頼する (`source: user-upload`)
3. ウェブ検索。ライセンス確認が必須で、`source: web-search` と `license` を記録します

文書に書いただけのルールは守られないので、三重に強制します。

| 層 | 手段 |
| --- | --- |
| 型 | `ImageSource` に `claude` という値が存在しない |
| フック | `PreToolUse` が Codex 以外の画像生成コマンドを遮断 |
| 監査 | 出所未記録 · ライセンス不明のウェブ画像を error 扱い → 出荷不可 |

根拠: [ADR-0002](../../wiki/decisions/ADR-0002-codex-only-image-generation.md)

### 5. 引き継ぎ

別のワークスペースで作っていたものを取り込みます。既存サービスをミニアプリへ移すとき、
デザインキットを受け取るとき、作りかけのプロジェクトを引き継ぐときに使います。

```bash
pnpm intake ~/Downloads/design-kit.zip
pnpm intake ~/work/other-repo --as reference
```

zip · tar.gz · フォルダを `inbox/<名前>/` に展開し、`node_modules` などを取り除いたうえで
**目次（`INVENTORY.md`）を作ります** — スタック、先に読むべき文書、画像とその解像度、
開けないデザインファイル、そして鍵が混ざっていれば警告まで。

目次を作る理由はコンテキストです。フォルダをまるごと渡すとエージェントはファイルを
一つずつ開いてコンテキストを消費します。どこに何があるか先に伝えれば必要なものだけ開きます。

受け取ったものは実行しません。シンボリックリンクは削除し（リポジトリの外を指し得ます）、
展開したコードをインストールもビルドもしません。人から渡された zip は読み物であって
実行するものではありません。

`inbox/` はバージョン管理しません。**成果物ではなく材料だからです** — そこから取り出した
仕様とアセットだけがリポジトリに残ります（コアハードルール 3）。

---

## コアのハードルール

テンプレートに関係なく常に真です。変えるには `wiki/decisions/` に ADR を先に書く必要があります。

1. **画像生成の経路は一つ。** 他の画像モデルの呼び出しも、SVG で代用することも禁止。
2. **出荷ボタンは人間が押す。** エージェントはレビュー待ち(`in_review`)まで。
3. **真実はリポジトリのファイル。** 成果物も決定もコードと同じリポジトリでバージョン管理する。
4. **ゲートは決定的。** レビューにモデル推論を入れない。
5. **コンテキストは自分で載る。** 誰も持ってくる必要がない。

ドメイン固有のルールは `templates/<id>/template.yaml` の `rule:` に書き、セッション開始時に
この五つの上に載せて注入されます。

---

## コマンド

### コア (常に)

| コマンド | 説明 |
| --- | --- |
| `pnpm company-setup` | 依存チェック → テンプレート選択 → 環境準備 → 検証 (+ 任意: GitHub フォロー/スター) |
| `pnpm check` | 状態の検査のみ (インストールしない)。現在のテンプレートの検査項目も含む |
| `pnpm template list \| apply <id> \| prune` | テンプレートの一覧 · 適用 · 片付け |
| `pnpm agent --list \| <id> "<タスク>"` | エージェントの一覧 · 実行 |
| `pnpm intake <zip \| フォルダ>` | 別ワークスペースの作業物を `inbox/` に取り込み目次を作成 |
| `pnpm context` | セッションコンテキストを手動で出力 |
| `pnpm memory:new <topic>` | 新しいメモリファイルを作成 (`--long` で長期) |
| `pnpm dev \| build \| typecheck \| lint \| test` | ワークスペース全体 (turbo) |

### テンプレートが載せるもの

`blog` を適用すると `dev:web` · `dev:admin` · `audit:content` · `cover` ·
`imagegen` が追加されます。どのキーが来るかはマニフェストの `script:` 行に書かれています。

---

## スラッシュコマンド

| コマンド | 何をするか |
| --- | --- |
| `/company-setup` | 依存の総点検 + インストール · テンプレート選択 (フォロー · スターは任意) |
| `/save-memory` | セッション内容を短期メモリに保存し、必要なら長期/wiki へ昇格 |
| `/create-agent` | 新しいエージェントを registry + AGENT.md + skills/ にまとめて生成 |

エージェントが読むスキル (`agents/<id>/skills/`) はこれとは別のものです。あちらはランチャーが
システムプロンプトに注入するランタイム中立のプレイブックなので、codex エージェントも読みます。

---

## 新しいテンプレートを作る

```
templates/<id>/
├── template.yaml    マニフェスト
└── files/           リポジトリルート基準のパスそのまま
```

マニフェストは繰り返しキー形式です。YAML パーサーを持ち込まず `sed`/`awk` で読みます。
セットアップが決定的でなければならないからです。

| キー | 意味 |
| --- | --- |
| `id` · `name` · `status` · `summary` | 一覧に出るもの。`status` は `stable` · `preview` · `planned` |
| `ships` · `hires` · `gate` | 一行要約 (文書 · ランディングで使用) |
| `script: key=value` | ルートの `package.json` にマージ。乗り換え時はこのキーだけ回収 |
| `verify-workspace:` | 依存のリンクまで確認 (なければ失敗) |
| `verify-dir:` | ディレクトリの存在 + ファイル数 (なければ失敗) |
| `verify-optional:` | あったほうがよいファイル/ディレクトリ (なければ警告) |
| `verify-env: VAR=説明` | `.env` の値を確認。未設定なら何がオフになるか通知 |
| `note-env: VAR=説明` | 空が正常な値。状態を示すだけ |
| `runtime:` | このテンプレートが使う CLI (なければ警告) |
| `mcp: サーバー名=説明` | このテンプレートが使う MCP サーバー。登録の有無を検査 |
| `mcp-claude:` · `mcp-codex:` | 未登録のときに出力する登録コマンド |
| `rule:` | この会社のハードルール。セッション開始ごとにコアルールの上に注入 |
| `next:` | セットアップ完了後の案内。`${VAR}` は `.env` から置換 |

マニフェストを読むのは `scripts/template.sh` · `scripts/check-deps.sh` ·
`scripts/load-context.sh` · `scripts/company-setup.sh` の四か所です。キーを追加したらこのうち
どれかが読むように一緒に直す必要があります。誰も読まないキーは設定ではなく文書にすぎません。

MCP の登録確認は `claude mcp list` ではなく設定ファイル (`~/.claude.json` · `.mcp.json` ·
`~/.codex/config.toml`) を読んで行います。あのコマンドはネットワーク越しにヘルスチェックするため、
`pnpm check` が決定的でなくなるからです。

---

## 技術スタック

pnpm workspaces · Turborepo · TypeScript 5.9 (strict) · 決定的な bash スクリプト。
アプリのスタック (Next.js · React · Tailwind · zod など) はテンプレートが持ってきます。

## ライセンス

MIT
