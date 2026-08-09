import type { CollectionEntry } from "astro:content";
import { seriesMeta, type SeriesMeta } from "../data/series";
import { noteDates } from "./dates";

export type Note = CollectionEntry<"dev"> | CollectionEntry<"recipe">;

export type NoteStatus = "wip" | "done";

/** 書きかけのメモかどうか(frontmatterでstatusを省略した記事はdone扱い) */
export function isWip(note: Note): boolean {
  return note.data.status === "wip";
}

/** 記事のURL。コレクション名がそのままパスの先頭になっている */
export function noteHref(note: Note): string {
  return `/${note.collection}/${note.id}/`;
}

/**
 * タグは小文字に揃えて扱う。
 * 表記ゆれ(Rust と rust)で別タグに割れるのを防ぐのと、
 * macOSのように大文字小文字を区別しないファイルシステムだと
 * /tags/Rust/ と /tags/rust/ がビルド時に衝突してしまうため。
 */
export function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase();
}

export function noteTags(note: Note): string[] {
  return [...new Set(note.data.tags.map(normalizeTag))].filter(Boolean);
}

/** 全タグを 記事数の多い順 → 名前順 で返す */
export function collectTags(notes: Note[]): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const note of notes) {
    for (const tag of noteTags(note)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function notesWithTag<T extends Note>(notes: T[], tag: string): T[] {
  const target = normalizeTag(tag);
  return notes.filter((note) => noteTags(note).includes(target));
}

/** seriesOrderの小さい順。未指定の記事は作成日の古い順で後ろに回す */
export function sortBySeriesOrder<T extends Note>(notes: T[]): T[] {
  return [...notes].sort((a, b) => {
    const orderA = a.data.seriesOrder ?? Number.POSITIVE_INFINITY;
    const orderB = b.data.seriesOrder ?? Number.POSITIVE_INFINITY;
    if (orderA !== orderB) return orderA - orderB;
    return noteDates(a).created.valueOf() - noteDates(b).created.valueOf();
  });
}

export function notesInSeries<T extends Note>(notes: T[], key: string): T[] {
  return sortBySeriesOrder(notes.filter((note) => note.data.series === key));
}

export function seriesInfo(key: string): SeriesMeta {
  return seriesMeta[key] ?? { title: key };
}

export interface Series<T extends Note = Note> extends SeriesMeta {
  key: string;
  notes: T[];
}

/** 記事が1本でもあるシリーズを、最終更新(最新記事の作成日)の新しい順で返す */
export function collectSeries<T extends Note>(notes: T[]): Series<T>[] {
  const keys = [
    ...new Set(
      notes.map((note) => note.data.series).filter((key) => Boolean(key)),
    ),
  ] as string[];

  const latest = (items: T[]) =>
    Math.max(...items.map((note) => noteDates(note).created.valueOf()));

  return keys
    .map((key) => ({ key, ...seriesInfo(key), notes: notesInSeries(notes, key) }))
    .sort((a, b) => latest(b.notes) - latest(a.notes));
}
