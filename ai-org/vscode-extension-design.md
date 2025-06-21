# VSCode拡張機能設計 - Simplicity Scorer

## 機能概要（3行）
1. コード選択時にS級評価を即座に表示
2. 8行を超えたら警告
3. リファクタリング提案を自動生成

## 実装設計（7行）
```javascript
vscode.commands.registerCommand('simplicity.score', () => {
  const editor = vscode.window.activeTextEditor;
  const code = editor.document.getText(editor.selection);
  const result = scoreSimplicity(code);
  vscode.window.showInformationMessage(
    `${result.grade}級 (${result.score}点) - ${result.feedback}`
  );
});
```

## UI仕様
- ステータスバーに常時表示: "現在: A級"
- ホバーで詳細: "7行 | 複雑度2"
- 右クリックメニュー: "S級にリファクタ"

## ショートカット
- `Cmd+Shift+S`: 現在のファイルを評価
- `Cmd+Shift+8`: 8行に収める提案
- `Cmd+Shift+5`: 5分TDDテンプレート挿入