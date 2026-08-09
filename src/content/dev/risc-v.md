---
title: RISC-V 概要
tags: [risc-v, cpu]
slug: riscv-overview
status: wip
---

## 参考

- [Verylで作るCPU](https://cpu.kanataso.net/)
- 作って学ぶコンピュータアーキテクチャ

## 目次

## 歴史的な概要

- 教育・研究目的で開発されたISA。
  - アーキテクチャの簡潔さ・カスタマイズの容易さ
- 仕様が広く公開されている
  - https://github.com/riscv/riscv-isa-manual/

## 機能的概要

 - 基本整数命令セット
  - RV32I,RV64I,RV32E,RV64E
    - RV<レジスタ長のbit数>
    - I = Integer, E = Embedded
      - Iが汎用レジスタ32本の標準の基底命令セット。Eは16本に減らして小型化を図ったもの
  - 最低限の命令しか実装されていない
- 例えば`mul`などの乗算命令は基本整数命令セットには実装されたおらず、拡張として定義されている


## memo


