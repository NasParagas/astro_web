# astro_web

自分用のメモ(技術・料理など)を置くWebサイト。

- フレームワーク: [Astro](https://astro.build/)
- ホスティング: Cloudflare Workers(静的アセット + `@astrojs/cloudflare` アダプタ)
- Worker名: `nasparagas-astro`(`wrangler.jsonc` で設定)

## セットアップ

```sh
npm install
```

## 開発

```sh
npm run dev        # 開発サーバー (http://localhost:4321)
npm run build      # 本番ビルド (dist/ に出力)
npm run preview    # ビルド結果をworkerd(本番相当の環境)で確認
```

## デプロイ

初回のみCloudflareへのログインが必要:

```sh
npx wrangler login
```

デプロイはビルドしてから `wrangler deploy`:

```sh
npm run build
npx wrangler deploy
```

デプロイ前に設定だけ検証したい場合は `npx wrangler deploy --dry-run`。

## メモの追加方法

`src/content/dev/`(技術メモ)または `src/content/recipe/`(料理メモ)にmdファイルを置くだけで、一覧ページに自動で載ります。ファイル名がそのままURLになります(例: `src/content/dev/foo_001.md` → `/dev/foo_001/`)。

frontmatterの形式(`src/content.config.ts` でスキーマ検証されます):

```markdown
---
title: メモのタイトル        # 必須
date: 2026-07-16            # 必須(一覧の並び順は日付降順)
description: 一覧に出る説明  # 任意
tags: [neovim, license]     # 任意(まだ表示には使っていない)
---

本文...
```

## ディレクトリ構成

```
src/
├── content.config.ts      # コレクション定義とfrontmatterスキーマ
├── content/
│   ├── dev/               # 技術メモ (md)
│   └── recipe/            # 料理メモ (md)
├── layouts/
│   ├── BaseLayout.astro   # 全ページ共通のシェル (head, 共通CSS)
│   └── NoteLayout.astro   # 記事ページ用 (タイトル・日付・本文スタイル)
├── components/
│   └── NoteList.astro     # 記事一覧カード
├── styles/
│   └── global.css         # 共通スタイル
└── pages/
    ├── index.astro        # トップ
    ├── dev/
    │   ├── index.astro    # 一覧 (getCollectionで自動生成)
    │   └── [slug].astro   # 記事ページ
    └── recipe/            # devと同じ構成
```

## その他

- `npm run generate-types` — `wrangler.jsonc` のバインディングからWorkerの型定義(`worker-configuration.d.ts`)を生成
