---
title: MacのUTMへsshする
---

- UTMの設定から共有ネットワークにする
- UTMの仮想環境上で以下を実行し`ssh`を使えるようにする

```sh
sudo apt install openssh-server
sudo systemctl enable --now ssh   # 起動 + 自動起動設定
systemctl status ssh              # active (running) を確認
```

- `ip addr`でUTM上の仮想環境のip確認し`ssh user@host`
