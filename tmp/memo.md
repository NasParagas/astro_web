# Swift

## プロトコル

型が準拠している約束事を(こちらから)表すためのもの

```swift
struct Task: Identifiable, Sendable {
  ...
}
```

とすると、

- 型を作る側：「Taskには、識別に使えるid(`Identifiable`)があります」
- コンパイラ：「必要なidが、条件を満たす型で用意されているか確認します」
- 使う側のSwiftUI：「それなら、idを使って各要素を識別できます」

みたいな感じ

### `Identifiable`

上記の通り

### `Sendable`

並行処理を安全に行える型であることを示す(コンパイラに検証させる)

### `Codable`

復元可能な形に変換されることが約束される

## マクロ

### `@Observable`

SwiftUI がその class の変数などにアクセスされたことを追跡できるようになる

```swift
@MainActor @Observable
final class SchedulerStore {
    var tasks: [Task] = []
    var taskTimeBlocks: [TaskTimeBlock]
    ...
```

というコードがあり、

```swift
struct TaskCountView: View {
    var store: SchedulerStore

    var body: some View {
        Text("タスク数: \(store.tasks.count)")
    }
}
```

が

```swift
store.tasks.append(newTask)
```

と変更されたとき、描画画面を自動で更新してくれる

## `Actor`


## その他

- `final`
  - つけた class は継承不可
- `@MainActor`
-

```swift
    enum AppError: LocalizedError {
        case message(String)
        var errorDescription: String? {
            switch self { case .message(let text): text }
        }
    }
```


とすると、`AppError.message("error")`や

- 引数ラベルの概念がよくわからん

```swift
private func readReminders(in list: EKCalendar) async throws -> [ReminderSnapshot] {
  ...
}
```

があったとき、もちろん関数の中では `list` が参照先の変数として使われるが、呼び出し側からは

```swift
let reminders = try await readReminders(in: selectedList)
```

のように、ラベル付きで呼び出すことができる。  
わかりやすさのために使うぽい？pythonで `func(引数名=変数)` みたいにするのと同じな気がしてきた

## ローカルにデータを保存する

- `UserDefaults` という仕組みが使える

## EventKit

### `EKEventStore.events()`

- `hasRecurrenceRules`：繰り返しのルールを持っている。
- `isDetached`：繰り返し予定のうち、その回だけ内容が変更されている。例えば「毎週月曜の会議で、今週だけ開始時刻を変更した」という場合

