import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const noteSchema = z.object({
  title: z.string(),
  date: z.coerce.date(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

// デフォルトのIDはslug化(小文字化)されるので、ファイル名をそのままURLに使う
const keepFilename = ({ entry }: { entry: string }) =>
  entry.replace(/\.[^.]+$/, "");

const dev = defineCollection({
  loader: glob({
    base: "./src/content/dev",
    pattern: "**/*.md",
    generateId: keepFilename,
  }),
  schema: noteSchema,
});

const recipe = defineCollection({
  loader: glob({
    base: "./src/content/recipe",
    pattern: "**/*.md",
    generateId: keepFilename,
  }),
  schema: noteSchema,
});

export const collections = { dev, recipe };
