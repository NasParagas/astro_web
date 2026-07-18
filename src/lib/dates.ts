import type { CollectionEntry } from "astro:content";

type Note = CollectionEntry<"dev"> | CollectionEntry<"recipe">;

/**
 * メモの作成日・最終更新日を返す。
 * 実体はcontent.config.tsのloaderがgit履歴から埋めた値
 * (作成日=最初のコミット日、frontmatterのdateで上書き可。更新日=最新のコミット日)。
 */
export function noteDates(note: Note): { created: Date; updated: Date } {
  const now = new Date();
  return {
    created: note.data.created ?? now,
    updated: note.data.updated ?? now,
  };
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  });
}

/** 作成日の新しい順にソートして返す(一覧・サイドバー用) */
export function sortByCreatedDesc<T extends Note>(notes: T[]): T[] {
  return [...notes].sort(
    (a, b) => noteDates(b).created.valueOf() - noteDates(a).created.valueOf(),
  );
}
