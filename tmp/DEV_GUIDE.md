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

**現在はpushしたら自動でdeployされるようになってる**  
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
date: 2026-07-16            # 任意(省略時はgitの日付を使う。下記参照)
description: 一覧に出る説明  # 任意
tags: [neovim, license]     # 任意(タグページが自動で作られる。下記参照)
status: wip                 # 任意(書きかけ。省略時は done = 完成扱い)
series: jisaku-os           # 任意(シリーズにまとめる。下記参照)
seriesOrder: 2              # 任意(シリーズ内の順番)
slug: foo                   # 任意(URLを固定する。下記参照)
commentTerm: /dev/old/      # 任意(コメント欄の紐づけを固定する。下記参照)
---

本文...
```

### URLを固定したいとき(slug)

`slug` を書くと、ファイル名ではなくその値がURLになります(例: `slug: foo` → `/dev/foo/`)。

一度公開したメモは `slug` を書いておくのがおすすめです。書いておけばファイル名を変えても、サブディレクトリに移動しても、URLは変わりません。逆に書いていないメモのファイル名を変えると、外部からのリンクやブックマーク、検索結果からのアクセスは404になります(サイト内のリンクは自動で追従するので壊れません)。

なお、メモをサブディレクトリに分けて置きたくなったら、`src/pages/*/[slug].astro` を `[...slug].astro` にリネームする必要があります(現状の `[slug]` はURLに `/` を含められず、ビルドが「Missing parameter: slug」で失敗します)。

### 書きかけを示す(status)

```markdown
---
title: メモリアロケーターの実装
status: wip     # wip = 作成中 / done = 完成(省略時はdone)
---
```

`status: wip` にすると「作成中」が出ます。出る場所は3か所:

- 記事一覧・シリーズ一覧・タグ一覧のカード(タイトルの上にバッジ)
- 記事ページ(日付の横にバッジ＋本文の上に「このメモは書きかけです」の注意書き)
- 左サイドバー(タイトルの前に小さいオレンジの点)

完成したら `status` の行を消すか `done` にすればすべて消えます。ページ自体は `wip` でも普通に公開されます(非公開にはなりません)。値は `wip` / `done` のどちらかで、`draft` のように違う値を書くとビルド時にエラーになります。

### シリーズにまとめる(series)

記事が溜まってきてから、frontmatterに `series` を足すだけで後付けでまとめられます。URLもコメントも変わりません。

```markdown
---
title: 自作OS - ブートローダを書く
series: jisaku-os     # シリーズのキー(URLになるので英数字とハイフンで)
seriesOrder: 2        # 順番。省略した記事は作成日の古い順で後ろに並ぶ
---
```

これだけで以下が自動生成されます:

- `/dev/series/` — シリーズ一覧
- `/dev/series/jisaku-os/` — そのシリーズの記事を `seriesOrder` 順に並べた一覧(「第N回」付き)
- 記事ページ下部の「シリーズ内の他の記事」ナビ(全記事リスト＋前後リンク)

シリーズの表示名と説明は `src/data/series.ts` に書きます。書かなくても動き、その場合はキー(`jisaku-os`)がそのまま表示名になります。

```ts
export const seriesMeta: Record<string, SeriesMeta> = {
  "jisaku-os": {
    title: "自作OS入門",
    description: "x86でOSをゼロから書いていく記録",
  },
};
```

順番を後から入れ替えたくなったら `seriesOrder` の数字を振り直すだけです(10, 20, 30 のように飛ばしておくと間に挿入しやすい)。

### タグ(tags)

`tags: [rust, os]` と書くと、記事ページにタグが表示され、`/dev/tags/` と `/dev/tags/rust/` が自動生成されます。

タグは**小文字に正規化して**扱っています。`Rust` と `rust` が別タグに割れるのを防ぐためと、macOSのファイルシステムが大文字小文字を区別しないので `/tags/Rust/` と `/tags/rust/` がビルド時に衝突してしまうためです。日本語タグも使えますが、URLがパーセントエンコードされるので英数字が無難です。

シリーズもタグも `dev` / `recipe` それぞれのコレクション内で完結します(コレクションをまたいだ集約はしていません)。

なお `/dev/series/` と `/dev/tags/` は静的ルートなので、`slug: series` や `slug: tags` のメモを作るとそちらが隠れます(まず無いと思いますが一応)。

### 日付について

作成日・最終更新日はビルド時にgitの履歴から自動で取ります(`src/lib/dates.ts`):

- 作成日 = そのファイルが最初にコミットされた日(`date` をfrontmatterに書けば上書き可能)
- 最終更新日 = 最新のコミット日(作成日と別の日ならページに「最終更新」として表示)
- 未コミットのファイルはビルド時点の日時になる(`npm run dev` での執筆中はこれ)

### コメント欄について(giscus)

コメント・リアクションは [giscus](https://giscus.app) 経由でGitHubリポジトリのDiscussions(Announcementsカテゴリ)に保存されます(`src/components/Comments.astro`)。

記事とDiscussionは `mapping="specific"` のterm(＝Discussionのタイトル)で紐づいていて、termは既定でそのページのパス(例: `/dev/ssh-to-utm/`)です。URLを変えるとコメントが付いていたDiscussionと紐づかなくなるため、その場合は `commentTerm` に**変更前のパス**を書けば過去のコメントがそのまま残ります。

```markdown
---
title: MacのUTMへsshする
slug: ssh-to-utm-new     # URLは新しくしたい
commentTerm: /dev/ssh-to-utm/   # でもコメントは元のDiscussionのまま
---
```

## 配色・ダークモード

**色を変えたいときは `src/styles/global.css` の先頭にあるCSS変数だけを触ればOK**です。各コンポーネントの `<style>` は `var(--...)` を参照しているだけなので、個別に色を書いている場所はありません（新しくコンポーネントを足すときも、生の `#xxxxxx` ではなく変数を使ってください）。

```css
:root {                          /* ライト */
  --bg / --surface / --surface-alt / --surface-strong    /* 背景 */
  --border / --border-strong                             /* 枠線 */
  --text / --text-strong / --text-body / --text-muted / --text-faint
  --accent                                               /* リンク */
  --wip-*                                                /* 「作成中」まわり */
  --shadow-1..4                                          /* 影 */
}
:root[data-theme="dark"] { ... }  /* ダーク(同じ変数を上書き) */
```

テーマの切り替えは左上のボタン（`src/components/ThemeToggle.astro`）です。動きは以下のとおり:

- 初回訪問はOSの設定（`prefers-color-scheme`）に従う
- ボタンを押すと `localStorage` の `theme` に保存され、以降はそちらが優先
- 適用は `<html data-theme="dark">` を付けるだけ。**判定は `BaseLayout.astro` のhead内インラインスクリプト**でやっています。body描画後だとライトで一瞬光ってからダークに変わるため、ここは `is:inline` のまま head に置いておく必要があります

giscusのコメント欄だけはiframeの中なのでCSS変数が届きません。そのため `Comments.astro` が、読み込み時は現在のテーマをスクリプトの属性に渡し、切り替え時は `themechange` イベントを受けて `postMessage` でgiscusに知らせています。テーマを増やす・変える場合はここも合わせて直してください。

## ディレクトリ構成

```
src/
├── content.config.ts      # コレクション定義とfrontmatterスキーマ
├── content/
│   ├── dev/               # 技術メモ (md)
│   └── recipe/            # 料理メモ (md)
├── data/
│   └── series.ts          # シリーズの表示名・説明
├── lib/
│   ├── dates.ts           # 作成日・更新日の取り出しと整形
│   └── notes.ts           # シリーズ/タグの集計・並び替え
├── layouts/
│   ├── BaseLayout.astro   # 全ページ共通のシェル (head, 共通CSS)
│   └── NoteLayout.astro   # 記事ページ用 (タイトル・日付・タグ・シリーズナビ・コメント)
├── components/
│   ├── NoteList.astro     # 記事一覧カード
│   ├── SeriesIndex.astro  # シリーズ一覧カード
│   ├── SeriesNav.astro    # 記事ページ下部のシリーズナビ
│   ├── StatusBadge.astro  # 「作成中」バッジ
│   ├── TagChips.astro     # 記事ページのタグ表示
│   ├── TagIndex.astro     # タグ一覧
│   ├── Sidebar.astro      # 左サイドバー
│   ├── ThemeToggle.astro  # ライト/ダーク切り替えボタン
│   └── Comments.astro     # giscusのコメント欄
├── styles/
│   └── global.css         # 配色のCSS変数(ライト/ダーク) + 共通スタイル
└── pages/
    ├── index.astro        # トップ
    ├── dev/
    │   ├── index.astro    # 一覧 (getCollectionで自動生成)
    │   ├── [slug].astro   # 記事ページ
    │   ├── series/
    │   │   ├── index.astro    # シリーズ一覧
    │   │   └── [series].astro # シリーズごとの一覧
    │   └── tags/
    │       ├── index.astro    # タグ一覧
    │       └── [tag].astro    # タグごとの一覧
    └── recipe/            # devと同じ構成
```

## その他

- `npm run generate-types` — `wrangler.jsonc` のバインディングからWorkerの型定義(`worker-configuration.d.ts`)を生成
