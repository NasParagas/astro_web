---
title: Kali-LinuxをUTM上にインストールする
tags: [kali-linux, mac, utm]
slug: install-kali-linux-on-utm
status: wip
---

# Kali Linux on UTM (Apple Silicon) トラブルシュート記録

Apple Silicon Mac 上の UTM に Kali Linux (ARM64) を導入した際に遭遇した問題と、その切り分け・解決の記録。
TryHackMe の学習環境構築が目的。

| 項目 | 内容 |
|---|---|
| ホスト | macOS / Apple Silicon (M4 Pro) |
| 仮想化 | UTM (QEMU バックエンド, Virtualize) |
| ゲスト | Kali Linux ARM64 (kernel 6.19.14+kali-arm64) |
| ISO | `kali-linux-*-installer-arm64.iso` (offline 版) |
| デスクトップ | Xfce |

---

## 目次

1. [問題1: グラフィカルインストーラが黒画面のまま進まない](#問題1-グラフィカルインストーラが黒画面のまま進まない)
2. [問題2: インストール後、GUI ではなくコンソールが出る](#問題2-インストール後gui-ではなくコンソールが出る)
3. [問題3: ネットワークは繋がるのに apt update が固まる](#問題3-ネットワークは繋がるのに-apt-update-が固まる)
4. [切り分けの方法論](#切り分けの方法論)
5. [再構築用チェックリスト](#再構築用チェックリスト)
6. [誤診とその教訓](#誤診とその教訓)

---

## 問題1: グラフィカルインストーラが黒画面のまま進まない

### 症状

- GRUB メニュー通過後、画面が黒いまま 15 分以上変化なし
- QEMU プロセスの CPU 使用率は 200% 前後で張り付いている
- ログらしきものが一切表示されない

### 切り分け

**Step 1. ログを出す**

Kali のブートパラメータには `quiet` が入っていてカーネルログが抑制されている。
GRUB メニューで対象エントリを選び `e` を押して編集モードへ。

```
linux /install.a64/vmlinuz net.ifnames=0 console=tty0 preseed/file=/cdrom/simple-cdd/default.preseed simple-cdd/profiles=kali,offline ---
```

- 行末の `quiet` を削除
- 必要なら `console=tty0` の直後に `loglevel=7` を追加
- `Ctrl-X` または `F10` で起動

> **`---` の意味**
> Debian インストーラの慣習。この区切りより後ろのパラメータは「インストール完了後のシステムの GRUB 設定にコピーされる」もの。
> インストーラ自体に効かせたいパラメータは `---` より **前** に書く。

**Step 2. 停止位置を読む**

```
[ 0.356525] [drm] Initialized virtio_gpu 0.1.0 for 0000:00:02.0 on minor 0
[ 0.372023] Console: switching to colour frame buffer device 160x50
[ 0.384632] virtio-pci 0000:00:02.0: [drm] fb0: virtio_gpudrmfb frame buffer device
（ここで停止）
```

起動から **0.38 秒**の地点で停止している。
ここまで一瞬で到達しているので、**「遅い」のではなく「固まっている」**と確定できる。

停止位置は、カーネルが起動直後の EFI フレームバッファから
virtio_gpu の DRM ドライバへ画面出力を引き渡す瞬間。

### 原因

UTM + Kali ARM64 の既知の不具合。virtio_gpu への切り替えで画面出力が死ぬ。

### 解決: シリアルコンソールでインストールする

画面を使わなければ問題自体が発生しない。

1. VM をシャットダウン
2. UTM の VM 設定を開く
3. Devices 一覧で **Display を右クリック → Remove**
4. **`+ New...` → Serial** を追加（Mode: Built-in Terminal）
5. Save して起動

ターミナル風のウィンドウでテキストインストーラ (青い擬似GUI) が動く。
設定できる項目はグラフィカル版と完全に同一。

シリアルウィンドウに何も出ない場合は、GRUB で `console=tty0` の直後に
`console=ttyAMA0,115200` を追加する（`console=` は**最後に書いたものが主コンソール**になる）。

### 試す価値のある代替案

| 方法 | 内容 |
|---|---|
| `nomodeset` | GRUB の `---` より前に追加。DRM ドライバに画面を奪わせない |
| Display Card 変更 | UTM 設定 → Display → Emulated Display Card を `virtio-ramfb-gl` 系に |
| Apple Virtualization | VM 作成時に選択。表示実装が別なので問題を回避できる |

> Apple Virtualization は手軽だが、QEMU バックエンドの方がネットワークの詳細設定が使える。
> ローカルに検証環境を組む予定があるなら QEMU 側が後々有利。

---

## 問題2: インストール後、GUI ではなくコンソールが出る

### 症状

CD/DVD の ISO をクリアして再起動したが、Xfce ではなくテキストコンソールが表示される。

### 原因と対処（上から順に確認）

**① Display デバイスを戻していない（最頻）**

インストール時に外した Display が無いので、そもそも画面出力先が存在しない。
見えているのはシリアルコンソールのウィンドウ。

```bash
sudo poweroff
```

UTM の VM 設定で:
- **Serial を Remove**
- **`+ New...` → Display** を追加
- Emulated Display Card は `virtio-gpu-pci` のままでまず試す

**② GRUB にシリアル設定が残っている**

Debian インストーラは、シリアル経由でインストールするとその設定を
インストール後のシステムにも引き継ぐ。

```bash
cat /proc/cmdline
```

`console=ttyAMA0` が残っていたら:

```bash
sudo nano /etc/default/grub
# GRUB_CMDLINE_LINUX / GRUB_CMDLINE_LINUX_DEFAULT から
#   console=ttyAMA0,115200 を削除
# GRUB_TERMINAL=serial のような行があればコメントアウト

sudo update-grub && sudo reboot
```

**③ デフォルトターゲットが CLI**

```bash
systemctl get-default          # multi-user.target なら GUI が起動しない
sudo systemctl set-default graphical.target
sudo systemctl start lightdm
```

Xfce 自体の有無は `systemctl status lightdm` で判断。
`not-found` なら `sudo apt install -y kali-desktop-xfce`。

**④ Display を戻しても真っ黒**

問題1 と同じ virtio_gpu 問題の再発。`nomodeset` か Display Card 変更で対処。

### GUI が出たら

```bash
sudo apt install -y spice-vdagent spice-webdavd
sudo reboot
```

クリップボード共有と、ウィンドウリサイズに追従する解像度調整が有効になる。
無いと固定解像度のままで実用性が落ちるので実質必須。

---

## 問題3: ネットワークは繋がるのに apt update が固まる

### 症状

- `sudo apt update` が `Connecting to ...` で停止
- Firefox が「ネットワークに問題があります」を表示
- UTM 側のネットワーク設定は既定 (Shared Network) のまま、Ubuntu では問題なかった

### 切り分け

```bash
ip a                    # IP は取れているか
ip route                # デフォルトルートはあるか
nmcli device status     # NetworkManager の管理下か
ping -c3 <gateway>      # L3 到達性（ip route の default via のアドレス）
ping -c3 1.1.1.1        # IPv4 でインターネットに出られるか
cat /etc/resolv.conf    # DNS は何を見ているか
```

得られた結果:

| 項目 | 結果 |
|---|---|
| eth0 の IPv4 | `192.168.64.10/24` 取得済み |
| デフォルトルート | `via 192.168.64.1` あり |
| NetworkManager | `connected` |
| `ping 1.1.1.1` | **成功** |
| eth0 の IPv6 | `fdae:6712:...` (**ULA**) |

`ping 1.1.1.1` が通る = IPv4 の経路は完全に正常。
名前解決の失敗なら `Temporary failure resolving` が出るはずで、
ホスト名を表示したまま固まるのは「解決はできたが繋がらない」状態。

**決め手となったコマンド:**

```bash
curl -4 -I http://http.kali.org    # 成功
curl -6 -I http://http.kali.org    # 固まる  ← 犯人
```

### 原因

ルーターが配布している IPv6 アドレスが `fd00::/8` の
**ULA (Unique Local Address)** で、インターネットへの出口がない。

Linux は既定で IPv6 を優先するため、AAAA レコードが返ると
この出口のないアドレスから接続を試み、タイムアウトするまでハングする。

### 解決

```bash
sudo nmcli con mod "Wired connection 1" ipv6.method disabled
sudo nmcli con up "Wired connection 1"
```

TryHackMe の VPN も IPv4 なので、IPv6 を切って困る場面はまずない。

### 代替案

**apt だけ IPv4 に固定する（IPv6 を残したい場合）**

```bash
echo 'Acquire::ForceIPv4 "true";' | sudo tee /etc/apt/apt.conf.d/99force-ipv4
```

**DNS も明示的に固定する**

```bash
sudo nmcli con mod "Wired connection 1" ipv4.ignore-auto-dns yes
sudo nmcli con mod "Wired connection 1" ipv4.dns "1.1.1.1 8.8.8.8"
sudo nmcli con up "Wired connection 1"
```

### 今回は該当しなかったが、確認する価値のある項目

**NetworkManager が interface を管理していない場合**

Debian インストーラが `/etc/network/interfaces` (ifupdown) に設定を書くと、
NetworkManager はその interface を管理対象外として無視し、`unmanaged` になる。

```bash
cat /etc/network/interfaces
# lo 以外（auto eth0 / iface eth0 inet dhcp）をコメントアウト
sudo systemctl restart NetworkManager
```

**offline 版 ISO のリポジトリ設定**

GRUB の行に `simple-cdd/profiles=kali,offline` がある = offline インストーラ。
`/etc/apt/sources.list` が cdrom を参照したままのことがある。

```bash
cat /etc/apt/sources.list
```

`cdrom:` の行しかない場合は以下に差し替える（`cdrom:` 行はコメントアウト）:

```
deb http://http.kali.org/kali kali-rolling main contrib non-free non-free-firmware
```

---

## 切り分けの方法論

今回機能した考え方の整理。

### 1. 「遅い」と「固まっている」を数字で区別する

カーネルログのタイムスタンプが決定的だった。
`0.384632` で止まっている以上、そこまでは一瞬で到達している。
体感時間 (15分) ではなくゲスト内部の経過時間を見ることで、
性能問題ではなくハングだと確定できた。

### 2. 沈黙を破る

`quiet` を消す、シリアルコンソールを足す。
情報が出ない状態は推測しかできない。まずログの出る状態を作る。

### 3. レイヤーを下から順に潰す

ネットワークで有効だった順序:

```
リンク (ip a)
  → L3 到達性 (ping gateway)
    → インターネット到達性 (ping 1.1.1.1)
      → 名前解決 (dig / resolv.conf)
        → アプリケーション層 (curl)
```

`ping 1.1.1.1` が通った時点で L1〜L3 は無罪と分かり、探索範囲が一気に狭まった。

### 4. 同一条件で1変数だけ変える

`curl -4` と `curl -6` を同じ URL に対して実行。
成否が分かれた瞬間に原因が確定した。仮説検証としては最小コスト。

### 5. 「Ubuntu では起きなかった」を手がかりにする

Ubuntu Desktop は netplan + NetworkManager が最初から統合されており、
IPv6 まわりも含めて調整済み。Kali は Debian 素のインストーラに近く、
デフォルトの差がそのまま出る。
**ディストリ間の差分が出る場所 = 疑うべき場所**。

---

## 再構築用チェックリスト

VM を作り直すときの手順。上の内容を圧縮したもの。

### インストール前

- [ ] ISO は **Apple Silicon (ARM64)** 版か（ファイル名に `arm64`）
- [ ] UTM で **Virtualize**（Emulate ではない）→ Linux → ISO 指定
- [ ] VM 設定で **Display を Remove**、**Serial を追加**

### インストール中

- [ ] GRUB で `Install`（テキストモード）を選択
- [ ] Domain name は **空欄**でよい
- [ ] root パスワードは空欄 → 作成ユーザーが sudo グループに入る
- [ ] パーティションは `Guided - use entire disk` で可
- [ ] ソフトウェア選択で **Xfce** と **Top 10 / default** を選ぶ
- [ ] 完了画面の前に UTM 側で **CD/DVD を Clear**

### インストール後

- [ ] **Serial を Remove**、**Display を追加**
- [ ] `cat /proc/cmdline` で `console=ttyAMA0` が残っていないか確認
- [ ] `systemctl get-default` が `graphical.target` か確認
- [ ] `sudo nmcli con mod "Wired connection 1" ipv6.method disabled`
- [ ] `sudo nmcli con up "Wired connection 1"`
- [ ] `sudo apt update` が通ることを確認
- [ ] `sudo apt install -y spice-vdagent spice-webdavd && sudo reboot`
- [ ] **この状態でスナップショット（VM の複製）を取る**

### スナップショットについて

UTM の VM 一覧で右クリック → 複製。
または VM 停止中に以下をコピー:

```
~/Library/Containers/com.utmapp.UTM/Data/Documents/*.utm
```

演習でツールを入れて環境が荒れたとき、綺麗な状態に戻せる。

---

## 誤診とその教訓

途中で外した仮説の記録。同じ罠を踏まないため。

### 誤診1: 「amd64 の ISO を使っていてエミュレーション実行になっている」

CPU 200% 張り付き + 15分無反応から推測したが、**外れ**。

判別方法: GRUB の `linux` 行のパスを見る。

| パス | アーキテクチャ |
|---|---|
| `/install.a64/vmlinuz` | **arm64** |
| `/install.amd/vmlinuz` | amd64 |

Debian 系インストーラの命名規則。`a64` = arm64。

CPU が張り付いていたのは、エミュレーションによる負荷ではなく
ドライバ初期化でスピンしていたため。
**CPU 使用率だけでは「重い処理」と「ハング」を区別できない。**

### 誤診2: 「ゲートウェイは 10.0.2.2」

`10.0.2.2` は QEMU の **slirp (user networking)** の NAT ゲートウェイ。
UTM が macOS の vmnet を使う構成では **192.168.64.0/24** になり、
ゲートウェイは `192.168.64.1`。

教訓: ゲートウェイのアドレスは決め打ちせず `ip route` の `default via` を読む。

---

## 参考

- Kali Linux on Apple Silicon (UTM でのインストール手順): https://dimitrisper.xyz/posts/tech/kali-vm-arm64/
- UTM 公式: https://mac.getutm.app/
- Kali 公式イメージ: https://www.kali.org/get-kali/
