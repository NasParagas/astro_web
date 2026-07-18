import { defineCollection, z } from "astro:content";
import { glob, type Loader } from "astro/loaders";
import { execSync } from "node:child_process";

const noteSchema = z.object({
  title: z.string(),
  // 省略時はgitの最初のコミット日が作成日になる
  date: z.coerce.date().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  // 以下はloaderがgit履歴から自動で埋める(frontmatterには書かない)
  created: z.coerce.date().optional(),
  updated: z.coerce.date().optional(),
});

// デフォルトのIDはslug化(小文字化)されるので、ファイル名をそのままURLに使う
const keepFilename = ({ entry }: { entry: string }) =>
  entry.replace(/\.[^.]+$/, "");

function gitDates(filePath: string): { created: Date; updated: Date } {
  let isoDates: string[] = [];
  try {
    isoDates = execSync(`git log --follow --format=%aI -- "${filePath}"`, {
      encoding: "utf8",
    })
      .trim()
      .split("\n")
      .filter(Boolean);
  } catch {
    // gitが使えない環境では空のまま(下のフォールバックに落ちる)
  }
  // 未コミットのファイルは履歴が無いので現在時刻を仮の日付にする
  const now = new Date();
  return {
    created: isoDates.length > 0 ? new Date(isoDates.at(-1)!) : now,
    updated: isoDates.length > 0 ? new Date(isoDates[0]!) : now,
  };
}

// globで読み込んだ後、各エントリに作成日・最終更新日を付与する。
// ページ生成はworkerd(Node APIが使えない)で走るため、
// gitコマンドの実行はNodeで走るここ(loader)でやる必要がある。
function notesLoader(base: string): Loader {
  const inner = glob({ base, pattern: "**/*.md", generateId: keepFilename });
  return {
    ...inner,
    name: "notes-loader",
    load: async (ctx) => {
      await inner.load(ctx);
      for (const id of ctx.store.keys()) {
        const entry = ctx.store.get(id);
        if (!entry?.filePath) continue;
        const git = gitDates(entry.filePath);
        // digestが同じだとstore.setがスキップされるため外して強制上書きする
        const { digest, ...rest } = entry;
        ctx.store.set({
          ...rest,
          data: {
            ...rest.data,
            created: rest.data.date ?? git.created,
            updated: git.updated,
          },
        });
      }
    },
  };
}

const dev = defineCollection({
  loader: notesLoader("./src/content/dev"),
  schema: noteSchema,
});

const recipe = defineCollection({
  loader: notesLoader("./src/content/recipe"),
  schema: noteSchema,
});

export const collections = { dev, recipe };
