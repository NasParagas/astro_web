/**
 * シリーズの表示名・説明。
 *
 * メモ側のfrontmatterには `series: jisaku-os` のようにキーだけ書けばよく、
 * ここに登録するのは任意(未登録ならキーがそのまま表示名になる)。
 * キーはそのままURLになるので英数字とハイフンで書くこと。
 */
export interface SeriesMeta {
  title: string;
  description?: string;
}

export const seriesMeta: Record<string, SeriesMeta> = {
  // "jisaku-os": {
  //   title: "自作OS入門",
  //   description: "x86でOSをゼロから書いていく記録",
  // },
};
