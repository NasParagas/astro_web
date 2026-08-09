---
title: ハードウェア記述言語veryl 入門
tags: [risc-v, cpu]
slug: veryl-introduction
status: wip
---

## 参考

- https://cpu.kanataso.net/03-veryl.html
-

## 歴史的な概要

- 2022年12月に公開

## 機能的な概要

- 抽象度はレジスタ転送レベル
  - Verilogと同じ
- コンパイル時に、SystemVerilogにトランスパイルされる

## 環境構築

https://doc.veryl-lang.org/book/ja/03_getting_started/01_installation.html

## 論よりrun

### nandゲートを書いてみる

NAND == Not AND なので、以下のような真理値表を満たすゲートとなります

| a | b | out |
| - | - | --- |
| 0 | 0 | 1 |
| 0 | 1 | 0 |
| 1 | 0 | 0 |
| 1 | 1 | 0 |

(TODO: 回路図の画像でもはるか)

```veryl
module Nand (
    a: input  logic,
    b: input  logic,
    y: output logic,
) {
    assign y = ~(a & b);
}
```

- `module`
  - 回路の部品のイメージ。クラスとか関数と近い概念
- `a: input logic`
  - ピンの名前: 方向 型
  - TODO: 型？




